import { createAdminClient } from '@/lib/supabase/admin'
import { calculateLeadScore } from '@/lib/lead-score'
import { triggerZapierWebhook } from '@/lib/zapier'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const apiKey = authHeader?.replace('Bearer ', '')
  if (!apiKey) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: org } = await admin
    .from('crm_organizations')
    .select('id, settings_json')
    .filter('settings_json->>webhook_key', 'eq', apiKey)
    .single()

  if (!org) return Response.json({ error: 'Invalid API key' }, { status: 401 })

  const body = await request.json()
  const {
    full_name, email, phone, source, stage, notes,
    budget_min, budget_max, timeline, pre_approved,
    property_type, bedrooms, areas_of_interest, tags, assigned_to,
  } = body

  if (!full_name) return Response.json({ error: 'full_name is required' }, { status: 400 })

  const scoreInput = { source, email, phone, budget_min, budget_max, timeline, pre_approved, property_type, areas_of_interest, tags }
  const { data, error } = await admin
    .from('crm_leads')
    .insert({
      org_id: org.id,
      full_name,
      email: email || null,
      phone: phone || null,
      source: source || null,
      stage: stage || null,
      status: 'active',
      notes: notes || null,
      budget_min: budget_min || null,
      budget_max: budget_max || null,
      timeline: timeline || null,
      pre_approved: pre_approved ?? false,
      property_type: property_type || null,
      bedrooms: bedrooms || null,
      areas_of_interest: areas_of_interest || [],
      tags: tags || [],
      assigned_to: assigned_to || null,
      lead_score: calculateLeadScore(scoreInput).total,
      score_breakdown_json: calculateLeadScore(scoreInput),
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  triggerZapierWebhook(org.id, 'lead.created', { lead: data })

  return Response.json({ lead: data }, { status: 201 })
}
