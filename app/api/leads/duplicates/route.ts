// POST /api/leads/duplicates -- check for duplicates before creating/updating a lead
// Returns any leads that match on email, phone, or name (fuzzy)
import { NextRequest } from 'next/server'
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

export async function POST(request: NextRequest) {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { full_name, email, phone, exclude_id } = await request.json()
  const admin = createAdminClient()

  const duplicates: Record<string, unknown>[] = []
  const seenIds = new Set<string>()

  // Check email match (exact, case-insensitive)
  if (email) {
    const { data } = await admin
      .from('crm_leads')
      .select('id, full_name, email, phone, stage, status, created_at')
      .eq('org_id', orgId)
      .ilike('email', email)
      .limit(5)
    for (const lead of data ?? []) {
      if (lead.id !== exclude_id && !seenIds.has(lead.id)) {
        duplicates.push({ ...lead, match_reason: 'email' })
        seenIds.add(lead.id)
      }
    }
  }

  // Check phone match (strip non-digits, then match)
  if (phone) {
    const digits = phone.replace(/\D/g, '')
    if (digits.length >= 7) {
      const { data } = await admin
        .from('crm_leads')
        .select('id, full_name, email, phone, stage, status, created_at')
        .eq('org_id', orgId)
        .or(`phone.ilike.%${digits.slice(-7)}%,phone_2.ilike.%${digits.slice(-7)}%`)
        .limit(5)
      for (const lead of data ?? []) {
        if (lead.id !== exclude_id && !seenIds.has(lead.id)) {
          duplicates.push({ ...lead, match_reason: 'phone' })
          seenIds.add(lead.id)
        }
      }
    }
  }

  // Check name match (first + last, fuzzy using ilike)
  if (full_name && full_name.trim().split(' ').length >= 2 && duplicates.length === 0) {
    const nameParts = full_name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts[nameParts.length - 1]
    const { data } = await admin
      .from('crm_leads')
      .select('id, full_name, email, phone, stage, status, created_at')
      .eq('org_id', orgId)
      .ilike('full_name', `%${firstName}%${lastName}%`)
      .limit(3)
    for (const lead of data ?? []) {
      if (lead.id !== exclude_id && !seenIds.has(lead.id)) {
        duplicates.push({ ...lead, match_reason: 'name' })
        seenIds.add(lead.id)
      }
    }
  }

  return Response.json({ duplicates })
}
