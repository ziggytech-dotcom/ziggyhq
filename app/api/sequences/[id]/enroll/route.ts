import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { triggerZapierWebhook } from '@/lib/zapier'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  return data?.org_id ?? null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sequenceId } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: seq } = await admin
    .from('crm_sequences')
    .select('*, crm_sequence_steps(*)')
    .eq('id', sequenceId)
    .eq('org_id', orgId)
    .single()
  if (!seq) return Response.json({ error: 'Not found' }, { status: 404 })

  const { lead_ids } = await request.json()
  if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
    return Response.json({ error: 'lead_ids array required' }, { status: 400 })
  }

  const firstStep = (seq.crm_sequence_steps ?? []).sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order)[0]
  const nextSendAt = firstStep
    ? new Date(Date.now() + (firstStep.delay_hours ?? 24) * 3600000).toISOString()
    : null

  const enrollments = lead_ids.map((leadId: string) => ({
    sequence_id: sequenceId,
    lead_id: leadId,
    org_id: orgId,
    status: 'active',
    current_step: 0,
    next_send_at: nextSendAt,
  }))

  const { error } = await admin
    .from('crm_sequence_enrollments')
    .upsert(enrollments, { onConflict: 'sequence_id,lead_id', ignoreDuplicates: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  triggerZapierWebhook(orgId, 'sequence.enrolled', { sequence_id: sequenceId, lead_ids, enrolled: lead_ids.length })

  return Response.json({ enrolled: lead_ids.length })
}
