import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userRecord } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  if (!userRecord?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { lead_id } = body
  if (!lead_id) return Response.json({ error: 'lead_id is required' }, { status: 400 })

  // Check plan exists and belongs to org
  const { data: plan } = await admin
    .from('crm_action_plans')
    .select('id')
    .eq('id', planId)
    .eq('org_id', userRecord.org_id)
    .single()

  if (!plan) return Response.json({ error: 'Plan not found' }, { status: 404 })

  // Check if already enrolled
  const { data: existing } = await admin
    .from('crm_action_plan_enrollments')
    .select('id, status')
    .eq('lead_id', lead_id)
    .eq('plan_id', planId)
    .eq('status', 'active')
    .single()

  if (existing) return Response.json({ error: 'Lead is already enrolled in this plan' }, { status: 409 })

  const { data, error } = await admin
    .from('crm_action_plan_enrollments')
    .insert({
      lead_id,
      plan_id: planId,
      org_id: userRecord.org_id,
      status: 'active',
      current_step: 0,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ enrollment: data }, { status: 201 })
}
