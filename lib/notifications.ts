import { createAdminClient } from '@/lib/supabase/admin'

interface CreateNotificationParams {
  org_id: string
  user_id?: string | null
  type: 'new_lead' | 'lead_assigned' | 'plan_step_due' | 'document_signed' | 'follow_up_due'
  title: string
  message?: string
  link?: string
}

export async function createNotification(params: CreateNotificationParams) {
  const admin = createAdminClient()

  // If no user_id, notify all org admins
  if (!params.user_id) {
    const { data: users } = await admin
      .from('crm_users')
      .select('id')
      .eq('org_id', params.org_id)
      .in('role', ['admin', 'owner'])

    if (users && users.length > 0) {
      await admin.from('crm_notifications').insert(
        users.map((u) => ({
          org_id: params.org_id,
          user_id: u.id,
          type: params.type,
          title: params.title,
          message: params.message ?? null,
          link: params.link ?? null,
        }))
      )
    }
    return
  }

  await admin.from('crm_notifications').insert({
    org_id: params.org_id,
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    message: params.message ?? null,
    link: params.link ?? null,
  })
}
