'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface EmailAccount {
  id: string
  email: string
  provider: string
  last_synced_at: string | null
  sync_enabled: boolean
  created_at: string
}

function timeAgo(d: string | null) {
  if (!d) return 'Never'
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function IntegrationsContent() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/email-accounts')
    if (res.ok) { const d = await res.json(); setAccounts(d.accounts ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const s = searchParams.get('success')
    const e = searchParams.get('error')
    const em = searchParams.get('email')
    if (s === 'gmail_connected') {
      setBanner({ type: 'success', msg: `Gmail connected${em ? `: ${em}` : ''}!` })
    } else if (e) {
      const msgs: Record<string, string> = {
        gmail_denied: 'Gmail connection was denied.',
        token_exchange_failed: 'Failed to exchange token. Try again.',
        invalid_state: 'Invalid OAuth state. Try again.',
      }
      setBanner({ type: 'error', msg: msgs[e] ?? 'Connection failed.' })
    }
  }, [load, searchParams])

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch('/api/gmail/sync', { method: 'POST' })
    if (res.ok) {
      const d = await res.json()
      setSyncResult(`Synced ${d.synced} new email activities`)
      load()
    }
    setSyncing(false)
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this Gmail account?')) return
    await fetch('/api/gmail/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: id }),
    })
    load()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          INTEGRATIONS
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Connect external services to ZiggyCRM</p>
      </div>

      {banner && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm border ${banner.type === 'success' ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20' : 'bg-[#ff006e]/10 text-[#ff006e] border-[#ff006e]/20'}`}>
          {banner.msg}
        </div>
      )}

      {/* Gmail section */}
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Gmail</div>
              <div className="text-xs text-[#b3b3b3]">Sync emails with your leads automatically</div>
            </div>
          </div>
          <a
            href="/api/gmail/connect"
            className="flex items-center gap-2 px-4 py-2 bg-[#ff006e] text-white rounded-lg text-sm font-medium hover:bg-[#ff006e]/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Connect Gmail
          </a>
        </div>

        {loading ? (
          <div className="px-6 py-4 text-[#b3b3b3] text-sm">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="text-[#b3b3b3] text-sm">No Gmail accounts connected</div>
            <div className="text-xs text-[#b3b3b3]/60 mt-1">Connect Gmail to automatically log emails with your leads</div>
          </div>
        ) : (
          <div>
            {accounts.map((account) => (
              <div key={account.id} className="px-6 py-4 flex items-center justify-between border-b border-[#2d2d2d] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#ff006e]/20 flex items-center justify-center">
                    <span className="text-xs text-[#ff006e] font-semibold">{account.email.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{account.email}</div>
                    <div className="text-xs text-[#b3b3b3]">Last sync: {timeAgo(account.last_synced_at)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded">Connected</span>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    className="text-xs text-[#b3b3b3] hover:text-[#ff006e] px-2 py-1 rounded bg-[#2d2d2d] transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}

            <div className="px-6 py-4 bg-[#0a0a0a] flex items-center justify-between">
              <div className="text-xs text-[#b3b3b3]">
                {syncResult ?? 'Sync emails with connected Gmail accounts'}
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] hover:text-white text-xs transition-colors disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">How Gmail Sync Works</h3>
        <ul className="space-y-2">
          {[
            'Connect your Gmail account via secure OAuth',
            'ZiggyCRM scans your inbox for emails matching lead email addresses',
            'Matching emails are logged as activities on the lead profile',
            'New emails auto-sync every 15 minutes in the background',
            'Sent emails are tagged "email_sent", received as "email_received"',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#b3b3b3]">
              <span className="text-[#ff006e] flex-shrink-0 mt-0.5">→</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[#b3b3b3]">Loading...</div>}>
      <IntegrationsContent />
    </Suspense>
  )
}
