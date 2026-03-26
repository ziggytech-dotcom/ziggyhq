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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  // Verify sequence belongs to org
  const { data: seq } = await admin.from('crm_sequences').select('id').eq('id', id).eq('org_id', orgId).single()
  if (!seq) return Response.json({ error: 'Not found' }, { status: 404 })

  const { subject, body, delay_hours, step_order } = await request.json()
  if (!subject || !body) return Response.json({ error: 'subject and body required' }, { status: 400 })

  const { data, error } = await admin
    .from('crm_sequence_steps')
    .insert({ sequence_id: id, subject, body, delay_hours: delay_hours ?? 24, step_order: step_order ?? 0 })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ step: data }, { status: 201 })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: seq } = await admin.from('crm_sequences').select('id').eq('id', id).eq('org_id', orgId).single()
  if (!seq) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  // bulk update steps array
  const { steps } = body
  if (Array.isArray(steps)) {
    // Delete all and re-insert
    await admin.from('crm_sequence_steps').delete().eq('sequence_id', id)
    if (steps.length > 0) {
      await admin.from('crm_sequence_steps').insert(
        steps.map((s: { subject: string; body: string; delay_hours: number }, i: number) => ({
          sequence_id: id,
          subject: s.subject,
          body: s.body,
          delay_hours: s.delay_hours ?? 24,
          step_order: i,
        }))
      )
    }
  }

  return Response.json({ success: true })
}
