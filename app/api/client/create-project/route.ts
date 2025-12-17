import { NextRequest, NextResponse } from "next/server";
import { generateDocumentationFromGeminiAI } from "@/lib/gemini";
import {
  GeminiConfigurationError,
  GeminiValidationError,
} from "@/lib/gemini-errors";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error(
        `[API_PROJECT_DOCUMENTATION] Request body parsing failed: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request format. Expected JSON with projectName, projectOverview, and developmentAreas.",
        },
        { status: 400 }
      );
    }

    const { projectName, projectOverview, developmentAreas } = requestBody;

    // Validate required fields
    if (
      !projectName ||
      typeof projectName !== "string" ||
      projectName.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Project name is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    if (
      !projectOverview ||
      typeof projectOverview !== "string" ||
      projectOverview.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Project overview is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    if (
      !developmentAreas ||
      !Array.isArray(developmentAreas) ||
      developmentAreas.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Development areas are required and must be a non-empty array of strings.",
        },
        { status: 400 }
      );
    }

    // Validate each development area
    const hasValidAreas = developmentAreas.every(
      (area) => typeof area === "string" && area.trim().length > 0
    );

    if (!hasValidAreas) {
      return NextResponse.json(
        {
          success: false,
          message: "All development areas must be non-empty strings.",
        },
        { status: 400 }
      );
    }

    // Generate documentation
    const documentation = await generateDocumentationFromGeminiAI(
      projectName,
      projectOverview,
      developmentAreas
    );

    return NextResponse.json({
      success: true,
      documentation,
      message: "Documentation generated successfully",
    });
  } catch (error) {
    console.error(
      `[API_PROJECT_DOCUMENTATION] Documentation generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );

    // Handle specific error types
    if (error instanceof GeminiValidationError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message.replace("VALIDATION_ERROR: ", ""),
          errorType: "validation",
        },
        { status: 400 }
      );
    }

    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message.replace("CONFIG_ERROR: ", ""),
          errorType: "configuration",
        },
        { status: 503 }
      );
    }

    // Handle timeout
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Documentation generation timed out. The AI service may be experiencing high load. Please try again.",
          errorType: "timeout",
        },
        { status: 408 }
      );
    }

    // Handle formatted service errors (e.g., with ** markers)
    if (error instanceof Error && error.message.includes("**")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          errorType: "service",
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
        message: `Documentation generation failed: ${errorMessage}. If this issue persists, please contact technical support.`,
        errorType: "internal",
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
