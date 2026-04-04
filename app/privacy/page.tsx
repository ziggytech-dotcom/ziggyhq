import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy -- ZiggyHQ',
  description: 'How ZiggyTech Ventures LLC collects, uses, and protects your data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Header */}
      <header className="border-b border-[#2d2d2d] px-8 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/app" className="text-[#0ea5e9] text-sm hover:underline">
            ← Back to ZiggyHQ
          </Link>
          <span className="text-xs text-[#b3b3b3]">ZiggyTech Ventures LLC</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-8 py-12">
        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2d2d2d] text-xs text-[#f59e0b]">
          ⚠️ Draft -- Pending Attorney Review
        </div>

        <h1 className="mt-4 text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
          PRIVACY POLICY
        </h1>
        <p className="text-[#b3b3b3] mt-2 text-sm">
          ZiggyTech Ventures LLC &middot; Effective Date: [INSERT DATE] &middot; Last Updated: [INSERT DATE]
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[#b3b3b3]">

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              ZiggyTech Ventures LLC ("ZiggyTech," "we," "us," or "our") is a Nevada limited liability company
              (EIN: 41-4738365) that provides a suite of B2B SaaS products (the "Business Suite") to small and
              mid-sized businesses across the United States, including <strong className="text-white">ZiggyHQ</strong> &mdash; our CRM and business operations hub.
            </p>
            <p className="mt-3">
              This Privacy Policy describes how we collect, use, disclose, and protect information in connection
              with our Business Suite. By using our Services, you acknowledge and agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Data Processor / Data Controller Distinction</h2>
            <p>
              ZiggyTech operates primarily as a <strong className="text-white">data processor</strong>, not a data controller.
              Our customers (the businesses using our Services) are the data controllers -- they determine the purposes
              and means by which personal data of their clients, employees, and contacts is processed through our platform.
            </p>
            <p className="mt-3">
              ZiggyTech acts as a data controller in limited circumstances -- for example, when processing account
              registration information, billing data, and usage analytics for our own business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Information We Collect</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-white font-medium mb-1">3.1 Customer-Provided Data (Processor Role)</h3>
                <p>Contact data, employment and payroll data, scheduling data, financial data, and other information
                  customers input about their clients, employees, or contacts. We process this solely as instructed
                  by our customers.</p>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">3.2 Account Information (Controller Role)</h3>
                <p>Business name, owner name, email address, phone number, billing address, and payment information
                  (processed by Stripe -- we do not store raw card data).</p>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">3.3 Automatically Collected Data</h3>
                <p>IP addresses, browser type, device identifiers, session data, and navigation patterns via cookies
                  and similar technologies. See our{' '}
                  <Link href="/cookies" className="text-[#0ea5e9] hover:underline">Cookie Policy</Link>{' '}
                  for details.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Providing, maintaining, and improving our Services</li>
              <li>Processing payments and managing billing</li>
              <li>Sending transactional emails and service notifications</li>
              <li>Responding to support requests</li>
              <li>Complying with legal obligations</li>
              <li>Detecting and preventing fraud and abuse</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Data Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li><strong className="text-white">Service providers</strong> &mdash; Stripe (payments), Supabase (database), Resend (email), Bland.ai (AI calling)</li>
              <li><strong className="text-white">Legal requirements</strong> &mdash; when required by law or valid legal process</li>
              <li><strong className="text-white">Business transfers</strong> &mdash; in connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Your Rights</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-white font-medium mb-1">California Residents (CCPA)</h3>
                <p>You have the right to know what personal information we collect, to request deletion of your data,
                  to opt out of the sale of personal information (we do not sell data), and to non-discrimination for
                  exercising your rights. To submit a request, contact us at{' '}
                  <a href="mailto:privacy@ziggytechventures.com" className="text-[#0ea5e9] hover:underline">
                    privacy@ziggytechventures.com
                  </a>.</p>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Data Export</h3>
                <p>You may request an export of your account data at any time from your Account Settings page or
                  by contacting us directly.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption at rest and in transit, access
              controls, and regular security reviews. No method of transmission over the internet is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide Services. Upon
              account termination, we will delete or anonymize your data within 90 days, except where retention
              is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact:<br />
              <strong className="text-white">ZiggyTech Ventures LLC</strong><br />
              <a href="mailto:privacy@ziggytechventures.com" className="text-[#0ea5e9] hover:underline">
                privacy@ziggytechventures.com
              </a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2d2d2d] px-8 py-5 mt-12">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#b3b3b3]/60">© {new Date().getFullYear()} ZiggyTech Ventures LLC</p>
          <nav className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-[#0ea5e9]">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-[#b3b3b3]/60 hover:text-[#0ea5e9] transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="text-xs text-[#b3b3b3]/60 hover:text-[#0ea5e9] transition-colors">Cookie Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
