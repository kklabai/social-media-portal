import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/' || path === '/api/auth/callback' || path === '/force-logout';
  const token = request.cookies.get('nandi_session_token')?.value || '';

  if (!isPublicPath && !token) {
    const loginUrl = new URL('/', request.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (path === '/' && token) {
    const dashboardUrl = new URL('/dashboard', request.nextUrl);
    return NextResponse.redirect(dashboardUrl);
  }
}

export const config = {
  matcher: [
    '/((?!api/auth/sso/callback|api/auth/callback|_next/static|_next/image|favicon.ico).*)',
  ],
};