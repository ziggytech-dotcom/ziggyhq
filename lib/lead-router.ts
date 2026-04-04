// Lead routing engine -- applies routing rules to assign new leads automatically
import { createAdminClient } from '@/lib/supabase/admin'

interface RoutingLead {
  id: string
  org_id: string
  source?: string | null
  lead_score?: number
  stage?: string | null
}

interface RoutingRule {
  id: string
  org_id: string
  priority: number
  is_active: boolean
  match_source: string | null
  match_score_min: number | null
  match_score_max: number | null
  match_stage: string | null
  action: string
  assign_to_user_id: string | null
}

function ruleMatches(rule: RoutingRule, lead: RoutingLead): boolean {
  if (rule.match_source && lead.source !== rule.match_source) return false
  if (rule.match_stage && lead.stage !== rule.match_stage) return false
  const score = lead.lead_score ?? 0
  if (rule.match_score_min !== null && score < rule.match_score_min) return false
  if (rule.match_score_max !== null && score > rule.match_score_max) return false
  return true
}

export async function applyRoutingRules(lead: RoutingLead): Promise<string | null> {
  const admin = createAdminClient()

  // Fetch active rules sorted by priority
  const { data: rules } = await admin
    .from('crm_routing_rules')
    .select('*')
    .eq('org_id', lead.org_id)
    .eq('is_active', true)
    .order('priority', { ascending: true })

  if (!rules || rules.length === 0) return null

  for (const rule of rules) {
    if (!ruleMatches(rule, lead)) continue

    if (rule.action === 'assign' && rule.assign_to_user_id) {
      return rule.assign_to_user_id
    }

    if (rule.action === 'round_robin') {
      return await getNextRoundRobinAgent(lead.org_id)
    }
  }

  return null
}

async function getNextRoundRobinAgent(orgId: string): Promise<string | null> {
  const admin = createAdminClient()

  // Get or create round robin state
  const { data: rrState } = await admin
    .from('crm_routing_round_robin')
    .select('*')
    .eq('org_id', orgId)
    .single()

  if (!rrState || !rrState.agent_ids || rrState.agent_ids.length === 0) {
    // Fall back: get all active agents for this org
    const { data: agents } = await admin
      .from('crm_users')
      .select('id')
      .eq('org_id', orgId)
    if (!agents || agents.length === 0) return null

    const agentIds = agents.map((a: { id: string }) => a.id)
    await admin.from('crm_routing_round_robin').upsert({
      org_id: orgId,
      agent_ids: agentIds,
      current_index: 0,
    })
    return agentIds[0]
  }

  const { agent_ids, current_index } = rrState
  const nextIndex = (current_index + 1) % agent_ids.length
  const assignedAgent = agent_ids[current_index]

  // Advance the pointer
  await admin
    .from('crm_routing_round_robin')
    .update({ current_index: nextIndex })
    .eq('org_id', orgId)

  return assignedAgent
}
