import { adminAuth, adminDb } from "@/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ROLES = ["client", "admin", "developer", "subadmin"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

// Extract and verify the caller's Firebase ID token from the Authorization
// header (preferred) or the firebaseToken cookie. Returns the decoded token or
// null when missing/invalid.
async function getCaller(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const token = bearer || req.cookies.get("firebaseToken")?.value || null;
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

async function isCallerAdmin(decoded: {
  uid: string;
  role?: unknown;
}): Promise<boolean> {
  // Prefer the role custom claim; fall back to Firestore for callers whose
  // token doesn't yet carry the claim.
  if (decoded.role === "admin" || decoded.role === "subadmin") return true;
  try {
    const snap = await adminDb.collection("users").doc(decoded.uid).get();
    const role = snap.data()?.role;
    return role === "admin" || role === "subadmin";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1) Authentication — the caller must present a valid Firebase ID token.
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { uid, role } = body;

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Valid uid is required" }, { status: 400 });
    }
    if (!role || typeof role !== "string") {
      return NextResponse.json({ error: "Valid role is required" }, { status: 400 });
    }
    if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
      return NextResponse.json(
        { error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // 2) Authorization — prevent privilege escalation.
    //    - Admins/subadmins may set any allowed role for any user.
    //    - Everyone else may ONLY (self-)assign the base "client" role to their
    //      own account (the signup path). They can never grant elevated roles
    //      or modify another user's claims.
    const admin = await isCallerAdmin(caller);
    if (!admin) {
      const selfClientAssignment = uid === caller.uid && role === "client";
      if (!selfClientAssignment) {
        return NextResponse.json(
          { error: "Forbidden: not allowed to set this role" },
          { status: 403 }
        );
      }
    }

    await adminAuth.setCustomUserClaims(uid, { role });
    // Note: refresh tokens are intentionally NOT revoked here.

    return NextResponse.json(
      { message: "Custom claims set successfully", uid, role },
      { status: 200 }
    );
  } catch (error) {
    console.error("API: Error setting custom claims:", error);
    if (error instanceof Error) {
      if (error.message.includes("user-not-found")) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (error.message.includes("invalid-uid")) {
        return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
      }
    }
    return NextResponse.json(
      {
        error: "Failed to set custom claims",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticated callers may read their own claims; admins may read anyone's.
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid") || caller.uid;

    if (uid !== caller.uid && !(await isCallerAdmin(caller))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userRecord = await adminAuth.getUser(uid);
    return NextResponse.json(
      { uid, claims: userRecord.customClaims || {} },
      { status: 200 }
    );
  } catch (error) {
    console.error("API: Error getting custom claims:", error);
    return NextResponse.json({ error: "Failed to get custom claims" }, { status: 500 });
  }
}
