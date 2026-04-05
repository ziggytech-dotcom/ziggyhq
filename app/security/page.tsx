import Link from 'next/link'
import { MarketingNav } from '@/app/components/marketing/Nav'
import { MarketingFooter } from '@/app/components/marketing/Footer'

const securityFeatures = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Two-Factor Authentication (TOTP)',
    description: 'Protect your account with time-based one-time passwords. Enable 2FA via any authenticator app (Google Authenticator, Authy, 1Password) for an extra layer of security on every login.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    title: 'Data Encrypted at Rest (AES-256)',
    description: 'All data stored in ZiggyHQ databases is encrypted using AES-256, the same encryption standard used by financial institutions and government agencies worldwide.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
    title: 'Data Encrypted in Transit (TLS 1.3)',
    description: 'All data transmitted between your browser and our servers is protected using TLS 1.3 — the latest and most secure transport layer security protocol available.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'SOC 2 Compliance (In Progress)',
    description: 'We are actively working toward SOC 2 Type II certification. Our infrastructure, access controls, and data handling practices are built to meet the rigorous requirements of the SOC 2 framework.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: 'PCI Compliant Payments (Stripe)',
    description: 'We never store your payment card data. All billing is handled by Stripe, a Level 1 PCI DSS compliant payment processor trusted by millions of businesses worldwide.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Row-Level Security (Supabase RLS)',
    description: 'Our database enforces row-level security at the database layer using Supabase RLS policies. Your data is strictly isolated — no user or team can ever access another organization\'s data, even in the event of application-level bugs.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
      </svg>
    ),
    title: 'Regular Security Audits',
    description: 'We conduct regular internal security audits and penetration testing. Our code is reviewed for common vulnerabilities (OWASP Top 10) and we maintain a responsible disclosure program.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'Google & Apple SSO',
    description: 'Sign in with Google or Apple for a secure, passwordless authentication experience. We support OAuth 2.0 and never store third-party passwords.',
  },
]

export default function SecurityPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0ea5e9]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="w-16 h-16 bg-[#0ea5e9]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#0ea5e9]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Your data is{' '}
            <span className="text-[#0ea5e9]">safe with us</span>
          </h1>
          <p className="text-xl text-[#b3b3b3] max-w-2xl mx-auto">
            Security isn&apos;t an afterthought at ZiggyHQ — it&apos;s built into every layer of the platform. Here&apos;s exactly how we protect your business data.
          </p>
        </div>
      </section>

      {/* Security features grid */}
      <section className="py-16 px-4 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feature) => (
              <div key={feature.title} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 flex gap-5">
                <div className="w-12 h-12 bg-[#0ea5e9]/10 rounded-xl flex items-center justify-center text-[#0ea5e9] flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-[#b3b3b3] text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="py-20 px-4 bg-[#111111] border-t border-[#2d2d2d]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Built on trusted infrastructure</h2>
          <p className="text-[#b3b3b3] max-w-xl mx-auto mb-10">
            ZiggyHQ runs on enterprise-grade infrastructure from companies that have set the standard for reliability and security.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Supabase', role: 'Database & Auth' },
              { name: 'Vercel', role: 'Hosting & CDN' },
              { name: 'Stripe', role: 'Payments' },
              { name: 'AWS', role: 'Cloud Infrastructure' },
            ].map((provider) => (
              <div key={provider.name} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 text-center">
                <p className="text-white font-semibold mb-1">{provider.name}</p>
                <p className="text-[#b3b3b3] text-xs">{provider.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vulnerability disclosure */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Report a vulnerability</h2>
                <p className="text-[#b3b3b3] leading-relaxed mb-6">
                  We take security reports seriously. If you discover a vulnerability in ZiggyHQ, please report it responsibly. We&apos;ll acknowledge your report within 24 hours and work to resolve confirmed issues promptly.
                </p>
                <a
                  href="mailto:security@ziggyhq.com"
                  className="inline-flex items-center gap-2 bg-[#0ea5e9] text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  security@ziggyhq.com
                </a>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#0ea5e9] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-white text-sm font-medium">24-hour acknowledgment</p>
                    <p className="text-[#b3b3b3] text-xs">We respond to every security report within one business day.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#0ea5e9] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-white text-sm font-medium">Responsible disclosure</p>
                    <p className="text-[#b3b3b3] text-xs">We appreciate researchers who follow responsible disclosure guidelines.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#0ea5e9] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-white text-sm font-medium">No legal action for good-faith reports</p>
                    <p className="text-[#b3b3b3] text-xs">We will not pursue legal action against researchers acting in good faith.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
