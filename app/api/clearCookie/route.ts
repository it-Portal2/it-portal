// app/api/clearCookie/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
//  console.log("API: Clearing firebaseToken cookie server-side");
  const response = NextResponse.json({ message: "Cookie cleared" });
  response.cookies.set("firebaseToken", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    expires: new Date(0), // Immediate expiration
  });
  return response;
}