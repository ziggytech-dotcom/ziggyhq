'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldType = 'name' | 'email' | 'phone' | 'company' | 'text' | 'textarea'

interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
}

interface CaptureForm {
  id: string
  title: string
  fields: FormField[]
  widget_key: string
  submission_count: number
  active: boolean
  created_at: string
}

// ── Default fields ─────────────────────────────────────────────────────────────

const FIELD_PRESETS: { type: FieldType; label: string; placeholder: string; icon: string }[] = [
  { type: 'name', label: 'Full Name', placeholder: 'Enter your name', icon: '👤' },
  { type: 'email', label: 'Email Address', placeholder: 'Enter your email', icon: '✉️' },
  { type: 'phone', label: 'Phone Number', placeholder: 'Enter your phone', icon: '📱' },
  { type: 'company', label: 'Company', placeholder: 'Enter your company', icon: '🏢' },
  { type: 'text', label: 'Custom Text Field', placeholder: 'Enter text', icon: '📝' },
  { type: 'textarea', label: 'Message / Notes', placeholder: 'Enter your message', icon: '💬' },
]

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

// ── Form Builder Modal ─────────────────────────────────────────────────────────

function FormBuilderModal({
  open,
  onClose,
  onSaved,
  editForm,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editForm?: CaptureForm | null
}) {
  const [title, setTitle] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editForm) {
      setTitle(editForm.title)
      setFields(editForm.fields)
    } else {
      setTitle('')
      setFields([
        { id: genId(), type: 'name', label: 'Full Name', placeholder: 'Enter your name', required: true },
        { id: genId(), type: 'email', label: 'Email Address', placeholder: 'Enter your email', required: false },
        { id: genId(), type: 'phone', label: 'Phone Number', placeholder: 'Enter your phone', required: false },
      ])
    }
    setError('')
  }, [editForm, open])

  const addField = (preset: typeof FIELD_PRESETS[0]) => {
    setFields((prev) => [...prev, {
      id: genId(),
      type: preset.type,
      label: preset.label,
      placeholder: preset.placeholder,
      required: false,
    }])
  }

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, ...updates } : f))
  }

  const moveField = (id: string, dir: 'up' | 'down') => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const arr = [...prev]
      const swapWith = dir === 'up' ? idx - 1 : idx + 1
      ;[arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]]
      return arr
    })
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Form title is required'); return }
    if (fields.length === 0) { setError('Add at least one field'); return }
    if (!fields.some((f) => f.type === 'name')) { setError('Form must include a Name field'); return }

    setLoading(true)
    setError('')

    const method = editForm ? 'PATCH' : 'POST'
    const url = editForm ? `/api/forms/${editForm.id}` : '/api/forms'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), fields }),
    })

    if (res.ok) {
      onSaved()
      onClose()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to save form')
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d]">
          <h2 className="text-lg font-semibold text-white">{editForm ? 'Edit Form' : 'New Lead Capture Form'}</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1.5">Form Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Contact Us, Get a Quote, Schedule a Demo"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm"
            />
          </div>

          {/* Field builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-[#b3b3b3]">Form Fields</label>
              <span className="text-xs text-[#b3b3b3]">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-2 mb-4">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2 p-3 bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg group hover:border-[#0ea5e9]/30 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveField(field.id, 'up')} disabled={idx === 0} className="text-[#b3b3b3] hover:text-white disabled:opacity-20 transition-colors text-xs leading-none">▲</button>
                    <button onClick={() => moveField(field.id, 'down')} disabled={idx === fields.length - 1} className="text-[#b3b3b3] hover:text-white disabled:opacity-20 transition-colors text-xs leading-none">▼</button>
                  </div>
                  <div className="text-base w-5">{FIELD_PRESETS.find((p) => p.type === field.type)?.icon ?? '📝'}</div>
                  <div className="flex-1 min-w-0">
                    <input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-[#b3b3b3]/50"
                      placeholder="Field label"
                    />
                    <div className="text-xs text-[#b3b3b3] capitalize">{field.type} field</div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-[#2d2d2d] bg-[#0a0a0a] accent-[#0ea5e9]"
                    />
                    <span className="text-xs text-[#b3b3b3]">Required</span>
                  </label>
                  <button
                    onClick={() => removeField(field.id)}
                    disabled={field.type === 'name'}
                    className="text-[#b3b3b3] hover:text-red-400 transition-colors disabled:opacity-20"
                    title={field.type === 'name' ? 'Name field cannot be removed' : 'Remove field'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add field presets */}
            <div className="border border-[#2d2d2d] rounded-lg p-3">
              <div className="text-xs text-[#b3b3b3] mb-2 uppercase tracking-wider">Add Field</div>
              <div className="flex flex-wrap gap-2">
                {FIELD_PRESETS.map((preset) => (
                  <button
                    key={preset.type}
                    onClick={() => addField(preset)}
                    disabled={preset.type === 'name' && fields.some((f) => f.type === 'name')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-xs hover:text-white hover:bg-[#3d3d3d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>{preset.icon}</span>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2d2d2d]">
          {error && <div className="text-sm text-red-400 mb-3">{error}</div>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : editForm ? 'Save Changes' : 'Create Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Embed Code Modal ───────────────────────────────────────────────────────────

function EmbedModal({ form, onClose }: { form: CaptureForm; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const [copiedDirect, setCopiedDirect] = useState(false)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.ziggyhq.com'
  
  const scriptCode = `<script src="${appUrl}/form-embed.js" data-form="${form.id}" data-key="${form.widget_key}"></script>`
  const directCode = `<!-- Direct iframe embed -->
<iframe
  src="${appUrl}/embed/form/${form.id}"
  style="width:100%;min-height:500px;border:none;border-radius:12px;"
  loading="lazy"
></iframe>`

  const copy = async (text: string, type: 'script' | 'direct') => {
    await navigator.clipboard.writeText(text)
    if (type === 'script') { setCopied(true); setTimeout(() => setCopied(false), 2000) }
    else { setCopiedDirect(true); setTimeout(() => setCopiedDirect(false), 2000) }
  }

  const apiEndpoint = `${appUrl}/api/forms/${form.id}/submit`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d]">
          <div>
            <h2 className="text-lg font-semibold text-white">Embed: {form.title}</h2>
            <p className="text-xs text-[#b3b3b3] mt-0.5">{form.submission_count} submission{form.submission_count !== 1 ? 's' : ''} so far</p>
          </div>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Script embed */}
          <div className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Script Embed (Recommended)</h3>
              <button
                onClick={() => copy(scriptCode, 'script')}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${copied ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20 hover:bg-[#0ea5e9]/20'}`}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <code className="text-xs text-[#22c55e] font-mono break-all leading-relaxed">{scriptCode}</code>
            <p className="text-xs text-[#b3b3b3] mt-3">Paste before the <code className="text-[#0ea5e9]">&lt;/body&gt;</code> tag. The form will render inline where you place the script.</p>
          </div>

          {/* Iframe embed */}
          <div className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">iFrame Embed</h3>
              <button
                onClick={() => copy(directCode, 'direct')}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${copiedDirect ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-[#2d2d2d] text-[#b3b3b3] hover:text-white'}`}
              >
                {copiedDirect ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <code className="text-xs text-[#b3b3b3] font-mono whitespace-pre break-all leading-relaxed">{directCode}</code>
          </div>

          {/* API endpoint */}
          <div className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Direct API (Headless)</h3>
            <code className="text-xs text-[#b3b3b3] font-mono block mb-3">POST {apiEndpoint}</code>
            <div className="bg-[#1a1a1a] rounded-lg p-3 overflow-x-auto">
              <code className="text-xs text-[#b3b3b3] font-mono whitespace-pre">{`{
  "full_name": "Jane Smith",       // required
  "email": "jane@example.com",
  "phone": "(702) 555-1234",
  "company": "Acme Corp",
  "notes": "Interested in enterprise plan"
}`}</code>
            </div>
            <p className="text-xs text-[#b3b3b3] mt-2">Submissions auto-create a contact with source = &quot;{form.title}&quot;</p>
          </div>

          {/* Form fields preview */}
          <div className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Form Fields ({form.fields.length})</h3>
            <div className="space-y-1.5">
              {form.fields.map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-xs">
                  <span className="text-[#0ea5e9]">{f.required ? '* ' : '  '}</span>
                  <span className="text-white font-medium w-32 truncate">{f.label}</span>
                  <span className="text-[#b3b3b3] capitalize px-1.5 py-0.5 bg-[#2d2d2d] rounded text-[10px]">{f.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FormsPage() {
  const [forms, setForms] = useState<CaptureForm[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editForm, setEditForm] = useState<CaptureForm | null>(null)
  const [embedForm, setEmbedForm] = useState<CaptureForm | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [setupInfo, setSetupInfo] = useState<{ setupUrl?: string; message?: string } | null>(null)

  const loadForms = useCallback(async () => {
    const res = await fetch('/api/forms')
    if (res.ok) {
      const d = await res.json()
      setForms(d.forms ?? [])
      if (d.setupRequired) {
        setSetupRequired(true)
        setSetupInfo({ setupUrl: d.setupUrl, message: d.message })
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadForms() }, [loadForms])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete form "${title}"? This will also delete all submission records.`)) return
    await fetch(`/api/forms/${id}`, { method: 'DELETE' })
    loadForms()
  }

  const handleToggle = async (form: CaptureForm) => {
    await fetch(`/api/forms/${form.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !form.active }),
    })
    loadForms()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            LEAD CAPTURE FORMS
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Embeddable forms that auto-create contacts in ZiggyHQ</p>
        </div>
        <button
          onClick={() => { setEditForm(null); setShowBuilder(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Form
        </button>
      </div>

      {/* Setup required banner */}
      {setupRequired && setupInfo && (
        <div className="mb-6 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="text-[#f59e0b] text-xl flex-shrink-0">⚠️</div>
            <div>
              <div className="text-sm font-semibold text-[#f59e0b] mb-1">Database Setup Required</div>
              <div className="text-xs text-[#b3b3b3] mb-3">{setupInfo.message}</div>
              <div className="text-xs text-white font-medium mb-2">Run this SQL in the Supabase dashboard:</div>
              <a
                href="https://supabase.com/dashboard/project/tabrmsrxtqnuwivgwggb/sql/new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] rounded-lg hover:bg-[#f59e0b]/20 transition-colors"
              >
                Open Supabase SQL Editor →
              </a>
              <div className="mt-3 bg-[#0a0a0a] rounded-lg p-3 text-xs font-mono text-[#b3b3b3] overflow-x-auto whitespace-pre leading-relaxed">
{`CREATE TABLE IF NOT EXISTS crm_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL, fields JSONB NOT NULL DEFAULT '[]',
  widget_key TEXT NOT NULL, submission_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS crm_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES crm_forms(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`}
              </div>
              <button onClick={() => { setSetupRequired(false); loadForms() }} className="mt-3 text-xs text-[#b3b3b3] hover:text-white underline">
                I&apos;ve run the SQL — check again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { icon: '🏗️', title: 'Build a Form', desc: 'Choose your fields and give the form a title' },
          { icon: '📋', title: 'Copy Embed Code', desc: 'Paste the script tag on any website or landing page' },
          { icon: '📩', title: 'Capture Leads', desc: 'Submissions auto-create contacts in ZiggyHQ' },
          { icon: '📊', title: 'Track Results', desc: 'See submission count per form in real-time' },
        ].map((step) => (
          <div key={step.title} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">{step.icon}</div>
            <div className="text-sm font-semibold text-white mb-1">{step.title}</div>
            <div className="text-xs text-[#b3b3b3]">{step.desc}</div>
          </div>
        ))}
      </div>

      {/* Forms list */}
      {loading ? (
        <div className="text-[#b3b3b3] text-sm py-8 text-center">Loading forms...</div>
      ) : forms.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-16 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-white mb-2">No forms yet</h3>
          <p className="text-[#b3b3b3] text-sm mb-6">Create your first embeddable lead capture form</p>
          <button
            onClick={() => { setEditForm(null); setShowBuilder(true) }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create First Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {forms.map((form) => (
            <div key={form.id} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden hover:border-[#0ea5e9]/30 transition-colors">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{form.title}</h3>
                    <p className="text-xs text-[#b3b3b3] mt-0.5">
                      {form.fields.length} field{form.fields.length !== 1 ? 's' : ''} · Created {new Date(form.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${form.active ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-[#2d2d2d] text-[#b3b3b3] border border-[#2d2d2d]'}`}>
                    {form.active ? 'Active' : 'Paused'}
                  </span>
                </div>

                {/* Submission count */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg px-3 py-2 flex-1">
                    <svg className="w-4 h-4 text-[#0ea5e9]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <div>
                      <div className="text-lg font-bold text-white leading-none">{form.submission_count}</div>
                      <div className="text-[10px] text-[#b3b3b3]">submissions</div>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg px-3 py-2">
                    <div className="text-[10px] text-[#b3b3b3] mb-0.5">Source tag</div>
                    <div className="text-xs text-[#0ea5e9] font-mono truncate">{form.title}</div>
                  </div>
                </div>

                {/* Fields preview */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {form.fields.map((f) => (
                    <span key={f.id} className="text-[10px] px-1.5 py-0.5 bg-[#2d2d2d] text-[#b3b3b3] rounded capitalize">
                      {f.required && <span className="text-[#0ea5e9] mr-0.5">*</span>}{f.label}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEmbedForm(form)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0ea5e9] text-white rounded-lg text-xs font-medium hover:bg-[#0ea5e9]/90 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    Get Embed Code
                  </button>
                  <button
                    onClick={() => { setEditForm(form); setShowBuilder(true) }}
                    className="px-3 py-2 bg-[#2d2d2d] text-[#b3b3b3] rounded-lg text-xs hover:text-white transition-colors"
                    title="Edit form"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button
                    onClick={() => handleToggle(form)}
                    className="px-3 py-2 bg-[#2d2d2d] text-[#b3b3b3] rounded-lg text-xs hover:text-white transition-colors"
                    title={form.active ? 'Pause form' : 'Activate form'}
                  >
                    {form.active ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(form.id, form.title)}
                    className="px-3 py-2 bg-[#2d2d2d] text-[#b3b3b3] rounded-lg text-xs hover:text-red-400 transition-colors"
                    title="Delete form"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <FormBuilderModal
        open={showBuilder}
        onClose={() => { setShowBuilder(false); setEditForm(null) }}
        onSaved={loadForms}
        editForm={editForm}
      />
      {embedForm && (
        <EmbedModal form={embedForm} onClose={() => setEmbedForm(null)} />
      )}
    </div>
  )
}
