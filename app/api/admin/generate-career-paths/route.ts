import { NextRequest, NextResponse } from "next/server";
import { generateCareerPathRecommendations } from "@/lib/gemini";
import { updateApplicationCareerRecommendations } from "@/lib/firebase/admin";
import { 
  GeminiConfigurationError, 
  GeminiValidationError 
} from "@/lib/gemini-errors";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `career_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.info(`[API_CAREER_ANALYSIS] Incoming career analysis request`, {
      requestId,
      timestamp: new Date().toISOString(),
      phase: 'request_start'
    });

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid request format. Expected JSON with applicationData field.",
          requestId
        },
        { status: 400 }
      );
    }

    const { applicationData } = requestBody;

    // Validate application data
    if (!applicationData || !applicationData.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Valid application data with ID is required.",
          requestId
        },
        { status: 400 }
      );
    }

    // Validate that application is eligible for career analysis
    if (!applicationData.aiAnalysis || applicationData.aiAnalysis.overallVerdict !== "Highly Recommended") {
      return NextResponse.json(
        { 
          success: false, 
          message: "Career analysis is only available for highly recommended candidates.",
          requestId
        },
        { status: 400 }
      );
    }

    console.info(`[API_CAREER_ANALYSIS] Starting career path generation`, {
      requestId,
      applicationId: applicationData.id,
      candidateName: applicationData.fullName || 'Unknown',
      phase: 'generation_start'
    });

    // Generate career recommendations using AI
    const careerRecommendations = await generateCareerPathRecommendations(applicationData);
    
    if (!Array.isArray(careerRecommendations) || careerRecommendations.length === 0) {
      throw new Error("No career recommendations were generated");
    }

    // Update the application in Firebase with career recommendations
    const updateResult = await updateApplicationCareerRecommendations(
      applicationData.id,
      careerRecommendations
    );

    if (!updateResult.success) {
      throw new Error(updateResult.error || "Failed to save career recommendations");
    }

    const processingTime = Date.now() - startTime;

    console.info(`[API_CAREER_ANALYSIS] Career analysis completed successfully`, {
      requestId,
      applicationId: applicationData.id,
      candidateName: applicationData.fullName || 'Unknown',
      processingTimeMs: processingTime,
      recommendationsGenerated: careerRecommendations.length,
      recommendations: careerRecommendations,
      phase: 'request_complete'
    });

    return NextResponse.json({ 
      success: true, 
      careerRecommendations,
      processingTime,
      message: "Career recommendations generated and saved successfully",
      requestId
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error(`[API_CAREER_ANALYSIS] Career analysis failed`, {
      requestId,
      processingTimeMs: processingTime,
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      phase: 'request_failed'
    });

    // Handle specific error types
    if (error instanceof GeminiValidationError) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message.replace("VALIDATION_ERROR: ", ""),
          requestId
        },
        { status: 400 }
      );
    }

    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message.replace("CONFIG_ERROR: ", ""),
          requestId
        },
        { status: 503 }
      );
    }

    // Handle user-friendly formatted errors
    if (error instanceof Error && error.message.includes("**")) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message,
          requestId
        },
        { status: 503 }
      );
    }

    // Fallback for all other errors
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    return NextResponse.json(
      { 
        success: false, 
        message: `Career analysis failed: ${errorMessage}. Please try again later.`,
        requestId,
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          }
        })
      },
      { status: 500 }
    );
  }
}
