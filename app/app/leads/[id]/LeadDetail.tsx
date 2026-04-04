'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Lead {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  phone_2: string | null
  email_2: string | null
  co_buyer_name: string | null
  loan_amount: number | null
  loan_type: string | null
  lender_id: string | null
  lender_name: string | null
  lender_phone: string | null
  lender_email: string | null
  commission_split: string | null
  referral_agent_name: string | null
  referral_agent_phone: string | null
  referral_fee_pct: number | null
  source: string | null
  stage: string | null
  status: string
  lead_score: number
  notes: string | null
  budget_min: number | null
  budget_max: number | null
  timeline: string | null
  pre_approved: boolean
  property_type: string | null
  bedrooms: number | null
  areas_of_interest: string[]
  tags: string[]
  last_contacted_at: string | null
  next_followup_at: string | null
  created_at: string
  assigned_to: string | null
  users?: { id: string; full_name: string | null; email: string } | null
}

interface Activity {
  id: string
  type: string
  direction: string | null
  content: string | null
  duration_seconds: number | null
  created_at: string
  users?: { full_name: string | null; email: string } | null
}

interface Note {
  id: string
  content: string
  pinned: boolean
  created_at: string
  users?: { full_name: string | null; email: string } | null
}

interface TeamMember {
  id: string
  full_name: string | null
  email: string
}

interface Lender {
  id: string
  name: string
  company: string | null
  phone: string | null
  email: string | null
}

interface CustomFieldDef {
  id: string
  name: string
  label: string
  field_type: string
  options: string[] | null
  is_required: boolean
  position: number
}

interface EmailAccount {
  id: string
  email: string
  provider: string
}

const PROPERTY_TYPES = ['Single Family', 'Condo/Townhouse', 'Multi-Family', 'Land', 'Commercial', 'Mobile/Manufactured', 'Other']
const LOAN_TYPES = ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'Non-QM', 'Cash', 'Other']

function formatCurrency(val: number | null) {
  if (!val) return ''
  return '$' + val.toLocaleString('en-US')
}

interface ActionPlan {
  id: string
  name: string
  trigger_event: string
  is_active: boolean
}

interface Enrollment {
  id: string
  status: string
  current_step: number
  started_at: string
  action_plans?: { name: string } | null
}

