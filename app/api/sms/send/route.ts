import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendSmsToLead } from '@/lib/sms'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userRecord } = await admin
    .from('crm_users')
    .select('org_id')
    .eq('email', user.email!)
    .single()
  if (!userRecord?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { lead_id, message } = body as { lead_id?: string; message?: string }

  if (!lead_id || !message) {
    return Response.json({ error: 'lead_id and message are required' }, { status: 400 })
  }

  const result = await sendSmsToLead({
    admin,
    org_id: userRecord.org_id,
    lead_id,
    message,
  })

  if (!result.success) {
    const status = result.error?.includes('Twilio not connected') ? 400 : 500
    return Response.json({ error: result.error }, { status })
  }

  return Response.json({ success: true, sid: result.sid })
}
