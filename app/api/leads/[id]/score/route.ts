import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { calculateLeadScore } from '@/lib/lead-score'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('crm_users').select('org_id').eq('email', user.email!).single()
  return data?.org_id ?? null
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: lead, error } = await admin
    .from('crm_leads')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error || !lead) return Response.json({ error: 'Not found' }, { status: 404 })

  const breakdown = calculateLeadScore(lead)

  const { data: updated } = await admin
    .from('crm_leads')
    .update({ lead_score: breakdown.total, score_breakdown_json: breakdown })
    .eq('id', id)
    .eq('org_id', orgId)
    .select('lead_score, score_breakdown_json')
    .single()

  return Response.json({ score: breakdown.total, breakdown, lead: updated })
}
