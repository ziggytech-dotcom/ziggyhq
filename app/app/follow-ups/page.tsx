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

interface Task {
  id: string
  title: string
  description: string | null
  due_at: string | null
  completed_at: string | null
  type: string
  auto_created: boolean
  lead_id: string | null
  assigned_to: string | null
  crm_leads?: { id: string; full_name: string } | null
  crm_users?: { id: string; full_name: string | null; email: string } | null
}

interface TeamMember {
  id: string
  full_name: string | null
  email: string
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((dDate.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#0ea5e9' }
  if (diff === 0) return { label: 'Today', color: '#f59e0b' }
  if (diff === 1) return { label: 'Tomorrow', color: '#22c55e' }
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: '#b3b3b3' }
}

function formatFollowupDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 86400000)
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (dDate < today) {
    const daysAgo = Math.round((today.getTime() - dDate.getTime()) / 86400000)
    return { label: daysAgo === 1 ? '1 day overdue' : `${daysAgo} days overdue`, color: '#0ea5e9', group: 'overdue' }
  }
  if (dDate.getTime() === today.getTime()) return { label: 'Today', color: '#f59e0b', group: 'today' }
  if (dDate.getTime() === tomorrow.getTime()) return { label: 'Tomorrow', color: '#22c55e', group: 'soon' }
  const daysOut = Math.round((dDate.getTime() - today.getTime()) / 86400000)
  if (daysOut <= 7) return { label: `In ${daysOut} days`, color: '#22c55e', group: 'soon' }
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: '#b3b3b3', group: 'later' }
}

