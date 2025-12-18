import { NextRequest, NextResponse } from "next/server";
import { generateCareerPathRecommendations } from "@/lib/gemini";
import { updateApplicationCareerRecommendations } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import {
  GeminiConfigurationError,
  GeminiValidationError,
} from "@/lib/gemini-errors";

export const maxDuration = 30;

// Force Node.js runtime for proper fetch functionality
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request format. Expected JSON with applicationData field.",
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
        },
        { status: 400 }
      );
    }

    // Generate career recommendations using AI
    const careerRecommendations = await generateCareerPathRecommendations(
      applicationData
    );

    if (
      !Array.isArray(careerRecommendations) ||
      careerRecommendations.length === 0
    ) {
      throw new Error("No career recommendations were generated");
    }

    // Update the application in Firebase with career recommendations
    const updateResult = await updateApplicationCareerRecommendations(
      applicationData.id,
      careerRecommendations
    );

    if (updateResult.success) {
      revalidatePath("/admin/candidate-application");
      revalidatePath(`/admin/candidate-application/${applicationData.id}`);
    }

    if (!updateResult.success) {
      throw new Error(
        updateResult.error || "Failed to save career recommendations"
      );
    }

    console.info(
      `[API_CAREER_ANALYSIS] Career analysis completed successfully`,
      {
        applicationId: applicationData.id,
        candidateName: applicationData.fullName || "Unknown",
        recommendationsGenerated: careerRecommendations.length,
        recommendations: careerRecommendations,
        phase: "request_complete",
      }
    );

    return NextResponse.json({
      success: true,
      careerRecommendations,
      message: "Career recommendations generated and saved successfully",
    });
  } catch (error) {
    console.error(`[API_CAREER_ANALYSIS] Career analysis failed`, {
      errorType: error?.constructor?.name || "Unknown",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      phase: "request_failed",
    });

    // Handle specific error types
    if (error instanceof GeminiValidationError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message.replace("VALIDATION_ERROR: ", ""),
        },
        { status: 400 }
      );
    }

    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message.replace("CONFIG_ERROR: ", ""),
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
        },
        { status: 503 }
      );
    }

    // Fallback for all other errors
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      {
        success: false,
        message: `Career analysis failed: ${errorMessage}. Please try again later.`,
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
          },
        }),
      },
      { status: 500 }
    );
  }
}
