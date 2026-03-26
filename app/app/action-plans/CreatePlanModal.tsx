'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePlanModal({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger_event: 'manual',
    trigger_stage: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/action-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, org_id: orgId }),
    })
    if (res.ok) {
      const data = await res.json()
      setOpen(false)
      router.push(`/app/action-plans/${data.plan.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to create plan')
    }
    setLoading(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#ff006e] text-white rounded-lg text-sm font-medium hover:bg-[#ff006e]/90 transition-colors">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      New Plan
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">New Action Plan</h2>
          <button onClick={() => setOpen(false)} className="text-[#b3b3b3] hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1.5">Plan Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. New Lead Nurture" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#ff006e] text-sm" />
          </div>
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#ff006e] text-sm resize-none" />
          </div>
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1.5">Trigger</label>
            <select value={form.trigger_event} onChange={(e) => setForm({ ...form, trigger_event: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#ff006e] text-sm">
              <option value="manual">Manual</option>
              <option value="new_lead">New Lead</option>
              <option value="stage_change">Stage Change</option>
            </select>
          </div>
          {form.trigger_event === 'stage_change' && (
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Trigger Stage</label>
              <input value={form.trigger_stage} onChange={(e) => setForm({ ...form, trigger_stage: e.target.value })} placeholder="Stage name to trigger on" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#ff006e] text-sm" />
            </div>
          )}
          {error && <div className="text-sm text-[#ff006e] bg-[#ff006e]/10 border border-[#ff006e]/20 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-[#ff006e] text-white text-sm font-medium hover:bg-[#ff006e]/90 disabled:opacity-50 transition-colors">
              {loading ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
