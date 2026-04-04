import { redirect } from 'next/navigation'

// ZiggyHQ signup — redirects to login (admin-provisioned accounts only)
export default function SignupPage() {
  redirect('/login')
}
