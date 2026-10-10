import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'wik_session';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Always allow static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Read session from cookie
  const cookieVal = req.cookies.get(SESSION_COOKIE)?.value;
  let session: { role?: string } | null = null;

  if (cookieVal) {
    try {
      session = JSON.parse(cookieVal);
    } catch {
      try {
        session = JSON.parse(decodeURIComponent(cookieVal));
      } catch {
        session = null;
      }
    }
  }

  // 3. If accessing /login while already authenticated, redirect to appropriate page
  if (pathname === '/login') {
    if (session?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    if (session?.role === 'user') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // 4. Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!session || session.role !== 'admin') {
      return NextResponse.redirect(new URL('/login?redirect=admin', req.url));
    }
  }

  // 5. Protect user storefront & checkout
  if (pathname === '/' || pathname.startsWith('/checkout')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/checkout/:path*', '/admin/:path*', '/login'],
};
