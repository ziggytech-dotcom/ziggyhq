'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Filter Types ───────────────────────────────────────────────────────────────
type ConditionOperator = 'AND' | 'OR'

interface FilterCondition {
  id: string
  field: string
  operator: string
  value: string | number | boolean | string[]
}

interface FiltersJson {
  // Legacy flat format (backwards compatible)
  source?: string
  stage?: string
  assigned_to?: string
  budget_min?: number
  budget_max?: number
  lead_score_min?: number
  lead_score_max?: number
  no_contact_days?: number
  created_within_days?: number
  tags?: string[]
  status?: string
  // New advanced format
  logic?: ConditionOperator
  conditions?: FilterCondition[]
}

interface SmartList {
  id: string
  name: string
  filters_json: FiltersJson
  created_at: string
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
  created_at: string
  budget_max: number | null
  tags: string[]
  assigned_to: string | null
}

// ── Filter Engine ─────────────────────────────────────────────────────────────
function evalCondition(cond: FilterCondition, lead: Lead): boolean {
  const now = Date.now()
  switch (cond.field) {
    case 'source': return cond.operator === 'is' ? lead.source === cond.value : lead.source !== cond.value
    case 'stage': return cond.operator === 'is' ? lead.stage === cond.value : lead.stage !== cond.value
    case 'status': return cond.operator === 'is' ? lead.status === cond.value : lead.status !== cond.value
    case 'lead_score': {
      const score = lead.lead_score
      const val = Number(cond.value)
      if (cond.operator === 'gte') return score >= val
      if (cond.operator === 'lte') return score <= val
      if (cond.operator === 'gt') return score > val
      if (cond.operator === 'lt') return score < val
      return score === val
    }
    case 'budget_max': {
      const budget = lead.budget_max ?? 0
      const val = Number(cond.value)
      if (cond.operator === 'gte') return budget >= val
      if (cond.operator === 'lte') return budget <= val
      return false
    }
    case 'no_contact_days': {
      const days = Number(cond.value)
      const threshold = now - days * 86400000
      const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at).getTime() : 0
      return cond.operator === 'gte' ? lastContact <= threshold : lastContact > threshold
    }
    case 'created_within_days': {
      const days = Number(cond.value)
      const threshold = now - days * 86400000
      const created = new Date(lead.created_at).getTime()
      return cond.operator === 'within' ? created >= threshold : created < threshold
    }
    case 'tags': {
      const tagList = Array.isArray(cond.value) ? cond.value : [String(cond.value)]
      return cond.operator === 'contains_any'
        ? tagList.some((t) => lead.tags?.includes(t))
        : tagList.every((t) => lead.tags?.includes(t))
    }
    case 'has_email': return cond.value === 'true' ? !!lead.email : !lead.email
    case 'has_phone': return cond.value === 'true' ? !!lead.phone : !lead.phone
    default: return true
  }
}

function applyFilters(filters: FiltersJson, leads: Lead[]): Lead[] {
  // Advanced mode: use conditions array
  if (filters.conditions && filters.conditions.length > 0) {
    const logic = filters.logic ?? 'AND'
    return leads.filter((lead) => {
      const results = filters.conditions!.map((c) => evalCondition(c, lead))
      return logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
    })
  }

  // Legacy flat mode (backwards compatible)
  return leads.filter((l) => {
    if (filters.source && l.source !== filters.source) return false
    if (filters.stage && l.stage !== filters.stage) return false
    if (filters.status && l.status !== filters.status) return false
    if (filters.lead_score_min && l.lead_score < filters.lead_score_min) return false
    if (filters.lead_score_max && l.lead_score > filters.lead_score_max) return false
    if (filters.budget_max && (l.budget_max ?? Infinity) > filters.budget_max) return false
    if (filters.no_contact_days) {
      const threshold = Date.now() - filters.no_contact_days * 86400000
      const lastContact = l.last_contacted_at ? new Date(l.last_contacted_at).getTime() : 0
      if (lastContact > threshold) return false
    }
    if (filters.created_within_days) {
      const threshold = Date.now() - filters.created_within_days * 86400000
      if (new Date(l.created_at).getTime() < threshold) return false
    }
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some((t) => l.tags?.includes(t))) return false
    }
    return true
  })
}

