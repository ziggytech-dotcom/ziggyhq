import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id, org_id').eq('email', user.email!).single()
  return data
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { content, pinned = false } = await request.json()
  if (!content?.trim()) return Response.json({ error: 'content is required' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_lead_notes')
    .insert({ lead_id: id, org_id: user.org_id, user_id: user.id, content, pinned })
    .select('*, crm_users(full_name, email)')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ note: data }, { status: 201 })
}
