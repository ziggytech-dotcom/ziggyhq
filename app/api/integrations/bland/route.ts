import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getOrgUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('id, org_id').eq('email', user.email!).single()
  return data
}

// GET — return masked Bland.ai config
export async function GET() {
  const orgUser = await getOrgUser()
  if (!orgUser?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('org_integrations')
    .select('config, created_at')
    .eq('org_id', orgUser.org_id)
    .eq('provider', 'bland_ai')
    .single()

  if (!data) return Response.json({ connected: false })

  const cfg = data.config as Record<string, unknown>
  const apiKey = cfg.api_key as string | undefined
  return Response.json({
    connected: true,
    api_key_masked: apiKey ? apiKey.slice(0, 8) + '...' : null,
    agent_config: cfg.agent_config ?? null,
    connected_at: data.created_at,
  })
}

// POST — save Bland.ai config (validates API key first)
export async function POST(request: Request) {
  const orgUser = await getOrgUser()
  if (!orgUser?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { api_key, agent_config } = body as {
    api_key?: string
    agent_config?: {
      name?: string
      brokerage?: string
      callback_phone?: string
      disclose_if_asked?: boolean
      scripts?: {
        new_lead?: string
        home_value?: string
        listing_inquiry?: string
        voicemail?: string
      }
    }
  }

  if (!api_key) {
    return Response.json({ error: 'api_key is required' }, { status: 400 })
  }

  // Validate the API key against Bland.ai
  const testRes = await fetch('https://api.bland.ai/v1/voices', {
    headers: { authorization: api_key },
  })
  if (!testRes.ok) {
    return Response.json({ error: 'Invalid Bland.ai API key' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('org_integrations')
    .upsert(
      {
        org_id: orgUser.org_id,
        provider: 'bland_ai',
        config: { api_key, agent_config: agent_config ?? {} },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,provider' }
    )

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

// DELETE — remove Bland.ai integration
export async function DELETE() {
  const orgUser = await getOrgUser()
  if (!orgUser?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  await admin
    .from('org_integrations')
    .delete()
    .eq('org_id', orgUser.org_id)
    .eq('provider', 'bland_ai')

  return Response.json({ success: true })
}
