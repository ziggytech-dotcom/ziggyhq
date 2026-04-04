import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Inline verify -- no external deps, Web Crypto API (Node 18+ / Edge)
async function verifySSOToken(token: string): Promise<{ access_token: string; refresh_token: string }> {
  const secret = process.env.ZTV_SSO_SECRET
  if (!secret) throw new Error('ZTV_SSO_SECRET not configured')
  const dot = token.lastIndexOf('.')
  if (dot < 1) throw new Error('malformed token')
  const data = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
  )
  const sigBytes = Uint8Array.from(
    atob(sig.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0),
  )
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data))
  if (!valid) throw new Error('invalid signature')
  const payload = JSON.parse(atob(data.replace(/-/g, '+').replace(/_/g, '/')))
  if (payload.exp < Date.now()) throw new Error('expired')
  return payload
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const loginUrl = new URL('/login', request.url)

  if (!token) return NextResponse.redirect(loginUrl)

  try {
    const { access_token, refresh_token } = await verifySSOToken(token)
    const supabase = await createClient()
    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) throw error
    return NextResponse.redirect(new URL('/app/dashboard', request.url))
  } catch {
    return NextResponse.redirect(loginUrl)
  }
}
