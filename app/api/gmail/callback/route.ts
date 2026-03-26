import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error || !code || !state) {
    return Response.redirect(`${appUrl}/app/settings/integrations?error=gmail_denied`)
  }

  let userId: string, orgId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
    userId = decoded.userId
    orgId = decoded.orgId
  } catch {
    return Response.redirect(`${appUrl}/app/settings/integrations?error=invalid_state`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/gmail/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return Response.redirect(`${appUrl}/app/settings/integrations?error=token_exchange_failed`)
  }

  const tokens = await tokenRes.json()

  // Get Gmail email address
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const profile = await profileRes.json()
  const email = profile.email as string

  const admin = createAdminClient()
  await admin.from('crm_email_accounts').upsert({
    org_id: orgId,
    user_id: userId,
    email,
    provider: 'gmail',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    sync_enabled: true,
  }, { onConflict: 'user_id,email' })

  return Response.redirect(`${appUrl}/app/settings/integrations?success=gmail_connected&email=${encodeURIComponent(email)}`)
}
