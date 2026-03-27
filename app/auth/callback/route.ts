import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app/leads'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if this user's org needs onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const admin = createAdminClient()
        const { data: crmUser } = await admin
          .from('crm_users')
          .select('org_id')
          .eq('email', user.email)
          .single()

        if (crmUser?.org_id) {
          const { data: org } = await admin
            .from('crm_organizations')
            .select('onboarding_complete')
            .eq('id', crmUser.org_id)
            .single()

          if (org && !org.onboarding_complete) {
            return NextResponse.redirect(`${origin}/app/onboarding`)
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
