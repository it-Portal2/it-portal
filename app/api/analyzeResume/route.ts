import { NextRequest, NextResponse } from "next/server";
import { analyzeResumeWithAI, generateInterviewQuestions } from "@/lib/gemini";
import {
  GeminiConfigurationError,
  GeminiValidationError,
} from "@/lib/gemini-errors";

export const maxDuration = 60;

// CORS helper function
function addCorsHeaders(response: NextResponse, origin?: string | null) {
  // Allow all origins in production for now, restrict later if needed
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { fileData, fileName, fileType, fileSize } = requestBody;

    // Input validation
    if (!fileData) {
      const response = NextResponse.json({ 
        success: false,
        error: "No file data provided"
      }, { status: 400 });
      return addCorsHeaders(response);
    }

    if (fileType !== 'application/pdf') {
      const response = NextResponse.json({ 
        success: false,
        error: "Only PDF files are supported"
      }, { status: 400 });
      return addCorsHeaders(response);
    }

    if (fileSize > 5 * 1024 * 1024) {
      const response = NextResponse.json({ 
        success: false,
        error: "File too large (max 5MB)"
      }, { status: 400 });
      return addCorsHeaders(response);
    }

    // Step 1: Resume analysis
    const resumeAnalysis = await analyzeResumeWithAI(fileData, fileType);

    // Step 2: Question generation
    const questions = await generateInterviewQuestions(resumeAnalysis);

    const response = NextResponse.json({
      success: true,
      resumeAnalysis,
      questions,
      questionsCount: questions.length
    });

    return addCorsHeaders(response);

  } catch (error) {
    // Handle specific error types
    if (error instanceof GeminiValidationError) {
      const response = NextResponse.json({
        success: false,
        error: error.message.replace("VALIDATION_ERROR: ", "")
      }, { status: 400 });
      return addCorsHeaders(response);
    }

    if (error instanceof GeminiConfigurationError) {
      const response = NextResponse.json({
        success: false,
        error: error.message.replace("CONFIG_ERROR: ", "")
      }, { status: 503 });
      return addCorsHeaders(response);
    }

    // Fallback for all other errors
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    const response = NextResponse.json({
      success: false,
      error: `Resume analysis failed: ${errorMessage}. Please try again.`
    }, { status: 500 });

    return addCorsHeaders(response);
  }
}