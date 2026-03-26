import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: u } = await admin.from('crm_users').select('id, org_id').eq('email', user.email!).single()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'email',
      'profile',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: Buffer.from(JSON.stringify({ userId: u.id, orgId: u.org_id })).toString('base64'),
  })

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
