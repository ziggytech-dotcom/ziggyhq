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

export async function GET() {
  const u = await getUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_notifications')
    .select('*')
    .eq('user_id', u.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const unread = (data ?? []).filter((n) => !n.read).length
  return Response.json({ notifications: data ?? [], unread })
}

export async function PATCH() {
  // Mark all read
  const u = await getUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  await admin
    .from('crm_notifications')
    .update({ read: true })
    .eq('user_id', u.id)
    .eq('read', false)

  return Response.json({ success: true })
}
