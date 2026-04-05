'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MarketingNav } from '@/app/components/marketing/Nav'
import { MarketingFooter } from '@/app/components/marketing/Footer'

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How does the free trial work?',
        a: 'You get 14 days of full Pro access — no credit card required. Every feature is unlocked so you can evaluate ZiggyHQ properly before committing. At the end of your trial, you choose a plan to continue or your account is paused.',
      },
      {
        q: 'Do I need a credit card to sign up?',
        a: 'No. You can start your 14-day free trial with just an email address. We only ask for payment information when you decide to subscribe.',
      },
      {
        q: 'How long does setup take?',
        a: 'Most teams are fully set up in under an hour. Connect your email, import your contacts, and create your first pipeline. We provide onboarding guides and video walkthroughs to help you hit the ground running.',
      },
      {
        q: 'Can I import my existing contacts?',
        a: 'Yes. Import contacts from a CSV file or connect your existing CRM. Pro plan users get free migration assistance from our team.',
      },
    ],
  },
  {
    category: 'Plans & Pricing',
    questions: [
      {
        q: "What's the difference between Starter and Pro?",
        a: 'Starter ($29/mo) includes 1 seat and core CRM features: pipeline, contact management, email sequences, forms, and basic reporting. Pro ($49/mo) includes 5 seats plus everything in Starter, plus: power dialer (Twilio), AI calling (Bland.ai), advanced automation, white label branding, smart lists, advanced reporting, and priority support.',
      },
      {
        q: 'How does seat/team pricing work?',
        a: 'Each plan includes base seats. Add more at the per-seat rate: $12/seat/mo on Starter, $10/seat/mo on Pro. Seats are billed monthly alongside your base plan. You can add or remove seats anytime.',
      },
      {
        q: 'Can I change plans anytime?',
        a: 'Yes. Upgrade or downgrade anytime from your account settings. Upgrades take effect immediately and you\'re charged the prorated difference. Downgrades take effect at your next billing cycle.',
      },
      {
        q: 'Is there an annual discount?',
        a: 'Yes — pay annually and save 10%. Starter drops to $26/mo (vs $29) and Pro to $44/mo (vs $49). Annual billing is billed once upfront.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer a 30-day money-back guarantee on your first payment if you\'re not satisfied. After that, subscriptions are non-refundable, but you can cancel before your next billing cycle to avoid future charges.',
      },
      {
        q: 'What happens after my trial ends?',
        a: 'If you add a payment method and choose a plan, your account continues uninterrupted. If you don\'t, your account is paused. Your data is retained for 30 days, after which it\'s permanently deleted.',
      },
    ],
  },
  {
    category: 'Features',
    questions: [
      {
        q: 'Does ZiggyHQ work on mobile?',
        a: 'Yes. ZiggyHQ is fully mobile-responsive and works in your mobile browser. A dedicated iOS and Android app is on the roadmap.',
      },
      {
        q: 'How does the power dialer work?',
        a: 'The power dialer is powered by Twilio. Click any phone number in your contact list to call. You can drop pre-recorded voicemails, record calls, view live transcriptions, and have calls automatically logged in the contact timeline. Available on Pro plan.',
      },
      {
        q: 'How does AI calling work?',
        a: 'AI calling is powered by Bland.ai. Deploy a voice AI agent that can qualify inbound leads, make outbound calls, and book meetings on your behalf — 24/7, without a human rep. Available on Pro plan.',
      },
      {
        q: 'Can I white label ZiggyHQ?',
        a: 'Yes, white label is available on the Pro plan. Remove ZiggyHQ branding and replace it with your own logo and company name. Ideal for agencies and resellers.',
      },
      {
        q: 'What integrations does ZiggyHQ support?',
        a: 'Native integrations: Gmail, Google Calendar, Twilio, Bland.ai, Resend, Stripe, and Zapier. Via Zapier, connect 5,000+ additional apps. Outbound webhooks are also available for custom integrations.',
      },
    ],
  },
  {
    category: 'Security & Data',
    questions: [
      {
        q: 'Is my data secure?',
        a: 'Yes. All data is encrypted at rest using AES-256 and encrypted in transit using TLS 1.3. We use Supabase with row-level security to ensure your data is strictly isolated. Payments are processed by Stripe, which is PCI compliant.',
      },
      {
        q: 'Do you support two-factor authentication?',
        a: 'Yes. Two-factor authentication (TOTP) is available for all accounts. We recommend enabling it in your account security settings.',
      },
      {
        q: 'Where is my data stored?',
        a: 'Data is stored in Supabase (PostgreSQL) hosted on AWS infrastructure in the United States. We do not sell or share your data with third parties.',
      },
      {
        q: 'Can I export or delete my data?',
        a: 'Yes. You can export all contacts, deals, and activity data as CSV at any time. You can delete your account and all associated data from account settings. Deletion is permanent.',
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[#2d2d2d] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#1a1a1a] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-white font-medium pr-4">{q}</span>
        <svg
          className={`w-5 h-5 text-[#0ea5e9] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-5 bg-[#111111] border-t border-[#2d2d2d]">
          <p className="text-[#b3b3b3] text-sm leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Frequently asked{' '}
            <span className="text-[#0ea5e9]">questions</span>
          </h1>
          <p className="text-[#b3b3b3] text-lg">
            Everything you need to know about ZiggyHQ. Can&apos;t find your answer?{' '}
            <a href="mailto:hello@ziggyhq.com" className="text-[#0ea5e9] hover:underline">Contact us</a>.
          </p>
        </div>
      </section>

      {/* FAQ sections */}
      <section className="py-12 pb-24 px-4">
        <div className="max-w-3xl mx-auto space-y-16">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-bold text-white mb-6 pb-3 border-b border-[#2d2d2d]">
                {section.category}
              </h2>
              <div className="space-y-3">
                {section.questions.map((qa) => (
                  <FAQItem key={qa.q} q={qa.q} a={qa.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#111111] border-t border-[#2d2d2d]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Still have questions?</h2>
          <p className="text-[#b3b3b3] text-lg mb-8">Our team is happy to help. Reach out anytime.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hello@ziggyhq.com"
              className="bg-[#0ea5e9] text-white rounded-lg px-8 py-4 font-semibold text-lg hover:bg-[#0ea5e9]/90 transition-colors"
            >
              Contact Support
            </a>
            <Link href="/signup" className="border border-[#2d2d2d] text-white rounded-lg px-8 py-4 font-semibold text-lg hover:bg-[#1a1a1a] transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
