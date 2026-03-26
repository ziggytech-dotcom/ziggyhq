import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/app/components/Sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = createAdminClient()

  // Get user record
  const { data: userRecord } = await admin
    .from('users')
    .select('*, organizations(*)')
    .eq('email', user.email!)
    .single()

  // If no user record, try to find org and create user
  let orgName = 'ZiggyCRM'
  let userName = user.email?.split('@')[0] ?? ''
  let userFullName = ''

  if (userRecord) {
    userFullName = userRecord.full_name ?? ''
    if (userRecord.organizations) {
      orgName = (userRecord.organizations as { name: string }).name
    }
  } else {
    // Create a user record for first-time login
    const { data: org } = await admin
      .from('organizations')
      .select('id, name')
      .limit(1)
      .single()

    if (org) {
      orgName = org.name
      await admin.from('users').upsert({
        id: user.id,
        email: user.email!,
        org_id: org.id,
        full_name: user.email?.split('@')[0] ?? '',
        role: 'admin',
        status: 'active',
      })
    }
  }

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      <Sidebar
        orgName={orgName}
        userEmail={user.email ?? ''}
        userName={userFullName || userName}
      />
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
