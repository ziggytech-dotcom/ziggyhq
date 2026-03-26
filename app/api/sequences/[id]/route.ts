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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_sequences')
    .select('*, crm_sequence_steps(*)')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  const steps = (data.crm_sequence_steps ?? []).sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order)
  return Response.json({ sequence: { ...data, steps } })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if ('name' in body) updates.name = body.name
  if ('trigger' in body) updates.trigger = body.trigger
  if ('active' in body) updates.active = body.active

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_sequences')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ sequence: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin.from('crm_sequences').delete().eq('id', id).eq('org_id', orgId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
