'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Lender {
  id: string
  name: string
  company: string | null
  phone: string | null
  email: string | null
  loan_types: string[] | null
  notes: string | null
  status: string
  created_at: string
}

const LOAN_TYPES = ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'Cash', 'Other']

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length > 6) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  if (digits.length > 3) return `(${digits.slice(0,3)}) ${digits.slice(3)}`
  return digits
}

const emptyForm = { name: '', company: '', phone: '', email: '', loan_types: [] as string[], notes: '', status: 'active' }

export default function LendersPage() {
  const [lenders, setLenders] = useState<Lender[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchLenders()
  }, [])

  const fetchLenders = async () => {
    setLoading(true)
    const res = await fetch('/api/lenders')
    if (res.ok) {
      const data = await res.json()
      setLenders(data.lenders ?? [])
    }
    setLoading(false)
  }

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setShowForm(true)
  }

  const openEdit = (lender: Lender) => {
    setEditingId(lender.id)
    setForm({
      name: lender.name,
      company: lender.company ?? '',
      phone: lender.phone ?? '',
      email: lender.email ?? '',
      loan_types: lender.loan_types ?? [],
      notes: lender.notes ?? '',
      status: lender.status,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyForm })
  }

  const toggleLoanType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      loan_types: prev.loan_types.includes(type)
        ? prev.loan_types.filter((t) => t !== type)
        : [...prev.loan_types, type],
    }))
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      company: form.company.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      loan_types: form.loan_types.length > 0 ? form.loan_types : null,
      notes: form.notes.trim() || null,
      status: form.status,
    }

    if (editingId) {
      const res = await fetch(`/api/lenders/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        setLenders((prev) => prev.map((l) => (l.id === editingId ? data.lender : l)))
        closeForm()
      }
    } else {
      const res = await fetch('/api/lenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        setLenders((prev) => [data.lender, ...prev])
        closeForm()
      }
    }
    setSaving(false)
  }

  const deleteLender = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from your partner lenders?`)) return
    setDeletingId(id)
    await fetch(`/api/lenders/${id}`, { method: 'DELETE' })
    setLenders((prev) => prev.filter((l) => l.id !== id))
    setDeletingId(null)
  }

  const activeLenders = lenders.filter((l) => l.status === 'active')
  const inactiveLenders = lenders.filter((l) => l.status !== 'active')

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/app/settings" className="text-[#b3b3b3] hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '32px', letterSpacing: '0.05em', color: '#ededed' }}>
          PARTNER LENDERS
        </h1>
      </div>
      <p className="text-[#b3b3b3] text-sm mb-6 ml-8">Add your preferred lenders — they'll appear in the lead detail financing section for quick selection.</p>

      <div className="ml-8">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff006e] text-white text-sm font-medium hover:bg-[#ff006e]/90 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Lender
        </button>

        {loading ? (
          <div className="text-[#b3b3b3] text-sm">Loading...</div>
        ) : lenders.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-8 text-center">
            <div className="text-3xl mb-3">🏦</div>
            <div className="text-white font-medium mb-1">No partner lenders yet</div>
            <div className="text-[#b3b3b3] text-sm">Add your preferred lenders so agents can quickly select them on a lead.</div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeLenders.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-3">Active ({activeLenders.length})</div>
                <div className="space-y-3">
                  {activeLenders.map((lender) => (
                    <LenderCard key={lender.id} lender={lender} onEdit={openEdit} onDelete={deleteLender} deleting={deletingId === lender.id} />
                  ))}
                </div>
              </div>
            )}
            {inactiveLenders.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-3">Inactive ({inactiveLenders.length})</div>
                <div className="space-y-3">
                  {inactiveLenders.map((lender) => (
                    <LenderCard key={lender.id} lender={lender} onEdit={openEdit} onDelete={deleteLender} deleting={deletingId === lender.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2d2d2d]">
              <h2 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '22px', letterSpacing: '0.05em', color: '#ededed' }}>
                {editingId ? 'EDIT LENDER' : 'ADD LENDER'}
              </h2>
              <button onClick={closeForm} className="text-[#b3b3b3] hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Name <span className="text-[#ff006e]">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#ff006e] placeholder-[#b3b3b3]/40"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Company</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  placeholder="Nevada Mortgage Co."
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#ff006e] placeholder-[#b3b3b3]/40"
                />
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
                    placeholder="(702) 555-1234"
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#ff006e] placeholder-[#b3b3b3]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="john@lender.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#ff006e] placeholder-[#b3b3b3]/40"
                  />
                </div>
              </div>

              {/* Loan Types */}
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-2">Loan Types</label>
                <div className="flex flex-wrap gap-1.5">
                  {LOAN_TYPES.map((type) => {
                    const active = form.loan_types.includes(type)
                    return (
                      <button key={type} type="button" onClick={() => toggleLoanType(type)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${active ? 'bg-[#ff006e] text-white' : 'bg-[#2d2d2d] text-[#b3b3b3] hover:bg-[#3d3d3d]'}`}>
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-[#b3b3b3] mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Great with first-time buyers, fast closings..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#ff006e] placeholder-[#b3b3b3]/40 resize-none"
                />
              </div>

              {/* Status (edit only) */}
              {editingId && (
                <div>
                  <label className="block text-xs text-[#b3b3b3] mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#ff006e]">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={closeForm} className="flex-1 px-4 py-2 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] text-sm hover:text-white hover:border-[#b3b3b3] transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 px-4 py-2 rounded-lg bg-[#ff006e] text-white text-sm font-medium hover:bg-[#ff006e]/90 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Lender'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LenderCard({ lender, onEdit, onDelete, deleting }: {
  lender: Lender
  onEdit: (l: Lender) => void
  onDelete: (id: string, name: string) => void
  deleting: boolean
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4 flex items-start gap-4">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[#ff006e]/20 border border-[#ff006e]/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-[#ff006e]">{lender.name.charAt(0).toUpperCase()}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-white font-medium text-sm">{lender.name}</span>
          {lender.company && <span className="text-[#b3b3b3] text-xs">— {lender.company}</span>}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#b3b3b3] mb-2">
          {lender.phone && <span>📞 {lender.phone}</span>}
          {lender.email && <span>✉️ {lender.email}</span>}
        </div>
        {lender.loan_types && lender.loan_types.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lender.loan_types.map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded bg-[#2d2d2d] text-[#b3b3b3] text-[10px]">{t}</span>
            ))}
          </div>
        )}
        {lender.notes && <p className="text-xs text-[#b3b3b3]/60 mt-1.5 italic">{lender.notes}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(lender)} className="p-1.5 rounded-lg text-[#b3b3b3] hover:text-white hover:bg-[#2d2d2d] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <button onClick={() => onDelete(lender.id, lender.name)} disabled={deleting} className="p-1.5 rounded-lg text-[#b3b3b3] hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  )
}
