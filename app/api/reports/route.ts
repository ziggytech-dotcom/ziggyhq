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
  const [leadsRes, activitiesRes, agentsRes, settingsRes] = await Promise.all([
    admin.from('crm_leads').select('id, full_name, stage, status, source, lead_score, pre_approved, created_at, last_contacted_at, assigned_to, budget_max, budget_min').eq('org_id', orgId),
    admin.from('crm_lead_activities').select('type, created_at, lead_id').eq('org_id', orgId).gte('created_at', since.toISOString()),
    admin.from('crm_users').select('id, full_name, email').eq('org_id', orgId).eq('status', 'active'),
    admin.from('crm_organizations').select('settings_json').eq('id', orgId).single(),
  ])

  const leads = leadsRes.data ?? []
  const activities = activitiesRes.data ?? []
  const agents = agentsRes.data ?? []
  const orgSettings = (settingsRes.data?.settings_json ?? {}) as Record<string, unknown>
  const stageProbabilities = (orgSettings.stage_probabilities ?? {}) as Record<string, number>

  // ── Stage counts (pipeline overview) ────────────────────────────────────────
  const stageCounts: Record<string, number> = {}
  for (const l of leads) {
    const s = l.stage ?? 'No Stage'
    stageCounts[s] = (stageCounts[s] ?? 0) + 1
  }

  // ── Pipeline VALUE by stage (sum of budget_max) ──────────────────────────
  const stageValues: Record<string, number> = {}
  for (const l of leads) {
    const s = l.stage ?? 'No Stage'
    stageValues[s] = (stageValues[s] ?? 0) + (l.budget_max ?? 0)
  }

  // ── Source counts ────────────────────────────────────────────────────────────
  const sourceCounts: Record<string, number> = {}
  for (const l of leads) {
    const s = l.source ?? 'Unknown'
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1
  }

  // ── Conversion by source ─────────────────────────────────────────────────────
  const sourceConversion: { source: string; leads: number; converted: number; rate: number }[] = []
  const sourceMap: Record<string, { leads: number; converted: number }> = {}
  for (const l of leads) {
    const s = l.source ?? 'Unknown'
    if (!sourceMap[s]) sourceMap[s] = { leads: 0, converted: 0 }
    sourceMap[s].leads++
    if (l.status === 'won') sourceMap[s].converted++
  }
  for (const [source, data] of Object.entries(sourceMap)) {
    sourceConversion.push({
      source,
      leads: data.leads,
      converted: data.converted,
      rate: data.leads > 0 ? Math.round((data.converted / data.leads) * 100) : 0,
    })
  }
  sourceConversion.sort((a, b) => b.leads - a.leads)

  // ── Monthly new leads (last 6 months) ────────────────────────────────────
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

  // ── Monthly revenue (sum of budget_max for won leads, last 6 months) ────
  const monthlyRevenue: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    monthlyRevenue[label] = 0
  }
  for (const l of leads) {
    if (l.status === 'won' && l.budget_max) {
      const d = new Date(l.last_contacted_at ?? l.created_at)
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      if (label in monthlyRevenue) monthlyRevenue[label] += l.budget_max
    }
  }

  // ── Win rate ─────────────────────────────────────────────────────────────────
  const wonLeads = leads.filter((l) => l.status === 'won')
  const closedLeads = leads.filter((l) => l.status === 'won' || l.status === 'dead')
  const winRate = closedLeads.length > 0 ? Math.round((wonLeads.length / closedLeads.length) * 100) : 0

  // ── Average deal time (days from created_at to last_contacted_at for won) ──
  const wonWithDates = wonLeads.filter((l) => l.last_contacted_at)
  const avgDealDays = wonWithDates.length > 0
    ? Math.round(
        wonWithDates.reduce((sum, l) => {
          const days = (new Date(l.last_contacted_at!).getTime() - new Date(l.created_at).getTime()) / 86400000
          return sum + Math.max(0, days)
        }, 0) / wonWithDates.length
      )
    : null

  // ── Top contacts by deal value ───────────────────────────────────────────────
  const topContacts = leads
    .filter((l) => l.budget_max && l.budget_max > 0)
    .sort((a, b) => (b.budget_max ?? 0) - (a.budget_max ?? 0))
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      name: l.full_name,
      source: l.source ?? 'Unknown',
      stage: l.stage ?? 'No Stage',
      status: l.status,
      dealValue: l.budget_max ?? 0,
    }))

  // ── This month vs last month revenue ────────────────────────────────────────
  const thisMonthLabel = now.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthLabel = lastMonthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  const thisMonthRevenue = monthlyRevenue[thisMonthLabel] ?? 0
  const lastMonthRevenue = monthlyRevenue[lastMonthLabel] ?? 0

  // ── Agent performance ───────────────────────────────────────────────────────
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

  // ── Funnel stages (fixed order) ──────────────────────────────────────────────
  const funnelStages = ['New Lead', 'Contacted', 'Appointment Set', 'Showing', 'Offer Made', 'Under Contract', 'Closed Won']
  const funnelData = funnelStages.map((stage) => ({
    stage,
    count: leads.filter((l) => l.stage === stage || (stage === 'New Lead' && !l.stage)).length,
  }))

  // ── Response time ────────────────────────────────────────────────────────────
  const responseTimes = leads
    .filter((l) => l.last_contacted_at && l.created_at)
    .map((l) => (new Date(l.last_contacted_at!).getTime() - new Date(l.created_at).getTime()) / 3600000)
    .filter((h) => h >= 0 && h < 720)
  const avgResponseHours = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((s, h) => s + h, 0) / responseTimes.length * 10) / 10
    : null

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalLeads = leads.length
  const newInRange = leads.filter((l) => new Date(l.created_at) >= since).length
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0

  // ── Total pipeline value ─────────────────────────────────────────────────────
  const totalPipelineValue = Object.values(stageValues).reduce((s, v) => s + v, 0)

  // ── Weighted forecast by stage (deal_value × probability) ───────────────────
  const weightedForecast: { stage: string; dealValue: number; probability: number; weightedValue: number }[] = []
  for (const [stage, dealValue] of Object.entries(stageValues)) {
    if (dealValue > 0) {
      const probability = stageProbabilities[stage] ?? 0
      weightedForecast.push({
        stage,
        dealValue,
        probability,
        weightedValue: Math.round(dealValue * (probability / 100)),
      })
    }
  }
  weightedForecast.sort((a, b) => b.weightedValue - a.weightedValue)
  const totalWeightedForecast = weightedForecast.reduce((s, f) => s + f.weightedValue, 0)

  return Response.json({
    // Existing fields
    stageCounts,
    sourceCounts,
    monthlyLeads,
    agentPerformance: Object.values(agentMap),
    funnelData,
    avgResponseHours,
    totalLeads,
    newInRange,
    wonLeads: wonLeads.length,
    conversionRate,
    range,
    // New analytics fields
    stageValues,
    totalPipelineValue,
    winRate,
    avgDealDays,
    sourceConversion,
    monthlyRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    topContacts,
    weightedForecast,
    totalWeightedForecast,
  })
}
