'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string | null
  type: string
  priority: 'high' | 'medium' | 'low' | null
  due_at: string | null
  completed_at: string | null
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

interface LeadOption {
  id: string
  full_name: string
}

// ── helpers ──────────────────────────────────────────────────────────────────

function isOverdue(task: Task): boolean {
  if (task.completed_at) return false
  if (!task.due_at) return false
  return new Date(task.due_at) < new Date()
}

function formatDueDate(dateStr: string | null): { label: string; color: string } {
  if (!dateStr) return { label: '--', color: '#b3b3b3' }
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((dDate.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#e11d48' }
  if (diff === 0) return { label: 'Today', color: '#f59e0b' }
  if (diff === 1) return { label: 'Tomorrow', color: '#22c55e' }
  return {
    label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }),
    color: '#b3b3b3',
  }
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   bg: 'bg-[#e11d48]/10',  text: 'text-[#e11d48]',  border: 'border-[#e11d48]/30' },
  medium: { label: 'Medium', bg: 'bg-[#f59e0b]/10',  text: 'text-[#f59e0b]',  border: 'border-[#f59e0b]/30' },
  low:    { label: 'Low',    bg: 'bg-[#0ea5e9]/10',  text: 'text-[#0ea5e9]',  border: 'border-[#0ea5e9]/30' },
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  if (!priority) return <span className="text-[#b3b3b3] text-xs">&mdash;</span>
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ task }: { task: Task }) {
  if (task.completed_at) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
        Done
      </span>
    )
  }
  if (task.due_at && new Date(task.due_at) < new Date()) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#e11d48]/10 text-[#e11d48] border border-[#e11d48]/20">
        Overdue
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20">
      Open
    </span>
  )
}

// ── Create Task Modal ─────────────────────────────────────────────────────────

