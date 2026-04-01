import { createAdminClient } from '@/lib/supabase/admin'

export async function triggerZapierWebhook(
  orgId: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('zapier_subscriptions')
    .select('target_url, secret')
    .eq('org_id', orgId)
    .eq('event_type', eventType)

  if (!subs || subs.length === 0) return

  const body = JSON.stringify({ event: eventType, ...payload })

  for (const sub of subs) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (sub.secret) headers['X-Zapier-Secret'] = sub.secret
    fetch(sub.target_url, { method: 'POST', headers, body }).catch(() => {})
  }
}