// ── Field definitions ─────────────────────────────────────────────────────────
const FILTER_FIELDS = [
  { key: 'lead_score', label: 'Lead Score', operators: ['gte', 'lte', 'gt', 'lt'], valueType: 'number' },
  { key: 'stage', label: 'Stage', operators: ['is', 'is_not'], valueType: 'stage' },
  { key: 'source', label: 'Source', operators: ['is', 'is_not'], valueType: 'source' },
  { key: 'status', label: 'Status', operators: ['is', 'is_not'], valueType: 'status' },
  { key: 'no_contact_days', label: 'No Contact (days)', operators: ['gte'], valueType: 'number' },
  { key: 'created_within_days', label: 'Created Within (days)', operators: ['within'], valueType: 'number' },
  { key: 'budget_max', label: 'Budget', operators: ['gte', 'lte'], valueType: 'number' },
  { key: 'has_email', label: 'Has Email', operators: ['is'], valueType: 'bool' },
  { key: 'has_phone', label: 'Has Phone', operators: ['is'], valueType: 'bool' },
]

const OPERATOR_LABELS: Record<string, string> = {
  is: '=', is_not: '≠', gte: '≥', lte: '≤', gt: '>', lt: '<',
  within: 'within', contains_any: 'contains any',
}

const STATUS_OPTIONS = ['active', 'nurture', 'dead', 'won']

function genId() { return Math.random().toString(36).slice(2) }

function FilterBadge({ filters }: { filters: FiltersJson }) {
  if (filters.conditions && filters.conditions.length > 0) {
    return (
      <div className="flex flex-wrap gap-1">
        {filters.conditions.map((c, i) => (
          <span key={c.id ?? i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20">
            {c.field} {OPERATOR_LABELS[c.operator] ?? c.operator} {String(c.value)}
          </span>
        ))}
        {filters.conditions.length > 1 && (
          <span className="text-xs text-[#b3b3b3]/60 self-center">{filters.logic ?? 'AND'}</span>
        )}
      </div>
    )
  }
  const entries = Object.entries(filters).filter(([k, v]) => k !== 'logic' && k !== 'conditions' && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
  if (entries.length === 0) return <span className="text-xs text-[#b3b3b3]/60">No filters</span>
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([key, val]) => (
        <span key={key} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20">
          {key}: {Array.isArray(val) ? val.join(', ') : String(val)}
        </span>
      ))}
    </div>
  )
}

