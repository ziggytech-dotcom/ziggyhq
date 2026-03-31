import twilio from 'twilio'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface TwilioConfig {
  account_sid: string
  auth_token: string
  phone_number: string
}

export async function getOrgTwilioConfig(
  admin: SupabaseClient,
  org_id: string
): Promise<TwilioConfig | null> {
  const { data } = await admin
    .from('org_integrations')
    .select('config')
    .eq('org_id', org_id)
    .eq('provider', 'twilio')
    .single()
  if (!data?.config) return null
  const cfg = data.config as Record<string, string>
  if (!cfg.account_sid || !cfg.auth_token || !cfg.phone_number) return null
  return cfg as unknown as TwilioConfig
}

export async function sendSmsToLead({
  admin,
  org_id,
  lead_id,
  message,
}: {
  admin: SupabaseClient
  org_id: string
  lead_id: string
  message: string
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  const cfg = await getOrgTwilioConfig(admin, org_id)
  if (!cfg) return { success: false, error: 'Twilio not connected. Go to Settings → Integrations.' }

  const { data: lead } = await admin
    .from('crm_leads')
    .select('id, phone, full_name')
    .eq('id', lead_id)
    .eq('org_id', org_id)
    .single()

  if (!lead) return { success: false, error: 'Lead not found' }
  if (!lead.phone) return { success: false, error: 'Lead has no phone number' }

  try {
    const client = twilio(cfg.account_sid, cfg.auth_token)
    const result = await client.messages.create({
      body: message,
      from: cfg.phone_number,
      to: lead.phone,
    })

    await admin.from('crm_lead_activities').insert({
      lead_id: lead.id,
      org_id,
      type: 'sms_sent',
      direction: 'outbound',
      content: message,
      metadata_json: { from: cfg.phone_number, to: lead.phone, twilio_sid: result.sid },
    })

    return { success: true, sid: result.sid }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'SMS send failed'
    return { success: false, error: msg }
  }
}
