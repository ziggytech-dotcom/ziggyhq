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
  const admin = createAdminClient()
  const activeOnly = request.nextUrl.searchParams.get('active') === '1'
  let query = admin.from('crm_lenders').select('*').eq('org_id', orgId).order('name')
  if (activeOnly) query = query.eq('status', 'active')
  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ lenders: data })
}

export async function POST(request: NextRequest) {
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { name, company, phone, email, loan_types, notes } = body
  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_lenders')
    .insert({ org_id: orgId, name, company: company||null, phone: phone||null, email: email||null, loan_types: loan_types||[], notes: notes||null })
    .select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ lender: data }, { status: 201 })
}
