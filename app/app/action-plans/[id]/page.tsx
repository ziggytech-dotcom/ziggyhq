import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AddStepForm from './AddStepForm'

export default async function ActionPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: userRecord } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  if (!userRecord?.org_id) redirect('/login')

  const { data: plan } = await admin
    .from('crm_action_plans')
    .select('*')
    .eq('id', id)
    .eq('org_id', userRecord.org_id)
    .single()

  if (!plan) notFound()

  const { data: steps } = await admin
    .from('crm_action_plan_steps')
    .select('*')
    .eq('plan_id', id)
    .order('step_order', { ascending: true })

  const { data: enrollments } = await admin
    .from('crm_action_plan_enrollments')
    .select('*, leads(full_name, email, phone)')
    .eq('plan_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const triggerLabels: Record<string, string> = {
    new_lead: 'New Lead',
    stage_change: 'Stage Change',
    manual: 'Manual',
  }

  const typeColors: Record<string, string> = {
    email: '#f59e0b',
    sms: '#22c55e',
    call: '#3b82f6',
    task: '#8b5cf6',
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/app/action-plans" className="text-[#b3b3b3] hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '32px', letterSpacing: '0.05em', color: '#ededed' }}>
              {plan.name}
            </h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.is_active ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-[#2d2d2d] text-[#b3b3b3]'}`}>
              {plan.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#b3b3b3] mt-0.5">
            <span>Trigger: <span className="text-white">{triggerLabels[plan.trigger_event] ?? plan.trigger_event}</span></span>
            {plan.trigger_stage && <span>Stage: <span className="text-[#0ea5e9]">{plan.trigger_stage}</span></span>}
            {plan.description && <span>{plan.description}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Steps */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Steps ({(steps ?? []).length})</h2>
          </div>

          <div className="space-y-3 mb-6">
            {(steps ?? []).length === 0 ? (
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-8 text-center">
                <p className="text-[#b3b3b3] text-sm">No steps yet. Add your first step below.</p>
              </div>
            ) : (
              (steps ?? []).map((step, idx) => (
                <div key={step.id} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border" style={{ borderColor: `${typeColors[step.type] ?? '#b3b3b3'}40`, backgroundColor: `${typeColors[step.type] ?? '#b3b3b3'}15`, color: typeColors[step.type] ?? '#b3b3b3' }}>
                      {idx + 1}
                    </div>
                    {idx < (steps ?? []).length - 1 && <div className="w-px h-6 bg-[#2d2d2d] mt-1" />}
                  </div>
                  <div className="flex-1 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: `${typeColors[step.type] ?? '#b3b3b3'}15`, color: typeColors[step.type] ?? '#b3b3b3' }}>
                        {step.type}
                      </span>
                      {step.delay_hours > 0 && (
                        <span className="text-xs text-[#b3b3b3]">
                          {step.delay_hours < 24 ? `${step.delay_hours}h delay` : `${Math.floor(step.delay_hours / 24)}d delay`}
                        </span>
                      )}
                    </div>
                    {step.template_subject && <div className="text-sm font-medium text-white mb-1">{step.template_subject}</div>}
                    {step.template_body && <div className="text-sm text-[#b3b3b3] whitespace-pre-wrap">{step.template_body}</div>}
                    {step.task_description && <div className="text-sm text-[#b3b3b3]">{step.task_description}</div>}
                  </div>
                </div>
              ))
            )}
          </div>

          <AddStepForm planId={plan.id} nextOrder={(steps ?? []).length + 1} />
        </div>

        {/* Enrollments */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-4">Recent Enrollments</h2>
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4">
            {(enrollments ?? []).length === 0 ? (
              <p className="text-[#b3b3b3] text-sm">No enrollments yet</p>
            ) : (
              <div className="space-y-3">
                {(enrollments ?? []).map((e) => (
                  <div key={e.id} className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-white">{(e.leads as { full_name: string } | null)?.full_name ?? 'Unknown'}</div>
                      <div className="text-xs text-[#b3b3b3]">Step {e.current_step}</div>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                      e.status === 'active' ? 'bg-[#22c55e]/10 text-[#22c55e]' :
                      e.status === 'completed' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' :
                      'bg-[#2d2d2d] text-[#b3b3b3]'
                    }`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
