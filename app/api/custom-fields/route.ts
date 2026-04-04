// GET /api/custom-fields -- list field defs for org
// POST /api/custom-fields -- create a new field def (admin only)
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

export async function GET() {
  const u = await getOrgUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_custom_field_defs')
    .select('*')
    .eq('org_id', u.org_id)
    .order('position', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ fields: data ?? [] })
}

export async function POST(request: Request) {
  const u = await getOrgUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'owner'].includes(u.role)) {
    return Response.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { label, field_type, options, is_required, position } = await request.json()
  if (!label || !field_type) {
    return Response.json({ error: 'label and field_type are required' }, { status: 400 })
  }

  const VALID_TYPES = ['text', 'number', 'date', 'dropdown', 'checkbox']
  if (!VALID_TYPES.includes(field_type)) {
    return Response.json({ error: `field_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
  }

  if (field_type === 'dropdown' && (!Array.isArray(options) || options.length === 0)) {
    return Response.json({ error: 'options array required for dropdown type' }, { status: 400 })
  }

  // Derive snake_case name from label
  const name = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60)

  const admin = createAdminClient()

  // Get next position if not provided
  let pos = position
  if (pos === undefined) {
    const { count } = await admin
      .from('crm_custom_field_defs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', u.org_id)
    pos = count ?? 0
  }

  const { data, error } = await admin
    .from('crm_custom_field_defs')
    .insert({
      org_id: u.org_id,
      name,
      label,
      field_type,
      options: field_type === 'dropdown' ? options : null,
      is_required: is_required ?? false,
      position: pos,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return Response.json({ error: 'A field with this name already exists' }, { status: 409 })
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ field: data }, { status: 201 })
}
