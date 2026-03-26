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

export async function GET(request: NextRequest) {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search')
  const stage = searchParams.get('stage')
  const source = searchParams.get('source')
  const assignedTo = searchParams.get('assigned_to')
  const sort = searchParams.get('sort') ?? 'created_at'
  const dir = searchParams.get('dir') ?? 'desc'

  const admin = createAdminClient()
  let query = admin
    .from('crm_leads')
    .select('*, crm_users(id, full_name, email)')
    .eq('org_id', orgId)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  if (stage) query = query.eq('stage', stage)
  if (source) query = query.eq('source', source)
  if (assignedTo) query = query.eq('assigned_to', assignedTo)

  const validSortFields = ['full_name', 'stage', 'source', 'lead_score', 'last_contacted_at', 'next_followup_at', 'created_at']
  const sortField = validSortFields.includes(sort) ? sort : 'created_at'
  query = query.order(sortField, { ascending: dir === 'asc', nullsFirst: false })

  const { data, error } = await query.limit(500)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ leads: data })
}

export async function POST(request: Request) {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    full_name,
    email,
    phone,
    source,
    stage,
    status = 'active',
    notes,
    budget_min,
    budget_max,
    timeline,
    pre_approved = false,
    property_type,
    bedrooms,
    areas_of_interest,
    tags,
    assigned_to,
    lead_score = 0,
  } = body

  if (!full_name) return Response.json({ error: 'full_name is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_leads')
    .insert({
      org_id: orgId,
      full_name,
      email: email || null,
      phone: phone || null,
      source: source || null,
      stage: stage || null,
      status,
      notes: notes || null,
      budget_min: budget_min || null,
      budget_max: budget_max || null,
      timeline: timeline || null,
      pre_approved,
      property_type: property_type || null,
      bedrooms: bedrooms || null,
      areas_of_interest: areas_of_interest || [],
      tags: tags || [],
      assigned_to: assigned_to || null,
      lead_score,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ lead: data }, { status: 201 })
}
