import Link from 'next/link'
import { MarketingNav } from '@/app/components/marketing/Nav'
import { MarketingFooter } from '@/app/components/marketing/Footer'

const changelog = [
  {
    date: 'April 2026',
    version: 'v1.2',
    highlight: true,
    entries: [
      {
        type: 'feature',
        title: 'Team Management',
        description: 'Full team management with role-based access control, round-robin lead assignment, and team performance dashboards.',
      },
      {
        type: 'feature',
        title: 'Two-Factor Authentication (TOTP)',
        description: 'Secure your account with time-based one-time passwords. Supports Google Authenticator, Authy, and 1Password.',
      },
      {
        type: 'feature',
        title: 'Google & Apple OAuth',
        description: 'Sign in or sign up using your Google or Apple account. One-click authentication across all devices.',
      },
      {
        type: 'feature',
        title: 'White Label Branding',
        description: 'Pro plan users can now remove ZiggyHQ branding and replace it with their own logo and company name.',
      },
      {
        type: 'feature',
        title: 'Automation Engine',
        description: 'Build multi-step automations triggered by contact actions, deal stage changes, form submissions, and more. Set delays, conditions, and actions.',
      },
      {
        type: 'improvement',
        title: 'Action Plans',
        description: 'Action plans now support recurring tasks, template sharing, and due date calculations relative to deal stage.',
      },
      {
        type: 'improvement',
        title: 'Smart Lists v2',
        description: 'Smart lists now support nested conditions, real-time count updates, and export to CSV.',
      },
      {
        type: 'fix',
        title: 'Email sequence open tracking reliability',
        description: 'Resolved an issue where open tracking pixels were occasionally blocked by email clients. Improved fallback detection.',
      },
    ],
  },
  {
    date: 'March 2026',
    version: 'v1.0',
    highlight: false,
    entries: [
      {
        type: 'launch',
        title: '🚀 ZiggyHQ Launched',
        description: 'ZiggyHQ is live. The CRM built for modern sales teams — visual pipeline, email sequences, contact management, and more.',
      },
      {
        type: 'feature',
        title: 'Power Dialer',
        description: 'Twilio-powered click-to-call with pre-recorded voicemail drop, call recording, live transcription, and automatic call logging.',
      },
      {
        type: 'feature',
        title: 'AI Calling (Bland.ai)',
        description: 'Deploy AI voice agents that qualify inbound leads and run outbound campaigns 24/7. Human-sounding, fully customizable.',
      },
      {
        type: 'feature',
        title: 'Email Sequences',
        description: 'Build multi-step email drip campaigns with open/click tracking, personalization tokens, and auto-pause on reply.',
      },
      {
        type: 'feature',
        title: 'Pipeline Management',
        description: 'Drag-and-drop deal tracking across custom pipeline stages. Deal value, close date, ownership, and activity timeline.',
      },
      {
        type: 'feature',
        title: 'Contact Management',
        description: 'Rich contact profiles with full activity history, custom fields, tags, and company associations.',
      },
      {
        type: 'feature',
        title: 'Forms & Lead Capture',
        description: 'Embeddable lead capture forms that auto-create contacts and trigger sequences on submission.',
      },
      {
        type: 'feature',
        title: 'Reporting Dashboard',
        description: 'Real-time pipeline health, deal velocity, and team activity metrics. Revenue forecasting included.',
      },
      {
        type: 'feature',
        title: 'Gmail Integration',
        description: 'Send emails from your own Gmail address, sync your inbox, and track opens and clicks natively.',
      },
    ],
  },
]

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  launch: { label: 'Launch', color: 'text-[#ff1744]', bg: 'bg-[#ff1744]/10 border-[#ff1744]/30' },
  feature: { label: 'New', color: 'text-[#0ea5e9]', bg: 'bg-[#0ea5e9]/10 border-[#0ea5e9]/30' },
  improvement: { label: 'Improved', color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10 border-[#22c55e]/30' },
  fix: { label: 'Fixed', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10 border-[#f59e0b]/30' },
}

export default function ChangelogPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Changelog
          </h1>
          <p className="text-[#b3b3b3] text-lg">
            What&apos;s new in ZiggyHQ. We ship fast.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-[#2d2d2d] ml-4 hidden md:block" />

            <div className="space-y-16">
              {changelog.map((release) => (
                <div key={release.date} className="md:pl-14 relative">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 w-9 h-9 rounded-full flex items-center justify-center hidden md:flex ${release.highlight ? 'bg-[#0ea5e9]' : 'bg-[#1a1a1a] border border-[#2d2d2d]'}`}>
                    {release.highlight ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>

                  {/* Release header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{release.date}</h2>
                      <span className="text-[#b3b3b3] text-sm">{release.version}</span>
                    </div>
                    {release.highlight && (
                      <span className="bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 text-[#0ea5e9] text-xs font-medium px-3 py-1 rounded-full">
                        Latest
                      </span>
                    )}
                  </div>

                  {/* Entries */}
                  <div className="space-y-4">
                    {release.entries.map((entry, i) => {
                      const config = typeConfig[entry.type] || typeConfig.feature
                      return (
                        <div key={i} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
                          <div className="flex items-start gap-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${config.bg} ${config.color}`}>
                              {config.label}
                            </span>
                            <div>
                              <h3 className="text-white font-semibold mb-1">{entry.title}</h3>
                              <p className="text-[#b3b3b3] text-sm leading-relaxed">{entry.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notify CTA */}
      <section className="py-20 px-4 bg-[#111111] border-t border-[#2d2d2d]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Want to know when we ship?</h2>
          <p className="text-[#b3b3b3] mb-8">
            Start your free trial and get release notes delivered to your inbox.
          </p>
          <Link href="/signup" className="bg-[#0ea5e9] text-white rounded-lg px-8 py-4 font-semibold text-lg hover:bg-[#0ea5e9]/90 transition-colors inline-block">
            Start Free Trial
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
