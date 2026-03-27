import { NextRequest } from 'next/server'
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

export async function GET(request: NextRequest) {
  const u = await getUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const leadId = searchParams.get('lead_id')
  const completed = searchParams.get('completed')

  const admin = createAdminClient()
  let query = admin
    .from('crm_tasks')
    .select('*, crm_leads(id, full_name), crm_users!crm_tasks_assigned_to_fkey(id, full_name, email)')
    .eq('org_id', u.org_id)

  if (leadId) query = query.eq('lead_id', leadId)
  if (completed === '0') query = query.is('completed_at', null)
  if (completed === '1') query = query.not('completed_at', 'is', null)

  const { data, error } = await query.order('due_at', { ascending: true, nullsFirst: false }).limit(200)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ tasks: data ?? [] })
}

export async function POST(request: NextRequest) {
  const u = await getUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, lead_id, assigned_to, due_at, type = 'follow_up' } = body
  if (!title) return Response.json({ error: 'title is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_tasks')
    .insert({
      org_id: u.org_id,
      created_by: u.id,
      title,
      description: description || null,
      lead_id: lead_id || null,
      assigned_to: assigned_to || null,
      due_at: due_at || null,
      type,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Create notification for assigned user
  if (data.assigned_to) {
    await admin.from('crm_notifications').insert({
      org_id: u.org_id,
      user_id: data.assigned_to,
      type: 'follow_up_due',
      title: 'New task assigned',
      message: title,
      link: lead_id ? `/app/leads/${lead_id}` : '/app/follow-ups',
    })
  }

  return Response.json({ task: data }, { status: 201 })
}
