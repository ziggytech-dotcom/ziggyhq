import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[#2d2d2d] bg-[#0a0a0a] px-8 py-5 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-[#b3b3b3]/60">
          © {new Date().getFullYear()} ZiggyTech Ventures LLC. All rights reserved.
        </p>
        <nav className="flex items-center gap-5">
          <Link
            href="/privacy"
            className="text-xs text-[#b3b3b3]/60 hover:text-[#0ea5e9] transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-xs text-[#b3b3b3]/60 hover:text-[#0ea5e9] transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/cookies"
            className="text-xs text-[#b3b3b3]/60 hover:text-[#0ea5e9] transition-colors"
          >
            Cookie Policy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
