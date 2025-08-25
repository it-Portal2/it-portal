// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebaseAdmin";

const roleRoutes = {
  admin: ["/admin"],
  subadmin: ["/admin"], 
  developer: ["/developer"],
  client: ["/client"],
};

export const config = {
  matcher: [
    // Only match protected routes, completely exclude API routes
    "/admin/:path*", 
    "/developer/:path*", 
    "/client/:path*"
  ],
  runtime: "nodejs",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Double check - absolutely skip any API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Your existing auth logic (no changes needed)
  const cookieToken = request.cookies.get("firebaseToken")?.value;
  const urlToken = request.nextUrl.searchParams.get("token");
  const token = cookieToken || urlToken;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const role = decodedToken.role || null;

    let requiredRole: string | null = null;
    for (const [roleKey, prefixes] of Object.entries(roleRoutes)) {
      if (prefixes.some((prefix) => pathname.startsWith(prefix))) {
        requiredRole = roleKey;
        break;
      }
    }

    if (requiredRole === "admin" && role !== "admin" && role !== "subadmin") {
      return NextResponse.redirect(new URL("/", request.url));
    } else if (requiredRole && requiredRole !== "admin" && role !== requiredRole) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (urlToken && !cookieToken) {
      const response = NextResponse.next();
      response.cookies.set("firebaseToken", urlToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware: Auth error:", error);
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("firebaseToken");
    return response;
  }
}