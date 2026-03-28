// PATCH /api/leads/[id]/custom-fields — update custom_fields_json on a lead
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const u = await getOrgUser()
  if (!u) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { fields } = await request.json() // { fieldName: value, ... }
  if (!fields || typeof fields !== 'object') {
    return Response.json({ error: 'fields object required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get current custom_fields_json
  const { data: lead } = await admin
    .from('crm_leads')
    .select('custom_fields_json')
    .eq('id', id)
    .eq('org_id', u.org_id)
    .single()

  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 })

  const current = (lead.custom_fields_json ?? {}) as Record<string, unknown>
  const updated = { ...current, ...fields }

  const { data, error } = await admin
    .from('crm_leads')
    .update({ custom_fields_json: updated })
    .eq('id', id)
    .eq('org_id', u.org_id)
    .select('custom_fields_json')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ custom_fields_json: data?.custom_fields_json })
}
