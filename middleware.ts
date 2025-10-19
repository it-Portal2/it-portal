// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "./firebaseAdmin";

const roleRoutes = {
  admin: ["/admin"],
  subadmin: ["/admin"],
  developer: ["/developer"],
  client: ["/client"],
};

export const config = {
  matcher: ["/admin/:path*", "/developer/:path*", "/client/:path*"],
  runtime: "nodejs",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // console.log(`Middleware: Processing ${pathname}`);

  const cookieToken = request.cookies.get("firebaseToken")?.value;
  const urlToken = request.nextUrl.searchParams.get("token");
  const token = cookieToken || urlToken;

  // console.log(`Middleware: Token found - Cookie: ${!!cookieToken}, URL: ${!!urlToken}`);

  if (!token) {
    console.log("Middleware: No token found, redirecting to home");
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    let role = decodedToken.role || null;
    const uid = decodedToken.uid;

    // console.log(`Middleware: User ${uid} with role: ${role} accessing ${pathname}`);

    // Determine required role for the current path
    let requiredRole: string | null = null;
    for (const [roleKey, prefixes] of Object.entries(roleRoutes)) {
      if (prefixes.some((prefix) => pathname.startsWith(prefix))) {
        requiredRole = roleKey;
        break;
      }
    }

    // console.log(`Middleware: Required role for ${pathname}: ${requiredRole}`);

    // If no role in token, check Firestore (for newly created users)
    if (!role && requiredRole) {
      // console.log("Middleware: No role in token, checking Firestore...");

      try {
        const userDoc = await adminDb.collection("users").doc(uid).get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          role = userData?.role;
          //    console.log(`Middleware: Found role in Firestore: ${role}`);
        } else {
          console.log("Middleware: User document not found in Firestore");
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch (firestoreError) {
        console.error("Middleware: Firestore error:", firestoreError);

        // For client routes, allow access even if Firestore fails (graceful fallback)
        if (requiredRole === "client") {
          //    console.log("Middleware: Firestore error but allowing client access");
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Check role permissions
    if (!role) {
      //  console.log("Middleware: No role found anywhere, redirecting to home");
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (requiredRole === "admin" && role !== "admin" && role !== "subadmin") {
      //    console.log(`Middleware: Role ${role} not authorized for admin area`);
      return NextResponse.redirect(new URL("/", request.url));
    } else if (
      requiredRole &&
      requiredRole !== "admin" &&
      role !== requiredRole
    ) {
      //  console.log(`Middleware: Role ${role} not authorized for ${requiredRole} area`);
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Handle URL token by setting it as cookie
    if (urlToken && !cookieToken) {
      //   console.log("Middleware: Setting token from URL to cookie");
      const response = NextResponse.next();
      response.cookies.set("firebaseToken", urlToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
      return response;
    }

    //  console.log(`Middleware: Access granted for ${uid} with role ${role} to ${pathname}`);
    return NextResponse.next();
  } catch (error: any) {
    console.error("Middleware: Auth error:", error);

    if (error.code === "auth/id-token-expired") {
      //    console.log("Middleware: Token expired, redirecting to home");
    } else if (error.code === "auth/argument-error") {
      //      console.log("Middleware: Invalid token format, redirecting to home");
    } else {
      //      console.log("Middleware: Token verification failed, redirecting to home");
    }

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("firebaseToken");
    return response;
  }
}
