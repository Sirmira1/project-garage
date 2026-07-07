import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  let session: { user?: { id?: string | null } } | null = null;
  try {
    session = await auth();
  } catch {
    // If auth/env init fails in production, avoid a hard 500 and send users
    // to login while we keep the site reachable.
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/share/")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    // If already logged in, redirect to dashboard
    if (session?.user?.id) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect everything else - require authentication
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export const runtime = "nodejs";
