import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = ['/dashboard', '/rooms', '/room', '/nodes', '/dm', '/oracle', '/settings', '/purge', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route));

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth pages with active session
  // EXCEPT for password update page (used in reset flow)
  if (req.nextUrl.pathname.startsWith('/auth') && session && req.nextUrl.pathname !== '/auth/update-password') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rooms/:path*',
    '/room/:path*',
    '/nodes/:path*',
    '/dm/:path*',
    '/oracle/:path*',
    '/settings/:path*',
    '/purge/:path*',
    '/auth/:path*',
  ],
};