function NewTaskModal({
  team,
  onClose,
  onCreated,
}: {
  team: TeamMember[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_at: '',
    priority: '' as '' | 'high' | 'medium' | 'low',
    type: 'follow_up',
    lead_id: '',
  })
  const [leadSearch, setLeadSearch] = useState('')
  const [leadResults, setLeadResults] = useState<LeadOption[]>([])
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null)
  const [leadSearchFocused, setLeadSearchFocused] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!leadSearch.trim()) {
      setLeadResults([])
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/leads?search=${encodeURIComponent(leadSearch.trim())}`)
      if (res.ok) {
        const d = await res.json()
        setLeadResults((d.leads ?? []).slice(0, 8))
      }
    }, 250)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [leadSearch])

  const selectLead = (lead: LeadOption) => {
    setSelectedLead(lead)
    setForm((f) => ({ ...f, lead_id: lead.id }))
    setLeadSearch(lead.full_name)
    setLeadResults([])
  }

  const clearLead = () => {
    setSelectedLead(null)
    setForm((f) => ({ ...f, lead_id: '' }))
    setLeadSearch('')
    setLeadResults([])
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || null,
        assigned_to: form.assigned_to || null,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
        priority: form.priority || null,
        type: form.type,
        lead_id: form.lead_id || null,
      }),
    })
    if (res.ok) {
      onCreated()
      onClose()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Failed to create task')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">New Task</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Call back about the listing"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm resize-none"
            />
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Assign To</label>
            <select
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
            >
              <option value="">Unassigned</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={form.due_at}
              onChange={(e) => setForm({ ...form, due_at: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
            />
          </div>

          {/* Lead Search */}
          <div className="relative">
            <label className="block text-xs text-[#b3b3b3] mb-1">Link to Lead</label>
            <div className="relative">
              <input
                value={leadSearch}
                onChange={(e) => {
                  setLeadSearch(e.target.value)
                  if (selectedLead && e.target.value !== selectedLead.full_name) clearLead()
                }}
                onFocus={() => setLeadSearchFocused(true)}
                onBlur={() => setTimeout(() => setLeadSearchFocused(false), 150)}
                placeholder="Search leads..."
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm"
              />
              {selectedLead && (
                <button
                  onClick={clearLead}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {leadSearchFocused && leadResults.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg shadow-xl overflow-hidden">
                {leadResults.map((lead) => (
                  <button
                    key={lead.id}
                    onMouseDown={() => selectLead(lead)}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#2d2d2d] transition-colors"
                  >
                    {lead.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
            >
              <option value="">None</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {error && (
            <div className="text-xs text-[#e11d48] bg-[#e11d48]/10 border border-[#e11d48]/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="flex-1 py-2.5 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)

  // Filters
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'done'>('all')
  const [filterPriority, setFilterPriority] = useState<'' | 'high' | 'medium' | 'low'>('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    // fetch all tasks (we filter client-side for richer UX)
    const [tasksRes, teamRes] = await Promise.all([
      fetch(`/api/tasks`),
      fetch('/api/team'),
    ])
    if (tasksRes.ok) {
      const d = await tasksRes.json()
      setTasks(d.tasks ?? [])
    }
    if (teamRes.ok) {
      const d = await teamRes.json()
      setTeam(d.members ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const markComplete = async (taskId: string) => {
    setCompletingId(taskId)
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    await fetchData()
    setCompletingId(null)
  }

  // ── Client-side filtering ───────────────────────────────────────────────────
  const filtered = tasks.filter((task) => {
    if (filterAssignee && task.assigned_to !== filterAssignee) return false
    if (filterStatus === 'open' && task.completed_at) return false
    if (filterStatus === 'done' && !task.completed_at) return false
    if (filterPriority && task.priority !== filterPriority) return false
    return true
  })

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            TASKS
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">
            {loading ? 'Loading...' : `${filtered.length} task${filtered.length !== 1 ? 's' : ''}${filtered.length !== tasks.length ? ` (filtered from ${tasks.length})` : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowNewTask(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl">
        {/* Assignee */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#b3b3b3] whitespace-nowrap">Assignee</label>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="">All reps</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#b3b3b3]">Status</label>
          <div className="flex rounded-lg overflow-hidden border border-[#2d2d2d]">
            {(['all', 'open', 'done'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${
                  filterStatus === s
                    ? 'bg-[#0ea5e9] text-white'
                    : 'bg-[#0a0a0a] text-[#b3b3b3] hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#b3b3b3]">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
            className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Clear filters */}
        {(filterAssignee || filterStatus !== 'all' || filterPriority) && (
          <button
            onClick={() => { setFilterAssignee(''); setFilterStatus('all'); setFilterPriority('') }}
            className="text-xs text-[#b3b3b3] hover:text-white transition-colors ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-[#b3b3b3] text-sm py-12 text-center">Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-14 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-[#2d2d2d] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="text-white font-semibold text-base mb-1">
            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
          </div>
          <div className="text-[#b3b3b3] text-sm mb-5">
            {tasks.length === 0
              ? 'Create your first task to stay on top of your pipeline.'
              : 'Try adjusting the filters above.'}
          </div>
          {tasks.length === 0 && (
            <button
              onClick={() => setShowNewTask(true)}
              className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors"
            >
              Create Task
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-2">
            {filtered.map((task) => {
              const overdue = isOverdue(task)
              const due = formatDueDate(task.due_at)
              const isCompleting = completingId === task.id
              return (
                <div
                  key={task.id}
                  className={`bg-[#1a1a1a] border rounded-xl p-4 ${
                    overdue ? 'border-[#e11d48]/40 bg-[#e11d48]/[0.03]' : 'border-[#2d2d2d]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => !task.completed_at && markComplete(task.id)}
                      disabled={isCompleting || !!task.completed_at}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                        task.completed_at
                          ? 'bg-[#22c55e] border-[#22c55e]'
                          : isCompleting
                          ? 'border-[#22c55e] bg-[#22c55e]/20 animate-pulse'
                          : 'border-[#2d2d2d] bg-[#0a0a0a]'
                      }`}
                    >
                      {(task.completed_at || isCompleting) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${task.completed_at ? 'text-[#b3b3b3] line-through' : 'text-white'}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-[#b3b3b3] mt-0.5 line-clamp-2">{task.description}</div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs font-medium" style={{ color: due.color }}>{due.label}</span>
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge task={task} />
                      </div>
                      {(task.crm_leads || task.crm_users) && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-[#b3b3b3]">
                          {task.crm_leads && (
                            <Link href={`/app/leads/${task.crm_leads.id}`} className="text-[#0ea5e9]">
                              {task.crm_leads.full_name}
                            </Link>
                          )}
                          {task.crm_users && <span>{task.crm_users.full_name ?? task.crm_users.email}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2rem_1fr_140px_130px_100px_90px_90px] gap-x-4 px-4 py-2.5 border-b border-[#2d2d2d] text-[10px] font-semibold text-[#b3b3b3] uppercase tracking-wider">
              <div />
              <div>Task</div>
              <div>Assigned To</div>
              <div>Due Date</div>
              <div>Lead</div>
              <div>Priority</div>
              <div>Status</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#2d2d2d]">
              {filtered.map((task) => {
                const overdue = isOverdue(task)
                const due = formatDueDate(task.due_at)
                const isCompleting = completingId === task.id

                return (
                  <div
                    key={task.id}
                    className={`grid grid-cols-[2rem_1fr_140px_130px_100px_90px_90px] gap-x-4 px-4 py-3.5 items-center transition-colors hover:bg-[#2d2d2d]/20 ${
                      overdue ? 'border-l-2 border-l-[#e11d48] bg-[#e11d48]/[0.03]' : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <div>
                      <button
                        onClick={() => !task.completed_at && markComplete(task.id)}
                        disabled={isCompleting || !!task.completed_at}
                        title={task.completed_at ? 'Completed' : 'Mark complete'}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                          task.completed_at
                            ? 'bg-[#22c55e] border-[#22c55e]'
                            : isCompleting
                            ? 'border-[#22c55e] bg-[#22c55e]/20 animate-pulse'
                            : 'border-[#2d2d2d] bg-[#0a0a0a] hover:border-[#22c55e] hover:bg-[#22c55e]/10'
                        }`}
                      >
                        {(task.completed_at || isCompleting) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium truncate ${task.completed_at ? 'text-[#b3b3b3] line-through' : 'text-white'}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-[#b3b3b3] truncate mt-0.5">{task.description}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      {task.crm_users ? (
                        <span className="text-sm text-[#b3b3b3] truncate block">
                          {task.crm_users.full_name ?? task.crm_users.email}
                        </span>
                      ) : (
                        <span className="text-sm text-[#b3b3b3]/40">&mdash;</span>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium" style={{ color: due.color }}>{due.label}</span>
                    </div>
                    <div className="min-w-0">
                      {task.crm_leads ? (
                        <Link
                          href={`/app/leads/${task.crm_leads.id}`}
                          className="text-sm text-[#0ea5e9] hover:text-[#0ea5e9]/80 truncate block transition-colors"
                        >
                          {task.crm_leads.full_name}
                        </Link>
                      ) : (
                        <span className="text-sm text-[#b3b3b3]/40">&mdash;</span>
                      )}
                    </div>
                    <div><PriorityBadge priority={task.priority} /></div>
                    <div><StatusBadge task={task} /></div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {showNewTask && (
        <NewTaskModal
          team={team}
          onClose={() => setShowNewTask(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  )
}
