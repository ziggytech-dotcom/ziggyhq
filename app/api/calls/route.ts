import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getOrgUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id, org_id, full_name, email').eq('email', user.email!).single()
  return data
}

interface AiCallerSettings {
  name: string
  voice: string
  brokerage: string
  callback_phone: string
  disclose_if_asked: boolean
  scripts: {
    new_lead: string
    home_value: string
    listing_inquiry: string
    voicemail: string
  }
}

function buildScripts(s: AiCallerSettings, leadName: string): { task: string; voicemail: string } {
  const name = s.name
  const brokerage = s.brokerage
  const callback = s.callback_phone
  const aiRule = s.disclose_if_asked !== false
    ? `If they ask "are you a real person?", "are you human?", or "is this AI?" — respond warmly and honestly: "I'm a virtual assistant for ${s.brokerage} — but I want you to know that someone from the team will be reaching out to you personally very soon! I just wanted to make sure we got back to you right away."`
    : `If they ask whether you are human or AI — simply say "I'm calling on behalf of ${s.brokerage} — and I promise someone from the team will be in touch with you very soon!" and smoothly redirect the conversation.`

  const scripts = {
    new_lead: s.scripts?.new_lead || `You are ${name}, a warm and friendly assistant calling from ${brokerage}. You are calling ${leadName}.

IMPORTANT — follow this exact flow:
1. Start immediately with: "Hi there! This is ${name} calling from ${brokerage}. Am I speaking with ${leadName}?"
2. Wait for them to confirm. If yes, continue. If wrong number, apologize and end politely.
3. Then say: "Hi ${leadName}! We received your inquiry and I just wanted to reach out right away. I know how busy things can get, so I'll keep this quick! We saw you were interested in buying a home — is that still something you're looking into?"
4. Let them answer, then naturally ask: "That's wonderful! Just so we can have your agent reach out with the most helpful info — how soon are you thinking about making a move?"
5. Ask about budget: "And do you have a general price range in mind?"
6. Ask about pre-approval: "Have you had a chance to get pre-approved for a mortgage yet, or is that something you'd like help with?"
7. Ask about areas: "And are there any specific areas or neighborhoods you're most interested in?"
8. Warm close: "Perfect — I have everything I need. I'm going to pass this along to your agent right now and they'll be reaching out to you personally very soon. Is there a best time to reach you, or is this number generally good?"
9. End with: "Wonderful! Thanks so much ${leadName}, have a great day!"

Keep it warm, natural, and conversational — never robotic. Never pressure or rush. Always lead the conversation — do not wait for them to ask why you're calling. Total call under 3 minutes. If they ask to be removed from contact, thank them sincerely and end the call.

${aiRule}`,

    home_value: s.scripts?.home_value || `You are ${name}, a warm and friendly assistant calling from ${brokerage}. You are calling ${leadName}.

IMPORTANT — follow this exact flow:
1. Start with: "Hi there! This is ${name} calling from ${brokerage}. Am I speaking with ${leadName}?"
2. Wait for confirmation, then say: "Hi ${leadName}! I'm calling because you recently requested a home value estimate and I wanted to make sure we got back to you right away — I know how important that information can be!"
3. Ask: "Is the home you'd like valued at the address you provided, or is it a different property?"
4. Ask: "Are you thinking about potentially selling, or were you more just curious about where your home stands value-wise right now?"
5. If selling: "That's exciting! What kind of timeline are you working with?"
6. Close: "Wonderful — I'm going to have your agent put together a full market analysis and reach out to you personally very soon. Is this the best number to reach you?"

Warm, helpful, conversational. Lead the conversation. Under 3 minutes.

${aiRule}`,

    listing_inquiry: s.scripts?.listing_inquiry || `You are ${name}, a warm and friendly assistant calling from ${brokerage}. You are calling ${leadName}.

IMPORTANT — follow this exact flow:
1. Start with: "Hi there! This is ${name} calling from ${brokerage}. Am I speaking with ${leadName}?"
2. Wait for confirmation, then say: "Hi ${leadName}! I'm calling because you reached out about one of our properties and I wanted to make sure someone got back to you right away!"
3. Ask: "Is that property still something you're interested in, or have you been looking at a few different options?"
4. Ask: "Would you like to schedule a showing? We can usually get something set up very quickly."
5. Ask: "And are you pre-approved, or is that something we could help connect you with?"
6. Close: "Perfect! I'm going to have your agent reach out shortly to get a showing on the calendar. Is this the best number for them to call?"

Warm, friendly, proactive. Always lead the conversation. Under 3 minutes.

${aiRule}`,
  }

  const voicemailMsg = s.scripts?.voicemail ||
    `Hi ${leadName}! This is ${name} calling from ${brokerage}. We received your inquiry and just wanted to reach out — we'd love to help you! Please give us a call back at ${callback} when you get a chance, or we'll try you again soon. Have a wonderful day!`

  return { task: scripts.new_lead, voicemail: voicemailMsg }
}

