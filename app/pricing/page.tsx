'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MarketingNav } from '@/app/components/marketing/Nav'
import { MarketingFooter } from '@/app/components/marketing/Footer'

const starterFeatures = [
  'Visual pipeline & deal tracking',
  'Contact management (unlimited)',
  'Email sequences & automation',
  'Forms & lead capture',
  'Basic reporting & analytics',
  'Gmail & Google Calendar sync',
  'CSV import / export',
  'Mobile-responsive app',
  'Email support',
]

const proFeatures = [
  'Everything in Starter',
  'Power dialer (Twilio)',
  'AI calling agent (Bland.ai)',
  'Advanced automation engine',
  'Action plans & follow-up rules',
  'White label branding',
  'Team management & routing',
  'Smart lists & segmentation',
  'Advanced reporting & forecasting',
  'Priority support',
  'Custom fields (unlimited)',
  'API access',
]

const comparisonRows = [
  { feature: 'Seats included', starter: '1 seat', pro: '5 seats' },
  { feature: 'Additional seats', starter: '$12/seat/mo', pro: '$10/seat/mo' },
  { feature: 'Pipeline & deal tracking', starter: true, pro: true },
  { feature: 'Contact management', starter: true, pro: true },
  { feature: 'Email sequences', starter: true, pro: true },
  { feature: 'Forms & lead capture', starter: true, pro: true },
  { feature: 'Gmail / Calendar sync', starter: true, pro: true },
  { feature: 'Basic reporting', starter: true, pro: true },
  { feature: 'Power dialer (Twilio)', starter: false, pro: true },
  { feature: 'AI calling (Bland.ai)', starter: false, pro: true },
  { feature: 'Automation engine', starter: false, pro: true },
  { feature: 'Action plans', starter: false, pro: true },
  { feature: 'White label branding', starter: false, pro: true },
  { feature: 'Team routing & assignment', starter: false, pro: true },
  { feature: 'Advanced forecasting', starter: false, pro: true },
  { feature: 'API access', starter: false, pro: true },
  { feature: 'Priority support', starter: false, pro: true },
]

