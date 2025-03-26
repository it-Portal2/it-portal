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
  const cookieToken = request.cookies.get("firebaseToken")?.value;
  const urlToken = request.nextUrl.searchParams.get("token");
  const token = cookieToken || urlToken;

  // console.log("Middleware triggered for path:", pathname);
  // console.log("Token from cookies:", cookieToken);
  // console.log("Token from URL:", urlToken);
  // console.log("Using token:", token);

  if (!token) {
    //  console.log("No token found, redirecting to /");
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("firebaseToken"); // Ensure cookie is deleted
    return response;
  }

  try {
    //   console.log("Verifying token:", token);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const role = decodedToken.role || "client";
    //  console.log("Token verified, role:", role);

    let requiredRole: string | null = null;
    for (const [roleKey, prefixes] of Object.entries(roleRoutes)) {
      if (prefixes.some((prefix) => pathname.startsWith(prefix))) {
        requiredRole = roleKey;
        break;
      }
    }

    //console.log("Required role for path:", requiredRole);

    if (requiredRole && role !== requiredRole) {
      //  console.log(`Role mismatch: ${role} != ${requiredRole}, redirecting to /`);
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("firebaseToken");
      return response;
    }

    if (urlToken && !cookieToken) {
      //   console.log("Setting firebaseToken cookie server-side:", urlToken);
      const response = NextResponse.next();
      response.cookies.set("firebaseToken", urlToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 3600,
      });
      return response;
    }

    // console.log("Role matches, proceeding with request");
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware auth error:", error);
    console.log("Token verification failed, redirecting to /");
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("firebaseToken");
    return response;
  }
}
