import { adminAuth } from "@/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  const { uid, role } = await req.json();

  if (!uid || !role) {
    return NextResponse.json({ error: "uid and role are required" }, { status: 400 });
  }

  try {
    await adminAuth.setCustomUserClaims(uid, { role });
    return NextResponse.json({ message: "Custom claims set successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error setting custom claims:", error);
    return NextResponse.json({ error: "Failed to set custom claims" }, { status: 500 });
  }
}