import Link from 'next/link'
import { MarketingNav } from '@/app/components/marketing/Nav'
import { MarketingFooter } from '@/app/components/marketing/Footer'

const comparisonRows = [
  { feature: 'Starting price', ziggy: '$29/mo', ghl: '$97/mo' },
  { feature: 'Seats included', ziggy: '1 seat', ghl: '1 seat' },
  { feature: 'Additional seats', ziggy: '$12/seat/mo', ghl: '$25+/seat/mo' },
  { feature: 'Free trial', ziggy: '14 days, no CC', ghl: '14 days' },
  { feature: 'Visual CRM pipeline', ziggy: true, ghl: true },
  { feature: 'Email sequences', ziggy: true, ghl: true },
  { feature: 'Contact management', ziggy: true, ghl: true },
  { feature: 'Forms & landing pages', ziggy: true, ghl: true },
  { feature: 'Power dialer', ziggy: true, ghl: true },
  { feature: 'AI voice calling', ziggy: true, ghl: true },
  { feature: 'Automation builder', ziggy: true, ghl: true },
  { feature: 'White label', ziggy: true, ghl: 'Pro plan only' },
  { feature: 'Simple, clean UI', ziggy: true, ghl: false },
  { feature: 'Fast onboarding', ziggy: true, ghl: false },
  { feature: 'Focused on sales teams', ziggy: true, ghl: false },
  { feature: 'Website builder', ziggy: false, ghl: true },
  { feature: 'Membership sites', ziggy: false, ghl: true },
  { feature: 'Course builder', ziggy: false, ghl: true },
]

const switchReasons = [
  {
    icon: '💸',
    title: 'Save $68–$248/mo',
    description: 'GoHighLevel starts at $97/mo ($297/mo for agencies). ZiggyHQ starts at $29/mo. Same core CRM features, fraction of the cost.',
  },
  {
    icon: '⚡',
    title: 'Actually fast to set up',
    description: 'GHL is powerful but notorious for its steep learning curve. ZiggyHQ is built for sales teams — onboard in under an hour, not weeks.',
  },
  {
    icon: '🎯',
    title: 'Built for sales, not marketing agencies',
    description: 'GoHighLevel is designed for marketing agencies reselling to clients. ZiggyHQ is purpose-built for sales teams that need pipeline, dialer, and automation — nothing more, nothing less.',
  },
  {
    icon: '🤝',
    title: 'Real support when you need it',
    description: 'GHL support can be slow and impersonal at scale. ZiggyHQ Pro includes priority support with a team that actually knows your account.',
  },
]

export default function CompareGHLPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0ea5e9]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-full px-4 py-1.5 text-sm text-[#b3b3b3] mb-8">
            ZiggyHQ vs GoHighLevel
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <span className="text-[#0ea5e9]">ZiggyHQ</span> vs{' '}
            <span className="text-[#b3b3b3]">GoHighLevel</span>
          </h1>
          <p className="text-xl text-[#b3b3b3] max-w-2xl mx-auto mb-10">
            The honest comparison. Same core features. A fraction of the price. And an interface your team will actually use.
          </p>
          <Link href="/signup" className="bg-[#0ea5e9] text-white rounded-lg px-8 py-4 font-semibold text-lg hover:bg-[#0ea5e9]/90 transition-colors inline-block">
            Try ZiggyHQ Free — No Credit Card
          </Link>
        </div>
      </section>

      {/* Summary verdict */}
      <section className="py-16 px-4 bg-[#111111] border-y border-[#2d2d2d]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">The verdict</h2>
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
            <p className="text-[#b3b3b3] leading-relaxed">
              GoHighLevel is a powerhouse for marketing agencies managing dozens of client accounts — it has website builders, funnel tools, reputation management, and more. But that complexity comes at a cost: a steep learning curve, a $97–$297/mo price tag, and an interface that often overwhelms sales reps who just want to work their pipeline.
            </p>
            <p className="text-[#b3b3b3] leading-relaxed mt-4">
              <span className="text-white font-medium">ZiggyHQ is the better choice if</span> you run a sales team (not a marketing agency), want to get up and running in under an hour, and don&apos;t want to pay for features you&apos;ll never use. At $29/mo, you get the CRM, pipeline, email sequences, power dialer, and AI calling that matter most.
            </p>
          </div>
        </div>
      </section>

      {/* Price comparison */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-10 text-center">Price comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0ea5e9]/10 border-2 border-[#0ea5e9] rounded-2xl p-8 text-center">
              <p className="text-[#0ea5e9] font-semibold text-sm mb-2">ZiggyHQ</p>
              <div className="text-white font-bold text-6xl mb-2">$29</div>
              <p className="text-[#b3b3b3] text-sm">/mo · Starter plan</p>
              <p className="text-[#b3b3b3] text-xs mt-1">1 seat · +$12/seat</p>
              <div className="mt-4 pt-4 border-t border-[#0ea5e9]/20">
                <p className="text-[#0ea5e9] font-bold text-3xl">$49</p>
                <p className="text-[#b3b3b3] text-sm">/mo · Pro plan (5 seats)</p>
              </div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8 text-center">
              <p className="text-[#b3b3b3] font-semibold text-sm mb-2">GoHighLevel</p>
              <div className="text-white font-bold text-6xl mb-2">$97</div>
              <p className="text-[#b3b3b3] text-sm">/mo · Starter plan</p>
              <p className="text-[#b3b3b3] text-xs mt-1">1 account</p>
              <div className="mt-4 pt-4 border-t border-[#2d2d2d]">
                <p className="text-white font-bold text-3xl">$297</p>
                <p className="text-[#b3b3b3] text-sm">/mo · Agency Unlimited</p>
              </div>
            </div>
          </div>
          <p className="text-center text-[#b3b3b3] text-sm mt-6">
            ZiggyHQ saves you <span className="text-white font-semibold">$68–$248/mo</span> vs GoHighLevel. That&apos;s $816–$2,976/yr back in your pocket.
          </p>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-20 px-4 bg-[#111111] border-t border-[#2d2d2d]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-10">Feature comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d2d2d]">
                  <th className="text-left py-4 px-4 text-[#b3b3b3] font-medium text-sm">Feature</th>
                  <th className="text-center py-4 px-4 text-[#0ea5e9] font-semibold">ZiggyHQ</th>
                  <th className="text-center py-4 px-4 text-[#b3b3b3] font-semibold">GoHighLevel</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-[#2d2d2d]/50 ${i % 2 === 0 ? 'bg-[#0a0a0a]/30' : ''}`}>
                    <td className="py-3 px-4 text-[#b3b3b3] text-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.ziggy === 'boolean' ? (
                        row.ziggy ? (
                          <svg className="w-5 h-5 text-[#0ea5e9] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-[#555] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-white text-sm font-medium">{row.ziggy}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.ghl === 'boolean' ? (
                        row.ghl ? (
                          <svg className="w-5 h-5 text-[#555] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-[#555] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-[#b3b3b3] text-sm">{row.ghl}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why businesses switch */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-10">Why teams switch from GoHighLevel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {switchReasons.map((reason) => (
              <div key={reason.title} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
                <div className="text-3xl mb-3">{reason.icon}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{reason.title}</h3>
                <p className="text-[#b3b3b3] text-sm leading-relaxed">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#111111] border-t border-[#2d2d2d]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Make the switch today</h2>
          <p className="text-[#b3b3b3] text-lg mb-8">
            14-day free trial. Full Pro access. No credit card required.
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