const faqs = [
  {
    q: 'Can I change plans anytime?',
    a: 'Yes. Upgrade or downgrade anytime from your account settings. Changes take effect immediately and billing is prorated.',
  },
  {
    q: 'What happens after the free trial?',
    a: 'After 14 days, you\'ll choose a plan to continue. If you don\'t add a payment method, your account is paused — your data is kept for 30 days.',
  },
  {
    q: 'How does seat pricing work?',
    a: 'Each plan includes base seats. Add more at the per-seat rate. Seats are billed monthly alongside your base plan.',
  },
  {
    q: 'Is there an annual discount?',
    a: 'Yes — pay annually and save 10%. That\'s $313/yr for Starter (vs $348) and $529/yr for Pro (vs $588).',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a 30-day money-back guarantee on your first payment. After that, plans are non-refundable but you can cancel before your next billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit cards via Stripe. We\'ll add ACH and invoicing for annual plans on request.',
  },
]

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  const starterPrice = isAnnual ? 26 : 29
  const proPrice = isAnnual ? 44 : 49

  return (
    <div className="bg-[#0a0a0a] min-h-screen" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Simple, transparent{' '}
          <span className="text-[#0ea5e9]">pricing</span>
        </h1>
        <p className="text-xl text-[#b3b3b3] max-w-xl mx-auto mb-10">
          No hidden fees. No long-term contracts. Start free for 14 days.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-[#b3b3b3]'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${isAnnual ? 'bg-[#0ea5e9]' : 'bg-[#2d2d2d]'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-[#b3b3b3]'}`}>
            Annual <span className="text-[#0ea5e9] text-xs ml-1">Save 10%</span>
          </span>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-24 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Starter */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8 flex flex-col">
            <h3 className="text-white font-bold text-2xl mb-2">Starter</h3>
            <p className="text-[#b3b3b3] text-sm mb-8">For solo operators and small teams getting started</p>
            <div className="mb-8">
              <div className="flex items-end gap-1">
                <span className="text-white font-bold text-6xl">${starterPrice}</span>
                <span className="text-[#b3b3b3] text-sm mb-2">/mo</span>
              </div>
              {isAnnual && <p className="text-[#0ea5e9] text-xs mt-1">Billed annually · Save $36/yr</p>}
              <p className="text-[#b3b3b3] text-sm mt-2">1 seat included</p>
              <p className="text-[#b3b3b3] text-xs mt-1">+$12/seat/mo for additional seats</p>
            </div>
            <Link
              href="/signup"
              className="block text-center border border-[#2d2d2d] text-white rounded-lg px-6 py-3 font-medium hover:bg-[#2d2d2d] transition-colors mb-8"
            >
              Start Free Trial
            </Link>
            <ul className="space-y-3 flex-1">
              {starterFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-[#b3b3b3]">
                  <svg className="w-4 h-4 text-[#0ea5e9] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="bg-[#0ea5e9]/10 border-2 border-[#0ea5e9] rounded-2xl p-8 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#0ea5e9] text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
            </div>
            <h3 className="text-white font-bold text-2xl mb-2">Pro</h3>
            <p className="text-[#b3b3b3] text-sm mb-8">For growing sales teams that need the full stack</p>
            <div className="mb-8">
              <div className="flex items-end gap-1">
                <span className="text-white font-bold text-6xl">${proPrice}</span>
                <span className="text-[#b3b3b3] text-sm mb-2">/mo</span>
              </div>
              {isAnnual && <p className="text-[#0ea5e9] text-xs mt-1">Billed annually · Save $60/yr</p>}
              <p className="text-[#b3b3b3] text-sm mt-2">5 seats included</p>
              <p className="text-[#b3b3b3] text-xs mt-1">+$10/seat/mo for additional seats</p>
            </div>
            <Link
              href="/signup"
              className="block text-center bg-[#0ea5e9] text-white rounded-lg px-6 py-3 font-medium hover:bg-[#0ea5e9]/90 transition-colors mb-8"
            >
              Start Free Trial
            </Link>
            <ul className="space-y-3 flex-1">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-[#b3b3b3]">
                  <svg className="w-4 h-4 text-[#0ea5e9] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Complete Suite banner */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-gradient-to-r from-[#ff1744]/10 to-[#0ea5e9]/10 border border-[#2d2d2d] rounded-2xl p-6 text-center">
            <h3 className="text-white font-bold text-lg mb-2">
              🚀 Using multiple ZiggyTech apps?
            </h3>
            <p className="text-[#b3b3b3] text-sm mb-4">
              Get all 10 apps in the ZiggyTech Business Suite for <span className="text-white font-semibold">$179/mo</span> — saving you hundreds compared to individual pricing.
            </p>
            <a href="https://ziggytechventures.com/suite" className="text-[#0ea5e9] text-sm font-medium hover:underline">
              Learn about the Complete Suite →
            </a>
          </div>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-24 px-4 bg-[#111111] border-t border-[#2d2d2d]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Full feature comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d2d2d]">
                  <th className="text-left py-4 px-4 text-[#b3b3b3] font-medium text-sm">Feature</th>
                  <th className="text-center py-4 px-4 text-white font-semibold">Starter</th>
                  <th className="text-center py-4 px-4 text-[#0ea5e9] font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-[#2d2d2d]/50 ${i % 2 === 0 ? 'bg-[#0a0a0a]/30' : ''}`}>
                    <td className="py-3 px-4 text-[#b3b3b3] text-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? (
                          <svg className="w-5 h-5 text-[#0ea5e9] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-[#555] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-[#b3b3b3] text-sm">{row.starter}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? (
                          <svg className="w-5 h-5 text-[#0ea5e9] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-[#555] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-white font-medium text-sm">{row.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Pricing questions</h2>
          <div className="space-y-5">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3">{faq.q}</h3>
                <p className="text-[#b3b3b3] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#111111] border-t border-[#2d2d2d]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Start free. Scale when you&apos;re ready.</h2>
          <p className="text-[#b3b3b3] text-lg mb-8">14-day trial, full Pro access, no credit card.</p>
          <Link href="/signup" className="bg-[#0ea5e9] text-white rounded-lg px-10 py-4 font-semibold text-lg hover:bg-[#0ea5e9]/90 transition-colors inline-block">
            Start Free Trial
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
