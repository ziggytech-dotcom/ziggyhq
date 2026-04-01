import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { triggerZapierWebhook } from '@/lib/zapier'

type Disposition =
  | 'answered_interested'
  | 'answered_not_interested'
  | 'voicemail'
  | 'no_answer'
  | 'wrong_number'
  | 'callback_requested'

async function getOrgUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id, org_id, full_name, email').eq('email', user.email!).single()
  return data
}

export async function POST(request: Request) {
  const user = await getOrgUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { call_sid, lead_id, disposition, notes, duration, callback_date, lead_name } = await request.json() as {
    call_sid: string
    lead_id: string
    disposition: Disposition
    notes?: string
    duration?: number
    callback_date?: string
    lead_name?: string
  }

  if (!call_sid || !lead_id || !disposition) {
    return Response.json({ error: 'call_sid, lead_id, and disposition are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Find the activity for this call_sid
  const { data: activities } = await admin
    .from('crm_lead_activities')
    .select('id, metadata')
    .eq('lead_id', lead_id)
    .eq('org_id', user.org_id)
    .eq('type', 'call')
    .filter('metadata->>call_sid', 'eq', call_sid)
    .limit(1)

  if (activities && activities.length > 0) {
    const activity = activities[0]
    const existingMeta = (activity.metadata ?? {}) as Record<string, unknown>
    await admin
      .from('crm_lead_activities')
      .update({
        content: `Outbound call — ${disposition.replace(/_/g, ' ')}${notes ? `: ${notes}` : ''}`,
        metadata: {
          ...existingMeta,
          disposition,
          ...(notes ? { notes } : {}),
          ...(duration != null ? { duration } : {}),
        },
      })
      .eq('id', activity.id)
  }

  let taskCreated = false

  if (disposition === 'callback_requested' && callback_date) {
    const { error: taskError } = await admin.from('crm_tasks').insert({
      org_id: user.org_id,
      created_by: user.id,
      title: `Callback: ${lead_name ?? 'Lead'}`,
      description: `Callback requested during dialer session${notes ? ': ' + notes : ''}`,
      type: 'callback',
      due_at: callback_date,
      lead_id,
      assigned_to: user.id,
    })

    if (!taskError) taskCreated = true
  }

  await admin
    .from('crm_leads')
    .update({ last_contacted_at: new Date().toISOString() })
    .eq('id', lead_id)
    .eq('org_id', user.org_id)

  triggerZapierWebhook(user.org_id, 'call.completed', {
    lead_id,
    call_sid,
    disposition,
    duration: duration ?? null,
    notes: notes ?? null,
  })

  return Response.json({ success: true, task_created: taskCreated })
}
