// Called by a cron or manual trigger to send due sequence emails
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { sendSmsToLead, getOrgTwilioConfig } from '@/lib/sms'

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

  // Find due enrollments (skip those where lead has replied)
  const { data: enrollments } = await admin
    .from('crm_sequence_enrollments')
    .select('*, crm_leads(id, full_name, email, phone, assigned_to, property_type), crm_sequences(*, crm_sequence_steps(*))')
    .eq('status', 'active')
    .is('replied_at', null)
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
    let currentStep = steps[enrollment.current_step]
    if (!currentStep) {
      // No more steps -- complete enrollment
      await admin.from('crm_sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
      continue
    }

    if (!lead.email) {
      // Skip no email
      await admin.from('crm_sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
      continue
    }

    // Check conditional logic -- skip step if condition not met
    if (currentStep.condition_type) {
      const prevStepIndex = enrollment.current_step - 1
      let conditionMet = true
      if (prevStepIndex >= 0) {
        const prevStep = steps[prevStepIndex]
        if (prevStep?.id) {
          const { data: prevSend } = await admin
            .from('crm_sequence_sends')
            .select('opened_at, clicked_at')
            .eq('enrollment_id', enrollment.id)
            .eq('step_id', prevStep.id)
            .single()

          if (currentStep.condition_type === 'opened') conditionMet = !!prevSend?.opened_at
          if (currentStep.condition_type === 'not_opened') conditionMet = !prevSend?.opened_at
          if (currentStep.condition_type === 'clicked') conditionMet = !!prevSend?.clicked_at
        }
      }

      if (!conditionMet) {
        // Skip this step, advance to next
        const nextStepIndex = enrollment.current_step + 1
        const nextStep = steps[nextStepIndex]
        if (nextStep) {
          const nextSendAt = new Date(Date.now() + nextStep.delay_hours * 3600000).toISOString()
          await admin.from('crm_sequence_enrollments').update({ current_step: nextStepIndex, next_send_at: nextSendAt }).eq('id', enrollment.id)
        } else {
          await admin.from('crm_sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
        }
        continue
      }
    }

    // Get agent name
    let agentName = 'Your Agent'
    if (lead.assigned_to) {
      const { data: agent } = await admin.from('crm_users').select('full_name, email').eq('id', lead.assigned_to).single()
      if (agent) agentName = agent.full_name ?? agent.email
    }

    // --- SMS step ---
    if (currentStep.type === 'sms') {
      const smsBody = applyMergeTags(currentStep.body ?? '', lead, agentName)
      if (!lead.phone) {
        // No phone -- skip and log warning
        await admin.from('crm_lead_activities').insert({
          lead_id: lead.id,
          org_id: enrollment.org_id,
          type: 'note',
          content: 'Sequence SMS step skipped -- lead has no phone number',
        })
      } else {
        const twilioConfig = await getOrgTwilioConfig(admin, enrollment.org_id)
        if (!twilioConfig) {
          await admin.from('crm_lead_activities').insert({
            lead_id: lead.id,
            org_id: enrollment.org_id,
            type: 'note',
            content: 'Sequence SMS step skipped -- Twilio not connected. Go to Settings → Integrations.',
          })
        } else {
          try {
            await sendSmsToLead({ admin, org_id: enrollment.org_id, lead_id: lead.id, message: smsBody })
          } catch {
            // Failed -- skip for now
          }
        }
      }

      // Advance to next step
      const nextStepIndex = enrollment.current_step + 1
      const nextStep = steps[nextStepIndex]
      if (nextStep) {
        const nextSendAt = new Date(Date.now() + nextStep.delay_hours * 3600000).toISOString()
        await admin.from('crm_sequence_enrollments').update({ current_step: nextStepIndex, next_send_at: nextSendAt }).eq('id', enrollment.id)
      } else {
        await admin.from('crm_sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
      }
      sent++
      continue
    }

    // --- Email step (default) ---
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
      // Failed to send -- skip for now
    }
  }

  return Response.json({ sent })
}
