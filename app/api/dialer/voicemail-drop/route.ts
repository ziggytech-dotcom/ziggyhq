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
  return data.config as { account_sid: string; auth_token: string; phone_number: string; voicemail_url?: string }
}

export async function POST(request: Request) {
  const user = await getOrgUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { call_sid, lead_id } = await request.json() as { call_sid: string; lead_id: string }

  if (!call_sid || !lead_id) {
    return Response.json({ error: 'call_sid and lead_id are required' }, { status: 400 })
  }

  const creds = await getTwilioCreds(user.org_id)
  if (!creds) return Response.json({ error: 'Twilio not connected' }, { status: 400 })

  // Try voicemail URL from twilio config first, then dedicated provider
  let voicemailUrl = creds.voicemail_url ?? null

  if (!voicemailUrl) {
    const admin = createAdminClient()
    const { data: vmIntegration } = await admin
      .from('org_integrations')
      .select('config')
      .eq('org_id', user.org_id)
      .eq('provider', 'twilio_voicemail')
      .single()

    if (vmIntegration) {
      const vmCfg = vmIntegration.config as Record<string, string>
      voicemailUrl = vmCfg.voicemail_url ?? null
    }
  }

  if (!voicemailUrl) {
    return Response.json({ error: 'No voicemail recording configured' }, { status: 400 })
  }

  const client = twilio(creds.account_sid, creds.auth_token)
  await client.calls(call_sid).update({
    twiml: `<Response><Play>${voicemailUrl}</Play><Hangup/></Response>`,
  })

  const admin = createAdminClient()
  await admin.from('crm_lead_activities').insert({
    lead_id,
    org_id: user.org_id,
    user_id: user.id,
    type: 'call',
    content: 'Voicemail drop sent',
    metadata: { call_sid, voicemail_drop: true },
  })

  return Response.json({ success: true })
}
