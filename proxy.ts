import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files — skip
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Token check — cookie ya header se
  const accessToken =
    request.cookies.get('accessToken')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const isLoggedIn = !!accessToken;

  // Auth routes — logged in users ko dashboard bhejo
  const authRoutes = ['/login', '/register', '/forgot-password','/verify-email','/','/about'];

  // Open routes — sab access kar sakte hain
  // const openRoutes = ['/', '/about'];

  const isAuthRoute = authRoutes.includes(pathname);
  // const isOpenRoute = openRoutes.includes(pathname);

  // // Open routes — hamesha allow
  // if (isOpenRoute) {
  //   return NextResponse.next();
  // }

  // Logged in user auth page pe — dashboard bhejo
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Logged out user protected route pe — login bhejo
  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};