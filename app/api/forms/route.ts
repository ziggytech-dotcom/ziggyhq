import { NextRequest } from 'next/server'
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

async function getOrgWidgetKey(orgId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('crm_organizations').select('widget_key').eq('id', orgId).single()
  return data?.widget_key ?? `wk_${orgId.replace(/-/g, '').slice(0, 20)}`
}

export async function GET() {
  const user = await getOrgUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_forms')
    .select('*')
    .eq('org_id', user.org_id)
    .order('created_at', { ascending: false })

  if (error) {
    // Table may not exist yet
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return Response.json({
        forms: [],
        setupRequired: true,
        setupUrl: '/api/admin/setup-forms?secret=ziggyhq-setup-2026',
        message: 'Forms table not yet created. Visit /api/admin/setup-forms for instructions.',
      })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ forms: data ?? [] })
}

export async function POST(request: NextRequest) {
  const user = await getOrgUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, fields } = body

  if (!title?.trim()) return Response.json({ error: 'Form title is required' }, { status: 400 })
  if (!Array.isArray(fields)) return Response.json({ error: 'Fields must be an array' }, { status: 400 })

  const widgetKey = await getOrgWidgetKey(user.org_id)
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('crm_forms')
    .insert({
      org_id: user.org_id,
      title: title.trim(),
      fields,
      widget_key: widgetKey,
      submission_count: 0,
      active: true,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ form: data }, { status: 201 })
}
