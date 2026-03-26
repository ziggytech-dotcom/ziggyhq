import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: userRecord } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  if (!userRecord?.org_id) redirect('/login')
  const orgId = userRecord.org_id

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [leadsRes, activitiesRes, activitiesTodayRes, notesRes] = await Promise.all([
    admin.from('crm_leads').select('id, stage, status, source, lead_score, pre_approved, created_at, next_followup_at').eq('org_id', orgId),
    admin.from('crm_lead_activities').select('type, created_at').eq('org_id', orgId).gte('created_at', sevenDaysAgo.toISOString()),
    admin.from('crm_lead_activities').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', todayStart.toISOString()),
    admin.from('crm_lead_notes').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', sevenDaysAgo.toISOString()),
  ])

  const leads = leadsRes.data ?? []
  const activities = activitiesRes.data ?? []

  // Stage breakdown
  const stageCounts: Record<string, number> = {}
  for (const l of leads) { if (l.stage) stageCounts[l.stage] = (stageCounts[l.stage] ?? 0) + 1 }

  // Source breakdown
  const sourceCounts: Record<string, number> = {}
  for (const l of leads) {
    const s = l.source ?? 'Unknown'
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1
  }

  // Status breakdown
  const statusCounts: Record<string, number> = {}
  for (const l of leads) {
    const s = l.status ?? 'active'
    statusCounts[s] = (statusCounts[s] ?? 0) + 1
  }

  // Activity breakdown this week
  const activityCounts: Record<string, number> = {}
  for (const a of activities) { activityCounts[a.type] = (activityCounts[a.type] ?? 0) + 1 }

  // New leads last 30 days by week
  const weekBuckets: Record<string, number> = {}
  for (let i = 3; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * 7 * 86400000)
    const end = new Date(now.getTime() - i * 7 * 86400000)
    const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    weekBuckets[label] = leads.filter((l) => {
      const d = new Date(l.created_at)
      return d >= start && d < end
    }).length
  }

  // Key metrics
  const totalLeads = leads.length
  const newLast30 = leads.filter((l) => new Date(l.created_at) >= thirtyDaysAgo).length
  const wonLeads = leads.filter((l) => l.status === 'won').length
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0
  const preApprovedCount = leads.filter((l) => l.pre_approved).length
  const avgScore = totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + (l.lead_score ?? 0), 0) / totalLeads) : 0
  const withFollowup = leads.filter((l) => l.next_followup_at).length
  const overdueFollowups = leads.filter((l) => l.next_followup_at && new Date(l.next_followup_at) < now).length

  const maxStage = Math.max(...Object.values(stageCounts), 1)
  const maxSource = Math.max(...Object.values(sourceCounts), 1)
  const maxActivity = Math.max(...Object.values(activityCounts), 1)
  const maxWeek = Math.max(...Object.values(weekBuckets), 1)

  const activityColors: Record<string, string> = {
    call: '#3b82f6', sms: '#22c55e', email: '#f59e0b', note: '#b3b3b3',
    stage_change: '#ff006e', meeting: '#8b5cf6', task: '#06b6d4',
  }

  const statusColors: Record<string, string> = {
    active: '#22c55e', won: '#ff006e', lost: '#b3b3b3', paused: '#f59e0b',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          REPORTS
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Pipeline analytics and team performance</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: totalLeads, sub: `+${newLast30} last 30 days`, color: '#3b82f6' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, sub: `${wonLeads} won`, color: '#ff006e' },
          { label: 'Avg Lead Score', value: avgScore, sub: 'across all active leads', color: avgScore >= 70 ? '#22c55e' : avgScore >= 40 ? '#f59e0b' : '#ff006e' },
          { label: 'Pre-Approved', value: preApprovedCount, sub: `${totalLeads > 0 ? Math.round((preApprovedCount/totalLeads)*100) : 0}% of pipeline`, color: '#22c55e' },
        ].map((card) => (
          <div key={card.label} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <div className="text-3xl font-bold mb-1" style={{ color: card.color }}>{card.value}</div>
            <div className="text-sm font-medium text-white mb-0.5">{card.label}</div>
            <div className="text-xs text-[#b3b3b3]">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Pipeline by Stage */}
        <div className="col-span-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Pipeline by Stage</h2>
          {Object.keys(stageCounts).length === 0 ? (
            <p className="text-[#b3b3b3] text-sm">No stage data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stageCounts).sort((a, b) => b[1] - a[1]).map(([stage, count]) => (
                <div key={stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#b3b3b3] truncate">{stage}</span>
                    <span className="text-white font-semibold ml-2">{count}</span>
                  </div>
                  <Bar value={count} max={maxStage} color="#ff006e" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lead Status */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Lead Status</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#b3b3b3] capitalize">{status}</span>
                  <span className="text-white font-semibold">{count}</span>
                </div>
                <Bar value={count} max={totalLeads} color={statusColors[status] ?? '#b3b3b3'} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#2d2d2d] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#b3b3b3]">With Follow-up</span>
              <span className="text-white font-medium">{withFollowup}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#ff006e]">Overdue Follow-ups</span>
              <span className="text-[#ff006e] font-medium">{overdueFollowups}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Lead Sources */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Lead Sources</h2>
          {Object.keys(sourceCounts).length === 0 ? (
            <p className="text-[#b3b3b3] text-sm">No source data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
                <div key={source}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#b3b3b3] truncate">{source}</span>
                    <span className="text-white font-semibold ml-2">{count}</span>
                  </div>
                  <Bar value={count} max={maxSource} color="#3b82f6" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity This Week */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Activity This Week</h2>
          <div className="text-xs text-[#b3b3b3] mb-4">
            {activities.length} activities + {notesRes.count ?? 0} notes · {activitiesTodayRes.count ?? 0} today
          </div>
          {Object.keys(activityCounts).length === 0 ? (
            <p className="text-[#b3b3b3] text-sm">No activity this week</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(activityCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize" style={{ color: activityColors[type] ?? '#b3b3b3' }}>{type.replace('_', ' ')}</span>
                    <span className="text-white font-semibold">{count}</span>
                  </div>
                  <Bar value={count} max={maxActivity} color={activityColors[type] ?? '#b3b3b3'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Leads by Week */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">New Leads (Last 4 Weeks)</h2>
          <div className="space-y-3">
            {Object.entries(weekBuckets).map(([week, count]) => (
              <div key={week}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#b3b3b3]">{week}</span>
                  <span className="text-white font-semibold">{count}</span>
                </div>
                <Bar value={count} max={maxWeek} color="#22c55e" />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#2d2d2d]">
            <div className="flex justify-between text-xs">
              <span className="text-[#b3b3b3]">Total last 30 days</span>
              <span className="text-[#22c55e] font-semibold">{newLast30}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
