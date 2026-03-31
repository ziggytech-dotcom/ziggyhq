// Configure this webhook URL in your Twilio console: https://app.ziggyhq.com/api/sms/webhook
import { createAdminClient } from '@/lib/supabase/admin'

const TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

export async function POST(request: Request) {
  const formData = await request.formData()
  const from = formData.get('From') as string | null
  const to = formData.get('To') as string | null
  const messageBody = formData.get('Body') as string | null

  if (!from || !to || messageBody === null) {
    return new Response(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
  }

  const admin = createAdminClient()

  // Find the org by matching the 'To' number to a Twilio integration
  const { data: integrations } = await admin
    .from('org_integrations')
    .select('org_id, config')
    .eq('provider', 'twilio')

  const integration = integrations?.find((i) => {
    const cfg = i.config as Record<string, string>
    return cfg.phone_number === to
  })

  if (!integration) {
    return new Response(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
  }

  const org_id = integration.org_id

  // Find the lead by matching the 'From' number
  const { data: lead } = await admin
    .from('crm_leads')
    .select('id, full_name, assigned_to')
    .eq('org_id', org_id)
    .eq('phone', from)
    .single()

  if (!lead) {
    // Also try phone_2
    const { data: leadByPhone2 } = await admin
      .from('crm_leads')
      .select('id, full_name, assigned_to')
      .eq('org_id', org_id)
      .eq('phone_2', from)
      .single()

    if (!leadByPhone2) {
      return new Response(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
    }

    await logInboundSms({ admin, org_id, lead: leadByPhone2, from, to, messageBody })
    return new Response(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
  }

  await logInboundSms({ admin, org_id, lead, from, to, messageBody })
  return new Response(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
}

async function logInboundSms(params: {
  admin: ReturnType<typeof createAdminClient>
  org_id: string
  lead: { id: string; full_name: string; assigned_to: string | null }
  from: string
  to: string
  messageBody: string
}) {
  const { admin, org_id, lead, from, to, messageBody } = params

  await admin.from('crm_lead_activities').insert({
    lead_id: lead.id,
    org_id,
    type: 'sms_received',
    direction: 'inbound',
    content: messageBody,
    metadata_json: { from, to },
  })

  // Notify assigned rep if there is one
  if (lead.assigned_to) {
    await admin.from('crm_notifications').insert({
      user_id: lead.assigned_to,
      org_id,
      type: 'sms_reply',
      title: `SMS reply from ${lead.full_name}`,
      body: messageBody.slice(0, 200),
      link: `/app/leads/${lead.id}`,
      read: false,
    })
  }
}
