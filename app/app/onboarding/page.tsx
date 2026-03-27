'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TEMPLATE_LIST } from '@/lib/industry-templates'

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [step, setStep] = useState<'name' | 'template'>('name')

  const handleNext = () => {
    if (!orgName.trim()) return
    setStep('template')
  }

  const handleFinish = async () => {
    if (!selected) return
    setSaving(true)
    const template = TEMPLATE_LIST.find((t) => t.id === selected)!

    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: orgName,
        industry: selected,
        industry_template: selected,
        onboarding_complete: true,
        settings_json: {
          pipeline_stages: template.pipeline_stages,
          lead_sources: template.lead_sources,
        },
      }),
    })

    router.push('/app/leads')
  }

  if (step === 'name') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">👋</div>
            <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '40px', letterSpacing: '0.05em', color: '#ededed' }}>
              WELCOME TO ZIGGYHQ
            </h1>
            <p className="text-[#b3b3b3] text-sm mt-2">Let&apos;s set up your workspace in 30 seconds.</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8">
            <label className="block text-sm text-[#b3b3b3] mb-2">What&apos;s your business name?</label>
            <input
              autoFocus
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              placeholder="e.g. Smith Realty Group"
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm mb-6"
            />
            <button
              onClick={handleNext}
              disabled={!orgName.trim()}
              className="w-full py-3 rounded-xl bg-[#0ea5e9] text-white font-semibold text-sm hover:bg-[#0ea5e9]/90 transition-colors disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '40px', letterSpacing: '0.05em', color: '#ededed' }}>
            PICK YOUR INDUSTRY
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-2">ZiggyHQ will configure your pipeline stages, fields, and terminology for your vertical.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {TEMPLATE_LIST.map((tmpl) => {
            const isSelected = selected === tmpl.id
            return (
              <button
                key={tmpl.id}
                onClick={() => setSelected(tmpl.id)}
                className={`text-left p-5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-[#0ea5e9] bg-[#0ea5e9]/10'
                    : 'border-[#2d2d2d] bg-[#1a1a1a] hover:border-[#0ea5e9]/40'
                }`}
              >
                <div className="text-3xl mb-3">{tmpl.icon}</div>
                <div className="text-base font-semibold text-white mb-1">{tmpl.label}</div>
                <div className="text-xs text-[#b3b3b3] mb-3">{tmpl.description}</div>
                <div className="flex flex-wrap gap-1">
                  {tmpl.pipeline_stages.slice(0, 4).map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-[#2d2d2d] text-[#b3b3b3]">{s}</span>
                  ))}
                  {tmpl.pipeline_stages.length > 4 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#2d2d2d] text-[#b3b3b3]">+{tmpl.pipeline_stages.length - 4}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setStep('name')}
            className="px-6 py-3 rounded-xl border border-[#2d2d2d] text-[#b3b3b3] hover:text-white text-sm transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleFinish}
            disabled={!selected || saving}
            className="px-10 py-3 rounded-xl bg-[#0ea5e9] text-white font-semibold text-sm hover:bg-[#0ea5e9]/90 transition-colors disabled:opacity-40"
          >
            {saving ? 'Setting up...' : 'Launch My CRM →'}
          </button>
        </div>
      </div>
    </div>
  )
}
