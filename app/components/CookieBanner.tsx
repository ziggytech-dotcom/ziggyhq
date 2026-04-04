'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COOKIE_KEY = 'ziggyhq_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(COOKIE_KEY)
      if (!dismissed) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable -- don't show banner
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(COOKIE_KEY, 'accepted')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 flex-wrap px-6 py-4 bg-[#1a1a1a] border-t border-[#2d2d2d] shadow-2xl"
    >
      <p className="text-sm text-[#b3b3b3] flex-1 min-w-[240px]">
        We use cookies to keep you signed in and improve your experience. By continuing you agree to our{' '}
        <Link href="/cookies" className="text-[#0ea5e9] hover:underline">
          Cookie Policy
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-[#0ea5e9] hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <button
        onClick={dismiss}
        className="flex-shrink-0 px-5 py-2 rounded-lg bg-[#0ea5e9] text-white text-sm font-semibold hover:bg-[#0ea5e9]/90 transition-colors"
      >
        Got it
      </button>
    </div>
  )
}
