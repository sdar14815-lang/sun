import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const pathname = req.nextUrl.pathname;

  // 1. Security Headers
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // 2. Session Check
  const { data: { session } } = await supabase.auth.getSession();

  const isFamilyRoute = pathname.startsWith('/family');
  const isFamilyLoginRoute = pathname === '/family/login';
  const isAdminLoginRoute = pathname === '/login';
  
  // Public assets and API
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico' || pathname.startsWith('/auth')) {
    return res;
  }

  // --- Logic for Family Portal ---
  if (isFamilyRoute) {
    if (!session) {
      if (!isFamilyLoginRoute) return NextResponse.redirect(new URL('/family/login', req.url));
      return res;
    }
    if (isFamilyLoginRoute) return NextResponse.redirect(new URL('/family/dashboard', req.url));

    // Role check for family portal (optional but recommended)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile && profile.role !== 'family') {
        // If an admin tries to enter family portal, it's okay, but usually we redirect to dashboard
        return res; 
    }
    return res;
  }

  // --- Logic for Admin Dashboard ---
  if (!session) {
    // If not logged in and not on login page, redirect to login
    if (!isAdminLoginRoute) {
      return NextResponse.redirect(new URL('/family/login', req.url));
    }
    return res;
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (isAdminLoginRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Role check: Only admin/staff can access dashboard
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  
  if (profile && profile.role === 'family') {
    // Family members should not see the admin dashboard
    return NextResponse.redirect(new URL('/family/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
