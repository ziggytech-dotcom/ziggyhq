'use client'

import { useState } from 'react'

export default function InviteModal({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('agent')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, orgId }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to send invite')
    } else {
      setSuccess(true)
      setEmail('')
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#ff006e] text-white rounded-lg text-sm font-medium hover:bg-[#ff006e]/90 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Invite Member
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Invite Team Member</h2>
          <button onClick={() => { setOpen(false); setSuccess(false); setError('') }} className="text-[#b3b3b3] hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="text-[#22c55e] text-sm font-medium mb-2">Invite sent!</div>
            <button onClick={() => setSuccess(false)} className="text-[#ff006e] text-sm hover:underline">Send another</button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#ff006e] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#ff006e] text-sm"
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
                <option value="partner">Partner</option>
              </select>
            </div>
            {error && <div className="text-sm text-[#ff006e] bg-[#ff006e]/10 border border-[#ff006e]/20 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-[#ff006e] text-white text-sm font-medium hover:bg-[#ff006e]/90 transition-colors disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
