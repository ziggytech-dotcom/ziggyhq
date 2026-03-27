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
  const { data, error } = await admin.from('crm_followup_rules').select('*').eq('org_id', orgId).order('created_at', { ascending: true })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ rules: data ?? [] })
}

export async function POST(request: NextRequest) {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, no_contact_days = 7, task_title, assign_to = 'lead_owner' } = await request.json()
  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_followup_rules')
    .insert({
      org_id: orgId,
      name,
      no_contact_days,
      task_title: task_title || 'Follow up with {{first_name}}',
      assign_to,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ rule: data }, { status: 201 })
}
