import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('users').select('org_id').eq('email', user.email!).single()
  return data?.org_id ?? null
}

export async function GET() {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('action_plans')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ plans: data })
}

export async function POST(request: Request) {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, description, trigger_event = 'manual', trigger_stage, industry } = body

  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('action_plans')
    .insert({
      org_id: orgId,
      name,
      description: description || null,
      trigger_event,
      trigger_stage: trigger_stage || null,
      industry: industry || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ plan: data }, { status: 201 })
}
