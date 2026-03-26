import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('users').select('id, org_id').eq('email', user.email!).single()
  return data
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('lead_activities')
    .select('*, users(full_name, email)')
    .eq('lead_id', id)
    .eq('org_id', user.org_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ activities: data })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userRecord = await getUser()
  if (!userRecord) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, direction = 'outbound', content, duration_seconds, status, metadata_json } = body

  if (!type) return Response.json({ error: 'type is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('lead_activities')
    .insert({
      lead_id: id,
      org_id: userRecord.org_id,
      user_id: userRecord.id,
      type,
      direction,
      content: content || null,
      duration_seconds: duration_seconds || null,
      status: status || null,
      metadata_json: metadata_json || {},
    })
    .select('*, users(full_name, email)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Update last_contacted_at
  await admin
    .from('leads')
    .update({ last_contacted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', userRecord.org_id)

  return Response.json({ activity: data }, { status: 201 })
}
