'use client'

import { useState, useEffect } from 'react'
import { TEMPLATE_LIST, getTemplate } from '@/lib/industry-templates'

function generateKey() {
  return 'wh_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2,'0')).join('')
}
import { createClient } from '@/lib/supabase/client'

interface OrgSettings {
  id: string
  name: string
  industry: string
  industry_template: string
  onboarding_complete: boolean
  settings_json: {
    pipeline_stages?: string[]
    lead_sources?: string[]
    webhook_key?: string
    auto_call_new_leads?: boolean
    ai_caller?: {
      name?: string
      voice?: string
      brokerage?: string
      callback_phone?: string
      disclose_if_asked?: boolean
    }
  }
}

export default function SettingsPage() {
  const [org, setOrg] = useState<OrgSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('')
  const [stages, setStages] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [aiCaller, setAiCaller] = useState({ name: 'Emma', voice: 'maya', brokerage: '', callback_phone: '', disclose_if_asked: true })
  const [webhookKey, setWebhookKey] = useState('')
  const [autoCallNewLeads, setAutoCallNewLeads] = useState(true)
  const [callDelayMinutes, setCallDelayMinutes] = useState(2.5)
  const [callHoursStart, setCallHoursStart] = useState(9)
  const [callHoursEnd, setCallHoursEnd] = useState(21)
  const [newStage, setNewStage] = useState('')
  const [newSource, setNewSource] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setOrg(data)
        setOrgName(data.name)
        setIndustry(data.industry)
        setStages(data.settings_json?.pipeline_stages ?? [])
        setSources(data.settings_json?.lead_sources ?? [])
        const ai = data.settings_json?.ai_caller ?? {}
        setAiCaller({ name: ai.name ?? 'Emma', voice: ai.voice ?? 'maya', brokerage: ai.brokerage ?? data.name ?? '', callback_phone: ai.callback_phone ?? '', disclose_if_asked: ai.disclose_if_asked !== false })
        setWebhookKey(data.settings_json?.webhook_key ?? generateKey())
        setAutoCallNewLeads(data.settings_json?.auto_call_new_leads !== false)
        setCallDelayMinutes(data.settings_json?.call_delay_minutes ?? 2.5)
        setCallHoursStart(data.settings_json?.call_hours_start ?? 9)
        setCallHoursEnd(data.settings_json?.call_hours_end ?? 21)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!org) return
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: orgName,
        industry,
        settings_json: {
          ...org.settings_json,
          pipeline_stages: stages,
          ai_caller: aiCaller,
          webhook_key: webhookKey,
          auto_call_new_leads: autoCallNewLeads,
          call_delay_minutes: callDelayMinutes,
          call_hours_start: callHoursStart,
          call_hours_end: callHoursEnd,
          lead_sources: sources,
        },
      }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const addStage = () => {
    if (newStage.trim() && !stages.includes(newStage.trim())) {
      setStages([...stages, newStage.trim()])
      setNewStage('')
    }
  }

  const removeStage = (s: string) => setStages(stages.filter((x) => x !== s))

  const moveStage = (idx: number, dir: -1 | 1) => {
    const newStages = [...stages]
    const tmp = newStages[idx]
    newStages[idx] = newStages[idx + dir]
    newStages[idx + dir] = tmp
    setStages(newStages)
  }

  const addSource = () => {
    if (newSource.trim() && !sources.includes(newSource.trim())) {
      setSources([...sources, newSource.trim()])
      setNewSource('')
    }
  }

  const removeSource = (s: string) => setSources(sources.filter((x) => x !== s))

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-[#b3b3b3] text-sm">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          SETTINGS
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Configure your organization</p>
      </div>

      <div className="space-y-6">
        {/* Org Info */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Organization</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Industry Template</label>
              <div className="flex gap-2">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
                >
                  {TEMPLATE_LIST.map((t) => (
                    <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const tmpl = getTemplate(industry)
                    if (confirm(`Apply "${tmpl.label}" template? This will replace your pipeline stages and lead sources.`)) {
                      setStages(tmpl.pipeline_stages)
                      setSources(tmpl.lead_sources)
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-xs hover:text-white hover:bg-[#3d3d3d] transition-colors whitespace-nowrap"
                >
                  Apply Template
                </button>
              </div>
              <p className="text-xs text-[#b3b3b3]/60 mt-1">Switch vertical and click &quot;Apply Template&quot; to load preset pipeline stages &amp; sources.</p>
            </div>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Pipeline Stages</h2>
          <p className="text-xs text-[#b3b3b3] mb-4">These stages define the progression of your leads</p>
          <div className="space-y-2 mb-3">
            {stages.map((stage, idx) => (
              <div key={stage} className="flex items-center gap-2 group">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => idx > 0 && moveStage(idx, -1)}
                    disabled={idx === 0}
                    className="text-[#b3b3b3] hover:text-white disabled:opacity-20 leading-none"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button
                    onClick={() => idx < stages.length - 1 && moveStage(idx, 1)}
                    disabled={idx === stages.length - 1}
                    className="text-[#b3b3b3] hover:text-white disabled:opacity-20 leading-none"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
                <div className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-sm text-white">
                  {stage}
                </div>
                <button onClick={() => removeStage(stage)} className="text-[#b3b3b3] hover:text-[#0ea5e9] transition-colors opacity-0 group-hover:opacity-100">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStage()}
              placeholder="Add a stage..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm"
            />
            <button onClick={addStage} className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-white text-sm hover:bg-[#3d3d3d] transition-colors">Add</button>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Lead Sources</h2>
          <p className="text-xs text-[#b3b3b3] mb-4">Track where your leads come from</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {sources.map((source) => (
              <div key={source} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2d2d2d] text-sm text-white group">
                {source}
                <button onClick={() => removeSource(source)} className="text-[#b3b3b3] hover:text-[#0ea5e9] transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSource()}
              placeholder="Add a source..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm"
            />
            <button onClick={addSource} className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-white text-sm hover:bg-[#3d3d3d] transition-colors">Add</button>
          </div>
        </div>

        {/* Lead Capture & Auto-Call */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            ⚡ Lead Capture & Auto-Call
          </h2>
          <p className="text-xs text-[#b3b3b3] mb-4">New leads submitted via your website or Zapier are automatically added to your CRM — and Emma calls them within 60 seconds.</p>

          {/* Auto-call toggle */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-sm text-white font-medium">Auto-call new leads</div>
              <div className="text-xs text-[#b3b3b3] mt-0.5">Emma automatically calls every new inbound lead within 60 seconds of them submitting.</div>
            </div>
            <button type="button" onClick={() => setAutoCallNewLeads((p) => !p)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors mt-0.5 ${autoCallNewLeads ? 'bg-[#22c55e]' : 'bg-[#2d2d2d]'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoCallNewLeads ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Call delay + hours */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-[#b3b3b3] mb-1">Call delay (minutes)</label>
              <select value={callDelayMinutes} onChange={e => setCallDelayMinutes(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]">
                <option value={1}>1 min</option>
                <option value={2}>2 min</option>
                <option value={2.5}>2.5 min</option>
                <option value={3}>3 min</option>
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#b3b3b3] mb-1">Calls start (PST)</label>
              <select value={callHoursStart} onChange={e => setCallHoursStart(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]">
                {[7,8,9,10].map(h => <option key={h} value={h}>{h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#b3b3b3] mb-1">Calls end (PST)</label>
              <select value={callHoursEnd} onChange={e => setCallHoursEnd(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#0ea5e9]">
                {[18,19,20,21,22].map(h => <option key={h} value={h}>{h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-[#b3b3b3]/60 mb-4">Leads outside call hours are queued — Emma calls at {callHoursStart >= 12 ? `${callHoursStart-12} PM` : `${callHoursStart} AM`} PST next window. Required by TCPA.</p>

          {/* Webhook key */}
          <div>
            <label className="block text-xs text-[#b3b3b3] mb-1">Webhook API Key</label>
            <div className="flex gap-2">
              <input readOnly value={webhookKey} className="flex-1 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm font-mono focus:outline-none select-all" onClick={(e) => (e.target as HTMLInputElement).select()} />
              <button type="button" onClick={() => { navigator.clipboard.writeText(webhookKey) }} className="px-3 py-2 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-sm hover:text-white hover:bg-[#3d3d3d] transition-colors">Copy</button>
              <button type="button" onClick={() => setWebhookKey(generateKey())} className="px-3 py-2 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-sm hover:text-white hover:bg-[#3d3d3d] transition-colors">Regen</button>
            </div>
          </div>

          {/* Webhook URL */}
          <div className="mt-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d]">
            <div className="text-xs text-[#b3b3b3] mb-1 font-medium">Webhook URL</div>
            <code className="text-xs text-[#22c55e] break-all">https://app.ziggyhq.com/api/webhooks/lead?api_key={webhookKey || 'YOUR_KEY'}</code>
          </div>

          <div className="mt-3 text-xs text-[#b3b3b3]">
            POST <code className="text-white">{'{ full_name, email, phone, source, notes }'}</code> to this URL from your website form, Zapier, IDX Broker, or Facebook Lead Ads.
          </div>
        </div>

        {/* AI Caller Settings */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <span className="w-5 h-5 text-[#8b5cf6]">🤖</span> AI Caller Settings
          </h2>
          <p className="text-xs text-[#b3b3b3] mb-4">Configure the AI that calls your leads via Bland.ai.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#b3b3b3] mb-1">AI Caller Name</label>
              <input value={aiCaller.name} onChange={(e) => setAiCaller((p) => ({ ...p, name: e.target.value }))}
                placeholder="Emma" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#8b5cf6]" />
            </div>
            <div>
              <label className="block text-xs text-[#b3b3b3] mb-1">Voice</label>
              <select value={aiCaller.voice} onChange={(e) => setAiCaller((p) => ({ ...p, voice: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#8b5cf6]">
                <optgroup label="Female (Recommended)">
                  <option value="maya">Maya — Warm, professional ⭐</option>
                  <option value="evelyn">Evelyn — Polished, confident</option>
                  <option value="june">June — Friendly, casual</option>
                  <option value="sarah">Sarah — Clear, trustworthy</option>
                </optgroup>
                <optgroup label="Male">
                  <option value="ryan">Ryan — Friendly, approachable</option>
                  <option value="derek">Derek — Professional, calm</option>
                  <option value="josh">Josh — Energetic, warm</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#b3b3b3] mb-1">Brokerage Name</label>
              <input value={aiCaller.brokerage} onChange={(e) => setAiCaller((p) => ({ ...p, brokerage: e.target.value }))}
                placeholder="Jerry Abbott Realty" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#8b5cf6]" />
            </div>
            <div>
              <label className="block text-xs text-[#b3b3b3] mb-1">Callback Phone (for voicemail)</label>
              <input value={aiCaller.callback_phone} onChange={(e) => setAiCaller((p) => ({ ...p, callback_phone: e.target.value }))}
                placeholder="(725) 425-6788" className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm focus:outline-none focus:border-[#8b5cf6]" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#2d2d2d] flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-white font-medium">Disclose AI if asked</div>
              <div className="text-xs text-[#b3b3b3] mt-0.5">If a lead asks "are you a real person?", the AI responds honestly that it's a virtual assistant. Recommended — keeps you legally protected.</div>
            </div>
            <button
              type="button"
              onClick={() => setAiCaller((p) => ({ ...p, disclose_if_asked: !p.disclose_if_asked }))}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors mt-0.5 ${aiCaller.disclose_if_asked ? 'bg-[#22c55e]' : 'bg-[#2d2d2d]'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${aiCaller.disclose_if_asked ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-[#b3b3b3]/60 mt-3">The AI will introduce itself as <span className="text-white">{aiCaller.name || 'Emma'}</span> calling from <span className="text-white">{aiCaller.brokerage || 'your brokerage'}</span>.</p>
        </div>

        {/* Quick Links */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">More Settings</h2>
          <div className="space-y-2">
            <a href="/app/settings/routing" className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] hover:border-[#0ea5e9]/40 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-lg">🎯</span>
                <div>
                  <div className="text-sm font-medium text-white">Lead Routing Rules</div>
                  <div className="text-xs text-[#b3b3b3]">Round-robin & rule-based auto-assignment</div>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#b3b3b3] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
            <a href="/app/settings/lenders" className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] hover:border-[#0ea5e9]/40 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-lg">🏦</span>
                <div>
                  <div className="text-sm font-medium text-white">Partner Lenders</div>
                  <div className="text-xs text-[#b3b3b3]">Manage preferred lenders for lead financing</div>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#b3b3b3] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#0ea5e9] text-white font-semibold text-sm hover:bg-[#0ea5e9]/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-[#22c55e] text-sm font-medium">Saved!</span>}
        </div>
      </div>
    </div>
  )
}
