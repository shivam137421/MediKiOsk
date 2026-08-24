import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Patient, Doctor, and Admin portal routes
  const isPatientRoute = pathname.startsWith('/patient');
  const isDoctorRoute = pathname.startsWith('/doctor');
  const isAdminRoute = pathname.startsWith('/admin');

  if (isPatientRoute || isDoctorRoute || isAdminRoute) {
    const roleCookie = request.cookies.get('medikiosk_role')?.value;

    // 1. Unauthenticated -> Redirect to Login
    if (!roleCookie) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Strict Role Verification
    if (isPatientRoute && roleCookie !== 'patient') {
      const redirectUrl = new URL(roleCookie === 'doctor' ? '/doctor' : '/admin', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (isDoctorRoute && roleCookie !== 'doctor') {
      const redirectUrl = new URL(roleCookie === 'patient' ? '/patient' : '/admin', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (isAdminRoute && roleCookie !== 'admin') {
      const redirectUrl = new URL(roleCookie === 'doctor' ? '/doctor' : '/patient', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/patient/:path*',
    '/doctor/:path*',
    '/admin/:path*',
  ],
};
