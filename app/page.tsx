import Link from 'next/link'
import Image from 'next/image'
import { MarketingNav } from '@/app/components/marketing/Nav'
import { MarketingFooter } from '@/app/components/marketing/Footer'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Visual Pipeline',
    description: 'Drag-and-drop deal tracking. See every opportunity at a glance and never let a deal fall through the cracks.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Email Sequences',
    description: 'Automated follow-up sequences that feel personal. Schedule, track opens, and trigger next steps automatically.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Contact Management',
    description: 'Rich contact profiles with full activity history, notes, tags, and custom fields tailored to your business.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    title: 'Power Dialer',
    description: 'Call through your list at lightning speed with Twilio-powered dialing, call recording, and live transcription.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'AI Calling',
    description: 'Deploy AI agents powered by Bland.ai to qualify leads 24/7. Never miss an inbound call again.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Reports & Analytics',
    description: 'Real-time dashboards showing pipeline health, team performance, revenue forecasts, and conversion rates.',
  },
]

const faqs = [
  {
    q: 'How does the free trial work?',
    a: '14 days, full access, no credit card required. You get every Pro feature unlocked so you can see exactly what ZiggyHQ can do before committing.',
  },
  {
    q: 'What\'s the difference between Starter and Pro?',
    a: 'Starter ($29/mo) includes 1 seat and core CRM features — pipeline, contacts, email sequences. Pro ($49/mo) includes 5 seats, AI calling, white label, automation engine, and priority support.',
  },
  {
    q: 'Can I add more seats to my plan?',
    a: 'Yes. On Starter, add seats at $12/seat/mo. On Pro, add seats at $10/seat/mo. Scale up or down anytime.',
  },
  {
    q: 'Does ZiggyHQ integrate with my existing tools?',
    a: 'Yes — native integrations with Gmail, Google Calendar, Twilio, Bland.ai, Resend, Stripe, and Zapier. Connect 5,000+ more apps via Zapier.',
  },
  {
    q: 'Can I import my existing contacts?',
    a: 'Absolutely. Import from CSV, or connect your existing CRM. We\'ll help you migrate your data for free on the Pro plan.',
  },
  {
    q: 'Is my data secure?',
    a: 'Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use Supabase row-level security, and payments are processed by Stripe (PCI compliant).',
  },
]

const socialProofLogos = [
  { domain: 'shopify.com', name: 'Shopify' },
  { domain: 'stripe.com', name: 'Stripe' },
  { domain: 'notion.so', name: 'Notion' },
  { domain: 'linear.app', name: 'Linear' },
  { domain: 'vercel.com', name: 'Vercel' },
  { domain: 'figma.com', name: 'Figma' },
]

