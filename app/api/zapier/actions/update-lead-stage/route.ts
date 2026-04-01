import { createAdminClient } from '@/lib/supabase/admin'
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

  const { lead_id, stage } = await request.json()
  if (!lead_id || !stage) return Response.json({ error: 'lead_id and stage are required' }, { status: 400 })

  const { data, error } = await admin
    .from('crm_leads')
    .update({ stage, stage_entered_at: new Date().toISOString() })
    .eq('id', lead_id)
    .eq('org_id', org.id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  triggerZapierWebhook(org.id, 'lead.stage_changed', { lead: data, stage })

  return Response.json({ lead: data })
}
