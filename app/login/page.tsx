'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ZiggyHQLogo } from '@/app/components/ZiggyHQLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-3">
            <ZiggyHQLogo />
          </div>
          <p className="text-[#b3b3b3] text-sm">The CRM built for closers</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-[#b3b3b3] text-sm">
                We sent a magic link to <span className="text-white font-medium">{email}</span>.<br />
                Click the link to sign in.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-[#0ea5e9] hover:text-[#0ea5e9]/80 transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">Sign in to your account</h2>
              <p className="text-[#b3b3b3] text-sm mb-6">Enter your email to receive a magic link</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#b3b3b3] mb-1.5" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors text-sm"
                  />
                </div>

                {error && (
                  <div className="text-sm text-[#0ea5e9] bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 rounded-lg bg-[#0ea5e9] text-white font-semibold text-sm hover:bg-[#0ea5e9]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#b3b3b3]/50 mt-6">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  )
}
