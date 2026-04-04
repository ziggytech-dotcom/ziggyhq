'use client'

import { useState, useEffect, useCallback } from 'react'

interface FieldDef {
  id: string
  name: string
  label: string
  field_type: string
  options: string[] | null
  is_required: boolean
  position: number
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
]

const fieldTypeColors: Record<string, string> = {
  text: '#0ea5e9',
  number: '#3b82f6',
  date: '#8b5cf6',
  dropdown: '#f59e0b',
  checkbox: '#22c55e',
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<FieldDef[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({
    label: '',
    field_type: 'text',
    options: '',
    is_required: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ label: '', options: '', is_required: false })

  const load = useCallback(async () => {
    const res = await fetch('/api/custom-fields')
    if (res.ok) {
      const d = await res.json()
      setFields(d.fields ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const body: Record<string, unknown> = {
      label: form.label,
      field_type: form.field_type,
      is_required: form.is_required,
    }
    if (form.field_type === 'dropdown') {
      const opts = form.options.split('\n').map((o) => o.trim()).filter(Boolean)
      if (opts.length === 0) { setError('Enter at least one option (one per line)'); setSaving(false); return }
      body.options = opts
    }
    const res = await fetch('/api/custom-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setShowNew(false)
      setForm({ label: '', field_type: 'text', options: '', is_required: false })
      load()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to create field')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this custom field? Existing data will not be removed from leads.')) return
    await fetch(`/api/custom-fields/${id}`, { method: 'DELETE' })
    load()
  }

  const startEdit = (f: FieldDef) => {
    setEditId(f.id)
    setEditForm({
      label: f.label,
      options: (f.options ?? []).join('\n'),
      is_required: f.is_required,
    })
  }

  const handleEditSave = async () => {
    if (!editId) return
    setSaving(true)
    const body: Record<string, unknown> = { label: editForm.label, is_required: editForm.is_required }
    const field = fields.find((f) => f.id === editId)
    if (field?.field_type === 'dropdown') {
      body.options = editForm.options.split('\n').map((o) => o.trim()).filter(Boolean)
    }
    await fetch(`/api/custom-fields/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setEditId(null)
    load()
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            CUSTOM FIELDS
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Define per-industry fields for lead records</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Field
        </button>
      </div>

      {/* New field form */}
      {showNew && (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">New Custom Field</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Field Label *</label>
              <input
                required
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Interest Level"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Field Type *</label>
              <select
                value={form.field_type}
                onChange={(e) => setForm({ ...form, field_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {form.field_type === 'dropdown' && (
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">Options (one per line) *</label>
                <textarea
                  value={form.options}
                  onChange={(e) => setForm({ ...form, options: e.target.value })}
                  rows={4}
                  placeholder={'Option A\nOption B\nOption C'}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm font-mono resize-none"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_required"
                checked={form.is_required}
                onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
                className="w-4 h-4 accent-[#0ea5e9]"
              />
              <label htmlFor="is_required" className="text-sm text-[#b3b3b3]">Required field</label>
            </div>
            {error && <p className="text-sm text-[#0ea5e9] bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowNew(false); setError('') }} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors">
                {saving ? 'Creating...' : 'Create Field'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fields list */}
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-[#b3b3b3] text-sm text-center">Loading...</div>
        ) : fields.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-[#b3b3b3] text-sm mb-1">No custom fields yet</div>
            <div className="text-xs text-[#b3b3b3]/60">Create fields to capture industry-specific data on leads</div>
          </div>
        ) : (
          <div className="divide-y divide-[#2d2d2d]">
            {fields.map((f) => (
              <div key={f.id} className="px-6 py-4">
                {editId === f.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[#b3b3b3] mb-1">Label</label>
                      <input
                        value={editForm.label}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#0ea5e9] text-white text-sm focus:outline-none"
                      />
                    </div>
                    {f.field_type === 'dropdown' && (
                      <div>
                        <label className="block text-xs text-[#b3b3b3] mb-1">Options (one per line)</label>
                        <textarea
                          value={editForm.options}
                          onChange={(e) => setEditForm({ ...editForm, options: e.target.value })}
                          rows={3}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#0ea5e9] text-white text-sm font-mono focus:outline-none resize-none"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={editForm.is_required} onChange={(e) => setEditForm({ ...editForm, is_required: e.target.checked })} className="w-4 h-4 accent-[#0ea5e9]" />
                      <span className="text-sm text-[#b3b3b3]">Required</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-xs transition-colors">Cancel</button>
                      <button onClick={handleEditSave} disabled={saving} className="px-3 py-1.5 rounded-lg bg-[#0ea5e9] text-white text-xs hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium capitalize"
                        style={{ backgroundColor: `${fieldTypeColors[f.field_type]}20`, color: fieldTypeColors[f.field_type] }}
                      >
                        {f.field_type}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-white">{f.label}</div>
                        <div className="text-xs text-[#b3b3b3] font-mono">{f.name}
                          {f.is_required && <span className="text-[#0ea5e9] ml-2">required</span>}
                        </div>
                        {f.field_type === 'dropdown' && f.options && (
                          <div className="text-xs text-[#b3b3b3] mt-0.5">{f.options.join(' \u00B7 ')}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(f)} className="text-xs text-[#b3b3b3] hover:text-white px-2 py-1 rounded bg-[#2d2d2d] transition-colors">Edit</button>
                      <button onClick={() => handleDelete(f.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-[#2d2d2d] transition-colors">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">How Custom Fields Work</h3>
        <ul className="space-y-1.5">
          {[
            'Custom fields appear in every lead record under "Custom Fields"',
            'Field data is stored per-lead and filterable in Smart Lists',
            'Field types: Text, Number, Date, Dropdown (options), Checkbox',
            'Deleting a field definition does not erase saved data on leads',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#b3b3b3]">
              <span className="text-[#0ea5e9] mt-0.5">→</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
