import { NextResponse } from 'next/server';
import { normalizeRole, getDefaultDashboard, canAccessRoute } from './utils/constants';

export async function proxy(req) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Static/public routes — pass through immediately
  const publicRoutes = ['/login', '/'];
  if (publicRoutes.includes(pathname)) return res;

  // Check session cookie
  const sessionCookie = req.cookies.get('hrms_session');
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie.value));
    if (!session?.access_token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const rawRole = session.user?.role || 'employee';
    const role = normalizeRole(rawRole);

    // Check if this role can access the requested path
    if (!canAccessRoute(role, pathname)) {
      // Redirect to their correct dashboard instead of a blank error page
      const dashboard = getDefaultDashboard(role);
      return NextResponse.redirect(new URL(dashboard, req.url));
    }

    return res;
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.well-known|api|login).*)',
  ],
};
