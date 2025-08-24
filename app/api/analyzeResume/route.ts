import { NextRequest, NextResponse } from "next/server";
import { analyzeResumeWithAI, generateInterviewQuestions } from "@/lib/gemini";
import {
  GeminiConfigurationError,
  GeminiValidationError,
} from "@/lib/gemini-errors";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { fileData, fileName, fileType, fileSize } = requestBody;

    // Input validation
    if (!fileData) {
      return NextResponse.json(
        {
          success: false,
          error: "No file data provided",
        },
        { status: 400 }
      );
    }

    if (fileType !== "application/pdf") {
      return NextResponse.json(
        {
          success: false,
          error: "Only PDF files are supported",
        },
        { status: 400 }
      );
    }

    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "File too large (max 5MB)",
        },
        { status: 400 }
      );
    }

    // Step 1: Resume analysis
    const resumeAnalysis = await analyzeResumeWithAI(fileData, fileType);

    // Step 2: Question generation
    const questions = await generateInterviewQuestions(resumeAnalysis);

    const response = NextResponse.json({
      success: true,
      resumeAnalysis,
      questions,
      questionsCount: questions.length,
    });

    // Add CORS headers for production
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  } catch (error) {
    // Handle specific error types
    if (error instanceof GeminiValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message.replace("VALIDATION_ERROR: ", ""),
        },
        { status: 400 }
      );
    }

    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message.replace("CONFIG_ERROR: ", ""),
        },
        { status: 503 }
      );
    }

    // Handle user-friendly formatted errors
    if (error instanceof Error && error.message.includes("**")) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
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
        error: `Resume analysis failed: ${errorMessage}. Please try again.`,
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
// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