function NewTaskModal({
  team,
  onClose,
  onCreated,
}: {
  team: TeamMember[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({ title: '', description: '', due_at: '', assigned_to: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description || null,
        due_at: form.due_at || null,
        assigned_to: form.assigned_to || null,
        type: 'follow_up',
      }),
    })
    if (res.ok) {
      onCreated()
      onClose()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to create task')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">New Task</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Call back about offer" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Due Date</label>
            <input type="date" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Assign To</label>
            <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
              <option value="">Unassigned</option>
              {team.map((m) => <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Notes</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm resize-none" />
          </div>
          {error && <div className="text-xs text-[#0ea5e9] bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 rounded px-3 py-2">{error}</div>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="flex-1 py-2.5 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'tasks'>('queue')
  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [leadsRes, tasksRes, teamRes] = await Promise.all([
      fetch('/api/leads?has_followup=1&sort=next_followup_at&dir=asc&limit=200'),
      fetch('/api/tasks?completed=0'),
      fetch('/api/team'),
    ])
    if (leadsRes.ok) { const d = await leadsRes.json(); setLeads(d.leads ?? []) }
    if (tasksRes.ok) { const d = await tasksRes.json(); setTasks(d.tasks ?? []) }
    if (teamRes.ok) { const t = await teamRes.json(); setTeam(t.members ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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

  const completeTask = async (taskId: string) => {
    setActionLoading(taskId)
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setActionLoading(null)
  }

  const groups = {
    overdue: leads.filter((l) => l.next_followup_at && formatFollowupDate(l.next_followup_at).group === 'overdue'),
    today: leads.filter((l) => l.next_followup_at && formatFollowupDate(l.next_followup_at).group === 'today'),
    soon: leads.filter((l) => l.next_followup_at && formatFollowupDate(l.next_followup_at).group === 'soon'),
    later: leads.filter((l) => l.next_followup_at && formatFollowupDate(l.next_followup_at).group === 'later'),
  }

  const groupConfig = [
    { key: 'overdue', label: 'Overdue', color: '#0ea5e9' },
    { key: 'today', label: 'Today', color: '#f59e0b' },
    { key: 'soon', label: 'This Week', color: '#22c55e' },
    { key: 'later', label: 'Upcoming', color: '#b3b3b3' },
  ] as const

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            FOLLOW-UPS
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">
            {loading ? 'Loading...' : `${leads.length} follow-up${leads.length !== 1 ? 's' : ''} · ${tasks.length} open task${tasks.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/settings/followup-rules" className="px-3 py-2 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-xs transition-colors">
            Auto-Reminders
          </Link>
          <button onClick={() => setShowNewTask(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Task
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#2d2d2d]">
        {[
          { key: 'queue', label: `Follow-up Queue (${leads.length})` },
          { key: 'tasks', label: `Tasks (${tasks.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key as 'queue' | 'tasks')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === key ? 'border-[#0ea5e9] text-white' : 'border-transparent text-[#b3b3b3] hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm">Loading...</div>
      ) : activeTab === 'queue' ? (
        leads.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-12 text-center max-w-md">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-white font-semibold text-lg mb-1">All caught up!</div>
            <div className="text-[#b3b3b3] text-sm">No follow-ups scheduled. Set them on leads.</div>
            <Link href="/app/leads" className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors">View Leads</Link>
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
                          <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: lead.lead_score >= 70 ? '#22c55e' : lead.lead_score >= 40 ? '#f59e0b' : '#0ea5e9' }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Link href={`/app/leads/${lead.id}`} className="text-white font-semibold text-sm hover:text-[#0ea5e9] transition-colors">{lead.full_name}</Link>
                              {lead.stage && <span className="px-1.5 py-0.5 rounded bg-[#2d2d2d] text-[#b3b3b3] text-[10px]">{lead.stage}</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[#b3b3b3]">
                              {lead.phone && <span>📞 {lead.phone}</span>}
                              <span style={{ color: dueInfo.color }} className="font-medium">⏰ {dueInfo.label}</span>
                            </div>
                            {isRescheduling && (
                              <div className="flex items-center gap-2 mt-2">
                                <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="px-2 py-1 rounded bg-[#0a0a0a] border border-[#0ea5e9] text-white text-xs focus:outline-none" />
                                <button onClick={() => saveReschedule(lead.id)} disabled={!rescheduleDate || actionLoading === lead.id} className="px-3 py-1 rounded bg-[#0ea5e9] text-white text-xs hover:bg-[#0ea5e9]/90 disabled:opacity-50">Save</button>
                                <button onClick={() => setRescheduleId(null)} className="px-3 py-1 rounded bg-[#2d2d2d] text-[#b3b3b3] text-xs hover:text-white">Cancel</button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 text-xs hover:bg-[#3b82f6]/30 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                Call
                              </a>
                            )}
                            <button onClick={() => markContacted(lead)} disabled={actionLoading === lead.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 text-xs hover:bg-[#22c55e]/30 disabled:opacity-50 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Contacted
                            </button>
                            <button onClick={() => { setRescheduleId(isRescheduling ? null : lead.id); setRescheduleDate('') }} className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-xs hover:text-white hover:bg-[#3d3d3d] transition-colors">
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
        )
      ) : (
        // Tasks tab
        <div className="max-w-3xl">
          {tasks.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-12 text-center">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-white font-semibold mb-1">No open tasks</div>
              <div className="text-[#b3b3b3] text-sm mb-4">Create tasks manually or set up auto-reminders.</div>
              <button onClick={() => setShowNewTask(true)} className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium">Create Task</button>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const dueInfo = typeof formatDate(task.due_at) === 'string' ? { label: formatDate(task.due_at) as string, color: '#b3b3b3' } : formatDate(task.due_at) as { label: string; color: string }
                return (
                  <div key={task.id} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4 flex items-center gap-4">
                    <button onClick={() => completeTask(task.id)} disabled={actionLoading === task.id} className="w-5 h-5 rounded border border-[#2d2d2d] bg-[#0a0a0a] flex-shrink-0 hover:border-[#22c55e] hover:bg-[#22c55e]/10 transition-colors" title="Mark complete" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-white">{task.title}</span>
                        {task.auto_created && <span className="text-xs px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">Auto</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#b3b3b3]">
                        {task.crm_leads && (
                          <Link href={`/app/leads/${task.crm_leads.id}`} className="hover:text-[#0ea5e9] transition-colors">
                            {task.crm_leads.full_name}
                          </Link>
                        )}
                        {task.due_at && <span style={{ color: dueInfo.color }}>Due: {dueInfo.label}</span>}
                        {task.crm_users && <span>{task.crm_users.full_name ?? task.crm_users.email}</span>}
                      </div>
                    </div>
                    <button onClick={() => completeTask(task.id)} disabled={actionLoading === task.id} className="px-3 py-1.5 rounded-lg bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 text-xs hover:bg-[#22c55e]/20 disabled:opacity-50 transition-colors">
                      Done
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showNewTask && <NewTaskModal team={team} onClose={() => setShowNewTask(false)} onCreated={fetchData} />}
    </div>
  )
}
