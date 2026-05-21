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
  const isAdminLoginRoute = pathname === '/gate-islam';

  // Helper to preserve cookies on redirect
  const redirectWithCookies = (url: URL) => {
    const redirectRes = NextResponse.redirect(url);
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        redirectRes.headers.append(key, value);
      }
    });
    return redirectRes;
  };

  // 4. Routing and Guard Logic
  if (!session) {
    // --- User is NOT logged in ---
    if (isFamilyRoute && !isFamilyLoginRoute) {
      return redirectWithCookies(new URL('/family/login', req.url));
    } else if (!isFamilyRoute && !isAdminLoginRoute) {
      // Default: redirect to family portal login (admin login is only via direct URL)
      return redirectWithCookies(new URL('/family/login', req.url));
    }
  } else {
    // --- User IS logged in ---
    const userRole = session.user.user_metadata?.role;

    if (userRole === 'family') {
      // Family user trying to access non-family route (e.g. admin dashboard)
      if (!isFamilyRoute) {
        return redirectWithCookies(new URL('/family/dashboard', req.url));
      }
      // Family login page is always accessible — dashboard is reached only via direct URL
      // if (isFamilyLoginRoute) {
      //   return redirectWithCookies(new URL('/family/dashboard', req.url));
      // }
    } else {
      // Admin/Staff user trying to access family routes
      if (isFamilyRoute) {
        return redirectWithCookies(new URL('/', req.url));
      }
      if (isAdminLoginRoute) {
        return redirectWithCookies(new URL('/', req.url));
      }
      // Old /login path — redirect to family portal
      if (pathname === '/login') {
        return redirectWithCookies(new URL('/', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
