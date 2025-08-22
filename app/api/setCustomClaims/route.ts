import { adminAuth } from "@/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

// Define allowed roles
const ALLOWED_ROLES = ["client", "admin", "developer", "subadmin"] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

export async function POST(req: NextRequest) {
  try {
    console.log("API: Setting custom claims...");
    
    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { uid, role } = body;

    // Validate required fields
    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Valid uid is required" }, { status: 400 });
    }

    if (!role || typeof role !== "string") {
      return NextResponse.json({ error: "Valid role is required" }, { status: 400 });
    }

    // Validate role is allowed
    if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
      return NextResponse.json({ 
        error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}` 
      }, { status: 400 });
    }

    console.log(`API: Setting custom claims for uid: ${uid}, role: ${role}`);

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { role });
    
    // Force token refresh for the user by revoking refresh tokens
    try {
      await adminAuth.revokeRefreshTokens(uid);
      console.log(`API: Refresh tokens revoked for uid: ${uid} to apply new claims immediately`);
    } catch (revokeError) {
      console.error("API: Error revoking refresh tokens:", revokeError);
      // Don't fail the request if token revocation fails
    }

    return NextResponse.json({ 
      message: "Custom claims set successfully",
      uid,
      role 
    }, { status: 200 });

  } catch (error) {
    console.error("API: Error setting custom claims:", error);
    
    // Handle specific Firebase Admin errors
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

// Optional: Add GET method to retrieve current claims
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
