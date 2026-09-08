import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { extractQorToken, verifyQorToken, isAdminRole } from '@/lib/auth/require-qor-user'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('qor_token');
  
  // Redirect /portal to /dashboard (legacy route support)
  if (pathname === '/portal' || pathname.startsWith('/portal/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Admin route protection: the token must validate against qor-auth and the
  // account must hold the admin/god role. Mere presence of a cookie is not enough.
  if (pathname.startsWith('/admin')) {
    const bearer = extractQorToken(request);
    if (!bearer) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const identity = await verifyQorToken(bearer);
    if (!identity || !isAdminRole(identity.role)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Redirect authenticated users away from login/register to dashboard
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Allow unauthenticated users to access login/register (AuthGate handles display)
  // Don't redirect them - just let the page load
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login', '/register']
}
