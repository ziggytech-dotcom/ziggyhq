'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface SmartList {
  id: string
  name: string
  filters_json: FiltersJson
  created_at: string
}

interface FiltersJson {
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

const FILTER_LABELS: Record<string, string> = {
  source: 'Source',
  stage: 'Stage',
  assigned_to: 'Agent',
  budget_min: 'Budget Min',
  budget_max: 'Budget Max',
  lead_score_min: 'Score ≥',
  lead_score_max: 'Score ≤',
  no_contact_days: 'No Contact (days)',
  created_within_days: 'Created Within (days)',
  status: 'Status',
}

function filtersToQueryString(filters: FiltersJson, leads: Lead[]): Lead[] {
  return leads.filter((l) => {
    if (filters.source && l.source !== filters.source) return false
    if (filters.stage && l.stage !== filters.stage) return false
    if (filters.assigned_to && l.assigned_to !== filters.assigned_to) return false
    if (filters.budget_min && (l.budget_max ?? 0) < filters.budget_min) return false
    if (filters.budget_max && (l.budget_max ?? Infinity) > filters.budget_max) return false
    if (filters.lead_score_min && l.lead_score < filters.lead_score_min) return false
    if (filters.lead_score_max && l.lead_score > filters.lead_score_max) return false
    if (filters.status && l.status !== filters.status) return false
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

function FilterBadges({ filters }: { filters: FiltersJson }) {
  const entries = Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
  if (entries.length === 0) return <span className="text-xs text-[#b3b3b3]/60">No filters</span>
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([key, val]) => (
        <span key={key} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20">
          {FILTER_LABELS[key] ?? key}: {Array.isArray(val) ? val.join(', ') : String(val)}
        </span>
      ))}
    </div>
  )
}

const EMPTY_FILTERS: FiltersJson = {}

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
  const [filters, setFilters] = useState<FiltersJson>(list?.filters_json ?? EMPTY_FILTERS)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof FiltersJson, value: unknown) => {
    setFilters((prev) => {
      if (value === '' || value === undefined || value === null) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: value }
    })
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim(), filters)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2d2d2d] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{list?.id ? 'Edit' : 'New'} Smart List</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1.5">List Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hot Leads, No Contact 7 Days"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
            />
          </div>

          <div className="border-t border-[#2d2d2d] pt-4">
            <div className="text-sm font-medium text-white mb-3">Filters</div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Source</label>
                  <select value={filters.source ?? ''} onChange={(e) => set('source', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                    <option value="">Any</option>
                    {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Stage</label>
                  <select value={filters.stage ?? ''} onChange={(e) => set('stage', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                    <option value="">Any</option>
                    {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Status</label>
                  <select value={filters.status ?? ''} onChange={(e) => set('status', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                    <option value="">Any</option>
                    <option value="active">Active</option>
                    <option value="nurture">Nurture</option>
                    <option value="dead">Dead</option>
                    <option value="won">Won</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Score ≥</label>
                  <input type="number" min="0" max="100" value={filters.lead_score_min ?? ''} onChange={(e) => set('lead_score_min', e.target.value ? parseInt(e.target.value) : '')} placeholder="0–100" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Budget Max ($)</label>
                  <input type="number" min="0" value={filters.budget_max ?? ''} onChange={(e) => set('budget_max', e.target.value ? parseInt(e.target.value) : '')} placeholder="e.g. 500000" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">No Contact (days)</label>
                  <input type="number" min="1" value={filters.no_contact_days ?? ''} onChange={(e) => set('no_contact_days', e.target.value ? parseInt(e.target.value) : '')} placeholder="e.g. 7" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Created Within (days)</label>
                  <input type="number" min="1" value={filters.created_within_days ?? ''} onChange={(e) => set('created_within_days', e.target.value ? parseInt(e.target.value) : '')} placeholder="e.g. 7" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
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
      const id = (editingList as SmartList).id
      await fetch(`/api/smart-lists/${id}`, {
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
    load()
  }

  const activeList = activeListId ? lists.find((l) => l.id === activeListId) : null
  const filteredLeads = activeList ? filtersToQueryString(activeList.filters_json, allLeads) : []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            SMART LISTS
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Saved filter sets that auto-update</p>
        </div>
        <button
          onClick={() => setEditingList({})}
          className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New List
        </button>
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm py-8 text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Lists column */}
          <div className="col-span-1 space-y-2">
            {lists.length === 0 && (
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 text-center">
                <div className="text-[#b3b3b3] text-sm mb-3">No smart lists yet</div>
                <button onClick={() => setEditingList({})} className="text-[#0ea5e9] text-sm hover:underline">Create your first list →</button>
              </div>
            )}
            {lists.map((list) => {
              const count = filtersToQueryString(list.filters_json, allLeads).length
              const isActive = activeListId === list.id
              return (
                <div
                  key={list.id}
                  onClick={() => setActiveListId(isActive ? null : list.id)}
                  className={`bg-[#1a1a1a] border rounded-xl p-4 cursor-pointer transition-all ${isActive ? 'border-[#0ea5e9]/40 bg-[#0ea5e9]/5' : 'border-[#2d2d2d] hover:border-[#2d2d2d]/80'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{list.name}</div>
                      <div className="mt-2">
                        <FilterBadges filters={list.filters_json} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-lg font-bold" style={{ color: count > 0 ? '#0ea5e9' : '#b3b3b3' }}>{count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingList(list) }}
                      className="text-xs text-[#b3b3b3] hover:text-white px-2 py-1 rounded bg-[#2d2d2d] transition-colors"
                    >Edit</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(list.id) }}
                      className="text-xs text-[#b3b3b3] hover:text-[#0ea5e9] px-2 py-1 rounded bg-[#2d2d2d] transition-colors"
                    >Delete</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leads preview */}
          <div className="col-span-2">
            {activeList ? (
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2d2d2d] flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{activeList.name}</span>
                  <span className="text-xs text-[#b3b3b3]">{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}</span>
                </div>
                {filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-[#b3b3b3] text-sm">No leads match this filter</div>
                ) : (
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
                          <td className="px-4 py-3">
                            <span className="text-xs capitalize text-[#b3b3b3]">{lead.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
