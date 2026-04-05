import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(
    req.headers.get('authorization')?.replace('Bearer ', '') || ''
  )
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) return NextResponse.json({ branding: null })

  const { data } = await supabaseAdmin
    .from('workspace_branding').select('*').eq('workspace_id', workspace.id).single()
  return NextResponse.json({ branding: data })
}

export async function POST(req: Request) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(
    req.headers.get('authorization')?.replace('Bearer ', '') || ''
  )
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('workspace_branding')
    .upsert({ workspace_id: workspace.id, ...body, updated_at: new Date().toISOString() })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ branding: data })
}
