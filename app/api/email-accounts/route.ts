import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: u } = await admin.from('crm_users').select('id, org_id').eq('email', user.email!).single()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: accounts } = await admin
    .from('crm_email_accounts')
    .select('id, email, provider, last_synced_at, sync_enabled, created_at')
    .eq('user_id', u.id)

  return Response.json({ accounts: accounts ?? [] })
}
