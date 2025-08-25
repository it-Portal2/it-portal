import { adminAuth } from "@/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ROLES = ["client", "admin", "developer", "subadmin"] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

export async function POST(req: NextRequest) {
  try {
    console.log("API: Setting custom claims...");
    
    const body = await req.json();
    const { uid, role } = body;
    console.log(`API: Setting custom claims for uid: ${uid}, role: ${role}`);

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Valid uid is required" }, { status: 400 });
    }

    if (!role || typeof role !== "string") {
      return NextResponse.json({ error: "Valid role is required" }, { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
      return NextResponse.json({ 
        error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}` 
      }, { status: 400 });
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { role });
    
    // DO NOT revoke refresh tokens - this was causing the logout issue
    console.log(`API: Custom claims set successfully for uid: ${uid}`);

    return NextResponse.json({ 
      message: "Custom claims set successfully",
      uid,
      role 
    }, { status: 200 });

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

    return NextResponse.json({ 
      error: "Failed to set custom claims",
      details: process.env.NODE_ENV === "development" ? error : undefined
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid parameter is required" }, { status: 400 });
    }

    const userRecord = await adminAuth.getUser(uid);
    const customClaims = userRecord.customClaims || {};

    return NextResponse.json({ 
      uid,
      claims: customClaims
    }, { status: 200 });

  } catch (error) {
    console.error("API: Error getting custom claims:", error);
    return NextResponse.json({ error: "Failed to get custom claims" }, { status: 500 });
  }
}
