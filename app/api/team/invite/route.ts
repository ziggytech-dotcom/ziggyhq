import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userRecord } = await admin.from('users').select('org_id, role').eq('email', user.email!).single()
  if (!userRecord?.org_id) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRecord.role !== 'admin') return Response.json({ error: 'Only admins can invite team members' }, { status: 403 })

  const body = await request.json()
  const { email, role = 'agent' } = body

  if (!email) return Response.json({ error: 'email is required' }, { status: 400 })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  const { data, error } = await admin
    .from('team_invites')
    .insert({
      org_id: userRecord.org_id,
      email,
      role,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // In production, you'd send an email here using Resend
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}`

  return Response.json({ invite: data, invite_url: inviteUrl }, { status: 201 })
}
