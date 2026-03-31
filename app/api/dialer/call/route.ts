import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

async function getOrgUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id, org_id, full_name, email').eq('email', user.email!).single()
  return data
}

async function getTwilioCreds(orgId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('org_integrations').select('config').eq('org_id', orgId).eq('provider', 'twilio').single()
  if (!data) return null
  return data.config as { account_sid: string; auth_token: string; phone_number: string }
}

export async function POST(request: Request) {
  const user = await getOrgUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, phone, lead_name, notes } = await request.json()

  if (!lead_id || !phone) {
    return Response.json({ error: 'lead_id and phone are required' }, { status: 400 })
  }

  const creds = await getTwilioCreds(user.org_id)
  if (!creds) return Response.json({ error: 'Twilio not connected' }, { status: 400 })

  // Clean phone to E.164
  const digits = phone.replace(/\D/g, '')
  const e164 = digits.length === 10
    ? `+1${digits}`
    : digits.length === 11 && digits.startsWith('1')
      ? `+${digits}`
      : null
  if (!e164) return Response.json({ error: 'Invalid phone number format' }, { status: 400 })

  const client = twilio(creds.account_sid, creds.auth_token)
  const call = await client.calls.create({
    to: e164,
    from: creds.phone_number,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/dialer/twiml`,
    statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/dialer/status`,
    statusCallbackMethod: 'POST',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    record: true,
  })

  const admin = createAdminClient()

  await admin.from('crm_lead_activities').insert({
    lead_id,
    org_id: user.org_id,
    user_id: user.id,
    type: 'call',
    content: `Outbound call initiated to ${e164}`,
    metadata: {
      call_sid: call.sid,
      status: 'initiated',
      phone: e164,
      dialer: true,
      ...(notes ? { notes } : {}),
      ...(lead_name ? { lead_name } : {}),
    },
  })

  await admin.from('crm_leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', lead_id).eq('org_id', user.org_id)

  return Response.json({ call_sid: call.sid, status: 'initiated', phone: e164 })
}
