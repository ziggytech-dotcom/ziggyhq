import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  return data?.org_id ?? null
}

function generateWidgetKey() {
  return 'wk_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function GET() {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin.from('crm_organizations').select('widget_key').eq('id', orgId).single()

  let key = data?.widget_key
  if (!key) {
    key = generateWidgetKey()
    await admin.from('crm_organizations').update({ widget_key: key }).eq('id', orgId)
  }

  return Response.json({ widget_key: key })
}

export async function POST() {
  // Regenerate key
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const key = generateWidgetKey()
  const admin = createAdminClient()
  await admin.from('crm_organizations').update({ widget_key: key }).eq('id', orgId)
  return Response.json({ widget_key: key })
}
