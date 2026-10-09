import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Fast, optimistic route guard. It only checks that a session cookie exists
 * (no database or network call), so every navigation stays quick.
 *
 * It is NOT the security boundary. Layouts, pages and server actions must
 * still call requireUser() / requireRole() from lib/session.ts, which
 * validate the session for real.
 */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/up', // health check (Kamal, uptime monitoring)
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(`${p}/`)),
  );

  // Note: sending signed-in users away from / and /login happens in those
  // pages (after a real session check), not here. A stale cookie would
  // otherwise cause a redirect loop between /login and /dashboard.
  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except auth API, Next internals and static files.
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest\\.(?:json|webmanifest)|sw\\.js|workbox-.*|offline\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
