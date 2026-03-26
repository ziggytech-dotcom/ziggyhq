import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id, org_id').eq('email', user.email!).single()
  return data ?? null
}

export async function GET() {
  const u = await getUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: sequences } = await admin
    .from('crm_sequences')
    .select('*, crm_sequence_steps(id)')
    .eq('org_id', u.org_id)
    .order('created_at', { ascending: false })

  // Get enrollment counts
  const ids = (sequences ?? []).map((s) => s.id)
  const { data: enrollments } = ids.length > 0
    ? await admin.from('crm_sequence_enrollments').select('sequence_id, status').in('sequence_id', ids)
    : { data: [] }

  const result = (sequences ?? []).map((s) => ({
    ...s,
    step_count: s.crm_sequence_steps?.length ?? 0,
    enrollment_count: (enrollments ?? []).filter((e) => e.sequence_id === s.id).length,
    active_enrollments: (enrollments ?? []).filter((e) => e.sequence_id === s.id && e.status === 'active').length,
  }))

  return Response.json({ sequences: result })
}

export async function POST(request: Request) {
  const u = await getUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, trigger } = await request.json()
  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_sequences')
    .insert({ org_id: u.org_id, name, trigger: trigger ?? 'manual' })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ sequence: data }, { status: 201 })
}
