'use client'

import { useState, useEffect } from 'react'

interface Agent {
  id: string
  full_name: string | null
  email: string
  role: string
  status: string
  phone?: string | null
  license_number?: string | null
  commission_split?: string | null
  created_at: string
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length > 6) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  if (digits.length > 3) return `(${digits.slice(0,3)}) ${digits.slice(3)}`
  return digits
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Agent>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/team')
      .then((r) => r.json())
      .then((d) => { setAgents(d.members ?? []); setLoading(false) })
  }, [])

  const startEdit = (agent: Agent) => {
    setEditingId(agent.id)
    setEditForm({
      full_name: agent.full_name ?? '',
      phone: agent.phone ?? '',
      license_number: agent.license_number ?? '',
      commission_split: agent.commission_split ?? '',
    })
  }

  const save = async (id: string) => {
    setSaving(true)
    const res = await fetch(`/api/agents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: editForm.full_name || null,
        phone: editForm.phone || null,
        license_number: editForm.license_number || null,
        commission_split: editForm.commission_split || null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...data.agent } : a)))
      setEditingId(null)
    }
    setSaving(false)
  }

  const activeAgents = agents.filter((a) => a.status === 'active')
  const inactiveAgents = agents.filter((a) => a.status !== 'active')

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          AGENTS
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Manage agent profiles, license numbers, and commission splits.</p>
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm">Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">👤</div>
          <div className="text-white font-medium mb-1">No agents yet</div>
          <div className="text-[#b3b3b3] text-sm">Invite team members from the Team page first.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeAgents.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-3">Active ({activeAgents.length})</div>
              <div className="space-y-3">
                {activeAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isEditing={editingId === agent.id}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onEdit={() => startEdit(agent)}
                    onSave={() => save(agent.id)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                ))}
              </div>
            </div>
          )}
          {inactiveAgents.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-3">Inactive ({inactiveAgents.length})</div>
              <div className="space-y-3">
                {inactiveAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isEditing={editingId === agent.id}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onEdit={() => startEdit(agent)}
                    onSave={() => save(agent.id)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AgentCard({
  agent, isEditing, editForm, setEditForm, onEdit, onSave, onCancel, saving
}: {
  agent: Agent
  isEditing: boolean
  editForm: Partial<Agent>
  setEditForm: (f: Partial<Agent>) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-[#ff006e]/20 border border-[#ff006e]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-[#ff006e]">
            {(agent.full_name ?? agent.email).charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Full Name</label>
                  <input
                    value={editForm.full_name ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#ff006e]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Phone</label>
                  <input
                    value={editForm.phone ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: formatPhone(e.target.value) })}
                    placeholder="(702) 555-1234"
                    className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#ff006e]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">License #</label>
                  <input
                    value={editForm.license_number ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                    placeholder="S.0123456"
                    className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#ff006e]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Default Commission Split</label>
                  <input
                    value={editForm.commission_split ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, commission_split: e.target.value })}
                    placeholder="e.g. 70/30 or 80/20"
                    className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#ff006e]"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={onSave} disabled={saving} className="px-4 py-1.5 rounded-lg bg-[#ff006e] text-white text-sm hover:bg-[#ff006e]/90 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={onCancel} className="px-4 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-sm hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-semibold text-sm">{agent.full_name ?? '(no name)'}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${agent.role === 'admin' ? 'bg-[#ff006e]/20 text-[#ff006e]' : 'bg-[#2d2d2d] text-[#b3b3b3]'}`}>
                  {agent.role}
                </span>
              </div>
              <div className="text-xs text-[#b3b3b3] mb-2">{agent.email}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {agent.phone && <span className="text-[#b3b3b3]">📞 {agent.phone}</span>}
                {agent.license_number && <span className="text-[#b3b3b3]">🪪 {agent.license_number}</span>}
                {agent.commission_split && (
                  <span className="text-[#22c55e] font-medium">Split: {agent.commission_split}</span>
                )}
                {!agent.phone && !agent.license_number && !agent.commission_split && (
                  <span className="text-[#b3b3b3]/50 italic">No profile details — click Edit to add</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Edit button */}
        {!isEditing && (
          <button onClick={onEdit} className="p-1.5 rounded-lg text-[#b3b3b3] hover:text-white hover:bg-[#2d2d2d] transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}
