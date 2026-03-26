import { createAdminClient } from '@/lib/supabase/admin'

// Inbound lead webhook — accepts new leads from any source
// Auth: ?api_key=ORG_WEBHOOK_KEY or Authorization: Bearer ORG_WEBHOOK_KEY
// POST body (all optional except at least one of: full_name, email, phone)
// {
//   full_name, first_name, last_name, email, phone,
//   source, stage, notes, tags,
//   budget_min, budget_max, timeline, property_type,
//   auto_call: true/false (default: true)
//   script_type: "new_lead" | "home_value" | "listing_inquiry"
// }

export async function POST(request: Request) {
  const admin = createAdminClient()

  // Auth — match api_key to an org's webhook_key in settings_json
  const url = new URL(request.url)
  const apiKey = url.searchParams.get('api_key') ??
    request.headers.get('authorization')?.replace('Bearer ', '').trim()

  if (!apiKey) {
    return Response.json({ error: 'api_key required' }, { status: 401 })
  }

  // Find org by webhook key
  const { data: orgs } = await admin
    .from('crm_organizations')
    .select('id, name, settings_json')

  const org = (orgs ?? []).find((o) => {
    const s = (o.settings_json ?? {}) as Record<string, unknown>
    return s.webhook_key === apiKey
  })

  if (!org) {
    return Response.json({ error: 'Invalid api_key' }, { status: 401 })
  }

  const body = await request.json()

  // Build full name
  let fullName = body.full_name?.trim()
  if (!fullName && (body.first_name || body.last_name)) {
    fullName = `${body.first_name ?? ''} ${body.last_name ?? ''}`.trim()
  }

  if (!fullName && !body.email && !body.phone) {
    return Response.json({ error: 'At least one of full_name, email, or phone is required' }, { status: 400 })
  }

  // Format phone
  let phone = null
  if (body.phone) {
    const digits = String(body.phone).replace(/\D/g, '').slice(-10)
    if (digits.length === 10) {
      phone = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
    }
  }

  // Parse tags
  const tags = Array.isArray(body.tags)
    ? body.tags
    : body.tags ? String(body.tags).split(/[,;|]/).map((t: string) => t.trim()).filter(Boolean)
    : []

  const settings = (org.settings_json ?? {}) as Record<string, unknown>
  const aiCaller = (settings.ai_caller ?? {}) as Record<string, unknown>

  // Insert lead
  const { data: lead, error } = await admin
    .from('crm_leads')
    .insert({
      org_id: org.id,
      full_name: fullName || null,
      email: body.email?.trim().toLowerCase() || null,
      phone,
      source: body.source?.trim() || 'Website',
      stage: body.stage?.trim() || (settings.pipeline_stages as string[])?.[0] || 'New',
      status: 'active',
      notes: body.notes?.trim() || null,
      tags,
      budget_min: body.budget_min ? parseInt(String(body.budget_min).replace(/\D/g, '')) || null : null,
      budget_max: body.budget_max ? parseInt(String(body.budget_max).replace(/\D/g, '')) || null : null,
      timeline: body.timeline?.trim() || null,
      property_type: body.property_type?.trim() || null,
      lead_score: 50,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Log the inbound activity
  await admin.from('crm_lead_activities').insert({
    lead_id: lead.id,
    org_id: org.id,
    type: 'note',
    content: `New lead received via webhook (source: ${lead.source})`,
  })

  // Auto-call if enabled and phone exists
  const autoCall = body.auto_call !== false && phone !== null
  const autoCallEnabled = settings.auto_call_new_leads !== false
  let callInitiated = false
  let callId = null

  if (autoCall && autoCallEnabled && phone) {
    const blandKey = process.env.BLAND_API_KEY
    const fromNumber = process.env.BLAND_PHONE_NUMBER ?? '+17254256788'

    if (blandKey) {
      const callerName = (aiCaller.name as string) ?? 'Emma'
      const brokerage = (aiCaller.brokerage as string) ?? org.name
      const disclose = aiCaller.disclose_if_asked !== false
      const scriptType = body.script_type ?? 'new_lead'

      const aiRule = disclose
        ? `If they ask "are you a real person?", "are you human?", or "is this AI?" — respond warmly and honestly: "I'm a virtual assistant for ${brokerage} — but I want you to know that someone from the team will be reaching out to you personally very soon!"`
        : `If they ask whether you are human or AI — simply say "I'm calling on behalf of ${brokerage} and I promise someone will be in touch very soon!" and redirect.`

      const task = `You are ${callerName}, a warm and friendly assistant calling from ${brokerage}. You are calling ${fullName ?? 'a prospective client'}.

IMPORTANT — follow this exact flow:
1. Start with: "Hi there! This is ${callerName} calling from ${brokerage}. Am I speaking with ${fullName ?? 'the right person'}?"
2. Wait for confirmation, then say: "Hi! We just received your inquiry and I wanted to reach out right away — I know how quickly things move in real estate!"
3. Ask: "Are you currently looking to buy${scriptType === 'home_value' ? ' or sell' : ''} a home?"
4. Ask about their timeline
5. Ask about their budget or price range
6. Ask if they are pre-approved
7. Ask what areas they are interested in
8. Close: "Perfect — I have everything I need. Your agent will be reaching out to you personally very soon. Is this the best number to reach you?"

Keep it warm, natural, conversational. Lead the conversation. Under 3 minutes. If they ask to be removed, thank them and end politely.
${aiRule}`

      const digits = phone.replace(/\D/g, '')
      const e164 = `+1${digits}`

      const blandRes = await fetch('https://api.bland.ai/v1/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authorization': blandKey },
        body: JSON.stringify({
          phone_number: e164,
          from: fromNumber,
          task,
          voice: (aiCaller.voice as string) ?? 'maya',
          reduce_latency: true,
          record: true,
          metadata: { lead_id: lead.id, org_id: org.id, called_by: 'auto', script_type: scriptType },
          webhook: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ziggy-crm.vercel.app'}/api/calls/webhook`,
          answered_by_enabled: true,
          voicemail_message: `Hi ${fullName ?? 'there'}! This is ${callerName} calling from ${brokerage}. We just received your inquiry and wanted to reach out right away! Please call us back at ${aiCaller.callback_phone ?? fromNumber} or we'll try you again soon. Have a great day!`,
          wait_for_greeting: true,
          max_duration: 12,
        }),
      })

      const blandData = await blandRes.json()

      if (blandRes.ok) {
        callInitiated = true
        callId = blandData.call_id
        await admin.from('crm_lead_activities').insert({
          lead_id: lead.id,
          org_id: org.id,
          type: 'call',
          content: `Auto AI call initiated to ${e164} via Bland.ai [${callerName}] (call ID: ${blandData.call_id})`,
        })
        await admin.from('crm_leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', lead.id)
      }
    }
  }

  return Response.json({
    success: true,
    lead_id: lead.id,
    call_initiated: callInitiated,
    call_id: callId,
  }, { status: 201 })
}
