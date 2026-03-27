'use client'

import { useState, useEffect, useCallback } from 'react'

interface FollowupRule {
  id: string
  name: string
  is_active: boolean
  no_contact_days: number
  task_title: string
  assign_to: string
}

interface TeamMember {
  id: string
  full_name: string | null
  email: string
}

export default function FollowupRulesPage() {
  const [rules, setRules] = useState<FollowupRule[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', no_contact_days: '7', task_title: 'Follow up with {{first_name}}', assign_to: 'lead_owner' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [rulesRes, teamRes] = await Promise.all([
      fetch('/api/followup-rules'),
      fetch('/api/team'),
    ])
    if (rulesRes.ok) { const d = await rulesRes.json(); setRules(d.rules ?? []) }
    if (teamRes.ok) { const t = await teamRes.json(); setTeam(t.members ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/followup-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        no_contact_days: parseInt(form.no_contact_days) || 7,
        task_title: form.task_title,
        assign_to: form.assign_to,
      }),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', no_contact_days: '7', task_title: 'Follow up with {{first_name}}', assign_to: 'lead_owner' })
    load()
  }

  const toggleActive = async (rule: FollowupRule) => {
    await fetch(`/api/followup-rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rule.is_active }),
    }).catch(() => null) // endpoint will be added with rule ID
    load()
  }

  const getAssignLabel = (assignTo: string) => {
    if (assignTo === 'lead_owner') return 'Lead owner'
    const member = team.find((m) => m.id === assignTo)
    return member ? (member.full_name ?? member.email) : assignTo
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          AUTO FOLLOW-UP REMINDERS
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Automatically create tasks when leads go untouched for too long</p>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-[#0ea5e9]/5 border border-[#0ea5e9]/20 text-xs text-[#b3b3b3]">
        When a rule triggers, a follow-up task is auto-created and assigned to the lead owner (or the agent you specify).
        A notification is sent to the assignee. The check runs daily at midnight.
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm">Loading...</div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {rules.length === 0 && !showForm && (
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-8 text-center">
                <div className="text-3xl mb-3">⏰</div>
                <div className="text-white font-medium mb-1">No reminder rules yet</div>
                <div className="text-[#b3b3b3] text-sm mb-4">Create a rule to auto-remind agents when leads go cold.</div>
              </div>
            )}
            {rules.map((rule) => (
              <div key={rule.id} className={`bg-[#1a1a1a] border rounded-xl p-4 transition-all ${rule.is_active ? 'border-[#2d2d2d]' : 'border-[#2d2d2d] opacity-50'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{rule.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${rule.is_active ? 'border-[#22c55e]/20 bg-[#22c55e]/10 text-[#22c55e]' : 'border-[#b3b3b3]/20 bg-[#b3b3b3]/10 text-[#b3b3b3]'}`}>
                        {rule.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="text-xs text-[#b3b3b3] space-y-0.5">
                      <div>Trigger: no contact for <strong className="text-white">{rule.no_contact_days} days</strong></div>
                      <div>Task: &quot;<span className="text-white">{rule.task_title}</span>&quot;</div>
                      <div>Assign to: <span className="text-white">{getAssignLabel(rule.assign_to)}</span></div>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(rule)} className="px-3 py-1 rounded bg-[#2d2d2d] text-[#b3b3b3] hover:text-white text-xs transition-colors">
                    {rule.is_active ? 'Pause' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Reminder Rule
            </button>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">New Reminder Rule</h3>
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Rule Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 7-Day No Contact" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Trigger after (days with no contact)</label>
                <input type="number" min="1" value={form.no_contact_days} onChange={(e) => setForm({ ...form, no_contact_days: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Task Title (use &#123;&#123;first_name&#125;&#125;)</label>
                <input value={form.task_title} onChange={(e) => setForm({ ...form, task_title: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Assign Task To</label>
                <select value={form.assign_to} onChange={(e) => setForm({ ...form, assign_to: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
                  <option value="lead_owner">Lead owner (whoever is assigned to lead)</option>
                  {team.map((m) => <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors">
                  {saving ? 'Creating...' : 'Create Rule'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
