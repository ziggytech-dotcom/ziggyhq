import { NextRequest } from 'next/server'
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

export async function GET() {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_routing_rules')
    .select('*, crm_users(id, full_name, email)')
    .eq('org_id', orgId)
    .order('priority', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ rules: data ?? [] })
}

export async function POST(request: NextRequest) {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, priority = 0, match_source, match_score_min, match_score_max, match_stage, action = 'assign', assign_to_user_id } = body

  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })
  if (action !== 'assign' && action !== 'round_robin') {
    return Response.json({ error: 'action must be assign or round_robin' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_routing_rules')
    .insert({
      org_id: orgId,
      name,
      priority,
      match_source: match_source || null,
      match_score_min: match_score_min || null,
      match_score_max: match_score_max || null,
      match_stage: match_stage || null,
      action,
      assign_to_user_id: assign_to_user_id || null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ rule: data }, { status: 201 })
}
