import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest, updateSession } from "./lib/session";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register"];

// Routes that require admin access
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's an API route
  if (pathname.startsWith("/api/")) {
    // API routes handle their own auth
    return NextResponse.next();
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Get session
  const session = await getSessionFromRequest(request);

  // If not authenticated and trying to access protected route
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login/register
  if (session && (pathname === "/login" || pathname === "/register")) {
    const redirectTo = session.isAdmin ? "/admin/decks" : "/decks";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Check admin routes
  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAdminRoute && session && !session.isAdmin) {
    // Non-admin trying to access admin route
    return NextResponse.redirect(new URL("/decks", request.url));
  }

  // Try to update session (refresh if needed)
  const sessionUpdate = await updateSession(request);
  if (sessionUpdate) {
    return sessionUpdate;
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
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
