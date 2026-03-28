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

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = Array.isArray(val) ? val.join('; ') : String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(request: NextRequest) {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search')
  const stage = searchParams.get('stage')
  const source = searchParams.get('source')
  const assignedTo = searchParams.get('assigned_to')

  const admin = createAdminClient()
  let query = admin
    .from('crm_leads')
    .select('*, crm_users(id, full_name, email)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  if (stage) query = query.eq('stage', stage)
  if (source) query = query.eq('source', source)
  if (assignedTo) query = query.eq('assigned_to', assignedTo)

  const { data, error } = await query.limit(10000)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const leads = data ?? []

  // CSV headers
  const headers = [
    'Full Name',
    'Email',
    'Phone',
    'Email 2',
    'Phone 2',
    'Source',
    'Stage',
    'Status',
    'Lead Score',
    'Tags',
    'Notes',
    'Budget Min',
    'Budget Max',
    'Timeline',
    'Property Type',
    'Pre-Approved',
    'Co-Buyer Name',
    'Assigned Agent',
    'Last Contacted',
    'Next Follow-Up',
    'Created At',
  ]

  const rows = leads.map((lead) => [
    lead.full_name,
    lead.email,
    lead.phone,
    lead.email_2,
    lead.phone_2,
    lead.source,
    lead.stage,
    lead.status,
    lead.lead_score,
    lead.tags,
    lead.notes,
    lead.budget_min,
    lead.budget_max,
    lead.timeline,
    lead.property_type,
    lead.pre_approved ? 'Yes' : 'No',
    lead.co_buyer_name,
    (lead as Record<string, unknown> & { crm_users?: { full_name?: string; email?: string } | null }).crm_users
      ? ((lead as Record<string, unknown> & { crm_users?: { full_name?: string; email?: string } | null }).crm_users!.full_name ?? (lead as Record<string, unknown> & { crm_users?: { full_name?: string; email?: string } | null }).crm_users!.email)
      : '',
    lead.last_contacted_at ? new Date(lead.last_contacted_at).toISOString() : '',
    lead.next_followup_at ? new Date(lead.next_followup_at).toISOString() : '',
    new Date(lead.created_at).toISOString(),
  ])

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  const today = new Date().toISOString().split('T')[0]
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="ziggyhq-contacts-${today}.csv"`,
    },
  })
}
