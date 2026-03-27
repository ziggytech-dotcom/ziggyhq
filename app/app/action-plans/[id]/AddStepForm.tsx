'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddStepForm({ planId, nextOrder }: { planId: string; nextOrder: number }) {
  const [form, setForm] = useState({
    type: 'email',
    delay_hours: '0',
    template_subject: '',
    template_body: '',
    task_description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch(`/api/action-plans/${planId}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step_order: nextOrder,
        delay_hours: parseInt(form.delay_hours) || 0,
        type: form.type,
        template_subject: form.template_subject || null,
        template_body: form.template_body || null,
        task_description: form.task_description || null,
      }),
    })
    if (res.ok) {
      setForm({ type: 'email', delay_hours: '0', template_subject: '', template_body: '', task_description: '' })
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to add step')
    }
    setLoading(false)
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Add Step</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="call">Call</option>
              <option value="task">Task</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Delay (hours)</label>
            <input type="number" min="0" value={form.delay_hours} onChange={(e) => setForm({ ...form, delay_hours: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
          </div>
        </div>
        {(form.type === 'email' || form.type === 'sms') && (
          <>
            {form.type === 'email' && (
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Subject</label>
                <input value={form.template_subject} onChange={(e) => setForm({ ...form, template_subject: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm" />
              </div>
            )}
            <div>
              <label className="block text-xs text-[#b3b3b3] mb-1">Message Body</label>
              <textarea value={form.template_body} onChange={(e) => setForm({ ...form, template_body: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm resize-none" placeholder="Use {{first_name}}, {{last_name}} for personalization" />
            </div>
          </>
        )}
        {(form.type === 'call' || form.type === 'task') && (
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Description</label>
            <textarea value={form.task_description} onChange={(e) => setForm({ ...form, task_description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm resize-none" />
          </div>
        )}
        {error && <div className="text-sm text-[#0ea5e9] bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 rounded-lg px-3 py-2">{error}</div>}
        <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors">
          {loading ? 'Adding...' : '+ Add Step'}
        </button>
      </form>
    </div>
  )
}
