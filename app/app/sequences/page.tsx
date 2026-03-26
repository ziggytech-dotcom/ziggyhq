'use client'

import { useState, useEffect, useCallback } from 'react'

interface Sequence {
  id: string
  name: string
  trigger: string
  active: boolean
  step_count: number
  enrollment_count: number
  active_enrollments: number
  created_at: string
}

interface Step {
  id?: string
  subject: string
  body: string
  delay_hours: number
}

interface Lead {
  id: string
  full_name: string
  email: string | null
  stage: string | null
}

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Manual',
  new_lead: 'New Lead',
  no_contact_3d: 'No Contact 3 Days',
  no_contact_7d: 'No Contact 7 Days',
}

const MERGE_TAGS = ['{{first_name}}', '{{full_name}}', '{{agent_name}}', '{{property_address}}']

function SequenceEditor({
  sequence,
  onClose,
  onSaved,
}: {
  sequence: Partial<Sequence> | null
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = !sequence?.id
  const [name, setName] = useState(sequence?.name ?? '')
  const [trigger, setTrigger] = useState(sequence?.trigger ?? 'manual')
  const [steps, setSteps] = useState<Step[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (!isNew && sequence?.id) {
      fetch(`/api/sequences/${sequence.id}`)
        .then((r) => r.json())
        .then((d) => {
          setSteps(d.sequence?.steps ?? [])
          setLoading(false)
        })
    }
  }, [isNew, sequence?.id])

  const addStep = () => setSteps((prev) => [...prev, { subject: '', body: '', delay_hours: 24 }])
  const removeStep = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i))
  const updateStep = (i: number, field: keyof Step, value: string | number) =>
    setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    let seqId = sequence?.id

    if (isNew) {
      const res = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, trigger }),
      })
      const d = await res.json()
      seqId = d.sequence?.id
    } else {
      await fetch(`/api/sequences/${seqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, trigger }),
      })
    }

    if (seqId && steps.length > 0) {
      await fetch(`/api/sequences/${seqId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps }),
      })
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#1a1a1a] border-l border-[#2d2d2d] h-full overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2d2d2d] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{isNew ? 'New Sequence' : 'Edit Sequence'}</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-[#b3b3b3] text-sm">Loading...</div>
        ) : (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Sequence Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Buyer Welcome" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#ff006e] text-sm" />
            </div>

            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Trigger</label>
              <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#ff006e] text-sm">
                {Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-white">Steps ({steps.length})</div>
                <button onClick={addStep} className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#ff006e]/10 text-[#ff006e] text-xs hover:bg-[#ff006e]/20 transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Step
                </button>
              </div>

              {/* Merge tags hint */}
              <div className="mb-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d]">
                <div className="text-xs text-[#b3b3b3] mb-2">Available merge tags:</div>
                <div className="flex flex-wrap gap-1">
                  {MERGE_TAGS.map((t) => (
                    <code key={t} className="text-xs px-1.5 py-0.5 rounded bg-[#2d2d2d] text-[#ff006e]">{t}</code>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-[#ff006e] uppercase tracking-wider">Step {i + 1}</span>
                      <button onClick={() => removeStep(i)} className="text-[#b3b3b3] hover:text-[#ff006e] text-xs">Remove</button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#b3b3b3] mb-1">Send after (hours)</label>
                        <input type="number" min="1" value={step.delay_hours} onChange={(e) => updateStep(i, 'delay_hours', parseInt(e.target.value) || 24)} className="w-full px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#ff006e] text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#b3b3b3] mb-1">Subject *</label>
                        <input value={step.subject} onChange={(e) => updateStep(i, 'subject', e.target.value)} placeholder="e.g. Welcome {{first_name}}!" className="w-full px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#ff006e] text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#b3b3b3] mb-1">Body *</label>
                        <textarea value={step.body} onChange={(e) => updateStep(i, 'body', e.target.value)} rows={5} placeholder="Hi {{first_name}}, ..." className="w-full px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#ff006e] text-sm resize-none" />
                      </div>
                    </div>
                  </div>
                ))}
                {steps.length === 0 && (
                  <div className="text-center py-6 text-[#b3b3b3] text-sm border border-dashed border-[#2d2d2d] rounded-lg">
                    No steps yet — <button onClick={addStep} className="text-[#ff006e] hover:underline">add first step →</button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 py-2.5 rounded-lg bg-[#ff006e] text-white text-sm font-medium hover:bg-[#ff006e]/90 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Sequence'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EnrollModal({
  sequence,
  onClose,
}: {
  sequence: Sequence
  onClose: () => void
}) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [enrolling, setEnrolling] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/leads').then((r) => r.json()).then((d) => setLeads(d.leads ?? []))
  }, [])

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleEnroll = async () => {
    setEnrolling(true)
    await fetch(`/api/sequences/${sequence.id}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: [...selected] }),
    })
    setDone(true)
    setEnrolling(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-[#2d2d2d] flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-semibold text-white">Enroll in &quot;{sequence.name}&quot;</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-white font-medium">{selected.size} lead{selected.size !== 1 ? 's' : ''} enrolled!</div>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-[#ff006e] text-white rounded-lg text-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1">
              {leads.filter((l) => l.email).map((lead) => (
                <label key={lead.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#2d2d2d]/30 cursor-pointer border-b border-[#2d2d2d]">
                  <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggle(lead.id)} className="w-4 h-4 rounded border-[#2d2d2d] bg-[#0a0a0a] accent-[#ff006e]" />
                  <div>
                    <div className="text-sm text-white font-medium">{lead.full_name}</div>
                    <div className="text-xs text-[#b3b3b3]">{lead.email}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="p-4 border-t border-[#2d2d2d] flex gap-3">
              <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm">Cancel</button>
              <button onClick={handleEnroll} disabled={enrolling || selected.size === 0} className="flex-1 py-2 rounded-lg bg-[#ff006e] text-white text-sm font-medium hover:bg-[#ff006e]/90 disabled:opacity-50">
                {enrolling ? 'Enrolling...' : `Enroll ${selected.size}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSeq, setEditingSeq] = useState<Partial<Sequence> | null | false>(false)
  const [enrollingSeq, setEnrollingSeq] = useState<Sequence | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/sequences')
    if (res.ok) { const d = await res.json(); setSequences(d.sequences ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sequence?')) return
    await fetch(`/api/sequences/${id}`, { method: 'DELETE' })
    load()
  }

  const toggleActive = async (seq: Sequence) => {
    await fetch(`/api/sequences/${seq.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !seq.active }),
    })
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            EMAIL SEQUENCES
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Automated email follow-up sequences</p>
        </div>
        <button
          onClick={() => setEditingSeq({})}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff006e] text-white rounded-lg text-sm font-medium hover:bg-[#ff006e]/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Sequence
        </button>
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm py-8 text-center">Loading...</div>
      ) : sequences.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">✉️</div>
          <div className="text-white font-medium mb-1">No sequences yet</div>
          <div className="text-[#b3b3b3] text-sm mb-4">Create automated email follow-up sequences for your leads</div>
          <button onClick={() => setEditingSeq({})} className="px-4 py-2 bg-[#ff006e] text-white rounded-lg text-sm font-medium">
            Create First Sequence
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sequences.map((seq) => (
            <div key={seq.id} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 hover:border-[#2d2d2d]/80 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-white truncate">{seq.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${seq.active ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-[#b3b3b3]/10 text-[#b3b3b3] border border-[#b3b3b3]/20'}`}>
                      {seq.active ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#b3b3b3]">
                    <span>Trigger: <span className="text-white">{TRIGGER_LABELS[seq.trigger] ?? seq.trigger}</span></span>
                    <span>{seq.step_count} step{seq.step_count !== 1 ? 's' : ''}</span>
                    <span>{seq.active_enrollments} active · {seq.enrollment_count} total</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEnrollingSeq(seq)}
                    className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] hover:text-white text-xs transition-colors"
                  >
                    Enroll
                  </button>
                  <button
                    onClick={() => toggleActive(seq)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${seq.active ? 'bg-[#2d2d2d] text-[#b3b3b3] hover:text-white' : 'bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20'}`}
                  >
                    {seq.active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => setEditingSeq(seq)}
                    className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] hover:text-white text-xs transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(seq.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] hover:text-[#ff006e] text-xs transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingSeq !== false && (
        <SequenceEditor
          sequence={editingSeq}
          onClose={() => setEditingSeq(false)}
          onSaved={load}
        />
      )}
      {enrollingSeq && (
        <EnrollModal sequence={enrollingSeq} onClose={() => { setEnrollingSeq(null); load() }} />
      )}
    </div>
  )
}
