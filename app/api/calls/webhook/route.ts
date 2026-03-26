import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.json()

  const {
    call_id,
    metadata,
    status,
    transcript,
    summary,
    call_length,
    answered_by,
    recording_url,
    variables,
  } = body

  if (!metadata?.lead_id || !metadata?.org_id) {
    return Response.json({ ok: false, error: 'Missing metadata' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Build activity content from transcript summary
  const lines: string[] = []
  if (answered_by) lines.push(`Answered by: ${answered_by}`)
  if (call_length) lines.push(`Duration: ${Math.round(call_length / 60)}:${String(Math.round(call_length % 60)).padStart(2, '0')}`)
  if (summary) lines.push(`\nSummary:\n${summary}`)
  if (transcript) lines.push(`\nTranscript:\n${transcript}`)

  const content = lines.join('\n') || `Call ${status ?? 'completed'}`

  // Update the initiated activity with full details
  const { data: existing } = await admin
    .from('crm_lead_activities')
    .select('id')
    .eq('lead_id', metadata.lead_id)
    .contains('metadata', { bland_call_id: call_id })
    .single()

  if (existing?.id) {
    await admin.from('crm_lead_activities').update({
      content,
      duration_seconds: call_length ? Math.round(call_length) : null,
      metadata: {
        bland_call_id: call_id,
        status,
        answered_by,
        recording_url,
        summary,
        variables,
      },
    }).eq('id', existing.id)
  } else {
    // Fallback: insert new activity
    await admin.from('crm_lead_activities').insert({
      lead_id: metadata.lead_id,
      org_id: metadata.org_id,
      type: 'call',
      content,
      duration_seconds: call_length ? Math.round(call_length) : null,
      metadata: { bland_call_id: call_id, status, answered_by, recording_url, summary },
    })
  }

  // Auto-extract lead info from variables if Bland filled them in
  const updates: Record<string, unknown> = {}
  if (variables?.timeline) updates.timeline = variables.timeline
  if (variables?.budget) {
    const n = parseInt(String(variables.budget).replace(/\D/g, ''))
    if (!isNaN(n)) updates.budget_max = n
  }
  if (variables?.pre_approved === 'yes' || variables?.pre_approved === true) updates.pre_approved = true
  if (variables?.areas) updates.areas_of_interest = variables.areas

  if (Object.keys(updates).length > 0) {
    await admin.from('crm_leads').update(updates).eq('id', metadata.lead_id).eq('org_id', metadata.org_id)
  }

  return Response.json({ ok: true })
}
