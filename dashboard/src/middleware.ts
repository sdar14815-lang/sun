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

  // 2. Skip middleware for API routes, Next.js internals, and static public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.') // e.g. .png, .jpg, .svg, .js, .css
  ) {
    return res;
  }

  // 3. Session Check
  const { data: { session } } = await supabase.auth.getSession();

  const isFamilyRoute = pathname.startsWith('/family');
  const isFamilyLoginRoute = pathname === '/family/login';
  const isAdminLoginRoute = pathname === '/login';

  // 4. Role Detection (Lightweight domain-based check with metadata fallback)
  const userEmail = session?.user?.email || '';
  const userRole = session?.user?.user_metadata?.role || (userEmail.endsWith('@family.shams.com') ? 'family' : 'admin');

  // 5. Routing and Guard Logic
  if (!session) {
    // --- User is NOT logged in ---
    if (isFamilyRoute) {
      if (!isFamilyLoginRoute) {
        return NextResponse.redirect(new URL('/family/login', req.url));
      }
    } else {
      if (!isAdminLoginRoute) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }
    return res;
  } else {
    // --- User IS logged in ---
    if (userRole === 'family') {
      // Family User trying to access Admin Portal
      if (!isFamilyRoute) {
        return NextResponse.redirect(new URL('/family/dashboard', req.url));
      }
      // Family User trying to access Family Login
      if (isFamilyLoginRoute) {
        return NextResponse.redirect(new URL('/family/dashboard', req.url));
      }
      // Redirect exact /family or /family/ to /family/dashboard
      if (pathname === '/family' || pathname === '/family/') {
        return NextResponse.redirect(new URL('/family/dashboard', req.url));
      }
    } else {
      // Admin/Staff User trying to access Family Portal
      if (isFamilyRoute) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      // Admin/Staff User trying to access Admin Login
      if (isAdminLoginRoute) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    return res;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
