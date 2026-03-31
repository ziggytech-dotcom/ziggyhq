import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id, org_id, phone').eq('email', user.email!).single()
  return data ?? null
}

// GET — return masked Twilio config
export async function GET() {
  const userRecord = await getOrgId()
  if (!userRecord?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('org_integrations')
    .select('config, created_at')
    .eq('org_id', userRecord.org_id)
    .eq('provider', 'twilio')
    .single()

  if (!data) return Response.json({ connected: false })

  const cfg = data.config as Record<string, string>
  return Response.json({
    connected: true,
    account_sid_masked: cfg.account_sid ? cfg.account_sid.slice(0, 8) + '...****' : null,
    phone_number: cfg.phone_number ?? null,
    connected_at: data.created_at,
  })
}

// POST — save Twilio config (validates credentials first)
export async function POST(request: Request) {
  const userRecord = await getOrgId()
  if (!userRecord?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { account_sid, auth_token, phone_number } = body as Record<string, string>

  if (!account_sid || !auth_token || !phone_number) {
    return Response.json({ error: 'account_sid, auth_token, and phone_number are required' }, { status: 400 })
  }

  // Validate credentials with Twilio
  try {
    const client = twilio(account_sid, auth_token)
    await client.api.accounts(account_sid).fetch()
  } catch {
    return Response.json({ error: 'Invalid Twilio credentials. Please check your Account SID and Auth Token.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('org_integrations')
    .upsert(
      {
        org_id: userRecord.org_id,
        provider: 'twilio',
        config: { account_sid, auth_token, phone_number },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,provider' }
    )

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

// PATCH — send a test SMS
export async function PATCH(request: Request) {
  const userRecord = await getOrgId()
  if (!userRecord?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { to_phone } = body as { to_phone?: string }
  if (!to_phone) return Response.json({ error: 'to_phone is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: integration } = await admin
    .from('org_integrations')
    .select('config')
    .eq('org_id', userRecord.org_id)
    .eq('provider', 'twilio')
    .single()

  if (!integration) return Response.json({ error: 'Twilio not connected' }, { status: 400 })

  const cfg = integration.config as Record<string, string>
  try {
    const client = twilio(cfg.account_sid, cfg.auth_token)
    await client.messages.create({
      body: 'Test SMS from ZiggyHQ — your Twilio integration is working!',
      from: cfg.phone_number,
      to: to_phone,
    })
    return Response.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Test SMS failed'
    return Response.json({ error: msg }, { status: 400 })
  }
}

// DELETE — remove Twilio integration
export async function DELETE() {
  const userRecord = await getOrgId()
  if (!userRecord?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  await admin
    .from('org_integrations')
    .delete()
    .eq('org_id', userRecord.org_id)
    .eq('provider', 'twilio')

  return Response.json({ success: true })
}
