'use client'

import { useState, useEffect, useCallback } from 'react'

export default function PipelineForecastPage() {
  const [stages, setStages] = useState<string[]>([])
  const [probabilities, setProbabilities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/settings')
    if (res.ok) {
      const d = await res.json()
      const s = (d.settings_json ?? {}) as Record<string, unknown>
      setStages((s.pipeline_stages as string[]) ?? [])
      setProbabilities(((s.stage_probabilities as Record<string, number>) ?? {}) as Record<string, number>)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    // Merge stage_probabilities into existing settings_json
    const settingsRes = await fetch('/api/settings')
    const orgData = settingsRes.ok ? await settingsRes.json() : {}
    const existing = (orgData.settings_json ?? {}) as Record<string, unknown>
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings_json: { ...existing, stage_probabilities: probabilities } }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const setPct = (stage: string, val: string) => {
    const n = Math.min(100, Math.max(0, parseInt(val) || 0))
    setProbabilities((p) => ({ ...p, [stage]: n }))
  }

  const DEFAULT_PROBABILITIES: Record<string, number> = {
    'New': 10, 'Contacted': 20, 'Qualified': 30, 'Proposal': 50,
    'Negotiation': 70, 'Closed Won': 100, 'Closed Lost': 0,
  }

  const applyDefaults = () => {
    const defaults: Record<string, number> = {}
    for (const stage of stages) {
      defaults[stage] = DEFAULT_PROBABILITIES[stage] ?? 50
    }
    setProbabilities(defaults)
  }

  const totalWeighted = stages.reduce((sum, stage) => {
    const pct = probabilities[stage] ?? 0
    return sum + pct  // actual values come from reports API
  }, 0)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          PIPELINE FORECAST
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Set close probability % per pipeline stage for weighted forecasting</p>
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm">Loading...</div>
      ) : stages.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 text-center">
          <p className="text-[#b3b3b3] text-sm">No pipeline stages configured.</p>
          <p className="text-xs text-[#b3b3b3]/60 mt-1">Configure stages in Settings first, then return here to set probabilities.</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden mb-4">
            <div className="px-6 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Stage Probabilities</h2>
              <button
                onClick={applyDefaults}
                className="text-xs text-[#b3b3b3] hover:text-white px-3 py-1.5 rounded-lg bg-[#2d2d2d] transition-colors"
              >
                Apply Defaults
              </button>
            </div>
            <div className="divide-y divide-[#2d2d2d]">
              {stages.map((stage) => {
                const pct = probabilities[stage] ?? 0
                return (
                  <div key={stage} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white mb-2">{stage}</div>
                      <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#0ea5e9',
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={pct}
                        onChange={(e) => setPct(stage, e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white text-sm text-right focus:outline-none focus:border-[#0ea5e9]"
                      />
                      <span className="text-sm text-[#b3b3b3] w-4">%</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-4 bg-[#0a0a0a] flex items-center justify-between">
              <div className="text-xs text-[#b3b3b3]">
                Total probability sum: <span className="text-white font-medium">{totalWeighted}%</span>
                <span className="text-[#b3b3b3]/60 ml-2">(for reference; weighted forecast uses deal values)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Probabilities'}
            </button>
          </div>

          <div className="mt-6 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">How Forecasting Works</h3>
            <ul className="space-y-1.5">
              {[
                'Each stage gets a probability % representing likelihood of closing',
                'Weighted forecast = sum of (deal_value × probability) across all active leads',
                'Example: $100k deal at 50% probability = $50k weighted value',
                'View the weighted forecast in Reports → Pipeline Forecast section',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#b3b3b3]">
                  <span className="text-[#0ea5e9] mt-0.5">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
