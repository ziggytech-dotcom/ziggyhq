import Link from 'next/link'
import { MarketingNav } from '@/app/components/marketing/Nav'
import { MarketingFooter } from '@/app/components/marketing/Footer'

const comparisonRows = [
  { feature: 'Starting price', ziggy: '$29/mo', hs: 'Free (limited) / $20/mo+' },
  { feature: 'Full CRM price', ziggy: '$29–$49/mo', hs: '$90–$800+/mo' },
  { feature: 'Seats included', ziggy: '1–5 seats', hs: '2 seats (free)' },
  { feature: 'Free trial', ziggy: '14 days, no CC', hs: 'Free tier (limited)' },
  { feature: 'Visual CRM pipeline', ziggy: true, hs: true },
  { feature: 'Email sequences', ziggy: true, hs: 'Sales Hub only ($90+/mo)' },
  { feature: 'Contact management', ziggy: true, hs: true },
  { feature: 'Forms & lead capture', ziggy: true, hs: true },
  { feature: 'Power dialer', ziggy: true, hs: 'Enterprise only' },
  { feature: 'AI voice calling', ziggy: true, hs: false },
  { feature: 'Automation', ziggy: true, hs: 'Paid plans only' },
  { feature: 'White label', ziggy: true, hs: false },
  { feature: 'No seat limits surprise fees', ziggy: true, hs: false },
  { feature: 'Flat predictable billing', ziggy: true, hs: false },
  { feature: 'Built for small teams', ziggy: true, hs: 'Better for enterprise' },
  { feature: 'Marketing Hub', ziggy: false, hs: true },
  { feature: 'CMS & blog', ziggy: false, hs: true },
  { feature: 'Service Hub (ticketing)', ziggy: false, hs: true },
]

const switchReasons = [
  {
    icon: '💸',
    title: 'HubSpot\'s free tier is a trap',
    description: 'HubSpot lures you in with a free plan, then charges $90–$800+/mo the moment you need real features like sequences, reporting, or more than 2 seats. ZiggyHQ is transparent from day one — $29/mo for the real thing.',
  },
  {
    icon: '🧾',
    title: 'No surprise bills',
    description: 'HubSpot\'s pricing is notoriously complex — per-seat upgrades, add-on hubs, contact tier pricing. ZiggyHQ bills are simple: flat monthly rate plus seats. That\'s it.',
  },
  {
    icon: '⚡',
    title: 'Power dialer & AI calling on day one',
    description: 'HubSpot\'s calling features are buried in expensive Enterprise plans. ZiggyHQ includes a Twilio power dialer and Bland.ai AI calling in the Pro plan at $49/mo.',
  },
  {
    icon: '🚀',
    title: 'Faster, leaner, purpose-built',
    description: 'HubSpot is an enterprise suite trying to be everything to everyone. ZiggyHQ is a focused sales CRM. Less noise, faster setup, better results for SMB sales teams.',
  },
]

export default function CompareHubSpotPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0ea5e9]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-full px-4 py-1.5 text-sm text-[#b3b3b3] mb-8">
            ZiggyHQ vs HubSpot
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <span className="text-[#0ea5e9]">ZiggyHQ</span> vs{' '}
            <span className="text-[#b3b3b3]">HubSpot</span>
          </h1>
          <p className="text-xl text-[#b3b3b3] max-w-2xl mx-auto mb-10">
            HubSpot has 1,000 features. You need 20 of them — and they cost $800/mo. ZiggyHQ gives you the 20 that matter for $29/mo.
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
              HubSpot is the gold standard for enterprise marketing and CRM — if you have a budget to match. Their platform is deep, their ecosystem is massive, and for large organizations, the investment can make sense. But for SMBs and growing sales teams? HubSpot&apos;s free tier is intentionally limiting, and the paid tiers escalate fast with seat fees, hub add-ons, and contact tier pricing.
            </p>
            <p className="text-[#b3b3b3] leading-relaxed mt-4">
              <span className="text-white font-medium">ZiggyHQ is the better choice if</span> you want the core sales features that actually drive revenue — pipeline, sequences, dialer, AI calling — without paying for a CMS, blog, ticketing system, and enterprise marketing suite you don&apos;t need. Get started in under an hour for $29/mo.
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
              <p className="text-[#b3b3b3] text-xs mt-1">1 seat · +$12/seat · All core features</p>
              <div className="mt-4 pt-4 border-t border-[#0ea5e9]/20">
                <p className="text-[#0ea5e9] font-bold text-3xl">$49</p>
                <p className="text-[#b3b3b3] text-sm">/mo · Pro plan (5 seats, dialer + AI)</p>
              </div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8 text-center">
              <p className="text-[#b3b3b3] font-semibold text-sm mb-2">HubSpot Sales Hub</p>
              <div className="text-white font-bold text-6xl mb-2">Free</div>
              <p className="text-[#b3b3b3] text-sm">Limited features · 2 seats</p>
              <div className="mt-4 pt-4 border-t border-[#2d2d2d] space-y-2">
                <div>
                  <p className="text-white font-bold text-2xl">$20/mo</p>
                  <p className="text-[#b3b3b3] text-xs">Starter (per seat)</p>
                </div>
                <div>
                  <p className="text-white font-bold text-2xl">$90/mo</p>
                  <p className="text-[#b3b3b3] text-xs">Professional (per seat)</p>
                </div>
                <div>
                  <p className="text-white font-bold text-2xl">$150/mo</p>
                  <p className="text-[#b3b3b3] text-xs">Enterprise (per seat)</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-[#b3b3b3] text-sm mt-6">
            A 5-person team on HubSpot Professional = <span className="text-white font-semibold">$450/mo minimum</span>.<br />
            Same team on ZiggyHQ Pro = <span className="text-[#0ea5e9] font-semibold">$49/mo</span>. That&apos;s $4,812/yr in savings.
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
                  <th className="text-center py-4 px-4 text-[#b3b3b3] font-semibold">HubSpot</th>
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
                      {typeof row.hs === 'boolean' ? (
                        row.hs ? (
                          <svg className="w-5 h-5 text-[#555] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-[#555] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-[#b3b3b3] text-sm">{row.hs}</span>
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
          <h2 className="text-3xl font-bold text-white text-center mb-10">Why teams switch from HubSpot</h2>
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
          <h2 className="text-4xl font-bold text-white mb-4">Try the smarter alternative</h2>
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
