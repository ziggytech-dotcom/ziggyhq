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

interface LeadRow {
  full_name?: string
  email?: string
  phone?: string
  stage?: string
  source?: string
  status?: string
  tags?: string
  notes?: string
  budget_min?: string
  budget_max?: string
  timeline?: string
  property_type?: string
  assigned_to_email?: string
  next_followup_at?: string
  co_buyer_name?: string
  email_2?: string
  phone_2?: string
}

export async function POST(request: Request) {
  const user = await getOrgUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows, dryRun = false } = await request.json() as { rows: LeadRow[], dryRun: boolean }

  if (!Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: 'No rows provided' }, { status: 400 })
  }
  if (rows.length > 2000) {
    return Response.json({ error: 'Max 2000 rows per import' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch existing emails + phones for duplicate detection
  const { data: existingLeads } = await admin
    .from('crm_leads')
    .select('email, phone')
    .eq('org_id', user.org_id)

  const existingEmails = new Set((existingLeads ?? []).map((l) => l.email?.toLowerCase()).filter(Boolean))
  const existingPhones = new Set((existingLeads ?? []).map((l) => l.phone?.replace(/\D/g, '')).filter(Boolean))

  // Fetch team members for assigned_to resolution
  const { data: teamMembers } = await admin
    .from('crm_users')
    .select('id, email')
    .eq('org_id', user.org_id)

  const teamByEmail = new Map((teamMembers ?? []).map((m) => [m.email.toLowerCase(), m.id]))

  const toInsert: Record<string, unknown>[] = []
  const skipped: { row: number; reason: string; name: string }[] = []
  const warnings: { row: number; message: string; name: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const name = row.full_name?.trim() || row.email?.trim() || `Row ${i + 2}`

    if (!row.full_name?.trim() && !row.email?.trim() && !row.phone?.trim()) {
      skipped.push({ row: i + 2, reason: 'No name, email, or phone', name })
      continue
    }

    const emailNorm = row.email?.trim().toLowerCase()
    const phoneDigits = row.phone?.replace(/\D/g, '')

    // Duplicate check
    if (emailNorm && existingEmails.has(emailNorm)) {
      skipped.push({ row: i + 2, reason: 'Duplicate email', name })
      continue
    }
    if (phoneDigits && phoneDigits.length >= 10 && existingPhones.has(phoneDigits)) {
      skipped.push({ row: i + 2, reason: 'Duplicate phone', name })
      continue
    }

    // Format phone
    let phone = null
    if (phoneDigits && phoneDigits.length >= 10) {
      const d = phoneDigits.slice(-10)
      phone = `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
    } else if (row.phone?.trim()) {
      warnings.push({ row: i + 2, message: 'Phone number invalid format — imported as-is', name })
      phone = row.phone.trim()
    }

    let phone2 = null
    if (row.phone_2) {
      const d2 = row.phone_2.replace(/\D/g, '').slice(-10)
      if (d2.length === 10) phone2 = `(${d2.slice(0,3)}) ${d2.slice(3,6)}-${d2.slice(6)}`
    }

    // Resolve assigned_to
    let assignedTo = null
    if (row.assigned_to_email) {
      assignedTo = teamByEmail.get(row.assigned_to_email.toLowerCase().trim()) ?? null
      if (!assignedTo) warnings.push({ row: i + 2, message: `Assigned agent "${row.assigned_to_email}" not found`, name })
    }

    // Parse tags
    const tags = row.tags ? row.tags.split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : []

    // Parse budget
    const budgetMin = row.budget_min ? parseInt(row.budget_min.replace(/\D/g, '')) || null : null
    const budgetMax = row.budget_max ? parseInt(row.budget_max.replace(/\D/g, '')) || null : null

    // Parse followup date
    let nextFollowup = null
    if (row.next_followup_at) {
      const d = new Date(row.next_followup_at)
      if (!isNaN(d.getTime())) nextFollowup = d.toISOString()
    }

    toInsert.push({
      org_id: user.org_id,
      full_name: row.full_name?.trim() || null,
      email: emailNorm || null,
      email_2: row.email_2?.trim().toLowerCase() || null,
      phone,
      phone_2: phone2,
      co_buyer_name: row.co_buyer_name?.trim() || null,
      stage: row.stage?.trim() || null,
      source: row.source?.trim() || null,
      status: row.status?.trim() || 'active',
      notes: row.notes?.trim() || null,
      tags,
      budget_min: budgetMin,
      budget_max: budgetMax,
      timeline: row.timeline?.trim() || null,
      property_type: row.property_type?.trim() || null,
      assigned_to: assignedTo,
      next_followup_at: nextFollowup,
      lead_score: 50,
    })

    // Track for in-batch duplicate detection
    if (emailNorm) existingEmails.add(emailNorm)
    if (phoneDigits && phoneDigits.length >= 10) existingPhones.add(phoneDigits.slice(-10))
  }

  if (dryRun) {
    return Response.json({
      preview: toInsert.slice(0, 10),
      toImport: toInsert.length,
      skipped,
      warnings,
    })
  }

  // Batch insert in chunks of 200
  let imported = 0
  for (let i = 0; i < toInsert.length; i += 200) {
    const chunk = toInsert.slice(i, i + 200)
    const { error } = await admin.from('crm_leads').insert(chunk)
    if (error) return Response.json({ error: error.message, imported }, { status: 500 })
    imported += chunk.length
  }

  return Response.json({ imported, skipped, warnings })
}
