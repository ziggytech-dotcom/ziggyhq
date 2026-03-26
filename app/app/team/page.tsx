import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InviteModal from './InviteModal'

const roleColors: Record<string, string> = {
  admin: '#ff006e',
  agent: '#3b82f6',
  partner: '#8b5cf6',
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: userRecord } = await admin
    .from('users')
    .select('org_id, role')
    .eq('email', user.email!)
    .single()

  if (!userRecord?.org_id) return <div className="p-8 text-[#b3b3b3]">Loading...</div>

  const { data: members } = await admin
    .from('users')
    .select('*')
    .eq('org_id', userRecord.org_id)
    .order('created_at', { ascending: true })

  // Get lead counts per user
  const { data: leadCounts } = await admin
    .from('leads')
    .select('assigned_to')
    .eq('org_id', userRecord.org_id)
    .not('assigned_to', 'is', null)

  const countMap: Record<string, number> = {}
  if (leadCounts) {
    for (const lead of leadCounts) {
      if (lead.assigned_to) {
        countMap[lead.assigned_to] = (countMap[lead.assigned_to] ?? 0) + 1
      }
    }
  }

  const { data: pendingInvites } = await admin
    .from('team_invites')
    .select('*')
    .eq('org_id', userRecord.org_id)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            TEAM
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">{members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        {userRecord.role === 'admin' && <InviteModal orgId={userRecord.org_id} />}
      </div>

      {/* Members */}
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2d2d2d]">
              <th className="text-left text-xs font-medium text-[#b3b3b3] px-6 py-3 uppercase tracking-wider">Member</th>
              <th className="text-left text-xs font-medium text-[#b3b3b3] px-6 py-3 uppercase tracking-wider">Role</th>
              <th className="text-left text-xs font-medium text-[#b3b3b3] px-6 py-3 uppercase tracking-wider">Status</th>
              <th className="text-left text-xs font-medium text-[#b3b3b3] px-6 py-3 uppercase tracking-wider">Leads</th>
              <th className="text-left text-xs font-medium text-[#b3b3b3] px-6 py-3 uppercase tracking-wider">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2d2d]">
            {members?.map((member) => (
              <tr key={member.id} className="hover:bg-[#2d2d2d]/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#ff006e]/20 border border-[#ff006e]/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-[#ff006e]">
                        {(member.full_name ?? member.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{member.full_name ?? '—'}</div>
                      <div className="text-xs text-[#b3b3b3]">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                    style={{
                      backgroundColor: `${roleColors[member.role] ?? '#b3b3b3'}20`,
                      color: roleColors[member.role] ?? '#b3b3b3',
                      border: `1px solid ${roleColors[member.role] ?? '#b3b3b3'}40`,
                    }}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${member.status === 'active' ? 'text-[#22c55e]' : 'text-[#b3b3b3]'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-[#22c55e]' : 'bg-[#b3b3b3]'}`} />
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[#b3b3b3]">
                  {countMap[member.id] ?? 0}
                </td>
                <td className="px-6 py-4 text-sm text-[#b3b3b3]">
                  {member.last_login_at ? new Date(member.last_login_at).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Invites */}
      {(pendingInvites?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Pending Invites</h2>
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-[#2d2d2d]">
                {pendingInvites?.map((invite) => (
                  <tr key={invite.id} className="px-6 py-4">
                    <td className="px-6 py-4 text-sm text-white">{invite.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#b3b3b3] capitalize">{invite.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-0.5 rounded">Pending</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#b3b3b3]">
                      Expires {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : 'never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
