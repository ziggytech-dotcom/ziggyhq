'use client'

import { useState, useEffect, useCallback } from 'react'

interface TeamMember {
  id: string
  full_name: string | null
  email: string
}

interface RoutingRule {
  id: string
  name: string
  priority: number
  is_active: boolean
  match_source: string | null
  match_score_min: number | null
  match_score_max: number | null
  match_stage: string | null
  action: string
  assign_to_user_id: string | null
  crm_users?: { id: string; full_name: string | null; email: string } | null
}

const EMPTY_RULE = {
  name: '',
  priority: 0,
  match_source: '',
  match_score_min: '',
  match_score_max: '',
  match_stage: '',
  action: 'assign',
  assign_to_user_id: '',
}

function RuleModal({
  rule,
  stages,
  sources,
  team,
  onSave,
  onClose,
}: {
  rule: Partial<RoutingRule> | null
  stages: string[]
  sources: string[]
  team: TeamMember[]
  onSave: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
}) {
  const isNew = !rule?.id
  const [form, setForm] = useState({
    name: rule?.name ?? '',
    priority: rule?.priority ?? 0,
    match_source: rule?.match_source ?? '',
    match_score_min: rule?.match_score_min?.toString() ?? '',
    match_score_max: rule?.match_score_max?.toString() ?? '',
    match_stage: rule?.match_stage ?? '',
    action: rule?.action ?? 'assign',
    assign_to_user_id: rule?.assign_to_user_id ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({
      name: form.name.trim(),
      priority: parseInt(String(form.priority)) || 0,
      match_source: form.match_source || null,
      match_score_min: form.match_score_min ? parseInt(form.match_score_min) : null,
      match_score_max: form.match_score_max ? parseInt(form.match_score_max) : null,
      match_stage: form.match_stage || null,
      action: form.action,
      assign_to_user_id: form.action === 'assign' ? (form.assign_to_user_id || null) : null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2d2d2d] px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{isNew ? 'New' : 'Edit'} Routing Rule</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Rule Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Zillow leads → Alex" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Priority (lower = runs first)</label>
            <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
          </div>

          <div className="border-t border-[#2d2d2d] pt-4">
            <div className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-3">Conditions (all must match)</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Lead Source</label>
                <select value={form.match_source} onChange={(e) => setForm({ ...form, match_source: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                  <option value="">Any source</option>
                  {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Pipeline Stage</label>
                <select value={form.match_stage} onChange={(e) => setForm({ ...form, match_stage: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                  <option value="">Any stage</option>
                  {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Score ≥</label>
                  <input type="number" min="0" max="100" value={form.match_score_min} onChange={(e) => setForm({ ...form, match_score_min: e.target.value })} placeholder="0" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Score ≤</label>
                  <input type="number" min="0" max="100" value={form.match_score_max} onChange={(e) => setForm({ ...form, match_score_max: e.target.value })} placeholder="100" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#2d2d2d] pt-4">
            <div className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-3">Action</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Assignment Type</label>
                <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                  <option value="assign">Assign to specific agent</option>
                  <option value="round_robin">Round-robin (rotate through all agents)</option>
                </select>
              </div>
              {form.action === 'assign' && (
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Assign To</label>
                  <select value={form.assign_to_user_id} onChange={(e) => setForm({ ...form, assign_to_user_id: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                    <option value="">Select agent...</option>
                    {team.map((m) => <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>)}
                  </select>
                </div>
              )}
              {form.action === 'round_robin' && (
                <div className="text-xs text-[#b3b3b3] p-3 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d]">
                  Leads matching this rule will rotate through all team members equally.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RoutingRulesPage() {
  const [rules, setRules] = useState<RoutingRule[]>([])
  const [stages, setStages] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<RoutingRule> | null | false>(false)

  const load = useCallback(async () => {
    const [rulesRes, settingsRes, teamRes] = await Promise.all([
      fetch('/api/routing-rules'),
      fetch('/api/settings'),
      fetch('/api/team'),
    ])
    if (rulesRes.ok) { const d = await rulesRes.json(); setRules(d.rules ?? []) }
    if (settingsRes.ok) {
      const s = await settingsRes.json()
      setStages(s.settings_json?.pipeline_stages ?? [])
      setSources(s.settings_json?.lead_sources ?? [])
    }
    if (teamRes.ok) { const t = await teamRes.json(); setTeam(t.members ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: Record<string, unknown>) => {
    if (editing && (editing as RoutingRule).id) {
      await fetch(`/api/routing-rules/${(editing as RoutingRule).id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/routing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
    setEditing(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this routing rule?')) return
    await fetch(`/api/routing-rules/${id}`, { method: 'DELETE' })
    load()
  }

  const toggleActive = async (rule: RoutingRule) => {
    await fetch(`/api/routing-rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rule.is_active }),
    })
    load()
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            LEAD ROUTING
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Auto-assign incoming leads based on source, score, or stage</p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Rule
        </button>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-[#0ea5e9]/5 border border-[#0ea5e9]/20 text-xs text-[#b3b3b3]">
        Rules run in priority order when a new lead arrives via webhook or is created manually. First matching rule wins.
        <strong className="text-white"> Round-robin</strong> rotates through all team members automatically.
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm py-8 text-center">Loading...</div>
      ) : rules.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <div className="text-white font-medium mb-1">No routing rules</div>
          <div className="text-[#b3b3b3] text-sm mb-4">New leads will be unassigned until a rule is added.</div>
          <button onClick={() => setEditing({})} className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium">
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const conditions = [
              rule.match_source && `Source: ${rule.match_source}`,
              rule.match_stage && `Stage: ${rule.match_stage}`,
              rule.match_score_min !== null && `Score ≥ ${rule.match_score_min}`,
              rule.match_score_max !== null && `Score ≤ ${rule.match_score_max}`,
            ].filter(Boolean)
            const agent = rule.crm_users ? (rule.crm_users.full_name ?? rule.crm_users.email) : null

            return (
              <div key={rule.id} className={`bg-[#1a1a1a] border rounded-xl p-4 transition-all ${rule.is_active ? 'border-[#2d2d2d]' : 'border-[#2d2d2d] opacity-50'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#b3b3b3] bg-[#2d2d2d] px-1.5 py-0.5 rounded font-mono">#{rule.priority}</span>
                      <span className="text-sm font-semibold text-white">{rule.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${rule.is_active ? 'border-[#22c55e]/20 bg-[#22c55e]/10 text-[#22c55e]' : 'border-[#b3b3b3]/20 bg-[#b3b3b3]/10 text-[#b3b3b3]'}`}>
                        {rule.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-[#b3b3b3]">
                      {conditions.length === 0 ? (
                        <span className="text-[#b3b3b3]/60">All leads</span>
                      ) : (
                        conditions.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-[#2d2d2d]">{c}</span>
                        ))
                      )}
                      <span className="text-[#b3b3b3]">→</span>
                      <span className="text-white font-medium">
                        {rule.action === 'round_robin' ? 'Round Robin' : agent ?? 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(rule)} className="px-2.5 py-1 rounded bg-[#2d2d2d] text-[#b3b3b3] hover:text-white text-xs transition-colors">
                      {rule.is_active ? 'Pause' : 'Enable'}
                    </button>
                    <button onClick={() => setEditing(rule)} className="px-2.5 py-1 rounded bg-[#2d2d2d] text-[#b3b3b3] hover:text-white text-xs transition-colors">Edit</button>
                    <button onClick={() => handleDelete(rule.id)} className="px-2.5 py-1 rounded bg-[#2d2d2d] text-[#b3b3b3] hover:text-[#0ea5e9] text-xs transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing !== false && (
        <RuleModal
          rule={editing}
          stages={stages}
          sources={sources}
          team={team}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}
