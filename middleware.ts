import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebaseAdmin";

const roleRoutes = {
  admin: ["/admin"],
  subadmin: ["/admin"], // Allow subadmin to access admin panel
  developer: ["/developer"],
  client: ["/client"],
};

export const config = {
  matcher: ["/admin/:path*", "/developer/:path*", "/client/:path*"],
  runtime: "nodejs",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

//  console.log(`Middleware: Processing request for ${pathname}`);

  // Check for token in cookie first, then URL
  const cookieToken = request.cookies.get("firebaseToken")?.value;
  const urlToken = request.nextUrl.searchParams.get("token");
  const token = cookieToken || urlToken;

  // If no token, redirect to login
  if (!token) {
//    console.log("Middleware: No token found, redirecting to login");
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Verify token once
    const decodedToken = await adminAuth.verifyIdToken(token);
    const role = decodedToken.role || null;

    //console.log(`Middleware: User role from token: ${role}`);

    // Determine required role
    let requiredRole: string | null = null;
    for (const [roleKey, prefixes] of Object.entries(roleRoutes)) {
      if (prefixes.some((prefix) => pathname.startsWith(prefix))) {
        requiredRole = roleKey;
        break;
      }
    }

  //  console.log(`Middleware: Required role for ${pathname}: ${requiredRole}`);

    // Role check - Allow both admin and subadmin to access admin panel
    if (requiredRole === "admin" && role !== "admin" && role !== "subadmin") {
  //    console.log(`Middleware: Access denied. User role ${role} cannot access admin panel`);
      return NextResponse.redirect(new URL("/", request.url));
    } else if (requiredRole && requiredRole !== "admin" && role !== requiredRole) {
//      console.log(`Middleware: Access denied. User role ${role} does not match required role ${requiredRole}`);
      return NextResponse.redirect(new URL("/", request.url));
    }

  //  console.log(`Middleware: Access granted for role ${role} to ${pathname}`);

    // Set cookie from URL token if needed with longer expiry
    if (urlToken && !cookieToken) {
      const response = NextResponse.next();
      response.cookies.set("firebaseToken", urlToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    //  console.log("Middleware: Set cookie from URL token");
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
