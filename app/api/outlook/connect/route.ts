// GET /api/outlook/connect -- start Microsoft OAuth2 flow for Outlook email sync
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: u } = await admin.from('crm_users').select('id, org_id').eq('email', user.email!).single()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.MICROSOFT_CLIENT_ID
  if (!clientId) return Response.json({ error: 'Microsoft OAuth not configured' }, { status: 500 })

  const state = Buffer.from(JSON.stringify({ userId: u.id, orgId: u.org_id })).toString('base64')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: `${appUrl}/api/outlook/callback`,
    scope: 'openid email profile offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send',
    state,
    response_mode: 'query',
  })

  return Response.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`)
}
