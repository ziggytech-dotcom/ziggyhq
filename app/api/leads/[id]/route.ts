import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { calculateLeadScore } from '@/lib/lead-score'
import { triggerZapierWebhook } from '@/lib/zapier'
import { upsertSharedContact } from '@/lib/sharedContacts'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  return data?.org_id ?? null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_leads')
    .select('*, crm_users(id, full_name, email)')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ lead: data })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Only allow safe fields to be updated
  const allowed = [
    'full_name', 'email', 'email_2', 'phone', 'phone_2', 'co_buyer_name',
    'source', 'stage', 'status', 'notes',
    'budget_min', 'budget_max', 'timeline', 'pre_approved', 'property_type',
    'bedrooms', 'areas_of_interest', 'tags', 'assigned_to', 'lead_score',
    'last_contacted_at', 'next_followup_at',
    'loan_amount', 'loan_type', 'lender_id', 'lender_name', 'lender_phone', 'lender_email',
    'commission_split', 'referral_agent_name', 'referral_agent_phone', 'referral_fee_pct',
    'stage_entered_at', 'score_breakdown_json',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // Recalculate score if scoring-relevant fields changed
  const scoreFields = ['source','email','phone','budget_min','budget_max','timeline','pre_approved','property_type','areas_of_interest','tags','last_contacted_at']
  if (scoreFields.some((f) => f in updates)) {
    const admin2 = createAdminClient()
    const { data: existing } = await admin2.from('crm_leads').select('*').eq('id', id).eq('org_id', orgId).single()
    if (existing) {
      const merged = { ...existing, ...updates }
      const breakdown = calculateLeadScore(merged)
      updates.lead_score = breakdown.total
      updates.score_breakdown_json = breakdown
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_leads')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  triggerZapierWebhook(orgId, 'lead.updated', { lead: data })
  if ('stage' in updates) {
    triggerZapierWebhook(orgId, 'lead.stage_changed', { lead: data, stage: data.stage })
  }

  // Sync contact fields to shared_contacts if name/email/phone changed (best-effort)
  const contactFields = ['full_name', 'email', 'phone']
  if (contactFields.some((f) => f in updates)) {
    const nameParts = (data.full_name || '').trim().split(' ')
    void upsertSharedContact(orgId, {
      first_name: nameParts[0] || null,
      last_name: nameParts.slice(1).join(' ') || null,
      email: data.email || null,
      phone: data.phone || null,
    }, id)
  }

  return Response.json({ lead: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('crm_leads')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
