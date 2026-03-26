import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id').eq('email', user.email!).single()
  return data?.id ?? null
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  await admin
    .from('crm_notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', userId)

  return Response.json({ success: true })
}
