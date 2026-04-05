import Link from 'next/link'
import { ZiggyHQLogo } from '@/app/components/ZiggyHQLogo'

export function MarketingFooter() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#2d2d2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <ZiggyHQLogo />
            <p className="mt-4 text-[#b3b3b3] text-sm leading-relaxed">
              The CRM built for modern sales teams. Close more deals, faster.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              {[
                { href: '/features', label: 'Features' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/integrations', label: 'Integrations' },
                { href: '/compare/gohighlevel', label: 'Compare' },
                { href: '/blog', label: 'Blog' },
                { href: '/changelog', label: 'Changelog' },
                { href: '/security', label: 'Security' },
                { href: '/faq', label: 'FAQ' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#b3b3b3] hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-3">
              {[
                { href: '/about', label: 'About' },
                { href: '/press', label: 'Press' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#b3b3b3] hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-3">
              {[
                { href: '/privacy', label: 'Privacy' },
                { href: '/terms', label: 'Terms' },
                { href: '/cookies', label: 'Cookies' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#b3b3b3] hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://youtube.com/@ziggyhq" target="_blank" rel="noopener noreferrer" className="text-[#b3b3b3] hover:text-white text-sm transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </a>
              </li>
              <li>
                <a href="https://linkedin.com/company/ziggyhq" target="_blank" rel="noopener noreferrer" className="text-[#b3b3b3] hover:text-white text-sm transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="https://twitter.com/ziggyhq" target="_blank" rel="noopener noreferrer" className="text-[#b3b3b3] hover:text-white text-sm transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2d2d2d] mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#b3b3b3] text-sm">
            © 2026 ZiggyTech Ventures LLC. All rights reserved.
          </p>
          <p className="text-[#555] text-xs">
            All trademarks belong to their respective owners.
          </p>
        </div>
      </div>
    </footer>
  )
}
