import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userRecord } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  if (!userRecord?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await admin
    .from('crm_users')
    .select('id, full_name, email, role, status')
    .eq('org_id', userRecord.org_id)
    .eq('status', 'active')
    .order('full_name')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ members: data })
}
