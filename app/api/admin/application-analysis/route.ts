import { NextRequest, NextResponse } from "next/server";
import { analyzeCompleteApplicationOptimized } from "@/lib/gemini";
import {
  GeminiConfigurationError,
  GeminiValidationError,
} from "@/lib/gemini-errors";

// Set maximum duration to 60 seconds (Vercel Hobby plan limit)
export const maxDuration = 60;

// Request timeout with buffer for response processing
const GLOBAL_TIMEOUT = 55000; // 55 seconds, leaving 5s buffer

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let applicationDetails;
    try {
      const body = await request.json();
      applicationDetails = body.applicationDetails;
    } catch (parseError) {
      console.error(
        `[API_ANALYSIS_ROUTE] Request body parsing failed: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request format. Expected JSON with applicationDetails field.",
        },
        { status: 400 }
      );
    }

    // Validate required application details
    if (!applicationDetails) {
      return NextResponse.json(
        {
          success: false,
          message: "Application details are required for analysis",
        },
        { status: 400 }
      );
    }

    // Validate interview questions
    if (
      !applicationDetails.aiQuestions ||
      !Array.isArray(applicationDetails.aiQuestions) ||
      applicationDetails.aiQuestions.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No technical interview questions found. Please ensure the candidate has completed the interview process.",
        },
        { status: 400 }
      );
    }

    // Validate question structure
    const hasValidQuestions = applicationDetails.aiQuestions.every(
      (q: any) =>
        q &&
        typeof q === "object" &&
        q.id &&
        q.question &&
        q.answer &&
        typeof q.id === "string" &&
        typeof q.question === "string" &&
        typeof q.answer === "string" &&
        q.id.trim().length > 0 &&
        q.question.trim().length > 0 &&
        q.answer.trim().length > 0
    );

    if (!hasValidQuestions) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid question format detected. Each question must have valid id, question text, and answer content.",
        },
        { status: 400 }
      );
    }

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        console.error(
          `[API_ANALYSIS_ROUTE] Global request timeout exceeded after ${GLOBAL_TIMEOUT}ms`
        );
        reject(
          new Error(
            "REQUEST_TIMEOUT: Analysis request exceeded maximum processing time"
          )
        );
      }, GLOBAL_TIMEOUT)
    );

    // Execute analysis with timeout protection
    const analysisPromise =
      analyzeCompleteApplicationOptimized(applicationDetails);

    // Race analysis against timeout
    const analysisResult = await Promise.race([
      analysisPromise,
      timeoutPromise,
    ]);

    return NextResponse.json({
      success: true,
      aiAnalysis: analysisResult.aiAnalysis,
      overallScore: analysisResult.overallScore,
      message: "Analysis completed successfully",
    });
  } catch (error) {
    console.error(
      `[API_ANALYSIS_ROUTE] Analysis request failed: ${
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

    if (
      error instanceof Error &&
      (error.message.includes("timeout") ||
        error.message.includes("REQUEST_TIMEOUT"))
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Analysis request timed out. The AI service is experiencing high load. Please wait a moment and try again.",
          errorType: "timeout",
        },
        { status: 408 }
      );
    }

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

    if (error instanceof Error && /json|parse/i.test(error.message)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "AI response processing failed. This is usually temporary - please retry the analysis.",
          errorType: "parsing",
        },
        { status: 422 }
      );
    }

    // Fallback for unexpected errors
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during analysis";

    return NextResponse.json(
      {
        success: false,
        message: `Analysis failed: ${errorMessage}. If this issue persists, please contact technical support.`,
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
