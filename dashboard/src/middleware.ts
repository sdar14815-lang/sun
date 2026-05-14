import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const pathname = req.nextUrl.pathname;

  // Security Headers
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com; connect-src 'self' https://*.supabase.co;"
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isFamilyRoute = pathname.startsWith('/family');
  const isFamilyLoginRoute = pathname === '/family/login';

  // Allow public assets and API
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    return res;
  }

  // Redirect old admin login to dashboard root (since login is no longer needed)
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Protect Family Routes
  if (isFamilyRoute) {
    if (!session) {
      if (!isFamilyLoginRoute) {
        return NextResponse.redirect(new URL('/family/login', req.url));
      }
      return res; // Allow accessing family login page
    }

    // Session exists for family route
    if (isFamilyLoginRoute) {
      return NextResponse.redirect(new URL('/family/dashboard', req.url));
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // If profile fetch failed or missing, let the page itself handle the redirect
    // (the family pages already check auth themselves)
    if (profileError || !profile) {
      return res;
    }

    // Only block if we positively know the role is NOT family
    if (profile.role !== 'family') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return res;
  }

  // Dashboard routes - No login required
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
