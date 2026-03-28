// POST /api/outlook/sync — sync recent emails from Outlook via Microsoft Graph
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

async function refreshOutlookToken(account: {
  id: string
  refresh_token: string | null
  access_token: string | null
  token_expiry: string | null
}): Promise<string | null> {
  if (!account.refresh_token) return account.access_token
  if (account.token_expiry && new Date(account.token_expiry).getTime() > Date.now() + 60000) {
    return account.access_token
  }

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
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
  const admin = createAdminClient()
  let orgId: string | null = null

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    // cron mode — all orgs
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: u } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
    orgId = u?.org_id ?? null
  }

  let accountsQuery = admin
    .from('crm_email_accounts')
    .select('*')
    .eq('sync_enabled', true)
    .eq('provider', 'outlook')
  if (orgId) accountsQuery = accountsQuery.eq('org_id', orgId)

  const { data: accounts } = await accountsQuery
  if (!accounts || accounts.length === 0) return Response.json({ synced: 0 })

  // Load leads for email matching
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
    const accessToken = await refreshOutlookToken(account)
    if (!accessToken) continue

    // Fetch messages from last 30 days via Microsoft Graph
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const msgRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$top=50&$select=id,subject,from,toRecipients,sentDateTime,receivedDateTime&$filter=receivedDateTime ge ${since}&$orderby=receivedDateTime desc`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!msgRes.ok) continue
    const msgData = await msgRes.json()
    const messages = msgData.value ?? []

    for (const msg of messages) {
      const fromEmail = msg.from?.emailAddress?.address?.toLowerCase() ?? ''
      const toEmail = msg.toRecipients?.[0]?.emailAddress?.address?.toLowerCase() ?? ''
      const subject = msg.subject ?? '(no subject)'
      const msgDate = msg.sentDateTime || msg.receivedDateTime

      const isOutgoing = fromEmail === account.email.toLowerCase()
      const matchEmail = isOutgoing ? toEmail : fromEmail

      const lead = leadsByEmail.get(matchEmail)
      if (!lead) continue

      const activityType = isOutgoing ? 'email_sent' : 'email_received'

      const { data: existing } = await admin
        .from('crm_lead_activities')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('content', `Outlook:${msg.id}`)
        .single()

      if (!existing) {
        await admin.from('crm_lead_activities').insert({
          lead_id: lead.id,
          org_id: lead.org_id,
          type: activityType,
          content: `Outlook:${msg.id}`,
          email_subject: subject,
          metadata: { subject, from: fromEmail, to: toEmail },
          created_at: msgDate,
        })
        totalSynced++
      }
    }

    await admin.from('crm_email_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', account.id)
  }

  return Response.json({ synced: totalSynced })
}
