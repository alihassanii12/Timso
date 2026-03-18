// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is logged in (accessToken cookie se)
  const accessToken = request.cookies.get('accessToken')?.value;
  const isLoggedIn = !!accessToken;
  
  console.log('=== MIDDLEWARE CHECK ===');
  console.log('Path:', pathname);
  console.log('AccessToken exists:', !!accessToken);
  console.log('Is Logged In:', isLoggedIn);
  
  // Public routes (jin par bina login ke access ho sakta hai)
  const publicRoutes = ['/login', '/register', '/','/forgot-password','/about'];
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Static files ko allow karein
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // CASE 1: USER LOGIN NAHI HAI
  if (!isLoggedIn) {
    // Agar public route nahi hai to login par bhejein
    if (!isPublicRoute) {
      console.log('❌ Not logged in, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Public route hai to allow karein
    console.log('✓ Public route allowed for non-logged-in user');
    return NextResponse.next();
  }
  
  // CASE 2: USER LOGIN HAI
  if (isLoggedIn) {
    // PUBLIC ROUTES PAR BHI CHECK - Yeh missing tha!
    // Agar public route hai (jaise /, /login, /register) to dashboard par bhejein
    if (isPublicRoute) {
      console.log('✅ Logged in user trying to access public route:', pathname);
      console.log('➡️ Redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Agar dashboard nahi hai to dashboard par bhejein
    if (pathname !== '/dashboard') {
      console.log('✅ Logged in user trying to access:', pathname);
      console.log('➡️ Redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Dashboard par hai to allow karein
    console.log('✓ Already on dashboard, allowing access');
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};