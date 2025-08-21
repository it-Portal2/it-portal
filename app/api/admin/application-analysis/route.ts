import { NextResponse } from "next/server";
import { analyzeOriginality, analyzeCorrectness, analyzeHolistic } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { applicationDetails, analysisType, originalityResults, correctnessResults } = await request.json();

    if (!applicationDetails || !analysisType) {
      return NextResponse.json(
        { success: false, message: "Application details and analysis type are required" },
        { status: 400 }
      );
    }

    switch (analysisType) {
      case "originality":
        const originalityResult = await analyzeOriginality(applicationDetails);
        return NextResponse.json({
          success: true,
          originalityScores: originalityResult.originalityScores
        });

      case "correctness":
        const correctnessResult = await analyzeCorrectness(applicationDetails);
        return NextResponse.json({
          success: true,
          correctnessScores: correctnessResult.correctnessScores
        });

      case "holistic":
        if (!originalityResults || !correctnessResults) {
          return NextResponse.json(
            { success: false, message: "Previous analysis results required for holistic assessment" },
            { status: 400 }
          );
        }
        
        const holisticResult = await analyzeHolistic(
          applicationDetails,
          originalityResults,
          correctnessResults
        );
        return NextResponse.json({
          success: true,
          overallVerdict: holisticResult.overallVerdict,
          aiRecommendation: holisticResult.aiRecommendation,
          overallScore: holisticResult.overallScore
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid analysis type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Analysis failed"
      },
      { status: 500 }
    );
  }
}
