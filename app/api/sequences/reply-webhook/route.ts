// Resend webhook — receives email events (delivered, opened, clicked, bounced, complained)
// We use this to detect replies and stop sequences where reply_stops_sequence = true
// Set up in Resend dashboard: Webhooks → POST https://app.ziggyhq.com/api/sequences/reply-webhook
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  // Resend sends a svix-signature header; for now we just trust the payload
  // In production, verify the webhook signature from Resend dashboard
  const body = await request.json()
  const { type, data } = body

  // We only care about reply-like events (email_replied is not yet in Resend, but we handle opened/clicked)
  // When Resend adds replied event type, handle it here
  if (!type || !data) return Response.json({ ok: true })

  const admin = createAdminClient()
  const resendId = data.email_id ?? data.id

  if (!resendId) return Response.json({ ok: true })

  // Find the send record
  const { data: send } = await admin
    .from('crm_sequence_sends')
    .select('id, enrollment_id, lead_id, org_id')
    .eq('resend_id', resendId)
    .single()

  if (!send) return Response.json({ ok: true })

  if (type === 'email.opened' && !data.opened_at) {
    await admin.from('crm_sequence_sends').update({ opened_at: new Date().toISOString() }).eq('id', send.id)
  }

  if (type === 'email.clicked' && !data.clicked_at) {
    await admin.from('crm_sequence_sends').update({ clicked_at: new Date().toISOString() }).eq('id', send.id)
  }

  // email.bounced or email.complained — stop the sequence
  if (type === 'email.bounced' || type === 'email.complained' || type === 'email.unsubscribed') {
    await admin.from('crm_sequence_enrollments').update({ status: 'unsubscribed' }).eq('id', send.enrollment_id)
    await admin.from('crm_lead_activities').insert({
      lead_id: send.lead_id,
      org_id: send.org_id,
      type: 'email',
      content: `Email sequence stopped — ${type.replace('email.', '')} (${resendId})`,
    })
  }

  // email.replied — stop the sequence if reply_stops_sequence is true
  if (type === 'email.replied') {
    const { data: enrollment } = await admin
      .from('crm_sequence_enrollments')
      .select('*, crm_sequences(reply_stops_sequence)')
      .eq('id', send.enrollment_id)
      .single()

    if (enrollment?.crm_sequences?.reply_stops_sequence) {
      await admin.from('crm_sequence_enrollments').update({
        status: 'completed',
        replied_at: new Date().toISOString(),
      }).eq('id', send.enrollment_id)

      await admin.from('crm_lead_activities').insert({
        lead_id: send.lead_id,
        org_id: send.org_id,
        type: 'email',
        content: 'Lead replied to email sequence — sequence stopped automatically',
      })
    }
  }

  return Response.json({ ok: true })
}
