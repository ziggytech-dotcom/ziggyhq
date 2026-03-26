import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  return data?.org_id ?? null
}

export async function GET(request: Request) {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') ?? '30d'
  const now = new Date()
  let since: Date
  if (range === '7d') since = new Date(now.getTime() - 7 * 86400000)
  else if (range === '90d') since = new Date(now.getTime() - 90 * 86400000)
  else if (range === 'all') since = new Date(0)
  else since = new Date(now.getTime() - 30 * 86400000)

  const admin = createAdminClient()
  const [leadsRes, activitiesRes, agentsRes] = await Promise.all([
    admin.from('crm_leads').select('id, stage, status, source, lead_score, pre_approved, created_at, last_contacted_at, assigned_to, budget_max, budget_min').eq('org_id', orgId),
    admin.from('crm_lead_activities').select('type, created_at, lead_id').eq('org_id', orgId).gte('created_at', since.toISOString()),
    admin.from('crm_users').select('id, full_name, email').eq('org_id', orgId).eq('status', 'active'),
  ])

  const leads = leadsRes.data ?? []
  const activities = activitiesRes.data ?? []
  const agents = agentsRes.data ?? []

  // Stage counts (pipeline overview)
  const stageCounts: Record<string, number> = {}
  for (const l of leads) {
    const s = l.stage ?? 'No Stage'
    stageCounts[s] = (stageCounts[s] ?? 0) + 1
  }

  // Source counts
  const sourceCounts: Record<string, number> = {}
  for (const l of leads) {
    const s = l.source ?? 'Unknown'
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1
  }

  // Monthly new leads (last 6 months)
  const monthlyLeads: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    monthlyLeads[label] = 0
  }
  for (const l of leads) {
    const d = new Date(l.created_at)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (label in monthlyLeads) monthlyLeads[label]++
  }

  // Agent performance
  const agentMap: Record<string, { name: string; leads: number; contacted: number; closed: number }> = {}
  for (const a of agents) {
    agentMap[a.id] = { name: a.full_name ?? a.email, leads: 0, contacted: 0, closed: 0 }
  }
  for (const l of leads) {
    const aid = l.assigned_to
    if (aid && agentMap[aid]) {
      agentMap[aid].leads++
      if (l.last_contacted_at) agentMap[aid].contacted++
      if (l.status === 'won') agentMap[aid].closed++
    }
  }

  // Funnel stages (fixed order)
  const funnelStages = ['New Lead', 'Contacted', 'Appointment Set', 'Showing', 'Offer Made', 'Under Contract', 'Closed Won']
  const funnelData = funnelStages.map((stage) => ({
    stage,
    count: leads.filter((l) => l.stage === stage || (stage === 'New Lead' && !l.stage)).length,
  }))

  // Response time (avg hours from created_at to first last_contacted_at)
  const responseTimes = leads
    .filter((l) => l.last_contacted_at && l.created_at)
    .map((l) => (new Date(l.last_contacted_at!).getTime() - new Date(l.created_at).getTime()) / 3600000)
    .filter((h) => h >= 0 && h < 720) // exclude > 30 days
  const avgResponseHours = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((s, h) => s + h, 0) / responseTimes.length * 10) / 10
    : null

  // Summary stats
  const totalLeads = leads.length
  const newInRange = leads.filter((l) => new Date(l.created_at) >= since).length
  const wonLeads = leads.filter((l) => l.status === 'won').length
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

  return Response.json({
    stageCounts,
    sourceCounts,
    monthlyLeads,
    agentPerformance: Object.values(agentMap),
    funnelData,
    avgResponseHours,
    totalLeads,
    newInRange,
    wonLeads,
    conversionRate,
    range,
  })
}