const activityColors: Record<string, string> = {
  call: '#3b82f6',
  sms: '#22c55e',
  sms_sent: '#22c55e',
  sms_received: '#b3b3b3',
  email: '#f59e0b',
  email_sent: '#f59e0b',
  email_received: '#22c55e',
  note: '#b3b3b3',
  stage_change: '#0ea5e9',
  assignment: '#8b5cf6',
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: '#22c55e20', text: '#22c55e', border: '#22c55e40' },
  nurture: { bg: '#f59e0b20', text: '#f59e0b', border: '#f59e0b40' },
  dead: { bg: '#b3b3b320', text: '#b3b3b3', border: '#b3b3b340' },
  won: { bg: '#0ea5e920', text: '#0ea5e9', border: '#0ea5e940' },
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function LeadDetail({
  lead: initialLead,
  activities: initialActivities,
  notes: initialNotes,
  team,
  stages,
  sources,
  actionPlans,
  enrollments: initialEnrollments,
  lenders,
  orgId,
  customFieldDefs,
  emailAccounts,
  twilioConnected,
}: {
  lead: Lead
  activities: Activity[]
  notes: Note[]
  team: TeamMember[]
  stages: string[]
  sources: string[]
  actionPlans: ActionPlan[]
  enrollments: Enrollment[]
  lenders: Lender[]
  orgId: string
  customFieldDefs: CustomFieldDef[]
  emailAccounts: EmailAccount[]
  twilioConnected: boolean
}) {
  const router = useRouter()
  const [lead, setLead] = useState(initialLead)
  const [activities, setActivities] = useState(initialActivities)
  const [notes, setNotes] = useState(initialNotes)
  const [enrollments, setEnrollments] = useState(initialEnrollments)
  const [saving, setSaving] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [enrollingPlan, setEnrollingPlan] = useState('')
  const [editField, setEditField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [aiCalling, setAiCalling] = useState(false)
  const [aiCallStatus, setAiCallStatus] = useState<string | null>(null)
  const [aiScriptType, setAiScriptType] = useState('new_lead')
  const [showAiMenu, setShowAiMenu] = useState(false)

  // Log Call modal
  const [showLogCall, setShowLogCall] = useState(false)
  const [callForm, setCallForm] = useState({ outcome: 'connected', duration_minutes: '', notes: '', next_followup_date: '' })
  const [loggingCall, setLoggingCall] = useState(false)

  // Compose Email modal
  const [showCompose, setShowCompose] = useState(false)
  const [composeForm, setComposeForm] = useState({ account_id: '', subject: '', body: '' })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [composeError, setComposeError] = useState('')

  // SMS modal
  const [showSmsSend, setShowSmsSend] = useState(false)
  const [smsMessage, setSmsMessage] = useState('')
  const [sendingSms, setSendingSms] = useState(false)
  const [smsError, setSmsError] = useState('')

  // Custom fields
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(
    (initialLead as unknown as { custom_fields_json: Record<string, unknown> }).custom_fields_json ?? {}
  )
  const [savingCustomField, setSavingCustomField] = useState<string | null>(null)

  const updateLead = async (updates: Partial<Lead>) => {
    setSaving(true)
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const data = await res.json()
      setLead((prev) => ({ ...prev, ...data.lead }))
    }
    setSaving(false)
  }

  const startEdit = (field: string, value: string) => {
    setEditField(field)
    setEditValue(value ?? '')
  }

  const saveEdit = async () => {
    if (!editField) return
    // Strip formatting for phone fields before saving
    const phoneFields = ['phone', 'phone_2', 'lender_phone']
    const valueToSave = phoneFields.includes(editField)
      ? editValue.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
      : editValue
    await updateLead({ [editField]: valueToSave || null })
    setEditField(null)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneFields = ['phone', 'phone_2', 'lender_phone']
    if (editField && phoneFields.includes(editField)) {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
      let formatted = digits
      if (digits.length > 6) formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
      else if (digits.length > 3) formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`
      setEditValue(formatted)
    } else {
      setEditValue(e.target.value)
    }
  }

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    setAddingNote(true)
    const res = await fetch(`/api/leads/${lead.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNote }),
    })
    if (res.ok) {
      const data = await res.json()
      setNotes((prev) => [data.note, ...prev])
      setNewNote('')
    }
    setAddingNote(false)
  }

  const initiateAiCall = async () => {
    if (!lead.phone) return
    setAiCalling(true)
    setAiCallStatus(null)
    const res = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id, phone: lead.phone, lead_name: lead.full_name, script_type: aiScriptType }),
    })
    const data = await res.json()
    if (res.ok) {
      setAiCallStatus(`AI call initiated ✓ (ID: ${data.call_id})`)
      const activity: Activity = { id: data.call_id, type: 'call', direction: null, content: `AI call initiated to ${data.phone} via Bland.ai`, created_at: new Date().toISOString(), duration_seconds: null, users: null }
      setActivities((prev) => [activity, ...prev])
    } else {
      setAiCallStatus(`Error: ${data.error}`)
    }
    setAiCalling(false)
    setTimeout(() => setAiCallStatus(null), 6000)
  }

  const deleteLead = async () => {
    if (!confirm(`Delete "${lead.full_name}"? This cannot be undone.`)) return
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    router.push('/app/leads')
  }

  const toggleTag = async (tag: string) => {
    const current = lead.tags ?? []
    const updated = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    await updateLead({ tags: updated })
  }

  const COMMON_TAGS = ['Hot', 'Warm', 'Cold', 'Investor', 'First-Time Buyer', 'Relocating', 'Downsizing', 'Upsizing', 'Cash Buyer', 'Military', 'Referral']

  const enrollInPlan = async () => {
    if (!enrollingPlan) return
    const res = await fetch(`/api/action-plans/${enrollingPlan}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id }),
    })
    if (res.ok) {
      router.refresh()
    }
    setEnrollingPlan('')
  }

  const statusStyle = statusColors[lead.status] ?? statusColors.active

  const logCall = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoggingCall(true)
    const res = await fetch('/api/calls/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: lead.id,
        outcome: callForm.outcome,
        duration_minutes: callForm.duration_minutes || undefined,
        notes: callForm.notes || undefined,
        next_followup_date: callForm.next_followup_date || undefined,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setActivities((prev) => [data.activity, ...prev])
      if (callForm.next_followup_date) {
        setLead((prev) => ({ ...prev, next_followup_at: new Date(callForm.next_followup_date).toISOString() }))
      }
      setShowLogCall(false)
      setCallForm({ outcome: 'connected', duration_minutes: '', notes: '', next_followup_date: '' })
    }
    setLoggingCall(false)
  }

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendingEmail(true)
    setComposeError('')
    const res = await fetch('/api/gmail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: lead.id,
        account_id: composeForm.account_id,
        to: lead.email,
        subject: composeForm.subject,
        body: composeForm.body,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setActivities((prev) => [data.activity, ...prev])
      setShowCompose(false)
      setComposeForm({ account_id: '', subject: '', body: '' })
    } else {
      const d = await res.json()
      setComposeError(d.error ?? 'Send failed')
    }
    setSendingEmail(false)
  }

  const sendSms = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendingSms(true)
    setSmsError('')
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id, message: smsMessage }),
    })
    if (res.ok) {
      const data = await res.json()
      const activity: Activity = {
        id: data.sid ?? Date.now().toString(),
        type: 'sms_sent',
        direction: 'outbound',
        content: smsMessage,
        duration_seconds: null,
        created_at: new Date().toISOString(),
        users: null,
      }
      setActivities((prev) => [activity, ...prev])
      setShowSmsSend(false)
      setSmsMessage('')
    } else {
      const d = await res.json()
      setSmsError(d.error ?? 'Send failed')
    }
    setSendingSms(false)
  }

  const saveCustomField = async (fieldName: string, value: unknown) => {
    setSavingCustomField(fieldName)
    const updated = { ...customFields, [fieldName]: value }
    setCustomFields(updated)
    await fetch(`/api/leads/${lead.id}/custom-fields`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { [fieldName]: value } }),
    })
    setSavingCustomField(null)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <Link href="/app/leads" className="mt-1 text-[#b3b3b3] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '32px', letterSpacing: '0.05em', color: '#ededed' }}>
                {lead.full_name}
              </h1>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium capitalize"
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
              >
                {lead.status}
              </span>
              {saving && <span className="text-xs text-[#b3b3b3]">Saving...</span>}
            </div>
            <div className="flex items-center gap-4 text-sm text-[#b3b3b3]">
              {lead.stage && <span className="text-[#0ea5e9]">{lead.stage}</span>}
              {lead.source && <span>{lead.source}</span>}
              <span className="flex items-center gap-1.5">Score:
                <span className="text-white font-medium">{lead.lead_score}</span>
                <div className="w-16 h-1.5 rounded-full bg-[#2d2d2d] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${lead.lead_score}%`, backgroundColor: lead.lead_score >= 70 ? '#22c55e' : lead.lead_score >= 40 ? '#f59e0b' : '#0ea5e9' }} />
                </div>
              </span>
              <span>Added {timeAgo(lead.created_at)}</span>
            </div>
          </div>
        </div>
        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 text-sm hover:bg-[#3b82f6]/30 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Call
            </a>
          )}
          {lead.phone && (
            <button
              onClick={() => setShowLogCall(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 text-sm hover:bg-[#3b82f6]/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Log Call
            </button>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 text-sm hover:bg-[#f59e0b]/30 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Email
            </a>
          )}
          {lead.email && emailAccounts.length > 0 && (
            <button
              onClick={() => { setComposeForm((f) => ({ ...f, account_id: emailAccounts[0]?.id ?? '' })); setShowCompose(true) }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 text-sm hover:bg-[#f59e0b]/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Compose
            </button>
          )}
          {lead.phone && (
            twilioConnected ? (
              <button
                onClick={() => setShowSmsSend(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 text-sm hover:bg-[#22c55e]/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Send SMS
              </button>
            ) : (
              <a
                href="/app/settings/integrations"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] border border-[#2d2d2d] text-sm hover:text-white transition-colors"
                title="Connect Twilio in Settings to enable SMS"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Connect Twilio in Settings
              </a>
            )
          )}
          {lead.phone && (
            <div className="relative">
              <div className="flex items-center rounded-lg overflow-hidden border border-[#8b5cf6]/30">
                <button
                  onClick={initiateAiCall}
                  disabled={aiCalling}
                  title="AI calls the lead, qualifies them, and logs the transcript automatically"
                  className="flex items-center gap-2 px-3 py-2 bg-[#8b5cf6]/20 text-[#8b5cf6] text-sm hover:bg-[#8b5cf6]/30 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>
                  {aiCalling ? 'Calling...' : `AI Call`}
                </button>
                <button onClick={() => setShowAiMenu((p) => !p)} className="px-2 py-2 bg-[#8b5cf6]/20 text-[#8b5cf6] hover:bg-[#8b5cf6]/30 border-l border-[#8b5cf6]/20 transition-colors text-xs">▾</button>
              </div>
              {showAiMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-2 z-20 min-w-[180px] shadow-xl">
                  <div className="text-[10px] text-[#b3b3b3] uppercase tracking-wider px-2 mb-1">Script Type</div>
                  {[
                    { key: 'new_lead', label: '🏠 New Lead' },
                    { key: 'home_value', label: '💰 Home Value Request' },
                    { key: 'listing_inquiry', label: '📋 Listing Inquiry' },
                  ].map((s) => (
                    <button key={s.key} onClick={() => { setAiScriptType(s.key); setShowAiMenu(false) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${aiScriptType === s.key ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' : 'text-[#b3b3b3] hover:text-white hover:bg-[#2d2d2d]'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={deleteLead} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/20 text-red-400 border border-red-900/40 text-sm hover:bg-red-900/30 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
        </div>
      </div>

      {aiCallStatus && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${aiCallStatus.startsWith('Error') ? 'bg-red-900/20 border border-red-900/40 text-red-400' : 'bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6]'}`}>
          {aiCallStatus}
        </div>
      )}

      {/* Log Call Modal */}
      {showLogCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowLogCall(false)} />
          <div className="relative w-full max-w-md bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Log Call</h2>
              <button onClick={() => setShowLogCall(false)} className="text-[#b3b3b3] hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={logCall} className="space-y-4">
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">Outcome *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'connected', label: 'Connected', color: '#22c55e' },
                    { value: 'no_answer', label: 'No Answer', color: '#f59e0b' },
                    { value: 'voicemail', label: 'Voicemail', color: '#0ea5e9' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCallForm((f) => ({ ...f, outcome: opt.value }))}
                      className="py-2.5 rounded-lg border text-sm font-medium transition-colors"
                      style={callForm.outcome === opt.value
                        ? { backgroundColor: `${opt.color}20`, color: opt.color, borderColor: `${opt.color}40` }
                        : { backgroundColor: '#0a0a0a', color: '#b3b3b3', borderColor: '#2d2d2d' }
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">Duration (minutes)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={callForm.duration_minutes}
                  onChange={(e) => setCallForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">Call Notes</label>
                <textarea
                  value={callForm.notes}
                  onChange={(e) => setCallForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="What was discussed..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">Next Follow-up Date</label>
                <input
                  type="date"
                  value={callForm.next_followup_date}
                  onChange={(e) => setCallForm((f) => ({ ...f, next_followup_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowLogCall(false)} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={loggingCall} className="flex-1 py-2.5 rounded-lg bg-[#3b82f6] text-white text-sm font-medium hover:bg-[#3b82f6]/90 disabled:opacity-50 transition-colors">
                  {loggingCall ? 'Saving...' : 'Log Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCompose(false)} />
          <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Compose Email</h2>
              <button onClick={() => setShowCompose(false)} className="text-[#b3b3b3] hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={sendEmail} className="space-y-4">
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">From Account *</label>
                <select
                  required
                  value={composeForm.account_id}
                  onChange={(e) => setComposeForm((f) => ({ ...f, account_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
                >
                  <option value="">Select account...</option>
                  {emailAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.email} ({a.provider})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">To</label>
                <div className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-[#b3b3b3] text-sm">{lead.email}</div>
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">Subject *</label>
                <input
                  required
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">Message *</label>
                <textarea
                  required
                  value={composeForm.body}
                  onChange={(e) => setComposeForm((f) => ({ ...f, body: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm resize-none"
                />
              </div>
              {composeError && (
                <div className="px-3 py-2 rounded-lg bg-red-900/20 border border-red-900/40 text-red-400 text-sm">{composeError}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCompose(false)} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={sendingEmail} className="flex-1 py-2.5 rounded-lg bg-[#f59e0b] text-white text-sm font-medium hover:bg-[#f59e0b]/90 disabled:opacity-50 transition-colors">
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS Compose Modal */}
      {showSmsSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSmsSend(false)} />
          <div className="relative w-full max-w-md bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Send SMS</h2>
              <button onClick={() => setShowSmsSend(false)} className="text-[#b3b3b3] hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={sendSms} className="space-y-4">
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">To</label>
                <div className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-[#b3b3b3] text-sm">{lead.phone}</div>
              </div>
              <div>
                <label className="block text-sm text-[#b3b3b3] mb-1.5">Message *</label>
                <textarea
                  required
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={4}
                  maxLength={1600}
                  placeholder="Type your SMS message..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#22c55e] text-sm resize-none"
                />
                <div className="text-xs text-[#b3b3b3]/60 text-right mt-1">{smsMessage.length}/1600</div>
              </div>
              {smsError && (
                <div className="px-3 py-2 rounded-lg bg-red-900/20 border border-red-900/40 text-red-400 text-sm">{smsError}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowSmsSend(false)} className="flex-1 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={sendingSms || !smsMessage.trim()} className="flex-1 py-2.5 rounded-lg bg-[#22c55e] text-white text-sm font-medium hover:bg-[#22c55e]/90 disabled:opacity-50 transition-colors">
                  {sendingSms ? 'Sending...' : 'Send SMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Lead Info */}
        <div className="col-span-1 space-y-4">
          {/* Contact */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-4">Contact</h3>
            <div className="space-y-3">
              {[
                { key: 'full_name', label: 'Name', value: lead.full_name },
                { key: 'co_buyer_name', label: 'Co-Buyer / Partner', value: lead.co_buyer_name },
                { key: 'email', label: 'Email', value: lead.email },
                { key: 'email_2', label: 'Email 2', value: lead.email_2 },
                { key: 'phone', label: 'Phone', value: lead.phone },
                { key: 'phone_2', label: 'Phone 2', value: lead.phone_2 },
              ].map((field) => (
                <div key={field.key}>
                  <div className="text-xs text-[#b3b3b3] mb-0.5">{field.label}</div>
                  {editField === field.key ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={handleEditChange}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditField(null) }}
                        className="flex-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#0ea5e9] text-white text-sm focus:outline-none"
                      />
                      <button onClick={saveEdit} className="text-[#22c55e] text-xs hover:underline">Save</button>
                    </div>
                  ) : (
                    <div
                      className="text-sm text-white cursor-pointer hover:text-[#0ea5e9] transition-colors group flex items-center gap-1"
                      onClick={() => startEdit(field.key, field.value ?? '')}
                    >
                      {field.value ?? <span className="text-[#b3b3b3]/50 italic">Not set</span>}
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-4">Pipeline</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[#b3b3b3] mb-1">Stage</div>
                <select
                  value={lead.stage ?? ''}
                  onChange={(e) => updateLead({ stage: e.target.value || null })}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]"
                >
                  <option value="">No stage</option>
                  {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-[#b3b3b3] mb-1">Status</div>
                <select
                  value={lead.status}
                  onChange={(e) => updateLead({ status: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]"
                >
                  <option value="active">Active</option>
                  <option value="nurture">Nurture</option>
                  <option value="dead">Dead</option>
                  <option value="won">Won</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-[#b3b3b3] mb-1">Source</div>
                <select
                  value={lead.source ?? ''}
                  onChange={(e) => updateLead({ source: e.target.value || null })}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]"
                >
                  <option value="">No source</option>
                  {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-[#b3b3b3] mb-1">Assigned Agent</div>
                <select
                  value={lead.assigned_to ?? ''}
                  onChange={(e) => updateLead({ assigned_to: e.target.value || null })}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]"
                >
                  <option value="">Unassigned</option>
                  {team.map((m) => <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-3">
              {/* Budget -- inline edit */}
              <div>
                <div className="text-xs text-[#b3b3b3] mb-0.5">Budget Min</div>
                {editField === 'budget_min' ? (
                  <div className="flex gap-2">
                    <input autoFocus value={editValue} onChange={(e) => { const d = e.target.value.replace(/\D/g,''); setEditValue(d ? '$'+parseInt(d).toLocaleString() : '') }} onKeyDown={(e) => { if (e.key==='Enter') { updateLead({ budget_min: editValue ? parseInt(editValue.replace(/\D/g,'')) : null }); setEditField(null) } if (e.key==='Escape') setEditField(null) }} className="flex-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#0ea5e9] text-white text-sm focus:outline-none" />
                    <button onClick={() => { updateLead({ budget_min: editValue ? parseInt(editValue.replace(/\D/g,'')) : null }); setEditField(null) }} className="text-[#22c55e] text-xs hover:underline">Save</button>
                  </div>
                ) : (
                  <div className="text-sm text-white cursor-pointer hover:text-[#0ea5e9] group flex items-center gap-1" onClick={() => startEdit('budget_min', lead.budget_min ? '$'+lead.budget_min.toLocaleString() : '')}>
                    {lead.budget_min ? formatCurrency(lead.budget_min) : <span className="text-[#b3b3b3]/50 italic">Not set</span>}
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-[#b3b3b3] mb-0.5">Budget Max</div>
                {editField === 'budget_max' ? (
                  <div className="flex gap-2">
                    <input autoFocus value={editValue} onChange={(e) => { const d = e.target.value.replace(/\D/g,''); setEditValue(d ? '$'+parseInt(d).toLocaleString() : '') }} onKeyDown={(e) => { if (e.key==='Enter') { updateLead({ budget_max: editValue ? parseInt(editValue.replace(/\D/g,'')) : null }); setEditField(null) } if (e.key==='Escape') setEditField(null) }} className="flex-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#0ea5e9] text-white text-sm focus:outline-none" />
                    <button onClick={() => { updateLead({ budget_max: editValue ? parseInt(editValue.replace(/\D/g,'')) : null }); setEditField(null) }} className="text-[#22c55e] text-xs hover:underline">Save</button>
                  </div>
                ) : (
                  <div className="text-sm text-white cursor-pointer hover:text-[#0ea5e9] group flex items-center gap-1" onClick={() => startEdit('budget_max', lead.budget_max ? '$'+lead.budget_max.toLocaleString() : '')}>
                    {lead.budget_max ? formatCurrency(lead.budget_max) : <span className="text-[#b3b3b3]/50 italic">Not set</span>}
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                )}
              </div>
              {/* Timeline -- inline edit */}
              <div>
                <div className="text-xs text-[#b3b3b3] mb-0.5">Timeline</div>
                {editField === 'timeline' ? (
                  <div className="flex gap-2">
                    <input autoFocus value={editValue} onChange={handleEditChange} onKeyDown={(e) => { if (e.key==='Enter') saveEdit(); if (e.key==='Escape') setEditField(null) }} className="flex-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#0ea5e9] text-white text-sm focus:outline-none" />
                    <button onClick={saveEdit} className="text-[#22c55e] text-xs hover:underline">Save</button>
                  </div>
                ) : (
                  <div className="text-sm text-white cursor-pointer hover:text-[#0ea5e9] group flex items-center gap-1" onClick={() => startEdit('timeline', lead.timeline ?? '')}>
                    {lead.timeline ?? <span className="text-[#b3b3b3]/50 italic">Not set</span>}
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                )}
              </div>
              {/* Property Type -- dropdown */}
              <div>
                <div className="text-xs text-[#b3b3b3] mb-1">Property Type</div>
                <select value={lead.property_type ?? ''} onChange={(e) => updateLead({ property_type: e.target.value || null })} className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]">
                  <option value="">Not set</option>
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* Pre-approval */}
              <div className="pt-1 border-t border-[#2d2d2d]">
                <div className="flex items-center gap-2 mb-3">
                  <input type="checkbox" checked={lead.pre_approved} onChange={(e) => updateLead({ pre_approved: e.target.checked })} className="w-4 h-4 accent-[#0ea5e9]" id="pre_approved" />
                  <label htmlFor="pre_approved" className="text-sm text-white font-medium">Pre-Approved</label>
                </div>
                {lead.pre_approved && (
                  <div className="space-y-2 pl-1">
                    {/* Loan Amount */}
                    <div>
                      <div className="text-xs text-[#b3b3b3] mb-0.5">Loan Amount</div>
                      {editField === 'loan_amount' ? (
                        <div className="flex gap-2">
                          <input autoFocus value={editValue} onChange={(e) => { const d = e.target.value.replace(/\D/g,''); setEditValue(d ? '$'+parseInt(d).toLocaleString() : '') }} onKeyDown={(e) => { if (e.key==='Enter') { updateLead({ loan_amount: editValue ? parseInt(editValue.replace(/\D/g,'')) : null }); setEditField(null) } if (e.key==='Escape') setEditField(null) }} className="flex-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#0ea5e9] text-white text-sm focus:outline-none" />
                          <button onClick={() => { updateLead({ loan_amount: editValue ? parseInt(editValue.replace(/\D/g,'')) : null }); setEditField(null) }} className="text-[#22c55e] text-xs hover:underline">Save</button>
                        </div>
                      ) : (
                        <div className="text-sm text-white cursor-pointer hover:text-[#0ea5e9] group flex items-center gap-1" onClick={() => startEdit('loan_amount', lead.loan_amount ? '$'+lead.loan_amount.toLocaleString() : '')}>
                          {lead.loan_amount ? formatCurrency(lead.loan_amount) : <span className="text-[#b3b3b3]/50 italic">Not set</span>}
                          <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </div>
                      )}
                    </div>
                    {/* Loan Type */}
                    <div>
                      <div className="text-xs text-[#b3b3b3] mb-1">Loan Type</div>
                      <select value={lead.loan_type ?? ''} onChange={(e) => updateLead({ loan_type: e.target.value || null })} className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]">
                        <option value="">Not set</option>
                        {LOAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {/* Lender -- partner autopopulate or manual */}
                    <div>
                      <div className="text-xs text-[#b3b3b3] mb-1">Lender</div>
                      <select
                        value={lead.lender_id ?? ''}
                        onChange={(e) => {
                          const selected = lenders.find((l) => l.id === e.target.value)
                          if (selected) {
                            updateLead({ lender_id: selected.id, lender_name: selected.name, lender_phone: selected.phone, lender_email: selected.email })
                          } else {
                            updateLead({ lender_id: null })
                          }
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9] mb-2"
                      >
                        <option value="">Select partner lender...</option>
                        {lenders.map((l) => <option key={l.id} value={l.id}>{l.name}{l.company ? ` -- ${l.company}` : ''}</option>)}
                      </select>
                      {/* Manual lender fields */}
                      {[
                        { key: 'lender_name', label: 'Lender Name', value: lead.lender_name },
                        { key: 'lender_phone', label: 'Lender Phone', value: lead.lender_phone },
                        { key: 'lender_email', label: 'Lender Email', value: lead.lender_email },
                      ].map((field) => (
                        <div key={field.key} className="mb-1.5">
                          <div className="text-xs text-[#b3b3b3] mb-0.5">{field.label}</div>
                          {editField === field.key ? (
                            <div className="flex gap-2">
                              <input autoFocus value={editValue} onChange={handleEditChange} onKeyDown={(e) => { if (e.key==='Enter') saveEdit(); if (e.key==='Escape') setEditField(null) }} className="flex-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#0ea5e9] text-white text-sm focus:outline-none" />
                              <button onClick={saveEdit} className="text-[#22c55e] text-xs hover:underline">Save</button>
                            </div>
                          ) : (
                            <div className="text-sm text-white cursor-pointer hover:text-[#0ea5e9] group flex items-center gap-1" onClick={() => startEdit(field.key, field.value ?? '')}>
                              {field.value ?? <span className="text-[#b3b3b3]/50 italic">Not set</span>}
                              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {lead.next_followup_at && (
                <div>
                  <div className="text-xs text-[#b3b3b3] mb-0.5">Next Follow-up</div>
                  <div className={`text-sm font-medium ${new Date(lead.next_followup_at) < new Date() ? 'text-[#0ea5e9]' : 'text-white'}`}>
                    {new Date(lead.next_followup_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Commission & Referral */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-4">Commission & Referral</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[#b3b3b3] mb-0.5">Commission Split</div>
                {editField === 'commission_split' ? (
                  <div className="flex gap-2">
                    <input autoFocus value={editValue} onChange={handleEditChange} placeholder="e.g. 70/30" onKeyDown={(e) => { if (e.key==='Enter') saveEdit(); if (e.key==='Escape') setEditField(null) }} className="flex-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#0ea5e9] text-white text-sm focus:outline-none" />
                    <button onClick={saveEdit} className="text-[#22c55e] text-xs hover:underline">Save</button>
                  </div>
                ) : (
                  <div className="text-sm text-white cursor-pointer hover:text-[#0ea5e9] group flex items-center gap-1" onClick={() => startEdit('commission_split', lead.commission_split ?? '')}>
                    {lead.commission_split ?? <span className="text-[#b3b3b3]/50 italic">Not set</span>}
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-[#2d2d2d]">
                <div className="text-xs text-[#b3b3b3] mb-2 font-medium">Referral</div>
                {[
                  { key: 'referral_agent_name', label: 'Referral Agent' },
                  { key: 'referral_agent_phone', label: 'Referral Phone' },
                  { key: 'referral_fee_pct', label: 'Referral Fee %' },
                ].map((field) => (
                  <div key={field.key} className="mb-2">
                    <div className="text-xs text-[#b3b3b3] mb-0.5">{field.label}</div>
                    {editField === field.key ? (
                      <div className="flex gap-2">
                        <input autoFocus value={editValue} onChange={field.key === 'referral_agent_phone' ? (e) => { const d = e.target.value.replace(/\D/g,'').slice(0,10); let f = d; if (d.length>6) f=`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`; else if (d.length>3) f=`(${d.slice(0,3)}) ${d.slice(3)}`; setEditValue(f) } : handleEditChange} onKeyDown={(e) => { if (e.key==='Enter') saveEdit(); if (e.key==='Escape') setEditField(null) }} className="flex-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#0ea5e9] text-white text-sm focus:outline-none" />
                        <button onClick={saveEdit} className="text-[#22c55e] text-xs hover:underline">Save</button>
                      </div>
                    ) : (
                      <div className="text-sm text-white cursor-pointer hover:text-[#0ea5e9] group flex items-center gap-1" onClick={() => startEdit(field.key, ((lead as unknown) as Record<string, string>)[field.key] ?? '')}>
                        {((lead as unknown) as Record<string, string>)[field.key] ?? <span className="text-[#b3b3b3]/50 italic">Not set</span>}
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#b3b3b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map((tag) => {
                const active = (lead.tags ?? []).includes(tag)
                return (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 rounded-full text-xs transition-colors ${active ? 'bg-[#0ea5e9] text-white' : 'bg-[#2d2d2d] text-[#b3b3b3] hover:bg-[#3d3d3d]'}`}>
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Fields */}
          {customFieldDefs.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
              <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-4">Custom Fields</h3>
              <div className="space-y-3">
                {customFieldDefs.map((def) => {
                  const value = customFields[def.name]
                  return (
                    <div key={def.id}>
                      <div className="text-xs text-[#b3b3b3] mb-1">{def.label}{def.is_required && <span className="text-[#0ea5e9] ml-1">*</span>}</div>
                      {def.field_type === 'checkbox' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => saveCustomField(def.name, e.target.checked)}
                            className="w-4 h-4 accent-[#0ea5e9]"
                          />
                          <span className="text-sm text-[#b3b3b3]">{value ? 'Yes' : 'No'}</span>
                          {savingCustomField === def.name && <span className="text-xs text-[#b3b3b3]">Saving...</span>}
                        </div>
                      ) : def.field_type === 'dropdown' ? (
                        <select
                          value={(value as string) ?? ''}
                          onChange={(e) => saveCustomField(def.name, e.target.value || null)}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]"
                        >
                          <option value="">Not set</option>
                          {(def.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : def.field_type === 'date' ? (
                        <input
                          type="date"
                          value={(value as string) ?? ''}
                          onChange={(e) => saveCustomField(def.name, e.target.value || null)}
                          onBlur={(e) => saveCustomField(def.name, e.target.value || null)}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]"
                        />
                      ) : (
                        <input
                          type={def.field_type === 'number' ? 'number' : 'text'}
                          value={(value as string) ?? ''}
                          onChange={(e) => setCustomFields((f) => ({ ...f, [def.name]: e.target.value }))}
                          onBlur={(e) => saveCustomField(def.name, e.target.value || null)}
                          placeholder={`Enter ${def.label.toLowerCase()}...`}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lead Score */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-3">Lead Score</h3>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} value={lead.lead_score}
                onChange={(e) => setLead((prev) => ({ ...prev, lead_score: parseInt(e.target.value) }))}
                onMouseUp={(e) => updateLead({ lead_score: parseInt((e.target as HTMLInputElement).value) })}
                onTouchEnd={(e) => updateLead({ lead_score: parseInt((e.target as HTMLInputElement).value) })}
                className="flex-1 accent-[#0ea5e9]" />
              <span className="text-white font-bold text-lg w-8 text-right">{lead.lead_score}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[#2d2d2d] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${lead.lead_score}%`, backgroundColor: lead.lead_score >= 70 ? '#22c55e' : lead.lead_score >= 40 ? '#f59e0b' : '#0ea5e9' }} />
            </div>
          </div>

          {/* Action Plans */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-4">Action Plans</h3>
            {enrollments.length > 0 && (
              <div className="space-y-2 mb-3">
                {enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-xs">
                    <span className="text-white">{e.action_plans?.name ?? 'Unknown plan'}</span>
                    <span className={`capitalize px-1.5 py-0.5 rounded ${e.status === 'active' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#2d2d2d] text-[#b3b3b3]'}`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <select value={enrollingPlan} onChange={(e) => setEnrollingPlan(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-xs focus:outline-none focus:border-[#0ea5e9]">
                <option value="">Select plan...</option>
                {actionPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={enrollInPlan} disabled={!enrollingPlan} className="px-3 py-1.5 rounded-lg bg-[#0ea5e9] text-white text-xs hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors">
                Enroll
              </button>
            </div>
          </div>
        </div>

        {/* Right: Activity Timeline */}
        <div className="col-span-2 space-y-4">
          {/* Add Note */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-3">Add Note</h3>
            <form onSubmit={addNote} className="flex gap-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write a note..."
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm resize-none"
              />
              <button type="submit" disabled={addingNote || !newNote.trim()} className="px-4 py-2 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 self-end transition-colors">
                Add
              </button>
            </form>
          </div>

          {/* Notes */}
          {notes.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
              <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-4">Notes</h3>
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className={`p-3 rounded-lg ${note.pinned ? 'bg-[#0ea5e9]/10 border border-[#0ea5e9]/20' : 'bg-[#0a0a0a] border border-[#2d2d2d]'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm text-white whitespace-pre-wrap flex-1">{note.content}</p>
                      {note.pinned && <span className="text-[#0ea5e9] text-xs flex-shrink-0">📌 Pinned</span>}
                    </div>
                    <div className="text-xs text-[#b3b3b3]/60">
                      {note.users?.full_name ?? note.users?.email} &middot; {timeAgo(note.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-4">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="text-[#b3b3b3] text-sm">No activity yet</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, idx) => {
                  // SMS bubble rendering
                  if (activity.type === 'sms_sent' || activity.type === 'sms_received') {
                    const isSent = activity.type === 'sms_sent'
                    return (
                      <div key={activity.id} className={`flex mb-3 ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isSent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div
                            className="px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words"
                            style={isSent
                              ? { backgroundColor: '#22c55e20', border: '1px solid #22c55e40', color: '#e2e8f0', borderBottomRightRadius: '4px' }
                              : { backgroundColor: '#2d2d2d', border: '1px solid #3d3d3d', color: '#e2e8f0', borderBottomLeftRadius: '4px' }
                            }
                          >
                            {activity.content}
                          </div>
                          <span className="text-[10px] text-[#b3b3b3]/60 px-1">{timeAgo(activity.created_at)}</span>
                        </div>
                      </div>
                    )
                  }

                  return (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${activityColors[activity.type] ?? '#b3b3b3'}20`, border: `1px solid ${activityColors[activity.type] ?? '#b3b3b3'}40` }}>
                        <span className="text-[10px] capitalize font-medium" style={{ color: activityColors[activity.type] ?? '#b3b3b3' }}>
                          {activity.type.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {idx < activities.length - 1 && <div className="w-px flex-1 bg-[#2d2d2d] mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <span className="text-sm font-medium text-white capitalize">{activity.type.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-[#b3b3b3]">{timeAgo(activity.created_at)}</span>
                      </div>
                      {/* Email subject line */}
                      {(activity.type === 'email_sent' || activity.type === 'email_received') && (activity as unknown as { email_subject?: string }).email_subject && (
                        <p className="text-sm text-white font-medium mb-0.5">{(activity as unknown as { email_subject: string }).email_subject}</p>
                      )}
                      {/* Call outcome */}
                      {activity.type === 'call' && (activity as unknown as { call_outcome?: string }).call_outcome && (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-1 font-medium capitalize"
                          style={{
                            backgroundColor: (activity as unknown as { call_outcome: string }).call_outcome === 'connected' ? '#22c55e20' : (activity as unknown as { call_outcome: string }).call_outcome === 'voicemail' ? '#0ea5e920' : '#f59e0b20',
                            color: (activity as unknown as { call_outcome: string }).call_outcome === 'connected' ? '#22c55e' : (activity as unknown as { call_outcome: string }).call_outcome === 'voicemail' ? '#0ea5e9' : '#f59e0b',
                          }}
                        >
                          {(activity as unknown as { call_outcome: string }).call_outcome.replace('_', ' ')}
                        </span>
                      )}
                      {activity.content && !activity.content.startsWith('Gmail:') && !activity.content.startsWith('Outlook:') && (
                        <p className="text-sm text-[#b3b3b3] whitespace-pre-wrap">{activity.content}</p>
                      )}
                      {/* Call notes */}
                      {activity.type === 'call' && (activity as unknown as { call_notes?: string }).call_notes && (
                        <p className="text-sm text-[#b3b3b3] mt-1 whitespace-pre-wrap">{(activity as unknown as { call_notes: string }).call_notes}</p>
                      )}
                      {activity.duration_seconds && (
                        <p className="text-xs text-[#b3b3b3] mt-0.5">Duration: {Math.floor(activity.duration_seconds / 60)}:{String(activity.duration_seconds % 60).padStart(2, '0')}</p>
                      )}
                      {activity.users && (
                        <p className="text-xs text-[#b3b3b3]/60 mt-0.5">by {activity.users.full_name ?? activity.users.email}</p>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
