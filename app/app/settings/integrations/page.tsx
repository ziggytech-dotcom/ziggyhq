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

interface TwilioStatus {
  connected: boolean
  account_sid_masked?: string | null
  phone_number?: string | null
  connected_at?: string | null
}

interface BlandStatus {
  connected: boolean
  api_key_masked?: string | null
  agent_config?: {
    name?: string
    brokerage?: string
    callback_phone?: string
    disclose_if_asked?: boolean
    scripts?: {
      new_lead?: string
      home_value?: string
      listing_inquiry?: string
      voicemail?: string
    }
  }
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

  // Bland.ai state
  const [blandStatus, setBlandStatus] = useState<BlandStatus | null>(null)
  const [blandLoading, setBlandLoading] = useState(true)
  const [blandForm, setBlandForm] = useState({
    api_key: '',
    name: 'Emma',
    brokerage: '',
    callback_phone: '',
    disclose_if_asked: true,
  })
  const [blandSaving, setBlandSaving] = useState(false)
  const [blandError, setBlandError] = useState<string | null>(null)

  const loadBland = useCallback(async () => {
    setBlandLoading(true)
    const res = await fetch('/api/integrations/bland')
    if (res.ok) { const d = await res.json(); setBlandStatus(d) }
    setBlandLoading(false)
  }, [])

