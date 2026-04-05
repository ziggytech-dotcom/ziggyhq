'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setDone(true); setLoading(false) }
  }

  const handleOAuth = async (provider: 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="font-bold text-2xl tracking-tight">
              <span style={{ color: '#ff1744' }}>Ziggy</span>
              <span style={{ color: '#0ea5e9' }}>HQ</span>
            </span>
          </Link>
          <p className="text-[#b3b3b3] text-sm mt-2">Start your 14-day free trial</p>
          <p className="text-xs text-[#b3b3b3]/60 mt-1">No credit card required</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-8">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-[#b3b3b3] text-sm">
                We sent a confirmation to <span className="text-white font-medium">{email}</span>.<br />
                Click the link to activate your account.
              </p>
            </div>
          ) : (
            <>
              {/* OAuth */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => handleOAuth('google')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#2d2d2d] bg-[#0a0a0a] text-white text-sm hover:bg-[#2d2d2d] transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button onClick={() => handleOAuth('apple')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#2d2d2d] bg-[#0a0a0a] text-white text-sm hover:bg-[#2d2d2d] transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2d2d2d]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#1a1a1a] px-2 text-[#b3b3b3]">or sign up with email</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-[#e11d48]/10 border border-[#e11d48]/20 text-[#e11d48] text-sm">{error}</div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#b3b3b3] mb-1.5">Full name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Jordan Smith" required
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-[#b3b3b3] mb-1.5">Work email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" required
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-[#b3b3b3] mb-1.5">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters" required minLength={8}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white placeholder-[#b3b3b3]/50 focus:outline-none focus:border-[#0ea5e9] text-sm" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors">
                  {loading ? 'Creating account...' : 'Start Free Trial'}
                </button>
              </form>

              <p className="text-center text-xs text-[#b3b3b3]/60 mt-4">
                By signing up you agree to our{' '}
                <Link href="/terms" className="hover:text-[#b3b3b3] underline">Terms</Link> and{' '}
                <Link href="/privacy" className="hover:text-[#b3b3b3] underline">Privacy Policy</Link>
              </p>

              <p className="text-center text-sm text-[#b3b3b3] mt-5">
                Already have an account?{' '}
                <Link href="/login" className="text-[#0ea5e9] hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
