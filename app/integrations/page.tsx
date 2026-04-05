import Link from 'next/link'
import { MarketingNav } from '@/app/components/marketing/Nav'
import { MarketingFooter } from '@/app/components/marketing/Footer'

const nativeIntegrations = [
  { name: 'Gmail', domain: 'gmail.com', description: 'Sync emails, track opens, send from your own address', badge: 'Native' },
  { name: 'Google Calendar', domain: 'calendar.google.com', description: 'Sync meetings and schedule follow-ups automatically', badge: 'Native' },
  { name: 'Twilio', domain: 'twilio.com', description: 'Power dialer, call recording, SMS, local presence', badge: 'Native' },
  { name: 'Bland.ai', domain: 'bland.ai', description: 'AI voice calling for 24/7 lead qualification', badge: 'Native' },
  { name: 'Resend', domain: 'resend.com', description: 'Transactional email delivery with high deliverability', badge: 'Native' },
  { name: 'Stripe', domain: 'stripe.com', description: 'Collect payments and manage subscriptions from your CRM', badge: 'Native' },
  { name: 'Zapier', domain: 'zapier.com', description: 'Connect 5,000+ apps with automated workflows', badge: 'Native' },
]

const comingSoon = [
  { name: 'Slack', domain: 'slack.com', description: 'Get deal alerts and notifications in Slack' },
  { name: 'Outlook', domain: 'outlook.com', description: 'Microsoft email and calendar sync' },
  { name: 'QuickBooks', domain: 'quickbooks.intuit.com', description: 'Sync invoices and revenue data' },
  { name: 'Salesforce', domain: 'salesforce.com', description: 'Bi-directional sync with Salesforce CRM' },
]

export default function IntegrationsPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0ea5e9]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Works with the tools{' '}
            <span className="text-[#0ea5e9]">you already use</span>
          </h1>
          <p className="text-xl text-[#b3b3b3] max-w-2xl mx-auto">
            ZiggyHQ connects natively with your favorite tools — and via Zapier, connects with 5,000+ more.
          </p>
        </div>
      </section>

      {/* Native integrations */}
      <section className="py-16 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Native integrations</h2>
            <p className="text-[#b3b3b3]">Deep, built-in connections that work out of the box.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {nativeIntegrations.map((integration) => (
              <div key={integration.name} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 hover:border-[#0ea5e9]/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                    <img
                      src={`https://logo.clearbit.com/${integration.domain}`}
                      alt={integration.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<span class="text-[#0ea5e9] font-bold text-lg">${integration.name[0]}</span>`
                      }}
                    />
                  </div>
                  <span className="bg-[#0ea5e9]/10 text-[#0ea5e9] text-xs font-medium px-2 py-0.5 rounded-full">
                    {integration.badge}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">{integration.name}</h3>
                <p className="text-[#b3b3b3] text-xs leading-relaxed">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="py-16 px-4 bg-[#111111] border-t border-[#2d2d2d]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Coming soon</h2>
            <p className="text-[#b3b3b3]">These integrations are on the roadmap. Vote for your favorites.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {comingSoon.map((integration) => (
              <div key={integration.name} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 opacity-70">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                    <img
                      src={`https://logo.clearbit.com/${integration.domain}`}
                      alt={integration.name}
                      className="w-8 h-8 object-contain grayscale"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<span class="text-[#555] font-bold text-lg">${integration.name[0]}</span>`
                      }}
                    />
                  </div>
                  <span className="bg-[#2d2d2d] text-[#b3b3b3] text-xs font-medium px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">{integration.name}</h3>
                <p className="text-[#b3b3b3] text-xs leading-relaxed">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zapier + Webhooks */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Don&apos;t see your tool?
                </h2>
                <p className="text-[#b3b3b3] mb-6 leading-relaxed">
                  If it&apos;s not listed above, you can still connect it. ZiggyHQ supports outbound webhooks and works with Zapier — giving you access to 5,000+ apps including Slack, HubSpot, Notion, Airtable, and thousands more.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/signup" className="bg-[#0ea5e9] text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors text-center">
                    Start Free Trial
                  </Link>
                  <a
                    href="mailto:hello@ziggyhq.com?subject=Integration Request"
                    className="border border-[#2d2d2d] text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-[#2d2d2d] transition-colors text-center"
                  >
                    Request an Integration
                  </a>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-[#0ea5e9]/10 rounded-lg flex items-center justify-center text-[#0ea5e9]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold text-sm">Zapier Integration</h4>
                  </div>
                  <p className="text-[#b3b3b3] text-xs">Connect ZiggyHQ to 5,000+ apps with no-code Zaps. Trigger on new leads, deal updates, form submissions, and more.</p>
                </div>
                <div className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-[#0ea5e9]/10 rounded-lg flex items-center justify-center text-[#0ea5e9]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold text-sm">Webhooks</h4>
                  </div>
                  <p className="text-[#b3b3b3] text-xs">Send real-time event data to any endpoint. New contact, deal moved, form submitted — your systems get notified instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#111111] border-t border-[#2d2d2d]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Your stack, connected</h2>
          <p className="text-[#b3b3b3] text-lg mb-8">Start your free trial and connect your tools in minutes.</p>
          <Link href="/signup" className="bg-[#0ea5e9] text-white rounded-lg px-10 py-4 font-semibold text-lg hover:bg-[#0ea5e9]/90 transition-colors inline-block">
            Start Free Trial
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
