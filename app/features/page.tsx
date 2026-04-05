import Link from 'next/link'
import { MarketingNav } from '@/app/components/marketing/Nav'
import { MarketingFooter } from '@/app/components/marketing/Footer'

const features = [
  {
    id: 'pipeline',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Visual Pipeline & Deal Tracking',
    description: 'Get a bird\'s-eye view of your entire sales process with drag-and-drop pipeline boards. Move deals through stages, set close dates, assign ownership, and track deal value — all from a single view.',
    bullets: [
      'Drag-and-drop Kanban boards',
      'Multiple pipeline support',
      'Deal value and close date tracking',
      'Custom pipeline stages',
      'Deal activity timeline',
      'Won/lost analysis',
    ],
  },
  {
    id: 'email',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Email Sequences & Automation',
    description: 'Build multi-step email campaigns that run on autopilot. Set triggers, delays, and conditions. Get notified when prospects open emails or click links so your team can follow up at exactly the right moment.',
    bullets: [
      'Multi-step drip sequences',
      'Open & click tracking',
      'Personalization tokens',
      'A/B testing subject lines',
      'Auto-pause on reply',
      'Gmail integration',
    ],
  },
  {
    id: 'contacts',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Contact Management',
    description: 'A complete 360° view of every contact and company. Log calls, emails, and notes. Track every touchpoint in a unified timeline. Build smart lists that auto-update based on any criteria you define.',
    bullets: [
      'Rich contact profiles',
      'Company & contact linking',
      'Full activity timeline',
      'Custom fields & tags',
      'Smart lists & segments',
      'CSV import / export',
    ],
  },
  {
    id: 'dialer',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    title: 'Power Dialer (Twilio)',
    description: 'Blast through your call list at 3x normal speed. Our Twilio-powered dialer eliminates manual dialing, logs calls automatically, and lets reps leave pre-recorded voicemails in one click.',
    bullets: [
      'Click-to-call from any contact',
      'Pre-recorded voicemail drop',
      'Call recording & playback',
      'Live transcription',
      'Automatic call logging',
      'Local presence dialing',
    ],
  },
  {
    id: 'ai-calling',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'AI Calling (Bland.ai)',
    description: 'Deploy conversational AI agents that sound human. Use AI to qualify inbound leads 24/7, handle initial outreach, and book meetings — then hand off warm leads to your human reps.',
    bullets: [
      'Human-sounding AI voice',
      '24/7 inbound qualification',
      'Outbound AI campaigns',
      'Automatic CRM logging',
      'Custom conversation scripts',
      'Seamless human handoff',
    ],
  },
  {
    id: 'team',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Team Management',
    description: 'Manage your entire sales team from one dashboard. Assign leads with round-robin routing, set permissions by role, monitor individual performance, and run leaderboards that motivate your reps.',
    bullets: [
      'Role-based access control',
      'Round-robin lead assignment',
      'Team performance dashboards',
      'Activity leaderboards',
      'Multi-seat billing',
      'White label branding',
    ],
  },
  {
    id: 'forms',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Forms & Lead Capture',
    description: 'Build embeddable lead capture forms that auto-create contacts and deals the moment someone submits. Connect forms to sequences so follow-up starts immediately — no manual work required.',
    bullets: [
      'Drag-and-drop form builder',
      'Embeddable on any site',
      'Auto-create contacts & deals',
      'Trigger sequences on submit',
      'Custom thank-you pages',
      'Field mapping & validation',
    ],
  },
  {
    id: 'reports',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    title: 'Reporting & Analytics',
    description: 'Make data-driven decisions with real-time dashboards and custom reports. Track pipeline health, conversion rates, team activity, and revenue forecasts — all updated live as your team works.',
    bullets: [
      'Real-time pipeline dashboards',
      'Revenue forecasting',
      'Conversion rate analysis',
      'Team activity reports',
      'Custom report builder',
      'CSV export',
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0ea5e9]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Everything your CRM{' '}
            <span className="text-[#0ea5e9]">should be</span>
          </h1>
          <p className="text-xl text-[#b3b3b3] max-w-2xl mx-auto mb-10">
            ZiggyHQ packs the power of GoHighLevel and HubSpot into a leaner, faster, more affordable package. Here&apos;s what you get.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-[#0ea5e9] text-white rounded-lg px-8 py-4 font-semibold text-lg hover:bg-[#0ea5e9]/90 transition-colors"
          >
            Start Free Trial — No Credit Card
          </Link>
        </div>
      </section>

      {/* Feature deep dives */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`rounded-2xl border border-[#2d2d2d] overflow-hidden ${
                index % 2 === 0 ? 'bg-[#111111]' : 'bg-[#0a0a0a]'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Content */}
                <div className={`p-10 flex flex-col justify-center ${index % 2 !== 0 ? 'lg:order-2' : ''}`}>
                  <div className="w-14 h-14 bg-[#0ea5e9]/10 rounded-xl flex items-center justify-center text-[#0ea5e9] mb-6">
                    {feature.icon}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{feature.title}</h2>
                  <p className="text-[#b3b3b3] leading-relaxed mb-6">{feature.description}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2 text-sm text-[#b3b3b3]">
                        <svg className="w-4 h-4 text-[#0ea5e9] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Screenshot placeholder */}
                <div className={`bg-[#1a1a1a] border-l border-[#2d2d2d] min-h-[300px] flex items-center justify-center ${index % 2 !== 0 ? 'lg:order-1 border-l-0 border-r border-[#2d2d2d]' : ''}`}>
                  <div className="text-center p-8">
                    <div className="w-12 h-12 bg-[#2d2d2d] rounded-xl flex items-center justify-center mx-auto mb-3 text-[#555]">
                      {feature.icon}
                    </div>
                    <p className="text-[#555] text-sm">Product screenshot coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-[#111111] border-t border-[#2d2d2d]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Try every feature free for 14 days
          </h2>
          <p className="text-[#b3b3b3] text-lg mb-8">
            Full Pro access. No credit card. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-[#0ea5e9] text-white rounded-lg px-8 py-4 font-semibold text-lg hover:bg-[#0ea5e9]/90 transition-colors">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="border border-[#2d2d2d] text-white rounded-lg px-8 py-4 font-semibold text-lg hover:bg-[#1a1a1a] transition-colors">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
