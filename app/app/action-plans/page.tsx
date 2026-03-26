import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TogglePlan from './TogglePlan'
import CreatePlanModal from './CreatePlanModal'

export default async function ActionPlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: userRecord } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  if (!userRecord?.org_id) return <div className="p-8 text-[#b3b3b3]">Loading...</div>

  const { data: plans } = await admin
    .from('crm_action_plans')
    .select('*')
    .eq('org_id', userRecord.org_id)
    .order('created_at', { ascending: false })

  // Get step counts per plan
  const planIds = (plans ?? []).map((p) => p.id)
  const { data: steps } = planIds.length > 0
    ? await admin.from('crm_action_plan_steps').select('plan_id').in('plan_id', planIds)
    : { data: [] }

  const stepCounts: Record<string, number> = {}
  for (const step of (steps ?? [])) {
    stepCounts[step.plan_id] = (stepCounts[step.plan_id] ?? 0) + 1
  }

  // Get active enrollment counts
  const { data: enrollments } = planIds.length > 0
    ? await admin.from('crm_action_plan_enrollments').select('plan_id').in('plan_id', planIds).eq('status', 'active')
    : { data: [] }

  const enrollCounts: Record<string, number> = {}
  for (const e of (enrollments ?? [])) {
    enrollCounts[e.plan_id] = (enrollCounts[e.plan_id] ?? 0) + 1
  }

  const triggerLabels: Record<string, string> = {
    new_lead: 'New Lead',
    stage_change: 'Stage Change',
    manual: 'Manual',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            ACTION PLANS
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Automate your follow-up sequences</p>
        </div>
        <CreatePlanModal orgId={userRecord.org_id} />
      </div>

      {(plans ?? []).length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-lg font-semibold text-white mb-2">No action plans yet</h2>
          <p className="text-[#b3b3b3] text-sm">Create your first action plan to automate follow-ups</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(plans ?? []).map((plan) => (
            <div key={plan.id} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 hover:border-[#ff006e]/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/app/action-plans/${plan.id}`} className="text-base font-semibold text-white hover:text-[#ff006e] transition-colors">
                        {plan.name}
                      </Link>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#2d2d2d] text-[#b3b3b3]">
                        {triggerLabels[plan.trigger_event] ?? plan.trigger_event}
                      </span>
                      {plan.trigger_stage && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff006e]/10 text-[#ff006e] border border-[#ff006e]/20">
                          {plan.trigger_stage}
                        </span>
                      )}
                    </div>
                    {plan.description && <p className="text-sm text-[#b3b3b3]">{plan.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#b3b3b3]">
                      <span>{stepCounts[plan.id] ?? 0} step{(stepCounts[plan.id] ?? 0) !== 1 ? 's' : ''}</span>
                      <span>{enrollCounts[plan.id] ?? 0} active enrollment{(enrollCounts[plan.id] ?? 0) !== 1 ? 's' : ''}</span>
                      {plan.industry && <span className="capitalize">{plan.industry.replace('_', ' ')}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TogglePlan planId={plan.id} isActive={plan.is_active} />
                  <Link href={`/app/action-plans/${plan.id}`} className="px-3 py-1.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white hover:border-[#ff006e]/40 text-sm transition-colors">
                    Edit
                  </Link>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return
                      await fetch(`/api/action-plans/${plan.id}`, { method: 'DELETE' })
                      window.location.reload()
                    }}
                    className="px-3 py-1.5 rounded-lg border border-red-900/40 text-red-400 hover:bg-red-900/20 hover:border-red-500/40 text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
