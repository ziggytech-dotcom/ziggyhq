'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Lead {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  stage: string | null
  lead_score: number
  next_followup_at: string | null
  source: string | null
  crm_users?: { full_name: string; email: string } | null
}

function formatFollowupDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 86400000)
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (dDate < today) {
    const daysAgo = Math.round((today.getTime() - dDate.getTime()) / 86400000)
    return { label: daysAgo === 1 ? '1 day overdue' : `${daysAgo} days overdue`, color: '#ff006e', group: 'overdue' }
  }
  if (dDate.getTime() === today.getTime()) return { label: 'Today', color: '#f59e0b', group: 'today' }
  if (dDate.getTime() === tomorrow.getTime()) return { label: 'Tomorrow', color: '#22c55e', group: 'soon' }
  const daysOut = Math.round((dDate.getTime() - today.getTime()) / 86400000)
  if (daysOut <= 7) return { label: `In ${daysOut} days`, color: '#22c55e', group: 'soon' }
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: '#b3b3b3', group: 'later' }
}

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/leads?has_followup=1&sort=next_followup_at&dir=asc&limit=200')
    if (res.ok) {
      const data = await res.json()
      setLeads(data.leads ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const markContacted = async (lead: Lead) => {
    setActionLoading(lead.id)
    await Promise.all([
      fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'call', content: 'Marked contacted from follow-up queue' }),
      }),
      fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_contacted_at: new Date().toISOString(), next_followup_at: null }),
      }),
    ])
    setLeads((prev) => prev.filter((l) => l.id !== lead.id))
    setActionLoading(null)
  }

  const saveReschedule = async (leadId: string) => {
    if (!rescheduleDate) return
    setActionLoading(leadId)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_followup_at: new Date(rescheduleDate).toISOString() }),
    })
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, next_followup_at: new Date(rescheduleDate).toISOString() } : l))
    setRescheduleId(null)
    setRescheduleDate('')
    setActionLoading(null)
  }

  const groups = {
    overdue: leads.filter((l) => l.next_followup_at && formatFollowupDate(l.next_followup_at).group === 'overdue'),
    today: leads.filter((l) => l.next_followup_at && formatFollowupDate(l.next_followup_at).group === 'today'),
    soon: leads.filter((l) => l.next_followup_at && formatFollowupDate(l.next_followup_at).group === 'soon'),
    later: leads.filter((l) => l.next_followup_at && formatFollowupDate(l.next_followup_at).group === 'later'),
  }

  const groupConfig = [
    { key: 'overdue', label: 'Overdue', color: '#ff006e', emptyMsg: null },
    { key: 'today', label: 'Today', color: '#f59e0b', emptyMsg: null },
    { key: 'soon', label: 'This Week', color: '#22c55e', emptyMsg: null },
    { key: 'later', label: 'Upcoming', color: '#b3b3b3', emptyMsg: null },
  ] as const

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          FOLLOW-UP QUEUE
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">
          {loading ? 'Loading...' : `${leads.length} lead${leads.length !== 1 ? 's' : ''} need follow-up`}
          {!loading && groups.overdue.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-[#ff006e]/20 text-[#ff006e] text-xs font-medium">
              {groups.overdue.length} overdue
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm">Loading follow-ups...</div>
      ) : leads.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-12 text-center max-w-md">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-white font-semibold text-lg mb-1">You&apos;re all caught up!</div>
          <div className="text-[#b3b3b3] text-sm">No follow-ups scheduled. Go set some on your leads.</div>
          <Link href="/app/leads" className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#ff006e] text-white text-sm font-medium hover:bg-[#ff006e]/90 transition-colors">
            View Leads
          </Link>
        </div>
      ) : (
        <div className="space-y-8 max-w-3xl">
          {groupConfig.map(({ key, label, color }) => {
            const group = groups[key]
            if (group.length === 0) return null
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider">{label}</span>
                  <span className="text-xs text-[#b3b3b3]/60">({group.length})</span>
                </div>
                <div className="space-y-2">
                  {group.map((lead) => {
                    const dueInfo = formatFollowupDate(lead.next_followup_at!)
                    const isRescheduling = rescheduleId === lead.id
                    return (
                      <div key={lead.id} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4 flex items-center gap-4">
                        {/* Score bar */}
                        <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: lead.lead_score >= 70 ? '#22c55e' : lead.lead_score >= 40 ? '#f59e0b' : '#ff006e' }} />

                        {/* Lead info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Link href={`/app/leads/${lead.id}`} className="text-white font-semibold text-sm hover:text-[#ff006e] transition-colors">
                              {lead.full_name}
                            </Link>
                            {lead.stage && (
                              <span className="px-1.5 py-0.5 rounded bg-[#2d2d2d] text-[#b3b3b3] text-[10px]">{lead.stage}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#b3b3b3]">
                            {lead.phone && <span>📞 {lead.phone}</span>}
                            <span style={{ color: dueInfo.color }} className="font-medium">⏰ {dueInfo.label}</span>
                          </div>
                          {isRescheduling && (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="date"
                                value={rescheduleDate}
                                onChange={(e) => setRescheduleDate(e.target.value)}
                                className="px-2 py-1 rounded bg-[#0a0a0a] border border-[#ff006e] text-white text-xs focus:outline-none"
                              />
                              <button onClick={() => saveReschedule(lead.id)} disabled={!rescheduleDate || actionLoading === lead.id} className="px-3 py-1 rounded bg-[#ff006e] text-white text-xs hover:bg-[#ff006e]/90 disabled:opacity-50 transition-colors">
                                Save
                              </button>
                              <button onClick={() => setRescheduleId(null)} className="px-3 py-1 rounded bg-[#2d2d2d] text-[#b3b3b3] text-xs hover:text-white transition-colors">
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 text-xs hover:bg-[#3b82f6]/30 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              Call
                            </a>
                          )}
                          <button
                            onClick={() => markContacted(lead)}
                            disabled={actionLoading === lead.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 text-xs hover:bg-[#22c55e]/30 disabled:opacity-50 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Contacted
                          </button>
                          <button
                            onClick={() => { setRescheduleId(isRescheduling ? null : lead.id); setRescheduleDate('') }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-xs hover:text-white hover:bg-[#3d3d3d] transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Reschedule
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
