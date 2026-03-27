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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = ['title', 'description', 'assigned_to', 'due_at', 'completed_at', 'type']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  // Shorthand: completed: true sets completed_at
  if (body.completed === true && !('completed_at' in body)) {
    updates.completed_at = new Date().toISOString()
  }
  if (body.completed === false) {
    updates.completed_at = null
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_tasks')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ task: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin.from('crm_tasks').delete().eq('id', id).eq('org_id', orgId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
