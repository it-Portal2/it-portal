import { adminAuth } from "@/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

/**
 * Sets the `firebaseToken` auth cookie **server-side as httpOnly**, so the
 * session token is never readable by client JavaScript (closes the XSS
 * token-theft hole). The caller passes a Firebase ID token via the
 * Authorization header; we verify it before storing it as the cookie.
 *
 * The middleware reads this cookie server-side, so httpOnly does not affect
 * route protection. Token refresh is driven by the client `onIdTokenChanged`
 * listener, which re-calls this route with the refreshed token.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    // Only store a cookie for a valid, verifiable token.
    try {
      await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("firebaseToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch (error) {
    console.error("API: Error setting auth cookie:", error);
    return NextResponse.json(
      { error: "Failed to set auth cookie" },
      { status: 500 }
    );
  }
}
