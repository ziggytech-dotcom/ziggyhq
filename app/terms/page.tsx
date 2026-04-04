import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service -- ZiggyHQ',
  description: 'The Terms of Service for ZiggyTech Ventures LLC and the ZiggyHQ platform.',
}

export default function TermsOfServicePage() {
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
          TERMS OF SERVICE
        </h1>
        <p className="text-[#b3b3b3] mt-2 text-sm">
          ZiggyTech Ventures LLC &middot; Effective Date: [INSERT DATE] &middot; Last Updated: [INSERT DATE]
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[#b3b3b3]">

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Agreement to Terms</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you (the business
              entity or individual entering this agreement, "Customer" or "you") and{' '}
              <strong className="text-white">ZiggyTech Ventures LLC</strong>, a Nevada limited liability company
              with EIN 41-4738365 ("ZiggyTech," "we," "us," or "our").
            </p>
            <p className="mt-3">
              By accessing, registering for, or using any product or service within the ZiggyTech Business Suite
              -- including ZiggyHQ -- you acknowledge that you have read, understood, and agree to be bound by these
              Terms and all policies incorporated herein by reference, including our{' '}
              <Link href="/privacy" className="text-[#0ea5e9] hover:underline">Privacy Policy</Link> and{' '}
              <Link href="/cookies" className="text-[#0ea5e9] hover:underline">Cookie Policy</Link>.
            </p>
            <p className="mt-3 text-white font-medium">
              If you do not agree to these Terms, you must not access or use our Services.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Description of Services</h2>
            <p>ZiggyTech provides a suite of B2B SaaS products including:</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#2d2d2d]">
                    <th className="text-left py-2 pr-4 text-white font-medium">Product</th>
                    <th className="text-left py-2 text-white font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d2d2d]">
                  {[
                    ['ZiggyHQ', 'CRM & business operations hub'],
                    ['ZiggyDocs', 'Document management & electronic signature'],
                    ['ZiggyNexus', 'Team collaboration & internal communication'],
                    ['ZiggySchedule', 'Appointment booking & resource scheduling'],
                    ['ZiggyPayroll', 'Payroll processing & contractor management'],
                  ].map(([product, desc]) => (
                    <tr key={product}>
                      <td className="py-2 pr-4 text-white font-medium whitespace-nowrap">{product}</td>
                      <td className="py-2 text-[#b3b3b3]">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Account Registration & Eligibility</h2>
            <p>
              You must be at least 18 years of age and have the legal capacity to enter into contracts. Our Services
              are intended for business use only. You are responsible for maintaining the confidentiality of your
              login credentials and for all activities that occur under your account.
            </p>
            <p className="mt-3">
              Notify us immediately at{' '}
              <a href="mailto:legal@ziggytechventures.com" className="text-[#0ea5e9] hover:underline">
                legal@ziggytechventures.com
              </a>{' '}
              if you suspect unauthorized access to your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li>Use the Services for any unlawful purpose or in violation of applicable regulations</li>
              <li>Send unsolicited commercial emails or messages in violation of CAN-SPAM, TCPA, or similar laws</li>
              <li>Upload or transmit malware, viruses, or malicious code</li>
              <li>Attempt to gain unauthorized access to any part of the Services or related systems</li>
              <li>Reverse engineer, decompile, or otherwise attempt to extract source code</li>
              <li>Resell or sublicense the Services without our express written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Email & Communications Compliance</h2>
            <p>
              When using ZiggyHQ email sequences or other communication features, you agree to comply with all
              applicable laws including the CAN-SPAM Act, TCPA, and GDPR where applicable. This includes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li>Including a valid physical postal address in all commercial emails</li>
              <li>Including a clear and conspicuous unsubscribe mechanism in all email sequences</li>
              <li>Honoring unsubscribe requests within 10 business days</li>
              <li>Not using deceptive subject lines or sender information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Payment Terms</h2>
            <p>
              Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable
              except as required by law or as expressly stated in these Terms. We reserve the right to suspend
              access to the Services for accounts with overdue balances.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>
              ZiggyTech retains all right, title, and interest in and to the Services, including all intellectual
              property rights. You retain ownership of all data you submit to the Services. By submitting content,
              you grant ZiggyTech a limited license to use that content solely to provide the Services.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZIGGYTECH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICES. OUR TOTAL
              LIABILITY SHALL NOT EXCEED THE FEES PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Termination</h2>
            <p>
              Either party may terminate this agreement with 30 days' written notice. ZiggyTech may suspend or
              terminate your account immediately for material breach of these Terms. Upon termination, you may
              request a data export within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Nevada, without regard to conflict of law
              principles. Any disputes shall be resolved through binding arbitration in Clark County, Nevada,
              except for claims eligible for small claims court.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">11. Contact</h2>
            <p>
              <strong className="text-white">ZiggyTech Ventures LLC</strong><br />
              <a href="mailto:legal@ziggytechventures.com" className="text-[#0ea5e9] hover:underline">
                legal@ziggytechventures.com
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
            <Link href="/privacy" className="text-xs text-[#b3b3b3]/60 hover:text-[#0ea5e9] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-[#0ea5e9]">Terms of Service</Link>
            <Link href="/cookies" className="text-xs text-[#b3b3b3]/60 hover:text-[#0ea5e9] transition-colors">Cookie Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
