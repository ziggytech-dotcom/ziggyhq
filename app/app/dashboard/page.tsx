import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getStats(orgId: string) {
  const admin = createAdminClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const [totalLeads, newThisWeek, contactedToday, wonLeads, activities, leads, overdueTasks, dueTodayTasks] = await Promise.all([
    admin.from('crm_leads').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    admin.from('crm_leads').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', weekAgo.toISOString()),
    admin.from('crm_lead_activities').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', todayStart.toISOString()),
    admin.from('crm_leads').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'won'),
    admin.from('crm_lead_activities').select('*, crm_leads(full_name, id)').eq('org_id', orgId).order('created_at', { ascending: false }).limit(10),
    admin.from('crm_leads').select('stage').eq('org_id', orgId).not('stage', 'is', null),
    // Overdue: due_at < now AND not completed
    admin
      .from('crm_tasks')
      .select('id, title, due_at, crm_leads(id, full_name)')
      .eq('org_id', orgId)
      .is('completed_at', null)
      .lt('due_at', now.toISOString())
      .order('due_at', { ascending: true })
      .limit(5),
    // Due today: due_at between start and end of today AND not completed
    admin
      .from('crm_tasks')
      .select('id, title, due_at, crm_leads(id, full_name)')
      .eq('org_id', orgId)
      .is('completed_at', null)
      .gte('due_at', todayStart.toISOString())
      .lte('due_at', todayEnd.toISOString())
      .order('due_at', { ascending: true })
      .limit(5),
  ])

  const total = totalLeads.count ?? 0
  const won = wonLeads.count ?? 0
  const rate = total > 0 ? Math.round((won / total) * 100) : 0

  const stageCounts: Record<string, number> = {}
  if (leads.data) {
    for (const lead of leads.data) {
      if (lead.stage) {
        stageCounts[lead.stage] = (stageCounts[lead.stage] ?? 0) + 1
      }
    }
  }

  return {
    totalLeads: total,
    newThisWeek: newThisWeek.count ?? 0,
    contactedToday: contactedToday.count ?? 0,
    conversionRate: rate,
    recentActivities: activities.data ?? [],
    stageCounts,
    overdueTasks: overdueTasks.data ?? [],
    dueTodayTasks: dueTodayTasks.data ?? [],
  }
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function formatDueDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const activityTypeColors: Record<string, string> = {
  call: '#3b82f6',
  sms: '#22c55e',
  email: '#f59e0b',
  note: '#b3b3b3',
  stage_change: '#0ea5e9',
  assignment: '#8b5cf6',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: userRecord } = await admin
    .from('crm_users')
    .select('org_id')
    .eq('email', user.email!)
    .single()

  if (!userRecord?.org_id) {
    return (
      <div className="p-8 text-[#b3b3b3]">Setting up your account...</div>
    )
  }

  const stats = await getStats(userRecord.org_id)
  const maxStageCount = Math.max(...Object.values(stats.stageCounts), 1)

  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: '👥', color: '#3b82f6' },
    { label: 'New This Week', value: stats.newThisWeek, icon: '📈', color: '#22c55e' },
    { label: 'Contacted Today', value: stats.contactedToday, icon: '📞', color: '#f59e0b' },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: '🎯', color: '#0ea5e9' },
  ]

  const overdueCount = stats.overdueTasks.length
  const dueTodayCount = stats.dueTodayTasks.length

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          DASHBOARD
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Welcome back &mdash; here&apos;s what&apos;s happening</p>
      </div>

      {/* Stats Grid -- 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xl">{card.icon}</span>
              <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: card.color }} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{card.value}</div>
            <div className="text-xs text-[#b3b3b3]">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tasks Alert Widget */}
      {(overdueCount > 0 || dueTodayCount > 0) && (
        <div className="mb-6 sm:mb-8 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tasks Needing Attention
            </h2>
            <Link href="/app/tasks" className="text-xs text-[#0ea5e9] hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {overdueCount > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#e11d48] uppercase tracking-wide">Overdue</span>
                  <span className="text-xs bg-[#e11d48]/20 text-[#e11d48] border border-[#e11d48]/30 px-1.5 py-0.5 rounded-full font-medium">{overdueCount}</span>
                </div>
                <div className="space-y-2">
                  {stats.overdueTasks.map((task: { id: string; title: string; due_at: string; crm_leads?: { id: string; full_name: string }[] | null }) => (
                    <div key={task.id} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#e11d48] mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-white truncate">{task.title}</div>
                        <div className="text-xs text-[#e11d48]">
                          Due {formatDueDate(task.due_at)}
                          {task.crm_leads?.[0] && (
                            <span className="text-[#b3b3b3]"> &middot; {task.crm_leads[0].full_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dueTodayCount > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wide">Due Today</span>
                  <span className="text-xs bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 px-1.5 py-0.5 rounded-full font-medium">{dueTodayCount}</span>
                </div>
                <div className="space-y-2">
                  {stats.dueTodayTasks.map((task: { id: string; title: string; due_at: string; crm_leads?: { id: string; full_name: string }[] | null }) => (
                    <div key={task.id} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-white truncate">{task.title}</div>
                        <div className="text-xs text-[#f59e0b]">
                          Due {formatDueDate(task.due_at)}
                          {task.crm_leads?.[0] && (
                            <span className="text-[#b3b3b3]"> &middot; {task.crm_leads[0].full_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="sm:col-span-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {stats.recentActivities.length === 0 ? (
              <p className="text-[#b3b3b3] text-sm">No recent activity</p>
            ) : (
              stats.recentActivities.map((activity: { id: string; type: string; content: string; created_at: string; lead_id?: string; crm_leads?: { full_name: string; id: string } | null }) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: activityTypeColors[activity.type] ?? '#b3b3b3' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">
                      <span className="font-medium capitalize">{activity.type}</span>
                      {activity.crm_leads && (
                        <span className="text-[#b3b3b3]"> &mdash; {activity.crm_leads.full_name}</span>
                      )}
                    </div>
                    {activity.content && (
                      <div className="text-xs text-[#b3b3b3] truncate mt-0.5">{activity.content}</div>
                    )}
                  </div>
                  <div className="text-xs text-[#b3b3b3] flex-shrink-0">{timeAgo(activity.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline Breakdown */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Pipeline Stages</h2>
          <div className="space-y-3">
            {Object.entries(stats.stageCounts).length === 0 ? (
              <p className="text-[#b3b3b3] text-sm">No leads yet</p>
            ) : (
              Object.entries(stats.stageCounts).map(([stage, count]) => (
                <div key={stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#b3b3b3] truncate">{stage}</span>
                    <span className="text-white font-medium ml-2">{count}</span>
                  </div>
                  <div className="h-1.5 bg-[#2d2d2d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0ea5e9] transition-all"
                      style={{ width: `${Math.round((count / maxStageCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
