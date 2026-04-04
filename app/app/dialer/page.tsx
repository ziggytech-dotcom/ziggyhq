'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface Lead {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  stage: string | null
  source: string | null
}

interface SmartList {
  id: string
  name: string
}

type Disposition =
  | 'answered_interested'
  | 'answered_not_interested'
  | 'voicemail'
  | 'no_answer'
  | 'wrong_number'
  | 'callback_requested'

const DISPOSITION_LABELS: Record<Disposition, { label: string; color: string }> = {
  answered_interested: { label: 'Answered -- Interested', color: '#22c55e' },
  answered_not_interested: { label: 'Answered -- Not Interested', color: '#f59e0b' },
  voicemail: { label: 'Voicemail', color: '#8b5cf6' },
  no_answer: { label: 'No Answer', color: '#b3b3b3' },
  wrong_number: { label: 'Wrong Number', color: '#e11d48' },
  callback_requested: { label: 'Callback Requested', color: '#0ea5e9' },
}

function formatPhone(p: string | null) {
  if (!p) return '--'
  const d = p.replace(/\D/g, '').slice(-10)
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  return p
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

type CallStatus = 'idle' | 'dialing' | 'connected' | 'ended'

export default function DialerPage() {
  const [queue, setQueue] = useState<Lead[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [smartLists, setSmartLists] = useState<SmartList[]>([])
  const [selectedList, setSelectedList] = useState('')
  const [loadingQueue, setLoadingQueue] = useState(false)

  const [sessionActive, setSessionActive] = useState(false)
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [callSid, setCallSid] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [onHold, setOnHold] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [showDisposition, setShowDisposition] = useState(false)
  const [disposition, setDisposition] = useState<Disposition | null>(null)
  const [callbackDate, setCallbackDate] = useState('')
  const [savingDisp, setSavingDisp] = useState(false)

  const [dialingSpeed, setDialingSpeed] = useState<'manual' | 'auto'>('manual')
  const [twilioConnected, setTwilioConnected] = useState<boolean | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const callStartRef = useRef<number>(0)

  const currentLead = queue[queueIndex] ?? null
  const nextLead = queue[queueIndex + 1] ?? null

  // Check Twilio status
  useEffect(() => {
    fetch('/api/integrations/twilio')
      .then(r => r.json())
      .then(d => setTwilioConnected(d.connected))
      .catch(() => setTwilioConnected(false))
  }, [])

  // Load smart lists
  useEffect(() => {
    fetch('/api/smart-lists')
      .then(r => r.ok ? r.json() : { lists: [] })
      .then(d => setSmartLists(d.lists ?? []))
  }, [])

  const loadQueue = useCallback(async (listId?: string) => {
    setLoadingQueue(true)
    const params = new URLSearchParams({ limit: '100' })
    if (listId) params.set('smart_list_id', listId)
    const res = await fetch(`/api/leads?${params}&has_phone=1`)
    if (res.ok) {
      const d = await res.json()
      setQueue((d.leads ?? []).filter((l: Lead) => l.phone))
      setQueueIndex(0)
    }
    setLoadingQueue(false)
  }, [])

  // Timer
  useEffect(() => {
    if (callStatus === 'connected') {
      callStartRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [callStatus])

  const startCall = async () => {
    if (!currentLead?.phone) return
    setError(null)
    setCallStatus('dialing')
    setNotes('')
    setCallDuration(0)
    try {
      const res = await fetch('/api/dialer/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: currentLead.id,
          phone: currentLead.phone,
          lead_name: currentLead.full_name,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? 'Failed to initiate call')
        setCallStatus('idle')
        return
      }
      setCallSid(d.call_sid)
      // Simulate answer after 3s (in real app, use Twilio status webhook to update)
      setTimeout(() => setCallStatus('connected'), 3000)
    } catch {
      setError('Network error starting call')
      setCallStatus('idle')
    }
  }

  const hangUp = () => {
    setCallStatus('ended')
    setShowDisposition(true)
  }

  const handleVoicemailDrop = async () => {
    if (!callSid || !currentLead) return
    const res = await fetch('/api/dialer/voicemail-drop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call_sid: callSid, lead_id: currentLead.id }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Voicemail drop failed')
    } else {
      setCallStatus('ended')
      setShowDisposition(true)
      setDisposition('voicemail')
    }
  }

  const saveDisposition = async () => {
    if (!disposition || !currentLead) return
    setSavingDisp(true)
    await fetch('/api/dialer/disposition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call_sid: callSid,
        lead_id: currentLead.id,
        lead_name: currentLead.full_name,
        disposition,
        notes,
        duration: callDuration,
        callback_date: disposition === 'callback_requested' ? callbackDate || null : null,
      }),
    })
    setSavingDisp(false)
    setShowDisposition(false)
    setDisposition(null)
    setCallbackDate('')
    setCallSid(null)
    setCallStatus('idle')
    setNotes('')

    if (dialingSpeed === 'auto' && queueIndex < queue.length - 1) {
      setQueueIndex(i => i + 1)
      setTimeout(() => startCall(), 500)
    }
  }

  const skipLead = () => {
    if (queueIndex < queue.length - 1) {
      setQueueIndex(i => i + 1)
    }
  }

  const nextCall = () => {
    if (queueIndex < queue.length - 1) {
      setQueueIndex(i => i + 1)
      setCallStatus('idle')
    }
  }

  const endSession = () => {
    setSessionActive(false)
    setCallStatus('idle')
    setShowDisposition(false)
    setCallSid(null)
    setQueueIndex(0)
  }

  if (twilioConnected === false) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          POWER DIALER
        </h1>
        <div className="mt-8 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#e11d48]/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#e11d48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Twilio Not Connected</h2>
          <p className="text-[#b3b3b3] text-sm mb-6">Connect your Twilio account to use the Power Dialer.</p>
          <Link
            href="/app/settings/integrations"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e11d48] text-white rounded-lg text-sm font-medium hover:bg-[#e11d48]/90 transition-colors"
          >
            Connect Twilio →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          POWER DIALER
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Automated outbound calling session</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[#e11d48]/10 border border-[#e11d48]/20 text-[#e11d48] text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-[#e11d48]/60 hover:text-[#e11d48]">✕</button>
        </div>
      )}

      {!sessionActive ? (
        /* ── Session Setup ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Queue setup */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Build Call Queue</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1.5">Load from Smart List</label>
                <select
                  value={selectedList}
                  onChange={(e) => { setSelectedList(e.target.value); if (e.target.value) loadQueue(e.target.value) }}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
                >
                  <option value="">All leads with phone</option>
                  {smartLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <button
                onClick={() => loadQueue(selectedList || undefined)}
                disabled={loadingQueue}
                className="w-full py-2.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors disabled:opacity-50"
              >
                {loadingQueue ? 'Loading...' : 'Refresh Queue'}
              </button>
              {queue.length > 0 && (
                <div className="text-xs text-[#b3b3b3] bg-[#0a0a0a] rounded-lg px-3 py-2">
                  <span className="text-white font-medium">{queue.length}</span> leads in queue with phone numbers
                </div>
              )}
            </div>
          </div>

          {/* Dialer settings */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Dialer Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-2">Dialing Speed</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['manual', 'auto'] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setDialingSpeed(speed)}
                      className={`py-2 rounded-lg text-xs font-medium capitalize transition-colors border ${
                        dialingSpeed === speed
                          ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]/40 text-[#0ea5e9]'
                          : 'border-[#2d2d2d] text-[#b3b3b3] hover:text-white'
                      }`}
                    >
                      {speed === 'manual' ? '🖱 Manual' : '⚡ Auto'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#b3b3b3]/60 mt-2">
                  {dialingSpeed === 'auto'
                    ? 'Auto-dials next lead immediately after disposition'
                    : 'You choose when to dial each lead'}
                </p>
              </div>
              <Link
                href="/app/settings/integrations"
                className="flex items-center gap-2 text-xs text-[#b3b3b3] hover:text-[#0ea5e9] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Upload voicemail drop recording in Integrations
              </Link>
            </div>
          </div>

          {/* Queue preview */}
          {queue.length > 0 && (
            <div className="sm:col-span-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Call Queue ({queue.length})</h2>
                <button
                  onClick={() => setSessionActive(true)}
                  disabled={queue.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-white rounded-lg text-sm font-medium hover:bg-[#22c55e]/90 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Start Session
                </button>
              </div>
              <div className="divide-y divide-[#2d2d2d] max-h-64 overflow-y-auto">
                {queue.slice(0, 20).map((lead, idx) => (
                  <div key={lead.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-xs text-[#b3b3b3]/40 w-5 flex-shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{lead.full_name}</div>
                      <div className="text-xs text-[#b3b3b3]">{formatPhone(lead.phone)}</div>
                    </div>
                    {lead.stage && <span className="text-xs text-[#b3b3b3] bg-[#2d2d2d] px-2 py-0.5 rounded hidden sm:block">{lead.stage}</span>}
                  </div>
                ))}
                {queue.length > 20 && (
                  <div className="px-5 py-3 text-xs text-[#b3b3b3]">+ {queue.length - 20} more leads</div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Active Session ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Live Call Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current lead */}
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-[#b3b3b3] uppercase tracking-wider mb-1">
                    Lead {queueIndex + 1} of {queue.length}
                  </div>
                  <h2 className="text-xl font-bold text-white">{currentLead?.full_name ?? '--'}</h2>
                  <div className="text-[#0ea5e9] text-lg font-mono mt-1">{formatPhone(currentLead?.phone ?? null)}</div>
                  {currentLead?.stage && <div className="text-xs text-[#b3b3b3] mt-1">{currentLead.stage} &middot; {currentLead.source}</div>}
                </div>
                <Link
                  href={currentLead ? `/app/leads/${currentLead.id}` : '#'}
                  target="_blank"
                  className="text-xs text-[#0ea5e9] hover:underline flex-shrink-0"
                >
                  View profile →
                </Link>
              </div>

              {/* Call status indicator */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  callStatus === 'connected' ? 'bg-[#22c55e] animate-pulse' :
                  callStatus === 'dialing' ? 'bg-[#f59e0b] animate-pulse' :
                  callStatus === 'ended' ? 'bg-[#e11d48]' :
                  'bg-[#2d2d2d]'
                }`} />
                <span className="text-sm text-[#b3b3b3] capitalize">
                  {callStatus === 'idle' ? 'Ready to dial' :
                   callStatus === 'dialing' ? 'Dialing...' :
                   callStatus === 'connected' ? `Connected \u00B7 ${formatDuration(callDuration)}` :
                   'Call ended'}
                </span>
              </div>

              {/* Call controls */}
              <div className="flex flex-col gap-3">
                {callStatus === 'idle' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={startCall}
                      disabled={!currentLead?.phone}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-[#22c55e] text-white rounded-xl sm:rounded-lg text-base sm:text-sm font-semibold sm:font-medium hover:bg-[#22c55e]/90 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      Dial {currentLead?.full_name?.split(' ')[0]}
                    </button>
                    {queueIndex < queue.length - 1 && (
                      <button onClick={skipLead} className="px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-sm hover:text-white transition-colors">
                        Skip →
                      </button>
                    )}
                  </div>
                )}

                {(callStatus === 'dialing' || callStatus === 'connected') && (
                  <>
                    {/* Mobile: prominent hang up first */}
                    <button
                      onClick={hangUp}
                      className="w-full sm:hidden flex items-center justify-center gap-2 py-4 rounded-xl bg-[#e11d48] text-white text-base font-semibold active:scale-95 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                      </svg>
                      Hang Up
                    </button>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => setMuted(m => !m)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          muted ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30' : 'bg-[#2d2d2d] text-[#b3b3b3] hover:text-white'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {muted
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.364a9 9 0 000-12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></>
                          }
                        </svg>
                        {muted ? 'Unmute' : 'Mute'}
                      </button>

                      <button
                        onClick={() => setOnHold(h => !h)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          onHold ? 'bg-[#0ea5e9]/20 text-[#0ea5e9] border border-[#0ea5e9]/30' : 'bg-[#2d2d2d] text-[#b3b3b3] hover:text-white'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {onHold ? 'Resume' : 'Hold'}
                      </button>

                      {callStatus === 'connected' && (
                        <button
                          onClick={handleVoicemailDrop}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30 text-sm font-medium hover:bg-[#8b5cf6]/30 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          Voicemail Drop
                        </button>
                      )}

                      {/* Desktop hang up */}
                      <button
                        onClick={hangUp}
                        className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#e11d48] text-white text-sm font-medium hover:bg-[#e11d48]/90 transition-colors ml-auto"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                        </svg>
                        Hang Up
                      </button>
                    </div>
                  </>
                )}

                {callStatus === 'ended' && !showDisposition && (
                  <button
                    onClick={nextCall}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-[#0ea5e9] text-white rounded-xl sm:rounded-lg text-base sm:text-sm font-semibold sm:font-medium hover:bg-[#0ea5e9]/90 transition-colors"
                  >
                    Next Call →
                  </button>
                )}
              </div>
            </div>

            {/* Notes */}
            {(callStatus === 'connected' || callStatus === 'ended') && (
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
                <label className="block text-xs text-[#b3b3b3] mb-2">Call Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes during the call..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/40 focus:outline-none focus:border-[#0ea5e9] text-sm resize-none"
                />
              </div>
            )}

            {/* Disposition Modal */}
            {showDisposition && (
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Call Disposition</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {(Object.entries(DISPOSITION_LABELS) as [Disposition, { label: string; color: string }][]).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => setDisposition(key)}
                      className="px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors border"
                      style={{
                        backgroundColor: disposition === key ? `${color}20` : 'transparent',
                        borderColor: disposition === key ? `${color}60` : '#2d2d2d',
                        color: disposition === key ? color : '#b3b3b3',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {disposition === 'callback_requested' && (
                  <div className="mb-4">
                    <label className="block text-xs text-[#b3b3b3] mb-1.5">Callback Date & Time</label>
                    <input
                      type="datetime-local"
                      value={callbackDate}
                      onChange={(e) => setCallbackDate(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
                    />
                    <div className="text-xs text-[#b3b3b3]/60 mt-1">A follow-up task will be created automatically.</div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={saveDisposition}
                    disabled={!disposition || savingDisp}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors"
                  >
                    {savingDisp ? 'Saving...' : 'Save & Next →'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Queue Sidebar */}
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2d2d2d]">
                <div className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider">Up Next</div>
              </div>
              {nextLead ? (
                <div className="p-4">
                  <div className="text-sm font-medium text-white">{nextLead.full_name}</div>
                  <div className="text-xs text-[#b3b3b3] mt-0.5">{formatPhone(nextLead.phone)}</div>
                  {nextLead.stage && <div className="text-xs text-[#b3b3b3]/60 mt-0.5">{nextLead.stage}</div>}
                </div>
              ) : (
                <div className="p-4 text-xs text-[#b3b3b3]/60">Last lead in queue</div>
              )}
            </div>

            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4">
              <div className="text-xs text-[#b3b3b3] mb-3">
                Progress: <span className="text-white font-medium">{queueIndex + 1}</span> / {queue.length}
              </div>
              <div className="h-1.5 bg-[#2d2d2d] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0ea5e9] transition-all"
                  style={{ width: `${((queueIndex + 1) / queue.length) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={endSession}
              className="w-full py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] text-sm hover:text-[#e11d48] hover:border-[#e11d48]/30 transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
