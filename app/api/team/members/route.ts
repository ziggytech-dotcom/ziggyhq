import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — list workspace members
export async function GET(req: Request) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(
    req.headers.get('authorization')?.replace('Bearer ', '') || ''
  )
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) {
    const { data: newWorkspace } = await supabaseAdmin
      .from('workspaces')
      .insert({ name: user.email?.split('@')[0] || 'My Workspace', owner_id: user.id })
      .select('id')
      .single()
    return NextResponse.json({ members: [], workspace_id: newWorkspace?.id })
  }

  const { data: members } = await supabaseAdmin
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('invited_at', { ascending: false })

  return NextResponse.json({ members: members || [], workspace_id: workspace.id })
}

// POST — invite member
export async function POST(req: Request) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(
    req.headers.get('authorization')?.replace('Bearer ', '') || ''
  )
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, role } = await req.json()
  if (!email || !role) return NextResponse.json({ error: 'Email and role required' }, { status: 400 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  const { count } = await supabaseAdmin
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)
    .eq('status', 'active')

  if ((count || 0) >= 5) {
    return NextResponse.json({ error: 'Seat limit reached. Upgrade to add more members.' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      email,
      role,
      invited_by: user.id,
      status: 'pending'
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ member: data })
}