function ConditionRow({
  cond,
  stages,
  sources,
  onChange,
  onRemove,
}: {
  cond: FilterCondition
  stages: string[]
  sources: string[]
  onChange: (c: FilterCondition) => void
  onRemove: () => void
}) {
  const fieldDef = FILTER_FIELDS.find((f) => f.key === cond.field) ?? FILTER_FIELDS[0]
  const operators = fieldDef.operators

  const valueInput = () => {
    if (fieldDef.valueType === 'stage') {
      return (
        <select value={String(cond.value)} onChange={(e) => onChange({ ...cond, value: e.target.value })}
          className="flex-1 px-2 py-1.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#0ea5e9]">
          <option value="">Any</option>
          {stages.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    }
    if (fieldDef.valueType === 'source') {
      return (
        <select value={String(cond.value)} onChange={(e) => onChange({ ...cond, value: e.target.value })}
          className="flex-1 px-2 py-1.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#0ea5e9]">
          <option value="">Any</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    }
    if (fieldDef.valueType === 'status') {
      return (
        <select value={String(cond.value)} onChange={(e) => onChange({ ...cond, value: e.target.value })}
          className="flex-1 px-2 py-1.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#0ea5e9]">
          <option value="">Any</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      )
    }
    if (fieldDef.valueType === 'bool') {
      return (
        <select value={String(cond.value)} onChange={(e) => onChange({ ...cond, value: e.target.value })}
          className="flex-1 px-2 py-1.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#0ea5e9]">
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )
    }
    return (
      <input type="number" value={String(cond.value)} onChange={(e) => onChange({ ...cond, value: e.target.value })}
        className="flex-1 px-2 py-1.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#0ea5e9]" />
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select value={cond.field}
        onChange={(e) => {
          const fd = FILTER_FIELDS.find((f) => f.key === e.target.value) ?? FILTER_FIELDS[0]
          onChange({ ...cond, field: e.target.value, operator: fd.operators[0], value: '' })
        }}
        className="w-44 px-2 py-1.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#0ea5e9]">
        {FILTER_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select>
      <select value={cond.operator} onChange={(e) => onChange({ ...cond, operator: e.target.value })}
        className="w-20 px-2 py-1.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#0ea5e9]">
        {operators.map((op) => <option key={op} value={op}>{OPERATOR_LABELS[op] ?? op}</option>)}
      </select>
      {valueInput()}
      <button onClick={onRemove} className="text-[#b3b3b3] hover:text-[#0ea5e9] flex-shrink-0 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  )
}

function EditListModal({
  list,
  stages,
  sources,
  onSave,
  onClose,
}: {
  list: Partial<SmartList> | null
  stages: string[]
  sources: string[]
  onSave: (name: string, filters: FiltersJson) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(list?.name ?? '')
  const [logic, setLogic] = useState<ConditionOperator>((list?.filters_json?.logic as ConditionOperator) ?? 'AND')
  const [conditions, setConditions] = useState<FilterCondition[]>(
    list?.filters_json?.conditions ?? []
  )
  const [saving, setSaving] = useState(false)

  const addCondition = () => {
    setConditions((prev) => [...prev, { id: genId(), field: 'lead_score', operator: 'gte', value: '50' }])
  }

  const updateCondition = (id: string, updated: FilterCondition) => {
    setConditions((prev) => prev.map((c) => c.id === id ? updated : c))
  }

  const removeCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id))
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim(), { logic, conditions })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2d2d2d] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{list?.id ? 'Edit' : 'New'} Smart List</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1.5">List Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hot Leads, No Contact 7 Days"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
          </div>

          <div className="border-t border-[#2d2d2d] pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-white">Filter Conditions</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#b3b3b3]">Match:</span>
                {(['AND', 'OR'] as ConditionOperator[]).map((op) => (
                  <button key={op} onClick={() => setLogic(op)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${logic === op ? 'bg-[#0ea5e9] text-white' : 'bg-[#2d2d2d] text-[#b3b3b3] hover:text-white'}`}>
                    {op}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-[#b3b3b3]/60 mb-3">
              {logic === 'AND' ? 'Lead must match ALL conditions below.' : 'Lead must match ANY condition below.'}
            </div>

            <div className="space-y-2">
              {conditions.map((cond) => (
                <ConditionRow
                  key={cond.id}
                  cond={cond}
                  stages={stages}
                  sources={sources}
                  onChange={(updated) => updateCondition(cond.id, updated)}
                  onRemove={() => removeCondition(cond.id)}
                />
              ))}
              {conditions.length === 0 && (
                <div className="text-center py-4 text-[#b3b3b3] text-xs border border-dashed border-[#2d2d2d] rounded-lg">
                  No conditions — list will include all leads
                </div>
              )}
            </div>

            <button onClick={addCondition} className="mt-3 flex items-center gap-1.5 text-xs text-[#0ea5e9] hover:text-[#0ea5e9]/80 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add condition
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 py-2.5 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save List'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SmartListsPage() {
  const [lists, setLists] = useState<SmartList[]>([])
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [stages, setStages] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editingList, setEditingList] = useState<Partial<SmartList> | null | false>(false)
  const [activeListId, setActiveListId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [listsRes, leadsRes, settingsRes] = await Promise.all([
      fetch('/api/smart-lists'),
      fetch('/api/leads'),
      fetch('/api/settings'),
    ])
    if (listsRes.ok) { const d = await listsRes.json(); setLists(d.lists ?? []) }
    if (leadsRes.ok) { const d = await leadsRes.json(); setAllLeads(d.leads ?? []) }
    if (settingsRes.ok) {
      const s = await settingsRes.json()
      setStages(s.settings_json?.pipeline_stages ?? [])
      setSources(s.settings_json?.lead_sources ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (name: string, filters_json: FiltersJson) => {
    if (editingList && (editingList as SmartList).id) {
      await fetch(`/api/smart-lists/${(editingList as SmartList).id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, filters_json }),
      })
    } else {
      await fetch('/api/smart-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, filters_json }),
      })
    }
    setEditingList(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this smart list?')) return
    await fetch(`/api/smart-lists/${id}`, { method: 'DELETE' })
    if (activeListId === id) setActiveListId(null)
    load()
  }

  const activeList = activeListId ? lists.find((l) => l.id === activeListId) : null
  const filteredLeads = activeList ? applyFilters(activeList.filters_json, allLeads) : []

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            SMART LISTS
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Dynamic lists with AND/OR conditions — auto-update in real time</p>
        </div>
        <button onClick={() => setEditingList({})}
          className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New List
        </button>
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm py-8 text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lists column */}
          <div className="lg:col-span-1 space-y-2">
            {lists.length === 0 && (
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 text-center">
                <div className="text-[#b3b3b3] text-sm mb-3">No smart lists yet</div>
                <button onClick={() => setEditingList({})} className="text-[#0ea5e9] text-sm hover:underline">Create your first list →</button>
              </div>
            )}
            {lists.map((list) => {
              const count = applyFilters(list.filters_json, allLeads).length
              const isActive = activeListId === list.id
              return (
                <div key={list.id} onClick={() => setActiveListId(isActive ? null : list.id)}
                  className={`bg-[#1a1a1a] border rounded-xl p-4 cursor-pointer transition-all ${isActive ? 'border-[#0ea5e9]/40 bg-[#0ea5e9]/5' : 'border-[#2d2d2d] hover:border-[#2d2d2d]/80'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{list.name}</div>
                      <div className="mt-2">
                        <FilterBadge filters={list.filters_json} />
                      </div>
                    </div>
                    <span className="text-lg font-bold flex-shrink-0" style={{ color: count > 0 ? '#0ea5e9' : '#b3b3b3' }}>{count}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={(e) => { e.stopPropagation(); setEditingList(list) }}
                      className="text-xs text-[#b3b3b3] hover:text-white px-2 py-1 rounded bg-[#2d2d2d] transition-colors">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(list.id) }}
                      className="text-xs text-[#b3b3b3] hover:text-[#0ea5e9] px-2 py-1 rounded bg-[#2d2d2d] transition-colors">Delete</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leads preview */}
          <div className="lg:col-span-2">
            {activeList ? (
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2d2d2d] flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{activeList.name}</span>
                  <span className="text-xs text-[#b3b3b3]">{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}</span>
                </div>
                {filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-[#b3b3b3] text-sm">No leads match this filter</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#2d2d2d]">
                          {['Name', 'Stage', 'Source', 'Score', 'Status'].map((h) => (
                            <th key={h} className="text-left text-xs font-medium text-[#b3b3b3] px-4 py-3 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2d2d2d]">
                        {filteredLeads.slice(0, 50).map((lead) => (
                          <tr key={lead.id} className="hover:bg-[#2d2d2d]/20 transition-colors">
                            <td className="px-4 py-3">
                              <Link href={`/app/leads/${lead.id}`} className="text-sm font-medium text-white hover:text-[#0ea5e9]">{lead.full_name}</Link>
                              <div className="text-xs text-[#b3b3b3]">{lead.phone ?? lead.email ?? '—'}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#b3b3b3]">{lead.stage ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-[#b3b3b3]">{lead.source ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium" style={{ color: lead.lead_score >= 70 ? '#22c55e' : lead.lead_score >= 40 ? '#f59e0b' : '#0ea5e9' }}>{lead.lead_score}</span>
                            </td>
                            <td className="px-4 py-3 text-xs capitalize text-[#b3b3b3]">{lead.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-12 text-center">
                <div className="text-[#b3b3b3] text-sm">Select a smart list to preview leads</div>
              </div>
            )}
          </div>
        </div>
      )}

      {editingList !== false && (
        <EditListModal
          list={editingList}
          stages={stages}
          sources={sources}
          onSave={handleSave}
          onClose={() => setEditingList(false)}
        />
      )}
    </div>
  )
}