export async function POST(request: Request) {
  const caller = await getOrgUser()
  if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, phone, lead_name, script_type = 'new_lead' } = await request.json()

  if (!lead_id || !phone) {
    return Response.json({ error: 'lead_id and phone are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Load Bland.ai integration config from org_integrations (BYOK)
  const { data: integration } = await admin
    .from('org_integrations')
    .select('config')
    .eq('org_id', caller.org_id)
    .eq('provider', 'bland_ai')
    .single()

  if (!integration) {
    return Response.json({ error: 'Bland.ai not configured', not_configured: true }, { status: 500 })
  }

  const integrationConfig = integration.config as Record<string, unknown>
  const apiKey = integrationConfig.api_key as string
  const integrationAgentConfig = (integrationConfig.agent_config ?? {}) as Partial<AiCallerSettings>

  // Load org settings for AI caller config
  const { data: org } = await admin
    .from('crm_organizations')
    .select('name, settings_json')
    .eq('id', caller.org_id)
    .single()

  const settings = (org?.settings_json ?? {}) as Record<string, unknown>
  const aiCaller = (settings.ai_caller ?? {}) as Partial<AiCallerSettings>

  // Merge: org settings.ai_caller as base, integration.config.agent_config takes priority
  const mergedAiCaller: Partial<AiCallerSettings> = { ...aiCaller, ...integrationAgentConfig }

  const callerConfig: AiCallerSettings = {
    name: mergedAiCaller.name ?? 'Emma',
    voice: mergedAiCaller.voice ?? aiCaller.voice ?? 'maya',
    brokerage: mergedAiCaller.brokerage ?? org?.name ?? 'our real estate team',
    callback_phone: mergedAiCaller.callback_phone ?? process.env.BLAND_PHONE_NUMBER ?? '',
    disclose_if_asked: mergedAiCaller.disclose_if_asked !== false,
    scripts: (mergedAiCaller.scripts ?? {}) as AiCallerSettings['scripts'],
  }

  // Clean phone to E.164
  const digits = phone.replace(/\D/g, '')
  const e164 = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith('1') ? `+${digits}` : null
  if (!e164) return Response.json({ error: 'Invalid phone number format' }, { status: 400 })

  const { task, voicemail } = buildScripts(callerConfig, lead_name ?? 'there')

  // Pick script by type
  let finalTask = task
  if (script_type === 'home_value') {
    const { task: hvTask } = buildScripts({ ...callerConfig }, lead_name ?? 'there')
    finalTask = callerConfig.scripts?.home_value || hvTask
  } else if (script_type === 'listing_inquiry') {
    finalTask = callerConfig.scripts?.listing_inquiry || task
  }

  const fromNumber = integrationAgentConfig.callback_phone || process.env.BLAND_PHONE_NUMBER || '+17254256788'

  const payload = {
    phone_number: e164,
    from: fromNumber,
    task: finalTask,
    voice: callerConfig.voice,
    reduce_latency: true,
    record: true,
    metadata: {
      lead_id,
      org_id: caller.org_id,
      called_by: caller.email,
      script_type,
    },
    webhook: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.ziggyhq.com'}/api/calls/webhook`,
    answered_by_enabled: true,
    voicemail_message: voicemail,
    wait_for_greeting: true,
    interruption_threshold: 100,
    max_duration: 12,
  }

  const res = await fetch('https://api.bland.ai/v1/calls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authorization': apiKey,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok) {
    return Response.json({ error: data.message ?? 'Bland.ai call failed', details: data }, { status: 500 })
  }

  // Log the call as an activity
  await admin.from('crm_lead_activities').insert({
    lead_id,
    org_id: caller.org_id,
    user_id: caller.id,
    type: 'call',
    content: `AI call initiated to ${e164} via Bland.ai [${callerConfig.name}] (call ID: ${data.call_id})`,
    metadata: { bland_call_id: data.call_id, status: 'initiated', phone: e164, script_type, caller_name: callerConfig.name },
  })

  await admin.from('crm_leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', lead_id).eq('org_id', caller.org_id)

  return Response.json({ call_id: data.call_id, status: 'initiated', phone: e164, caller_name: callerConfig.name })
}
