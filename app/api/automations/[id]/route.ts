import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(
    req.headers.get('authorization')?.replace('Bearer ', '') || ''
  )
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('automations').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ automation: data })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(
    req.headers.get('authorization')?.replace('Bearer ', '') || ''
  )
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await supabaseAdmin.from('automations').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}
