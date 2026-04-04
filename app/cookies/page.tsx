import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy -- ZiggyHQ',
  description: 'How ZiggyTech Ventures LLC uses cookies and similar tracking technologies.',
}

export default function CookiePolicyPage() {
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
          COOKIE POLICY
        </h1>
        <p className="text-[#b3b3b3] mt-2 text-sm">
          ZiggyTech Ventures LLC · Effective Date: [INSERT DATE] · Last Updated: [INSERT DATE]
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[#b3b3b3]">

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              ZiggyTech Ventures LLC uses cookies and similar tracking technologies on our websites, web applications,
              and products within the ZiggyTech Business Suite. This Cookie Policy explains what cookies and tracking
              technologies we use, why we use them, and how you can manage your preferences.
            </p>
            <p className="mt-3">
              This Cookie Policy supplements our{' '}
              <Link href="/privacy" className="text-[#0ea5e9] hover:underline">Privacy Policy</Link>{' '}
              and should be read alongside it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device by websites and web applications you visit. They
              are widely used to make websites work, improve functionality, and to provide information to the site
              operator.
            </p>
            <p className="mt-3">Similar technologies we may use include:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li><strong className="text-white">Local storage</strong> &mdash; browser-based key-value storage (used for preferences like cookie consent dismissal)</li>
              <li><strong className="text-white">Session storage</strong> &mdash; temporary storage cleared when you close your browser</li>
              <li><strong className="text-white">Web beacons / pixels</strong> &mdash; small images used to track email opens or page visits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Types of Cookies We Use</h2>
            <div className="space-y-5">

              <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2d2d2d]">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" />
                  Strictly Necessary Cookies
                </h3>
                <p className="mb-3">Required for the Services to function. These cannot be disabled.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#2d2d2d]">
                        <th className="text-left py-1.5 pr-3 text-white font-medium">Cookie</th>
                        <th className="text-left py-1.5 pr-3 text-white font-medium">Purpose</th>
                        <th className="text-left py-1.5 text-white font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d2d2d]">
                      <tr>
                        <td className="py-1.5 pr-3 text-white font-mono">session_id</td>
                        <td className="py-1.5 pr-3">Maintains your login session</td>
                        <td className="py-1.5">Session</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 text-white font-mono">csrf_token</td>
                        <td className="py-1.5 pr-3">Protects against CSRF attacks</td>
                        <td className="py-1.5">Session</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 text-white font-mono">auth_token</td>
                        <td className="py-1.5 pr-3">Stores authentication state</td>
                        <td className="py-1.5">Up to 30 days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2d2d2d]">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0ea5e9] inline-block" />
                  Functional Cookies
                </h3>
                <p>
                  These enhance usability and personalization. They remember choices you make (e.g., sidebar state,
                  dark mode preferences, cookie consent). You may disable these, but some features may be affected.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2d2d2d]">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block" />
                  Analytics Cookies
                </h3>
                <p>
                  We may use analytics tools to understand how users interact with our platform in aggregate.
                  This data is anonymized and used only to improve the Services.
                </p>
              </div>

            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Managing Your Cookie Preferences</h2>
            <p>
              You can control cookies through your browser settings. Most browsers allow you to refuse new cookies,
              delete existing cookies, and be notified when new cookies are set.
            </p>
            <p className="mt-3">
              Note that disabling strictly necessary cookies will prevent you from using our Services. Disabling
              functional cookies may affect your experience.
            </p>
            <p className="mt-3">
              To reset your consent for our cookie banner, clear your browser&apos;s local storage or use your
              browser&apos;s privacy tools.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Contact Us</h2>
            <p>
              For cookie-related questions, contact:<br />
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
            <Link href="/privacy" className="text-xs text-[#b3b3b3]/60 hover:text-[#0ea5e9] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-[#b3b3b3]/60 hover:text-[#0ea5e9] transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="text-xs text-[#0ea5e9]">Cookie Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