export default function HomePage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0ea5e9]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-full px-4 py-1.5 text-sm text-[#0ea5e9] mb-8">
            <span className="w-2 h-2 bg-[#0ea5e9] rounded-full animate-pulse" />
            14-day free trial · No credit card required
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            The CRM that actually{' '}
            <span className="text-[#0ea5e9]">closes deals</span>
          </h1>

          <p className="text-xl text-[#b3b3b3] max-w-2xl mx-auto mb-10 leading-relaxed">
            Pipeline management, email sequences, power dialing, and AI calling — all in one place. Starting at $29/mo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="bg-[#0ea5e9] text-white rounded-lg px-8 py-4 font-semibold text-lg hover:bg-[#0ea5e9]/90 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/features"
              className="border border-[#2d2d2d] text-white rounded-lg px-8 py-4 font-semibold text-lg hover:bg-[#1a1a1a] transition-colors"
            >
              See Features
            </Link>
          </div>

          {/* Product screenshot placeholder */}
          <div className="max-w-5xl mx-auto bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2d2d2d] bg-[#111]">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="aspect-[16/9] flex items-center justify-center">
              <p className="text-[#555] text-sm">Product screenshot coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="bg-[#111111] border-y border-[#2d2d2d] py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[#b3b3b3] text-sm font-medium mb-8">
            Trusted by <span className="text-white font-semibold">500+ businesses</span> and growing
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 opacity-50">
            {socialProofLogos.map((logo) => (
              <div key={logo.domain} className="flex items-center gap-2">
                <img
                  src={`https://logo.clearbit.com/${logo.domain}`}
                  alt={logo.name}
                  className="h-6 w-auto object-contain grayscale"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features overview */}
      <section className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Everything you need to{' '}
              <span className="text-[#0ea5e9]">scale sales</span>
            </h2>
            <p className="text-[#b3b3b3] text-lg max-w-2xl mx-auto">
              Built for sales teams that want to move fast and close more. No fluff, no feature bloat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 hover:border-[#0ea5e9]/50 transition-colors">
                <div className="w-10 h-10 bg-[#0ea5e9]/10 rounded-lg flex items-center justify-center text-[#0ea5e9] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-[#b3b3b3] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/features" className="text-[#0ea5e9] hover:text-[#0ea5e9]/80 text-sm font-medium transition-colors">
              See all features →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-24 px-4 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Simple, transparent pricing
            </h2>
            <p className="text-[#b3b3b3] text-lg">
              No hidden fees. No long-term contracts. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Starter */}
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8">
              <h3 className="text-white font-bold text-xl mb-1">Starter</h3>
              <p className="text-[#b3b3b3] text-sm mb-6">For solo operators and small teams</p>
              <div className="mb-6">
                <span className="text-white font-bold text-5xl">$29</span>
                <span className="text-[#b3b3b3] text-sm">/mo</span>
                <p className="text-[#b3b3b3] text-xs mt-1">1 seat included · +$12/seat</p>
              </div>
              <Link href="/signup" className="block text-center border border-[#2d2d2d] text-white rounded-lg px-6 py-3 font-medium text-sm hover:bg-[#2d2d2d] transition-colors mb-6">
                Start Free Trial
              </Link>
              <ul className="space-y-2 text-sm text-[#b3b3b3]">
                {['Visual pipeline', 'Contact management', 'Email sequences', 'Forms & lead capture', 'Basic reporting'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[#0ea5e9]">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-[#0ea5e9]/10 border-2 border-[#0ea5e9] rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#0ea5e9] text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-1">Pro</h3>
              <p className="text-[#b3b3b3] text-sm mb-6">For growing sales teams</p>
              <div className="mb-6">
                <span className="text-white font-bold text-5xl">$49</span>
                <span className="text-[#b3b3b3] text-sm">/mo</span>
                <p className="text-[#b3b3b3] text-xs mt-1">5 seats included · +$10/seat</p>
              </div>
              <Link href="/signup" className="block text-center bg-[#0ea5e9] text-white rounded-lg px-6 py-3 font-medium text-sm hover:bg-[#0ea5e9]/90 transition-colors mb-6">
                Start Free Trial
              </Link>
              <ul className="space-y-2 text-sm text-[#b3b3b3]">
                {['Everything in Starter', 'Power dialer (Twilio)', 'AI calling (Bland.ai)', 'Automation engine', 'White label', 'Priority support'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[#0ea5e9]">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-[#0ea5e9] hover:text-[#0ea5e9]/80 text-sm font-medium transition-colors">
              See full pricing & feature comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3">{faq.q}</h3>
                <p className="text-[#b3b3b3] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="text-[#0ea5e9] hover:text-[#0ea5e9]/80 text-sm font-medium transition-colors">
              See all FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-[#111111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Ready to close more deals?
          </h2>
          <p className="text-[#b3b3b3] text-xl mb-10">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-[#0ea5e9] text-white rounded-lg px-10 py-4 font-semibold text-lg hover:bg-[#0ea5e9]/90 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="border border-[#2d2d2d] text-white rounded-lg px-10 py-4 font-semibold text-lg hover:bg-[#1a1a1a] transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
