import { createAdminClient } from '@/lib/supabase/admin'

// Returns a Unix timestamp (seconds) for when the call should fire
// Respects call hours in America/Los_Angeles
function getScheduledCallTime(delayMinutes: number, callStart: number, callEnd: number): number {
  const scheduledMs = Date.now() + delayMinutes * 60 * 1000
  const scheduled = new Date(scheduledMs)

  // Get PST/PDT offset (e.g. "GMT-7" → -7)
  const tzStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', timeZoneName: 'shortOffset'
  }).formatToParts(scheduled).find(p => p.type === 'timeZoneName')?.value ?? 'GMT-7'
  const tzOffset = parseInt(tzStr.replace('GMT', '')) // -7 or -8

  // Get PST date parts
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23'
  }).formatToParts(scheduled)
  const pstYear  = parseInt(parts.find(p => p.type === 'year')!.value)
  const pstMonth = parseInt(parts.find(p => p.type === 'month')!.value)
  const pstDay   = parseInt(parts.find(p => p.type === 'day')!.value)
  const pstHour  = parseInt(parts.find(p => p.type === 'hour')!.value)

  // Within hours — return as-is
  if (pstHour >= callStart && pstHour < callEnd) {
    return Math.floor(scheduledMs / 1000)
  }

  // Outside hours — find next callStart window
  let targetYear = pstYear, targetMonth = pstMonth, targetDay = pstDay, targetOffset = tzOffset

  if (pstHour >= callEnd) {
    // After hours — push to next day
    const next = new Date(Date.UTC(pstYear, pstMonth - 1, pstDay + 1))
    const np = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', year: 'numeric', month: 'numeric', day: 'numeric'
    }).formatToParts(next)
    targetYear  = parseInt(np.find(p => p.type === 'year')!.value)
    targetMonth = parseInt(np.find(p => p.type === 'month')!.value)
    targetDay   = parseInt(np.find(p => p.type === 'day')!.value)
    const nextTzStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', timeZoneName: 'shortOffset'
    }).formatToParts(next).find(p => p.type === 'timeZoneName')?.value ?? 'GMT-7'
    targetOffset = parseInt(nextTzStr.replace('GMT', ''))
  }
  // Before hours — same day, just push to callStart

  // UTC = local_hour - tz_offset  (e.g. 9 AM PDT → 9 - (-7) = 16:00 UTC)
  return Math.floor(Date.UTC(targetYear, targetMonth - 1, targetDay, callStart - targetOffset, 0, 0) / 1000)
}

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
  const callDelayMinutes = typeof settings.call_delay_minutes === 'number' ? settings.call_delay_minutes : 2.5
  const callHoursStart  = typeof settings.call_hours_start === 'number' ? settings.call_hours_start : 9
  const callHoursEnd    = typeof settings.call_hours_end === 'number' ? settings.call_hours_end : 21

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

      const scheduledTime = getScheduledCallTime(callDelayMinutes, callHoursStart, callHoursEnd)
      const callAt = new Date(scheduledTime * 1000)
      const delayedMsg = scheduledTime > Math.floor((Date.now() + callDelayMinutes * 60 * 1000) / 1000) + 60
        ? ` (scheduled for ${callAt.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit', hour12: true, month: 'short', day: 'numeric' })} PST — outside call hours)`
        : ` (calling in ~${Math.round(callDelayMinutes)} min)`

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
          start_time: scheduledTime,
          metadata: { lead_id: lead.id, org_id: org.id, called_by: 'auto', script_type: scriptType },
          webhook: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.ziggyhq.com'}/api/calls/webhook`,
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
          content: `Auto AI call scheduled to ${e164} via Bland.ai [${callerName}]${delayedMsg} (call ID: ${blandData.call_id})`,
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
