'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Formatters ────────────────────────────────────────────────────────────────
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
}

function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits).toLocaleString('en-US')
}

function parseCurrency(value: string): string {
  return value.replace(/\D/g, '')
}

interface Lead {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  source: string | null
  stage: string | null
  status: string
  lead_score: number
  last_contacted_at: string | null
  next_followup_at: string | null
  assigned_to: string | null
  tags: string[]
  created_at: string
  users?: { full_name: string | null; email: string } | null
}

interface OrgSettings {
  pipeline_stages: string[]
  lead_sources: string[]
}

interface TeamMember {
  id: string
  full_name: string | null
  email: string
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: '#22c55e20', text: '#22c55e', border: '#22c55e40' },
  nurture: { bg: '#f59e0b20', text: '#f59e0b', border: '#f59e0b40' },
  dead: { bg: '#b3b3b320', text: '#b3b3b3', border: '#b3b3b340' },
  won: { bg: '#0ea5e920', text: '#0ea5e9', border: '#0ea5e940' },
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#0ea5e9'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#2d2d2d] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-[#b3b3b3]">{score}</span>
    </div>
  )
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

interface DuplicateLead {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  stage: string | null
  status: string
  match_reason: string
}

function NewLeadSlideOver({
  open,
  onClose,
  stages,
  sources,
  team,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  stages: string[]
  sources: string[]
  team: TeamMember[]
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    source: '',
    stage: '',
    status: 'active',
    notes: '',
    budget_min: '',
    budget_max: '',
    timeline: '',
    pre_approved: false,
    assigned_to: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([])
  const [showDupWarning, setShowDupWarning] = useState(false)

  const buildBody = () => {
    const body: Record<string, unknown> = { ...form }
    if (form.budget_min) body.budget_min = parseInt(form.budget_min)
    if (form.budget_max) body.budget_max = parseInt(form.budget_max)
    if (!form.assigned_to) delete body.assigned_to
    return body
  }

  const doCreate = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildBody()),
    })
    if (res.ok) {
      onCreated()
      onClose()
      setForm({ full_name: '', email: '', phone: '', source: '', stage: '', status: 'active', notes: '', budget_min: '', budget_max: '', timeline: '', pre_approved: false, assigned_to: '' })
      setDuplicates([])
      setShowDupWarning(false)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to create lead')
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    // Check for duplicates first
    const dupRes = await fetch('/api/leads/duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: form.full_name, email: form.email, phone: form.phone }),
    })
    if (dupRes.ok) {
      const { duplicates: found } = await dupRes.json()
      if (found && found.length > 0) {
        setDuplicates(found)
        setShowDupWarning(true)
        setLoading(false)
        return
      }
    }
    setLoading(false)
    await doCreate()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1a1a1a] border-l border-[#2d2d2d] h-full overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2d2d2d] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New Lead</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Full Name *</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(702) 555-1234" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                <option value="">Select source</option>
                {sources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Stage</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                <option value="">Select stage</option>
                {stages.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                <option value="active">Active</option>
                <option value="nurture">Nurture</option>
                <option value="dead">Dead</option>
                <option value="won">Won</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Assign To</label>
              <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                <option value="">Unassigned</option>
                {team.map((m) => <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Budget Min ($)</label>
              <input type="text" inputMode="numeric" value={form.budget_min ? '$' + formatCurrency(form.budget_min) : ''} onChange={(e) => setForm({ ...form, budget_min: parseCurrency(e.target.value) })} placeholder="$500,000" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Budget Max ($)</label>
              <input type="text" inputMode="numeric" value={form.budget_max ? '$' + formatCurrency(form.budget_max) : ''} onChange={(e) => setForm({ ...form, budget_max: parseCurrency(e.target.value) })} placeholder="$800,000" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm" />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Timeline</label>
              <input value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="e.g. 3-6 months" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="pre_approved" checked={form.pre_approved} onChange={(e) => setForm({ ...form, pre_approved: e.target.checked })} className="w-4 h-4 rounded border-[#2d2d2d] bg-[#0a0a0a] accent-[#0ea5e9]" />
              <label htmlFor="pre_approved" className="text-sm text-[#b3b3b3]">Pre-approved</label>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm resize-none" />
            </div>
          </div>
          {showDupWarning && duplicates.length > 0 && (
            <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-[#f59e0b] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span className="text-sm font-medium text-[#f59e0b]">Possible duplicate{duplicates.length > 1 ? 's' : ''} found</span>
              </div>
              <div className="space-y-2 mb-3">
                {duplicates.map((dup) => (
                  <div key={dup.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d]">
                    <div>
                      <div className="text-sm font-medium text-white">{dup.full_name}</div>
                      <div className="text-xs text-[#b3b3b3]">{dup.email ?? dup.phone ?? '—'} · Matched on {dup.match_reason}</div>
                    </div>
                    <a href={`/app/leads/${dup.id}`} target="_blank" rel="noreferrer" className="text-xs text-[#0ea5e9] hover:underline">View →</a>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowDupWarning(false); setDuplicates([]) }} className="flex-1 py-2 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-xs transition-colors">Cancel</button>
                <button type="button" onClick={doCreate} className="flex-1 py-2 rounded-lg bg-[#f59e0b] text-white text-xs font-medium hover:bg-[#f59e0b]/90 transition-colors">Create Anyway</button>
              </div>
            </div>
          )}
          {error && <div className="text-sm text-[#0ea5e9] bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 rounded-lg px-3 py-2">{error}</div>}
          {!showDupWarning && (
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors disabled:opacity-50">
                {loading ? 'Checking...' : 'Create Lead'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

function KanbanView({ leads, stages }: { leads: Lead[]; stages: string[] }) {
  const byStage = stages.reduce<Record<string, Lead[]>>((acc, stage) => {
    acc[stage] = leads.filter((l) => l.stage === stage)
    return acc
  }, {})
  const unstagedLeads = leads.filter((l) => !l.stage || !stages.includes(l.stage))

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <div key={stage} className="flex-shrink-0 w-64">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-[#b3b3b3] uppercase tracking-wider">{stage}</span>
            <span className="text-xs text-[#b3b3b3] bg-[#2d2d2d] px-1.5 py-0.5 rounded">{byStage[stage]?.length ?? 0}</span>
          </div>
          <div className="space-y-2">
            {(byStage[stage] ?? []).map((lead) => (
              <Link key={lead.id} href={`/app/leads/${lead.id}`}>
                <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-3 hover:border-[#0ea5e9]/40 transition-colors cursor-pointer">
                  <div className="font-medium text-sm text-white mb-1 truncate">{lead.full_name}</div>
                  {lead.phone && <div className="text-xs text-[#b3b3b3] mb-1">{lead.phone}</div>}
                  <div className="flex items-center justify-between mt-2">
                    {lead.source && <span className="text-xs text-[#b3b3b3]">{lead.source}</span>}
                    <ScoreBar score={lead.lead_score} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
      {unstagedLeads.length > 0 && (
        <div className="flex-shrink-0 w-64">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-[#b3b3b3] uppercase tracking-wider">No Stage</span>
            <span className="text-xs text-[#b3b3b3] bg-[#2d2d2d] px-1.5 py-0.5 rounded">{unstagedLeads.length}</span>
          </div>
          <div className="space-y-2">
            {unstagedLeads.map((lead) => (
              <Link key={lead.id} href={`/app/leads/${lead.id}`}>
                <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-3 hover:border-[#0ea5e9]/40 transition-colors cursor-pointer">
                  <div className="font-medium text-sm text-white mb-1 truncate">{lead.full_name}</div>
                  {lead.phone && <div className="text-xs text-[#b3b3b3] mb-1">{lead.phone}</div>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterAgent, setFilterAgent] = useState('')
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [showNewLead, setShowNewLead] = useState(false)
  const [stages, setStages] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const loadLeads = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterStage) params.set('stage', filterStage)
    if (filterSource) params.set('source', filterSource)
    if (filterAgent) params.set('assigned_to', filterAgent)
    params.set('sort', sortField)
    params.set('dir', sortDir)

    const res = await fetch(`/api/leads?${params}`)
    if (res.ok) {
      const data = await res.json()
      setLeads(data.leads ?? [])
    }
    setLoading(false)
  }, [search, filterStage, filterSource, filterAgent, sortField, sortDir])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  useEffect(() => {
    const loadSettings = async () => {
      const [settingsRes, teamRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/team'),
      ])
      if (settingsRes.ok) {
        const s = await settingsRes.json()
        setStages(s.settings_json?.pipeline_stages ?? [])
        setSources(s.settings_json?.lead_sources ?? [])
      }
      if (teamRes.ok) {
        const t = await teamRes.json()
        setTeam(t.members ?? [])
      }
    }
    loadSettings()
  }, [])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-[#b3b3b3]/40 ml-1">↕</span>
    return <span className="text-[#0ea5e9] ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            LEADS
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">{leads.length} lead{leads.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/app/import" className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] text-[#b3b3b3] rounded-lg text-sm font-medium hover:text-white hover:bg-[#3d3d3d] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          Import
        </Link>
        <button
          onClick={() => setShowNewLead(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm"
          />
        </div>
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] text-sm text-white focus:outline-none focus:border-[#0ea5e9]">
          <option value="">All Stages</option>
          {stages.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] text-sm text-white focus:outline-none focus:border-[#0ea5e9]">
          <option value="">All Sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] text-sm text-white focus:outline-none focus:border-[#0ea5e9]">
          <option value="">All Agents</option>
          {team.map((m) => <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>)}
        </select>
        {/* View toggle */}
        <div className="flex rounded-lg border border-[#2d2d2d] overflow-hidden ml-auto">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-2 text-sm transition-colors ${view === 'list' ? 'bg-[#0ea5e9] text-white' : 'bg-[#1a1a1a] text-[#b3b3b3] hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-2 text-sm transition-colors ${view === 'kanban' ? 'bg-[#0ea5e9] text-white' : 'bg-[#1a1a1a] text-[#b3b3b3] hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm py-8 text-center">Loading leads...</div>
      ) : view === 'kanban' ? (
        <KanbanView leads={leads} stages={stages} />
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d2d]">
                {[
                  { key: 'full_name', label: 'Name' },
                  { key: 'stage', label: 'Stage' },
                  { key: 'source', label: 'Source' },
                  { key: 'lead_score', label: 'Score' },
                  { key: 'last_contacted_at', label: 'Last Contact' },
                  { key: 'next_followup_at', label: 'Next Follow-up' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left text-xs font-medium text-[#b3b3b3] px-4 py-3 uppercase tracking-wider cursor-pointer hover:text-white select-none"
                  >
                    {col.label}<SortIcon field={col.key} />
                  </th>
                ))}
                <th className="text-left text-xs font-medium text-[#b3b3b3] px-4 py-3 uppercase tracking-wider">Status</th>
                <th className="text-left text-xs font-medium text-[#b3b3b3] px-4 py-3 uppercase tracking-wider">Agent</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d]">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-[#b3b3b3] text-sm">
                    No leads found. <button onClick={() => setShowNewLead(true)} className="text-[#0ea5e9] hover:underline">Add your first lead →</button>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const statusStyle = statusColors[lead.status] ?? statusColors.active
                  return (
                    <tr key={lead.id} className="hover:bg-[#2d2d2d]/20 transition-colors group">
                      <td className="px-4 py-3">
                        <div>
                          <Link href={`/app/leads/${lead.id}`} className="text-sm font-medium text-white hover:text-[#0ea5e9] transition-colors">
                            {lead.full_name}
                          </Link>
                          <div className="text-xs text-[#b3b3b3]">{lead.email ?? lead.phone ?? '—'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#b3b3b3]">{lead.stage ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#b3b3b3]">{lead.source ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar score={lead.lead_score} />
                      </td>
                      <td className="px-4 py-3 text-sm text-[#b3b3b3]">{timeAgo(lead.last_contacted_at)}</td>
                      <td className="px-4 py-3 text-sm text-[#b3b3b3]">
                        {lead.next_followup_at ? (
                          <span className={new Date(lead.next_followup_at) < new Date() ? 'text-[#0ea5e9]' : ''}>
                            {new Date(lead.next_followup_at).toLocaleDateString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#b3b3b3]">
                        {lead.users ? (lead.users.full_name ?? lead.users.email) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/app/leads/${lead.id}`} className="p-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] hover:text-white transition-colors" title="View">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </Link>
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="p-1.5 rounded-lg bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30 transition-colors" title="Call">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </a>
                          )}
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="p-1.5 rounded-lg bg-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/30 transition-colors" title="Email">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <NewLeadSlideOver
        open={showNewLead}
        onClose={() => setShowNewLead(false)}
        stages={stages}
        sources={sources}
        team={team}
        onCreated={loadLeads}
      />
    </div>
  )
}
