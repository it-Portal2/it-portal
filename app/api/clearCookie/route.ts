import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("API: Clearing firebaseToken cookie server-side");
    
    const response = NextResponse.json({ 
      message: "Cookie cleared successfully",
      timestamp: new Date().toISOString()
    });

    // Clear the firebaseToken cookie with proper settings
    response.cookies.set("firebaseToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only secure in production
      sameSite: "strict",
      path: "/",
      expires: new Date(0), // Immediate expiration
      maxAge: 0, // Also set maxAge to 0 for better compatibility
    });

    // Also clear any other auth-related cookies if they exist
    response.cookies.set("auth-storage", "", {
      httpOnly: false, // This cookie might be accessible to client-side
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", 
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });

    console.log("Cookie clearing completed successfully");
    return response;

  } catch (error) {
    console.error("Error clearing cookies:", error);
    return NextResponse.json({ 
      error: "Failed to clear cookies",
      message: "Server-side cookie clearing failed"
    }, { status: 500 });
  }
}

