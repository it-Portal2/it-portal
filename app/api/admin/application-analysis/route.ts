// app/api/admin/application-analysis/route.ts
import { NextResponse } from "next/server";
import { analyzeCompleteApplicationOptimized } from "@/lib/gemini"; // Adjust path as needed

export const maxDuration = 30; // Set to 30 seconds

export async function POST(request: Request) {
  try {
    const { applicationDetails } = await request.json();
    
    if (!applicationDetails) {
      return NextResponse.json(
        { success: false, message: "Application details are required" },
        { status: 400 }
      );
    }

    const analysisResult = await analyzeCompleteApplicationOptimized(
      applicationDetails
    );

    return NextResponse.json({ 
      success: true, 
      aiAnalysis: analysisResult.aiAnalysis,
      overallScore: analysisResult.overallScore 
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to analyze application" 
      },
      { status: 500 }
    );
  }
}