import { createAdminClient } from '@/lib/supabase/admin'
import { calculateLeadScore } from '@/lib/lead-score'

export async function POST(request: Request) {
  const body = await request.json()
  const { org_key, full_name, email, phone, intent, price_range, message } = body

  if (!org_key || !full_name) {
    return Response.json({ error: 'org_key and full_name required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Look up org by widget key
  const { data: org } = await admin
    .from('crm_organizations')
    .select('id, name, settings_json')
    .eq('widget_key', org_key)
    .single()

  if (!org) {
    return Response.json({ error: 'Invalid org_key' }, { status: 404 })
  }

  // Parse price range to budget values
  let budget_min: number | null = null
  let budget_max: number | null = null
  if (price_range) {
    const ranges: Record<string, [number, number]> = {
      'under_300k': [0, 300000],
      '300k_500k': [300000, 500000],
      '500k_750k': [500000, 750000],
      '750k_1m': [750000, 1000000],
      'over_1m': [1000000, 5000000],
    }
    const r = ranges[price_range]
    if (r) { budget_min = r[0]; budget_max = r[1] }
  }

  const leadData = {
    org_id: org.id,
    full_name,
    email: email || null,
    phone: phone || null,
    source: 'Website Widget',
    notes: message || null,
    budget_min,
    budget_max,
    tags: intent ? [intent] : [],
    status: 'active',
  }

  const breakdown = calculateLeadScore({ ...leadData, source: 'Website Widget' })
  const { data: lead, error } = await admin
    .from('crm_leads')
    .insert({ ...leadData, lead_score: breakdown.total, score_breakdown_json: breakdown })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Fire webhook if configured
  const settings = org.settings_json as { webhook_key?: string; webhook_url?: string; auto_call_new_leads?: boolean } | null
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/lead`
  if (settings?.webhook_key) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webhook-key': settings.webhook_key },
        body: JSON.stringify({ full_name, email, phone, source: 'Website Widget', notes: message }),
      })
    } catch { /* non-critical */ }
  }

  return Response.json({ success: true, lead_id: lead.id }, { status: 201 })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
