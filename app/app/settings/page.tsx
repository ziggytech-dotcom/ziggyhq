'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OrgSettings {
  id: string
  name: string
  industry: string
  settings_json: {
    pipeline_stages?: string[]
    lead_sources?: string[]
  }
}

const INDUSTRIES = [
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'legal', label: 'Legal' },
  { value: 'generic', label: 'Generic / Other' },
]

export default function SettingsPage() {
  const [org, setOrg] = useState<OrgSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('')
  const [stages, setStages] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
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
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#ff006e] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#ff006e] text-sm"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind.value} value={ind.value}>{ind.label}</option>
                ))}
              </select>
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
                <button onClick={() => removeStage(stage)} className="text-[#b3b3b3] hover:text-[#ff006e] transition-colors opacity-0 group-hover:opacity-100">
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
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#ff006e] text-sm"
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
                <button onClick={() => removeSource(source)} className="text-[#b3b3b3] hover:text-[#ff006e] transition-colors">
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
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#ff006e] text-sm"
            />
            <button onClick={addSource} className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-white text-sm hover:bg-[#3d3d3d] transition-colors">Add</button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">More Settings</h2>
          <div className="space-y-2">
            <a href="/app/settings/lenders" className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] hover:border-[#ff006e]/40 transition-colors group">
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
            className="px-6 py-2.5 rounded-lg bg-[#ff006e] text-white font-semibold text-sm hover:bg-[#ff006e]/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-[#22c55e] text-sm font-medium">Saved!</span>}
        </div>
      </div>
    </div>
  )
}
