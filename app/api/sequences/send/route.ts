// Called by a cron or manual trigger to send due sequence emails
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

function applyMergeTags(text: string, lead: Record<string, string | null>, agentName: string): string {
  return text
    .replace(/\{\{first_name\}\}/g, lead.full_name?.split(' ')[0] ?? 'there')
    .replace(/\{\{full_name\}\}/g, lead.full_name ?? '')
    .replace(/\{\{agent_name\}\}/g, agentName)
    .replace(/\{\{property_address\}\}/g, lead.property_address ?? '')
    .replace(/\{\{phone\}\}/g, lead.phone ?? '')
    .replace(/\{\{email\}\}/g, lead.email ?? '')
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const admin = createAdminClient()
  const now = new Date().toISOString()

  // Find due enrollments
  const { data: enrollments } = await admin
    .from('crm_sequence_enrollments')
    .select('*, crm_leads(id, full_name, email, phone, assigned_to, property_type), crm_sequences(*, crm_sequence_steps(*))')
    .eq('status', 'active')
    .lte('next_send_at', now)
    .limit(50)

  if (!enrollments || enrollments.length === 0) {
    return Response.json({ sent: 0 })
  }

  let sent = 0
  for (const enrollment of enrollments) {
    const lead = enrollment.crm_leads
    const sequence = enrollment.crm_sequences
    if (!lead || !sequence) continue

    const steps = (sequence.crm_sequence_steps ?? []).sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order)
    const currentStep = steps[enrollment.current_step]
    if (!currentStep) {
      // No more steps — complete enrollment
      await admin.from('crm_sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
      continue
    }

    if (!lead.email) {
      // Skip no email
      await admin.from('crm_sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
      continue
    }

    // Get agent name
    let agentName = 'Your Agent'
    if (lead.assigned_to) {
      const { data: agent } = await admin.from('crm_users').select('full_name, email').eq('id', lead.assigned_to).single()
      if (agent) agentName = agent.full_name ?? agent.email
    }

    const subject = applyMergeTags(currentStep.subject, lead, agentName)
    const htmlBody = applyMergeTags(currentStep.body, lead, agentName).replace(/\n/g, '<br>')

    try {
      const result = await resend.emails.send({
        from: 'noreply@ziggyhq.com',
        to: lead.email,
        subject,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${htmlBody}</div>`,
      })

      await admin.from('crm_sequence_sends').insert({
        enrollment_id: enrollment.id,
        step_id: currentStep.id,
        lead_id: lead.id,
        org_id: enrollment.org_id,
        resend_id: result.data?.id ?? null,
      })

      // Log activity
      await admin.from('crm_lead_activities').insert({
        lead_id: lead.id,
        org_id: enrollment.org_id,
        type: 'email',
        content: `Sequence email sent: "${subject}"`,
      })

      // Advance to next step
      const nextStepIndex = enrollment.current_step + 1
      const nextStep = steps[nextStepIndex]
      if (nextStep) {
        const nextSendAt = new Date(Date.now() + nextStep.delay_hours * 3600000).toISOString()
        await admin.from('crm_sequence_enrollments').update({
          current_step: nextStepIndex,
          next_send_at: nextSendAt,
        }).eq('id', enrollment.id)
      } else {
        await admin.from('crm_sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
      }

      sent++
    } catch {
      // Failed to send — skip for now
    }
  }

  return Response.json({ sent })
}
