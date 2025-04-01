import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebaseAdmin";

const roleRoutes = {
  admin: ["/admin"],
  developer: ["/developer"],
  client: ["/client"],
};

export const config = {
  matcher: ["/admin/:path*", "/developer/:path*", "/client/:path*"],
  runtime: "nodejs",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for token in cookie first, then URL
  const cookieToken = request.cookies.get("firebaseToken")?.value;
  const urlToken = request.nextUrl.searchParams.get("token");
  const token = cookieToken || urlToken;

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Verify token once
    const decodedToken = await adminAuth.verifyIdToken(token);
    const role = decodedToken.role || null;

    // Determine required role
    let requiredRole: string | null = null;
    for (const [roleKey, prefixes] of Object.entries(roleRoutes)) {
      if (prefixes.some((prefix) => pathname.startsWith(prefix))) {
        requiredRole = roleKey;
        break;
      }
    }

    // Role check
    if (requiredRole && role !== requiredRole) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Set cookie from URL token if needed
    if (urlToken && !cookieToken) {
      const response = NextResponse.next();
      response.cookies.set("firebaseToken", urlToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 86400, // 24 hours (1 day)
      });
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Auth error:", error);
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("firebaseToken");
    return response;
  }
}
