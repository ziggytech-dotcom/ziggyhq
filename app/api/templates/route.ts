import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getTemplate, TEMPLATE_LIST } from '@/lib/industry-templates'

async function getOrgTemplate(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return 'general'
  const admin = createAdminClient()
  const { data: crmUser } = await admin.from('crm_users').select('org_id').eq('email', user.email).single()
  if (!crmUser?.org_id) return 'general'
  const { data: org } = await admin.from('crm_organizations').select('industry_template').eq('id', crmUser.org_id).single()
  return org?.industry_template ?? 'general'
}

// GET /api/templates -- returns current org's template
export async function GET() {
  const templateId = await getOrgTemplate()
  const template = getTemplate(templateId)
  return Response.json({ template, all: TEMPLATE_LIST })
}
