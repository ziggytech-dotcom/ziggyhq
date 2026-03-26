import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function getStats(orgId: string) {
  const admin = createAdminClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const todayStart = new Date(now.setHours(0, 0, 0, 0))

  const [totalLeads, newThisWeek, contactedToday, wonLeads, activities, leads] = await Promise.all([
    admin.from('crm_leads').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    admin.from('crm_leads').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', weekAgo.toISOString()),
    admin.from('crm_lead_activities').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', todayStart.toISOString()),
    admin.from('crm_leads').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'won'),
    admin.from('crm_lead_activities').select('*, leads(full_name)').eq('org_id', orgId).order('created_at', { ascending: false }).limit(10),
    admin.from('crm_leads').select('stage').eq('org_id', orgId).not('stage', 'is', null),
  ])

  const total = totalLeads.count ?? 0
  const won = wonLeads.count ?? 0
  const rate = total > 0 ? Math.round((won / total) * 100) : 0

  // Stage breakdown
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

const activityTypeColors: Record<string, string> = {
  call: '#3b82f6',
  sms: '#22c55e',
  email: '#f59e0b',
  note: '#b3b3b3',
  stage_change: '#ff006e',
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
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: '🎯', color: '#ff006e' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          DASHBOARD
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Welcome back — here&apos;s what&apos;s happening</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xl">{card.icon}</span>
              <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: card.color }} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
            <div className="text-xs text-[#b3b3b3]">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {stats.recentActivities.length === 0 ? (
              <p className="text-[#b3b3b3] text-sm">No recent activity</p>
            ) : (
              stats.recentActivities.map((activity: { id: string; type: string; content: string; created_at: string; leads?: { full_name: string } | null }) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: activityTypeColors[activity.type] ?? '#b3b3b3' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">
                      <span className="font-medium capitalize">{activity.type}</span>
                      {activity.leads && (
                        <span className="text-[#b3b3b3]"> — {(activity.leads as { full_name: string }).full_name}</span>
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
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
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
                      className="h-full rounded-full bg-[#ff006e] transition-all"
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
