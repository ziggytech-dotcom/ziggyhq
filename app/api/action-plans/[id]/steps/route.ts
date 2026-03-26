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
  const { data: userRecord } = await admin.from('users').select('org_id').eq('email', user.email!).single()
  if (!userRecord?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify plan ownership
  const { data: plan } = await admin.from('action_plans').select('id').eq('id', planId).eq('org_id', userRecord.org_id).single()
  if (!plan) return Response.json({ error: 'Plan not found' }, { status: 404 })

  const body = await request.json()
  const { step_order, delay_hours = 0, type, template_subject, template_body, task_description } = body

  if (!type) return Response.json({ error: 'type is required' }, { status: 400 })

  const { data, error } = await admin
    .from('action_plan_steps')
    .insert({
      plan_id: planId,
      step_order: step_order ?? 1,
      delay_hours,
      type,
      template_subject: template_subject || null,
      template_body: template_body || null,
      task_description: task_description || null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ step: data }, { status: 201 })
}
