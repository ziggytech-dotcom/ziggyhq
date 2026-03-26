import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getOrgUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id, org_id, full_name, email').eq('email', user.email!).single()
  return data
}

export async function POST(request: Request) {
  const caller = await getOrgUser()
  if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, phone, lead_name, task, voice_id } = await request.json()

  if (!lead_id || !phone) {
    return Response.json({ error: 'lead_id and phone are required' }, { status: 400 })
  }

  const apiKey = process.env.BLAND_API_KEY
  const fromNumber = process.env.BLAND_PHONE_NUMBER ?? '+17028852828'

  if (!apiKey) return Response.json({ error: 'Bland.ai not configured' }, { status: 500 })

  // Clean phone to E.164
  const digits = phone.replace(/\D/g, '')
  const e164 = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith('1') ? `+${digits}` : null
  if (!e164) return Response.json({ error: 'Invalid phone number format' }, { status: 400 })

  // Default task for real estate lead qualification
  const defaultTask = `You are a friendly real estate assistant calling on behalf of a real estate agent. 
You are calling ${lead_name ?? 'a prospective buyer'}.
Your goal is to:
1. Confirm they are interested in buying or selling a home
2. Ask about their timeline (how soon are they looking?)
3. Ask about their budget or price range
4. Ask if they are pre-approved for a mortgage
5. Ask what areas or neighborhoods they are interested in
6. Let them know the agent will follow up personally very soon

Keep the conversation warm, friendly, and under 3 minutes. Do not pressure them.
If they ask to be removed from contact, thank them and end the call politely.
At the end of the call, summarize what you learned.`

  const payload = {
    phone_number: e164,
    from: fromNumber,
    task: task ?? defaultTask,
    voice: voice_id ?? 'maya',
    reduce_latency: true,
    record: true,
    metadata: {
      lead_id,
      org_id: caller.org_id,
      called_by: caller.email,
    },
    webhook: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ziggy-crm.vercel.app'}/api/calls/webhook`,
    answered_by_enabled: true,
    wait_for_greeting: true,
    interruption_threshold: 100,
    max_duration: 12,
  }

  const res = await fetch('https://api.bland.ai/v1/calls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authorization': apiKey,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok) {
    return Response.json({ error: data.message ?? 'Bland.ai call failed', details: data }, { status: 500 })
  }

  // Log the call as an activity immediately
  const admin = createAdminClient()
  await admin.from('crm_lead_activities').insert({
    lead_id,
    org_id: caller.org_id,
    user_id: caller.id,
    type: 'call',
    content: `AI call initiated to ${e164} via Bland.ai (call ID: ${data.call_id})`,
    metadata: { bland_call_id: data.call_id, status: 'initiated', phone: e164 },
  })

  // Update last_contacted_at
  await admin.from('crm_leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', lead_id).eq('org_id', caller.org_id)

  return Response.json({ call_id: data.call_id, status: 'initiated', phone: e164 })
}
