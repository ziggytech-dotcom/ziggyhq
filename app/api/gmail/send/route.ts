// POST /api/gmail/send — send an email via connected Gmail account and log as activity
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

async function getValidToken(account: {
  id: string
  access_token: string | null
  refresh_token: string | null
  token_expiry: string | null
}): Promise<string | null> {
  if (!account.refresh_token) return account.access_token

  if (account.token_expiry && new Date(account.token_expiry).getTime() > Date.now() + 60000) {
    return account.access_token
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) return null
  const data = await res.json()

  const admin = createAdminClient()
  await admin.from('crm_email_accounts').update({
    access_token: data.access_token,
    token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }).eq('id', account.id)

  return data.access_token
}

export async function POST(request: Request) {
  const user = await getOrgUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, account_id, to, subject, body } = await request.json()

  if (!lead_id || !account_id || !to || !subject || !body) {
    return Response.json({ error: 'lead_id, account_id, to, subject, and body are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch account
  const { data: account } = await admin
    .from('crm_email_accounts')
    .select('id, email, access_token, refresh_token, token_expiry')
    .eq('id', account_id)
    .eq('org_id', user.org_id)
    .single()

  if (!account) return Response.json({ error: 'Email account not found' }, { status: 404 })

  const accessToken = await getValidToken(account)
  if (!accessToken) return Response.json({ error: 'Could not obtain valid access token — reconnect Gmail' }, { status: 400 })

  // Build RFC 2822 message
  const rawEmail = [
    `From: ${account.email}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body,
  ].join('\r\n')

  const encodedMessage = Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  })

  if (!sendRes.ok) {
    const err = await sendRes.json()
    return Response.json({ error: err.error?.message ?? 'Gmail send failed' }, { status: 500 })
  }

  const sent = await sendRes.json()

  // Log as activity
  const { data: activity } = await admin.from('crm_lead_activities').insert({
    lead_id,
    org_id: user.org_id,
    user_id: user.id,
    type: 'email_sent',
    content: `Gmail:${sent.id}`,
    email_subject: subject,
    email_body: body,
    metadata: { subject, from: account.email, to, gmail_message_id: sent.id },
  }).select().single()

  await admin.from('crm_leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', lead_id).eq('org_id', user.org_id)

  return Response.json({ activity, message_id: sent.id }, { status: 201 })
}