  const handleBlandConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setBlandSaving(true)
    setBlandError(null)
    const res = await fetch('/api/integrations/bland', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: blandForm.api_key,
        agent_config: {
          name: blandForm.name,
          brokerage: blandForm.brokerage,
          callback_phone: blandForm.callback_phone,
          disclose_if_asked: blandForm.disclose_if_asked,
        },
      }),
    })
    const d = await res.json()
    if (res.ok) {
      setBlandForm({ api_key: '', name: 'Emma', brokerage: '', callback_phone: '', disclose_if_asked: true })
      setBanner({ type: 'success', msg: 'Bland.ai connected successfully!' })
      loadBland()
    } else {
      setBlandError(d.error ?? 'Failed to connect')
    }
    setBlandSaving(false)
  }

  // Twilio state
  const [twilioStatus, setTwilioStatus] = useState<TwilioStatus | null>(null)
  const [twilioLoading, setTwilioLoading] = useState(true)
  const [twilioForm, setTwilioForm] = useState({ account_sid: '', auth_token: '', phone_number: '' })
  const [twilioSaving, setTwilioSaving] = useState(false)
  const [twilioError, setTwilioError] = useState<string | null>(null)
  const [testPhone, setTestPhone] = useState('')
  const [testingSms, setTestingSms] = useState(false)
  const [showTestInput, setShowTestInput] = useState(false)

  const loadTwilio = useCallback(async () => {
    setTwilioLoading(true)
    const res = await fetch('/api/integrations/twilio')
    if (res.ok) { const d = await res.json(); setTwilioStatus(d) }
    setTwilioLoading(false)
  }, [])

  const handleTwilioConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setTwilioSaving(true)
    setTwilioError(null)
    const res = await fetch('/api/integrations/twilio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(twilioForm),
    })
    const d = await res.json()
    if (res.ok) {
      setTwilioForm({ account_sid: '', auth_token: '', phone_number: '' })
      setBanner({ type: 'success', msg: 'Twilio connected successfully!' })
      loadTwilio()
    } else {
      setTwilioError(d.error ?? 'Failed to connect')
    }
    setTwilioSaving(false)
  }

  const handleTwilioDisconnect = async () => {
    if (!confirm('Disconnect Twilio? SMS features will stop working.')) return
    await fetch('/api/integrations/twilio', { method: 'DELETE' })
    setTwilioStatus({ connected: false })
    setBanner({ type: 'success', msg: 'Twilio disconnected.' })
  }

  const handleTestSms = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testPhone) return
    setTestingSms(true)
    const res = await fetch('/api/integrations/twilio', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_phone: testPhone }),
    })
    const d = await res.json()
    if (res.ok) {
      setBanner({ type: 'success', msg: `Test SMS sent to ${testPhone}!` })
      setShowTestInput(false)
      setTestPhone('')
    } else {
      setBanner({ type: 'error', msg: d.error ?? 'Test SMS failed' })
    }
    setTestingSms(false)
  }

  const load = useCallback(async () => {
    const res = await fetch('/api/email-accounts')
    if (res.ok) { const d = await res.json(); setAccounts(d.accounts ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    loadTwilio()
    loadBland()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, loadTwilio, loadBland])

  useEffect(() => {
    const s = searchParams.get('success')
    const e = searchParams.get('error')
    const em = searchParams.get('email')
    if (s === 'gmail_connected') {
      setBanner({ type: 'success', msg: `Gmail connected${em ? `: ${em}` : ''}!` })
    } else if (s === 'outlook_connected') {
      setBanner({ type: 'success', msg: `Outlook connected${em ? `: ${em}` : ''}!` })
    } else if (e) {
      const msgs: Record<string, string> = {
        gmail_denied: 'Gmail connection was denied.',
        outlook_denied: 'Outlook connection was denied.',
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
        <p className="text-[#b3b3b3] text-sm mt-1">Connect external services to ZiggyHQ</p>
      </div>

      {banner && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm border ${banner.type === 'success' ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20' : 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20'}`}>
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
            className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors"
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
                  <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/20 flex items-center justify-center">
                    <span className="text-xs text-[#0ea5e9] font-semibold">{account.email.charAt(0).toUpperCase()}</span>
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
                    className="text-xs text-[#b3b3b3] hover:text-[#0ea5e9] px-2 py-1 rounded bg-[#2d2d2d] transition-colors"
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

      {/* Outlook section */}
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0078d4] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-15ZM12 7l-7 4v1l7 4 7-4v-1L12 7Z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Outlook / Microsoft 365</div>
              <div className="text-xs text-[#b3b3b3]">Sync emails from Outlook or Microsoft 365 accounts</div>
            </div>
          </div>
          <a
            href="/api/outlook/connect"
            className="flex items-center gap-2 px-4 py-2 bg-[#0078d4] text-white rounded-lg text-sm font-medium hover:bg-[#0078d4]/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Connect Outlook
          </a>
        </div>
        <div className="px-6 py-4 text-xs text-[#b3b3b3]">
          Requires <code className="bg-[#2d2d2d] px-1 rounded">MICROSOFT_CLIENT_ID</code> and <code className="bg-[#2d2d2d] px-1 rounded">MICROSOFT_CLIENT_SECRET</code> environment variables.
        </div>
      </div>

      {/* Twilio section */}
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#2d2d2d] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#e11d48] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">Twilio SMS</div>
            <div className="text-xs text-[#b3b3b3]">Connect your own Twilio account to send and receive SMS. Your workspace pays Twilio directly for usage.</div>
          </div>
          {twilioStatus?.connected && (
            <span className="text-xs text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded flex-shrink-0">Connected</span>
          )}
        </div>

        {twilioLoading ? (
          <div className="px-6 py-4 text-[#b3b3b3] text-sm">Loading...</div>
        ) : twilioStatus?.connected ? (
          <div>
            <div className="px-6 py-4 space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#b3b3b3] w-24 flex-shrink-0">Account SID</span>
                <span className="text-white font-mono text-xs">{twilioStatus.account_sid_masked}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#b3b3b3] w-24 flex-shrink-0">Phone Number</span>
                <span className="text-white">{twilioStatus.phone_number}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#b3b3b3] w-24 flex-shrink-0">Connected</span>
                <span className="text-white">{timeAgo(twilioStatus.connected_at ?? null)}</span>
              </div>
            </div>
            <div className="px-6 py-4 bg-[#0a0a0a] border-t border-[#2d2d2d] flex items-center gap-3 flex-wrap">
              {showTestInput ? (
                <form onSubmit={handleTestSms} className="flex items-center gap-2 flex-1">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="flex-1 max-w-[200px] px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#22c55e]"
                    autoFocus
                  />
                  <button type="submit" disabled={testingSms || !testPhone} className="px-3 py-1.5 rounded-lg bg-[#22c55e] text-white text-xs font-medium hover:bg-[#22c55e]/90 disabled:opacity-50 transition-colors">
                    {testingSms ? 'Sending...' : 'Send'}
                  </button>
                  <button type="button" onClick={() => setShowTestInput(false)} className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-xs hover:text-white transition-colors">
                    Cancel
                  </button>
                </form>
              ) : (
                <button onClick={() => setShowTestInput(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 text-xs hover:bg-[#22c55e]/20 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Test SMS
                </button>
              )}
              <button onClick={handleTwilioDisconnect} className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-xs hover:text-red-400 transition-colors ml-auto">
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleTwilioConnect} className="px-6 py-5 space-y-4">
            {twilioError && (
              <div className="px-3 py-2 rounded-lg bg-red-900/20 border border-red-900/40 text-red-400 text-sm">{twilioError}</div>
            )}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1.5">Account SID</label>
                <input
                  required
                  value={twilioForm.account_sid}
                  onChange={(e) => setTwilioForm((f) => ({ ...f, account_sid: e.target.value }))}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#e11d48] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1.5">Auth Token</label>
                <input
                  required
                  type="password"
                  value={twilioForm.auth_token}
                  onChange={(e) => setTwilioForm((f) => ({ ...f, auth_token: e.target.value }))}
                  placeholder="Your Twilio auth token"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#e11d48] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1.5">Twilio Phone Number</label>
                <input
                  required
                  value={twilioForm.phone_number}
                  onChange={(e) => setTwilioForm((f) => ({ ...f, phone_number: e.target.value }))}
                  placeholder="+15550001234"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#e11d48] text-sm font-mono"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-[#b3b3b3]/60">
                Find these in your{' '}
                <span className="text-[#b3b3b3]">Twilio Console → Account Info</span>
              </p>
              <button
                type="submit"
                disabled={twilioSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#e11d48] text-white rounded-lg text-sm font-medium hover:bg-[#e11d48]/90 disabled:opacity-50 transition-colors"
              >
                {twilioSaving ? 'Connecting...' : 'Connect Twilio'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bland.ai section */}
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#2d2d2d] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-9h2v5h-2V11zm0-4h2v2h-2V7z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">Bland.ai (AI Calling)</div>
            <div className="text-xs text-[#b3b3b3]">Connect your own Bland.ai account for AI-powered outbound calls.</div>
          </div>
          {blandStatus?.connected && (
            <span className="text-xs text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded flex-shrink-0">Connected</span>
          )}
        </div>

        {blandLoading ? (
          <div className="px-6 py-4 text-[#b3b3b3] text-sm">Loading...</div>
        ) : blandStatus?.connected ? (
          <div>
            <div className="px-6 py-4 space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#b3b3b3] w-24 flex-shrink-0">API Key</span>
                <span className="text-white font-mono text-xs">{blandStatus.api_key_masked}</span>
              </div>
              {blandStatus.agent_config?.name && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[#b3b3b3] w-24 flex-shrink-0">Agent Name</span>
                  <span className="text-white">{blandStatus.agent_config.name}</span>
                </div>
              )}
              {blandStatus.agent_config?.brokerage && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[#b3b3b3] w-24 flex-shrink-0">Brokerage</span>
                  <span className="text-white">{blandStatus.agent_config.brokerage}</span>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#b3b3b3] w-24 flex-shrink-0">Disclosure</span>
                <span className="text-white">{blandStatus.agent_config?.disclose_if_asked !== false ? 'Disclose if asked' : 'Redirect if asked'}</span>
              </div>
            </div>
            <div className="px-6 py-4 bg-[#0a0a0a] border-t border-[#2d2d2d] flex justify-end">
              <button
                onClick={async () => {
                  if (!confirm('Disconnect Bland.ai? AI calling will stop working.')) return
                  await fetch('/api/integrations/bland', { method: 'DELETE' })
                  setBlandStatus({ connected: false })
                  setBanner({ type: 'success', msg: 'Bland.ai disconnected.' })
                }}
                className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-xs hover:text-red-400 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBlandConnect} className="px-6 py-5 space-y-4">
            {blandError && (
              <div className="px-3 py-2 rounded-lg bg-red-900/20 border border-red-900/40 text-red-400 text-sm">{blandError}</div>
            )}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1.5">Bland.ai API Key</label>
                <input
                  required
                  type="password"
                  value={blandForm.api_key}
                  onChange={(e) => setBlandForm(f => ({ ...f, api_key: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#7c3aed] text-sm font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1.5">AI Agent Name</label>
                  <input
                    value={blandForm.name}
                    onChange={(e) => setBlandForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Emma"
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#7c3aed] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1.5">Callback Phone</label>
                  <input
                    value={blandForm.callback_phone}
                    onChange={(e) => setBlandForm(f => ({ ...f, callback_phone: e.target.value }))}
                    placeholder="+17025551234"
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#7c3aed] text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1.5">Brokerage / Company Name</label>
                <input
                  value={blandForm.brokerage}
                  onChange={(e) => setBlandForm(f => ({ ...f, brokerage: e.target.value }))}
                  placeholder="Your Real Estate Team"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#7c3aed] text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bland_disclose"
                  checked={blandForm.disclose_if_asked}
                  onChange={(e) => setBlandForm(f => ({ ...f, disclose_if_asked: e.target.checked }))}
                  className="w-4 h-4 rounded border-[#2d2d2d] bg-[#0a0a0a] accent-[#7c3aed]"
                />
                <label htmlFor="bland_disclose" className="text-sm text-[#b3b3b3]">Disclose if asked whether this is AI</label>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-[#b3b3b3]/60">
                Find your API key at{' '}
                <span className="text-[#b3b3b3]">app.bland.ai → API Keys</span>
              </p>
              <button
                type="submit"
                disabled={blandSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#7c3aed]/90 disabled:opacity-50 transition-colors"
              >
                {blandSaving ? 'Connecting...' : 'Connect Bland.ai'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Zapier */}
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FF4A00]/10 flex items-center justify-center">
              <span className="text-[#FF4A00] font-bold text-sm">Z</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Zapier</h3>
              <p className="text-xs text-[#666]">Connect ZiggyHQ to 5,000+ apps</p>
            </div>
          </div>
          <a
            href="https://zapier.com/developer"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#FF4A00] text-white rounded-lg text-xs font-medium hover:bg-[#FF4A00]/90 transition-colors"
          >
            Connect Zapier →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs font-medium text-[#b3b3b3] mb-2">Triggers (ZiggyHQ → Zapier)</p>
            <ul className="space-y-1">
              {['lead.created', 'lead.updated', 'lead.stage_changed', 'call.completed', 'sequence.enrolled'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-xs text-[#666]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4A00] flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-[#b3b3b3] mb-2">Actions (Zapier → ZiggyHQ)</p>
            <ul className="space-y-1">
              {['Create Lead', 'Update Lead Stage'].map((a) => (
                <li key={a} className="flex items-center gap-2 text-xs text-[#666]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] flex-shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-xs text-[#555]">
          Copy your workspace API key from{' '}
          <a href="/app/settings/api" className="text-[#0ea5e9] hover:underline">Settings → API</a>{' '}
          to authenticate Zapier actions.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">How Email Sync Works</h3>
        <ul className="space-y-2">
          {[
            'Connect your Gmail account via secure OAuth',
            'ZiggyHQ scans your inbox for emails matching lead email addresses',
            'Matching emails are logged as activities on the lead profile',
            'New emails auto-sync every 15 minutes in the background',
            'Sent emails are tagged "email_sent", received as "email_received"',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#b3b3b3]">
              <span className="text-[#0ea5e9] flex-shrink-0 mt-0.5">→</span>
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
