// POST /api/calls/log — manually log a call outcome against a lead
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getOrgUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id, org_id').eq('email', user.email!).single()
  return data
}

export async function POST(request: Request) {
  const caller = await getOrgUser()
  if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, outcome, duration_minutes, notes, next_followup_date } = await request.json()

  if (!lead_id || !outcome) {
    return Response.json({ error: 'lead_id and outcome are required' }, { status: 400 })
  }

  const VALID_OUTCOMES = ['connected', 'no_answer', 'voicemail']
  if (!VALID_OUTCOMES.includes(outcome)) {
    return Response.json({ error: `outcome must be one of: ${VALID_OUTCOMES.join(', ')}` }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify lead belongs to org
  const { data: lead } = await admin
    .from('crm_leads')
    .select('id')
    .eq('id', lead_id)
    .eq('org_id', caller.org_id)
    .single()

  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 })

  const outcomeLabels: Record<string, string> = {
    connected: 'Connected',
    no_answer: 'No Answer',
    voicemail: 'Left Voicemail',
  }

  const durationSeconds = duration_minutes ? Math.round(parseFloat(duration_minutes) * 60) : null

  const { data: activity, error } = await admin.from('crm_lead_activities').insert({
    lead_id,
    org_id: caller.org_id,
    user_id: caller.id,
    type: 'call',
    content: outcomeLabels[outcome],
    call_outcome: outcome,
    call_notes: notes || null,
    duration_seconds: durationSeconds,
    metadata: { outcome, duration_minutes: duration_minutes ?? null },
  }).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Update lead: last_contacted_at and optionally next_followup_at
  const leadUpdates: Record<string, unknown> = { last_contacted_at: new Date().toISOString() }
  if (next_followup_date) leadUpdates.next_followup_at = new Date(next_followup_date).toISOString()

  await admin.from('crm_leads').update(leadUpdates).eq('id', lead_id).eq('org_id', caller.org_id)

  return Response.json({ activity }, { status: 201 })
}
