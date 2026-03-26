import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: u } = await admin.from('crm_users').select('id').eq('email', user.email!).single()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { account_id } = await request.json()

  await admin.from('crm_email_accounts').delete().eq('id', account_id).eq('user_id', u.id)
  return Response.json({ success: true })
}
