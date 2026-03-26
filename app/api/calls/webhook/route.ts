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

  // Build activity content
  const lines: string[] = []
  if (answered_by) lines.push(`Answered by: ${answered_by}`)
  if (call_length) {
    const mins = Math.floor(call_length / 60)
    const secs = String(Math.round(call_length % 60)).padStart(2, '0')
    lines.push(`Duration: ${mins}:${secs}`)
  }
  if (summary) lines.push(`\n📋 Summary:\n${summary}`)
  if (recording_url) lines.push(`\n🎙️ Recording: ${recording_url}`)
  if (transcript) lines.push(`\n📝 Transcript:\n${transcript}`)

  const content = lines.join('\n') || `Call ${status ?? 'completed'}`

  // Find the initial "call initiated" activity by searching for the call_id in content
  // Use ilike instead of jsonb contains — more reliable
  const { data: existing } = await admin
    .from('crm_lead_activities')
    .select('id')
    .eq('lead_id', metadata.lead_id)
    .eq('type', 'call')
    .ilike('content', `%${call_id}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    await admin.from('crm_lead_activities')
      .update({
        content,
        duration_seconds: call_length ? Math.round(call_length) : null,
      })
      .eq('id', existing.id)
  } else {
    // No initial entry found — insert fresh
    await admin.from('crm_lead_activities').insert({
      lead_id: metadata.lead_id,
      org_id: metadata.org_id,
      type: 'call',
      content,
      duration_seconds: call_length ? Math.round(call_length) : null,
    })
  }

  // Auto-extract lead info from Bland variables
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
