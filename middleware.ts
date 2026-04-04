import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes -- no auth needed
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/_next', '/api/auth', '/favicon.ico']
  const isPublic = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublic) return NextResponse.next()
  
  // Check for auth session cookie
  const session = request.cookies.get('supabase-auth-token') || 
                  request.cookies.get('sb-tabrmsrxtqnuwivgwggb-auth-token')
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

