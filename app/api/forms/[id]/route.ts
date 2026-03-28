import { NextRequest } from 'next/server'
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrgUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_forms')
    .select('*')
    .eq('id', id)
    .eq('org_id', user.org_id)
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ form: data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrgUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const allowed = ['title', 'fields', 'active']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_forms')
    .update(updates)
    .eq('id', id)
    .eq('org_id', user.org_id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ form: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrgUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin
    .from('crm_forms')
    .delete()
    .eq('id', id)
    .eq('org_id', user.org_id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
