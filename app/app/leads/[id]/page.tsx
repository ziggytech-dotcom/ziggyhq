import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import LeadDetail from './LeadDetail'

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: userRecord } = await admin
    .from('crm_users')
    .select('org_id')
    .eq('email', user.email!)
    .single()

  if (!userRecord?.org_id) redirect('/login')

  const [leadRes, activitiesRes, notesRes, teamRes, settingsRes, plansRes, enrollmentsRes, lendersRes] = await Promise.all([
    admin.from('crm_leads').select('*, crm_users(id, full_name, email)').eq('id', id).eq('org_id', userRecord.org_id).single(),
    admin.from('crm_lead_activities').select('*, crm_users(full_name, email)').eq('lead_id', id).order('created_at', { ascending: false }).limit(50),
    admin.from('crm_lead_notes').select('*, crm_users(full_name, email)').eq('lead_id', id).order('created_at', { ascending: false }),
    admin.from('crm_users').select('id, full_name, email').eq('org_id', userRecord.org_id).eq('status', 'active'),
    admin.from('crm_organizations').select('settings_json').eq('id', userRecord.org_id).single(),
    admin.from('crm_action_plans').select('id, name, trigger_event, is_active').eq('org_id', userRecord.org_id).eq('is_active', true),
    admin.from('crm_action_plan_enrollments').select('*, action_plans(name)').eq('lead_id', id).order('created_at', { ascending: false }),
    admin.from('crm_lenders').select('id, name, company, phone, email').eq('org_id', userRecord.org_id).eq('status', 'active').order('name', { ascending: true }),
  ])

  if (!leadRes.data) notFound()

  const settings = (settingsRes.data?.settings_json ?? {}) as { pipeline_stages?: string[]; lead_sources?: string[] }

  return (
    <LeadDetail
      lead={leadRes.data}
      activities={activitiesRes.data ?? []}
      notes={notesRes.data ?? []}
      team={teamRes.data ?? []}
      stages={settings.pipeline_stages ?? []}
      sources={settings.lead_sources ?? []}
      actionPlans={plansRes.data ?? []}
      enrollments={enrollmentsRes.data ?? []}
      lenders={lendersRes.data ?? []}
      orgId={userRecord.org_id}
    />
  )
}
