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

interface AiCallerSettings {
  name: string
  voice: string
  brokerage: string
  callback_phone: string
  scripts: {
    new_lead: string
    home_value: string
    listing_inquiry: string
    voicemail: string
  }
}

function buildScripts(s: AiCallerSettings, leadName: string): { task: string; voicemail: string } {
  const name = s.name
  const brokerage = s.brokerage
  const callback = s.callback_phone

  const scripts = {
    new_lead: s.scripts?.new_lead || `You are ${name}, a warm and friendly assistant calling from ${brokerage}.
You are calling ${leadName}.

Start with: "Hi, is this ${leadName}? Great! This is ${name} calling from ${brokerage}. How are you doing today?"

Wait for their response, then say: "I'm just reaching out because we saw you were interested in buying or selling a home — I wanted to make sure someone reached out right away!"

Your goals for this call:
1. Confirm whether they are looking to buy, sell, or both
2. Ask about their timeline — how soon are they thinking?
3. Ask about their price range or budget
4. Ask if they have been pre-approved for a mortgage yet
5. Ask what areas or neighborhoods they are most interested in
6. Warmly close: "Wonderful! I'm going to pass all of this along to your agent right now — they'll be reaching out to you personally very soon. Is there a best time to reach you?"

Keep the conversation natural, warm, and conversational — like a real person, not a robot. Never pressure or rush them. Under 3 minutes total. If they ask to be removed from contact, thank them sincerely and end the call politely.`,

    home_value: s.scripts?.home_value || `You are ${name}, a warm and friendly assistant calling from ${brokerage}.
You are calling ${leadName}.

Start with: "Hi, is this ${leadName}? Hi there! This is ${name} calling from ${brokerage}. How are you doing today?"

Say: "I'm calling because you recently requested a home value estimate — I wanted to make sure we connect right away!"

Your goals:
1. Confirm their address or the property they want valued
2. Ask if they are thinking about selling now, or just curious about their home's value
3. If selling: ask their timeline and where they are planning to move
4. Let them know an agent will follow up with a full market analysis very soon
5. Warm close: "We're going to put together a full analysis for you — is there a best time for your agent to call you back?"

Keep it warm, helpful, and conversational. Under 3 minutes. Never pressure.`,

    listing_inquiry: s.scripts?.listing_inquiry || `You are ${name}, a warm and friendly assistant calling from ${brokerage}.
You are calling ${leadName}.

Start with: "Hi, is this ${leadName}? Great! This is ${name} calling from ${brokerage}. How are you today?"

Say: "I'm calling because you reached out about one of our listings — I just wanted to make sure someone got back to you right away!"

Your goals:
1. Ask which property they were interested in
2. Ask if they would like to schedule a showing
3. Ask about their timeline for buying
4. Ask if they are pre-approved
5. Let them know an agent will reach out shortly to set everything up
6. Close: "I'm going to have your agent reach out to schedule a showing — is there a best time for you?"

Warm, friendly, conversational. Under 3 minutes. Never pressure.`,
  }

  const voicemailMsg = s.scripts?.voicemail ||
    `Hi ${leadName}, this is ${name} calling from ${brokerage}. We saw your inquiry come through and wanted to reach out right away! Please feel free to call us back at ${callback} — we'd love to help you. Have a wonderful day!`

  return { task: scripts.new_lead, voicemail: voicemailMsg }
}

export async function POST(request: Request) {
  const caller = await getOrgUser()
  if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, phone, lead_name, script_type = 'new_lead' } = await request.json()

  if (!lead_id || !phone) {
    return Response.json({ error: 'lead_id and phone are required' }, { status: 400 })
  }

  const apiKey = process.env.BLAND_API_KEY
  if (!apiKey) return Response.json({ error: 'Bland.ai not configured' }, { status: 500 })

  // Load org settings for AI caller config
  const admin = createAdminClient()
  const { data: org } = await admin
    .from('crm_organizations')
    .select('name, settings_json')
    .eq('id', caller.org_id)
    .single()

  const settings = (org?.settings_json ?? {}) as Record<string, unknown>
  const aiCaller = (settings.ai_caller ?? {}) as Partial<AiCallerSettings>

  const callerConfig: AiCallerSettings = {
    name: aiCaller.name ?? 'Emma',
    voice: aiCaller.voice ?? 'maya',
    brokerage: aiCaller.brokerage ?? org?.name ?? 'our real estate team',
    callback_phone: aiCaller.callback_phone ?? process.env.BLAND_PHONE_NUMBER ?? '',
    scripts: (aiCaller.scripts ?? {}) as AiCallerSettings['scripts'],
  }

  // Clean phone to E.164
  const digits = phone.replace(/\D/g, '')
  const e164 = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith('1') ? `+${digits}` : null
  if (!e164) return Response.json({ error: 'Invalid phone number format' }, { status: 400 })

  const { task, voicemail } = buildScripts(callerConfig, lead_name ?? 'there')

  // Pick script by type
  let finalTask = task
  if (script_type === 'home_value') {
    const { task: hvTask } = buildScripts({ ...callerConfig }, lead_name ?? 'there')
    finalTask = callerConfig.scripts?.home_value || hvTask
  } else if (script_type === 'listing_inquiry') {
    finalTask = callerConfig.scripts?.listing_inquiry || task
  }

  const fromNumber = process.env.BLAND_PHONE_NUMBER ?? '+17254256788'

  const payload = {
    phone_number: e164,
    from: fromNumber,
    task: finalTask,
    voice: callerConfig.voice,
    reduce_latency: true,
    record: true,
    metadata: {
      lead_id,
      org_id: caller.org_id,
      called_by: caller.email,
      script_type,
    },
    webhook: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ziggy-crm.vercel.app'}/api/calls/webhook`,
    answered_by_enabled: true,
    voicemail_message: voicemail,
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

  // Log the call as an activity
  await admin.from('crm_lead_activities').insert({
    lead_id,
    org_id: caller.org_id,
    user_id: caller.id,
    type: 'call',
    content: `AI call initiated to ${e164} via Bland.ai [${callerConfig.name}] (call ID: ${data.call_id})`,
    metadata: { bland_call_id: data.call_id, status: 'initiated', phone: e164, script_type, caller_name: callerConfig.name },
  })

  await admin.from('crm_leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', lead_id).eq('org_id', caller.org_id)

  return Response.json({ call_id: data.call_id, status: 'initiated', phone: e164, caller_name: callerConfig.name })
}
