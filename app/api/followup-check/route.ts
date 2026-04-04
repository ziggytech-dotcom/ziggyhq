// POST /api/followup-check -- run by cron/scheduler to auto-create follow-up tasks
// Called with Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  let tasksCreated = 0

  // Get all orgs with active follow-up rules
  const { data: rules } = await admin
    .from('crm_followup_rules')
    .select('*')
    .eq('is_active', true)

  if (!rules || rules.length === 0) return Response.json({ tasks_created: 0 })

  for (const rule of rules) {
    const thresholdDate = new Date(Date.now() - rule.no_contact_days * 86400000).toISOString()

    // Find active leads in this org that haven't been contacted since threshold
    // and don't already have an open auto-created follow-up task
    const { data: leads } = await admin
      .from('crm_leads')
      .select('id, full_name, assigned_to')
      .eq('org_id', rule.org_id)
      .eq('status', 'active')
      .or(`last_contacted_at.is.null,last_contacted_at.lte.${thresholdDate}`)

    if (!leads || leads.length === 0) continue

    for (const lead of leads) {
      // Check if there's already an open auto task for this lead from this rule
      const { data: existing } = await admin
        .from('crm_tasks')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('org_id', rule.org_id)
        .eq('auto_created', true)
        .is('completed_at', null)
        .single()

      if (existing) continue // Already has open auto task

      // Resolve task title merge tags
      const firstName = lead.full_name?.split(' ')[0] ?? 'lead'
      const taskTitle = rule.task_title.replace(/\{\{first_name\}\}/g, firstName).replace(/\{\{full_name\}\}/g, lead.full_name ?? '')

      // Determine assignee
      const assignedTo = rule.assign_to === 'lead_owner' ? (lead.assigned_to ?? null) : rule.assign_to

      // Create the task
      const { data: task } = await admin
        .from('crm_tasks')
        .insert({
          org_id: rule.org_id,
          lead_id: lead.id,
          assigned_to: assignedTo,
          title: taskTitle,
          description: `Auto-created: lead has not been contacted for ${rule.no_contact_days} days.`,
          type: 'follow_up',
          auto_created: true,
          due_at: new Date(Date.now() + 24 * 3600000).toISOString(), // due tomorrow
        })
        .select()
        .single()

      if (!task) continue
      tasksCreated++

      // Create notification for assignee
      if (assignedTo) {
        await admin.from('crm_notifications').insert({
          org_id: rule.org_id,
          user_id: assignedTo,
          type: 'follow_up_due',
          title: 'Follow-up reminder',
          message: taskTitle,
          link: `/app/leads/${lead.id}`,
        })
      }
    }
  }

  return Response.json({ tasks_created: tasksCreated })
}
