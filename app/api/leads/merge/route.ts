// POST /api/leads/merge — merge two leads (keep_id wins, delete_id is removed)
// All activities, notes, enrollments from delete_id are re-assigned to keep_id
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  return data?.org_id ?? null
}

export async function POST(request: Request) {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { keep_id, delete_id } = await request.json()
  if (!keep_id || !delete_id || keep_id === delete_id) {
    return Response.json({ error: 'keep_id and delete_id are required and must differ' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify both leads belong to this org
  const { data: leads } = await admin
    .from('crm_leads')
    .select('id, full_name')
    .eq('org_id', orgId)
    .in('id', [keep_id, delete_id])

  if (!leads || leads.length !== 2) {
    return Response.json({ error: 'One or both leads not found' }, { status: 404 })
  }

  // Re-assign activities from delete_id to keep_id
  await admin.from('crm_lead_activities').update({ lead_id: keep_id }).eq('lead_id', delete_id)

  // Re-assign sequence enrollments
  await admin.from('crm_sequence_enrollments').update({ lead_id: keep_id }).eq('lead_id', delete_id).eq('org_id', orgId)

  // Re-assign sequence sends
  await admin.from('crm_sequence_sends').update({ lead_id: keep_id }).eq('lead_id', delete_id).eq('org_id', orgId)

  // Re-assign tasks
  await admin.from('crm_tasks').update({ lead_id: keep_id }).eq('lead_id', delete_id).eq('org_id', orgId)

  // Log the merge as an activity on the kept lead
  const deletedLead = leads.find((l) => l.id === delete_id)
  await admin.from('crm_lead_activities').insert({
    lead_id: keep_id,
    org_id: orgId,
    type: 'note',
    content: `Merged duplicate lead: ${deletedLead?.full_name ?? delete_id}`,
  })

  // Delete the duplicate
  const { error } = await admin.from('crm_leads').delete().eq('id', delete_id).eq('org_id', orgId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true, kept_id: keep_id })
}
