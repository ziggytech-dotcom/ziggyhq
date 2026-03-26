'use client'

import { useState, useEffect } from 'react'

export default function LeadFormPage() {
  const [widgetKey, setWidgetKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/widget-key')
      .then((r) => r.json())
      .then((d) => { setWidgetKey(d.widget_key); setLoading(false) })
  }, [])

  const handleRegenerate = async () => {
    if (!confirm('Regenerate widget key? Your existing embed codes will stop working.')) return
    setRegenerating(true)
    const res = await fetch('/api/widget-key', { method: 'POST' })
    const d = await res.json()
    setWidgetKey(d.widget_key)
    setRegenerating(false)
  }

  const embedCode = widgetKey
    ? `<script src="https://app.ziggyhq.com/widget.js" data-key="${widgetKey}"></script>`
    : ''

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
          LEAD FORM WIDGET
        </h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Embed a lead capture form on any website</p>
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm">Loading...</div>
      ) : (
        <>
          {/* Embed code */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Embed Code</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="text-xs text-[#b3b3b3] hover:text-white px-2.5 py-1.5 rounded bg-[#2d2d2d] transition-colors disabled:opacity-50"
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate Key'}
                </button>
                <button
                  onClick={copyEmbed}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded transition-colors ${copied ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-[#ff006e]/10 text-[#ff006e] border border-[#ff006e]/20 hover:bg-[#ff006e]/20'}`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg p-4 overflow-x-auto">
              <code className="text-xs text-[#22c55e] font-mono whitespace-pre">{embedCode}</code>
            </div>

            <p className="text-xs text-[#b3b3b3] mt-3">
              Paste this code before the <code className="text-[#ff006e]">&lt;/body&gt;</code> tag of your website.
            </p>
          </div>

          {/* Widget key */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 mb-6">
            <div className="text-sm font-semibold text-white mb-2">Your Widget Key</div>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-sm text-[#b3b3b3] bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg px-3 py-2 font-mono">{widgetKey}</code>
            </div>
            <p className="text-xs text-[#b3b3b3] mt-2">Keep this key secret. All form submissions are tied to your organization.</p>
          </div>

          {/* Widget preview description */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4">What the Widget Does</h3>
            <ul className="space-y-2.5">
              {[
                'Shows a floating chat button in the bottom-right corner of your website',
                'Clicking opens a slide-in form: Name, Email, Phone, Intent (Buy/Sell/Both), Price Range, Message',
                'Submissions instantly create a lead in your CRM',
                'Auto-calculates lead score based on the data submitted',
                'Triggers your webhook and AI caller if enabled in settings',
                'Mobile responsive with smooth animations',
                'Matches ZiggyCRM dark theme (customizable)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#b3b3b3]">
                  <span className="text-[#ff006e] flex-shrink-0 mt-0.5">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* API endpoint docs */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3">Direct API Endpoint</h3>
            <p className="text-xs text-[#b3b3b3] mb-3">You can also POST directly to the widget API from any source:</p>
            <div className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg p-4 overflow-x-auto">
              <code className="text-xs text-[#b3b3b3] font-mono whitespace-pre">{`POST https://app.ziggyhq.com/api/widget/lead
Content-Type: application/json

{
  "org_key": "${widgetKey}",
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "(702) 555-1234",
  "intent": "Buy",
  "price_range": "500k_750k",
  "message": "Looking for 3BR in Henderson"
}`}</code>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
