import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('org_id, id').eq('email', user.email!).single()
  return data ?? null
}

export async function GET() {
  const u = await getUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_smart_lists')
    .select('*')
    .eq('org_id', u.org_id)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ lists: data ?? [] })
}

export async function POST(request: Request) {
  const u = await getUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, filters_json } = await request.json()
  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_smart_lists')
    .insert({ org_id: u.org_id, name, filters_json: filters_json ?? {}, created_by: u.id })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ list: data }, { status: 201 })
}
