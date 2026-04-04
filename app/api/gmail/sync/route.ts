import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

async function refreshAccessToken(account: {
  refresh_token: string | null
  access_token: string | null
  token_expiry: string | null
  id: string
}): Promise<string | null> {
  if (!account.refresh_token) return account.access_token

  // Check if token is still valid
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

export async function POST(request: NextRequest) {
  // Can be called by cron (with service key) or manually by user
  const authHeader = request.headers.get('authorization')
  const admin = createAdminClient()
  let orgId: string | null = null

  if (authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    // Cron mode -- sync all accounts
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: u } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
    orgId = u?.org_id ?? null
  }

  // Fetch email accounts to sync
  let accountsQuery = admin.from('crm_email_accounts').select('*').eq('sync_enabled', true)
  if (orgId) accountsQuery = accountsQuery.eq('org_id', orgId)
  const { data: accounts } = await accountsQuery

  if (!accounts || accounts.length === 0) return Response.json({ synced: 0 })

  // Load all leads for email matching
  const leadsQuery = orgId
    ? admin.from('crm_leads').select('id, email, org_id').eq('org_id', orgId).not('email', 'is', null)
    : admin.from('crm_leads').select('id, email, org_id').not('email', 'is', null)
  const { data: leads } = await leadsQuery
  const leadsByEmail = new Map<string, { id: string; org_id: string }>()
  for (const l of leads ?? []) {
    if (l.email) leadsByEmail.set(l.email.toLowerCase(), { id: l.id, org_id: l.org_id })
  }

  let totalSynced = 0
  for (const account of accounts) {
    const accessToken = await refreshAccessToken(account)
    if (!accessToken) continue

    // Fetch messages from last 30 days
    const since30d = Math.floor((Date.now() - 30 * 86400000) / 1000)
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=after:${since30d}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!listRes.ok) continue

    const list = await listRes.json()
    const messages = list.messages ?? []

    for (const msg of messages.slice(0, 50)) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!msgRes.ok) continue
      const msgData = await msgRes.json()

      const headers: { name: string; value: string }[] = msgData.payload?.headers ?? []
      const from = headers.find((h: { name: string }) => h.name === 'From')?.value ?? ''
      const to = headers.find((h: { name: string }) => h.name === 'To')?.value ?? ''
      const subject = headers.find((h: { name: string }) => h.name === 'Subject')?.value ?? '(no subject)'

      // Extract emails
      const fromEmail = from.match(/<([^>]+)>/)?.[1] ?? from
      const toEmail = to.match(/<([^>]+)>/)?.[1] ?? to

      const isOutgoing = fromEmail.toLowerCase() === account.email.toLowerCase()
      const matchEmail = isOutgoing ? toEmail.toLowerCase() : fromEmail.toLowerCase()

      const lead = leadsByEmail.get(matchEmail)
      if (!lead) continue

      const activityType = isOutgoing ? 'email_sent' : 'email_received'
      const internalDate = parseInt(msgData.internalDate ?? '0')
      const createdAt = new Date(internalDate).toISOString()

      // Upsert to avoid duplicates -- use gmail message ID
      const { data: existing } = await admin
        .from('crm_lead_activities')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('content', `Gmail:${msg.id}`)
        .single()

      if (!existing) {
        await admin.from('crm_lead_activities').insert({
          lead_id: lead.id,
          org_id: lead.org_id,
          type: activityType,
          content: `Gmail:${msg.id}`,
          metadata: { subject, from, to },
          created_at: createdAt,
        })
        totalSynced++
      }
    }

    await admin.from('crm_email_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', account.id)
  }

  return Response.json({ synced: totalSynced })
}
