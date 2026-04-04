// PUT /api/custom-fields/[id] -- update a field def
// DELETE /api/custom-fields/[id] -- delete a field def
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getOrgUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id, org_id, role').eq('email', user.email!).single()
  return data
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const u = await getOrgUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'owner'].includes(u.role)) {
    return Response.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { label, field_type, options, is_required, position } = body

  const updates: Record<string, unknown> = {}
  if (label !== undefined) updates.label = label
  if (field_type !== undefined) updates.field_type = field_type
  if (options !== undefined) updates.options = options
  if (is_required !== undefined) updates.is_required = is_required
  if (position !== undefined) updates.position = position

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_custom_field_defs')
    .update(updates)
    .eq('id', id)
    .eq('org_id', u.org_id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return Response.json({ error: 'Field not found' }, { status: 404 })

  return Response.json({ field: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const u = await getOrgUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'owner'].includes(u.role)) {
    return Response.json({ error: 'Admin access required' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('crm_custom_field_defs')
    .delete()
    .eq('id', id)
    .eq('org_id', u.org_id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
