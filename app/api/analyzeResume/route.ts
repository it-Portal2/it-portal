import { NextRequest, NextResponse } from "next/server";
import { analyzeResumeWithAI, generateInterviewQuestions } from "@/lib/gemini";
import { 
  GeminiConfigurationError, 
  GeminiValidationError 
} from "@/lib/gemini-errors";

export const maxDuration = 60;

// CORS headers helper with environment-based origins
function setCorsHeaders(response: NextResponse) {
//   const allowedOrigins = process.env.NODE_ENV === 'development' 
//     ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173']
//     : [process.env.NEXT_PUBLIC_PROD_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://your-production-domain.com'];

  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  let response: NextResponse;

  try {
    const requestBody = await request.json();
    const { fileData, fileName, fileType, fileSize } = requestBody;

    // Input validation
    if (!fileData) {
      response = NextResponse.json({ 
        success: false,
        error: "No file data provided"
      }, { status: 400 });
      return setCorsHeaders(response);
    }

    if (fileType !== 'application/pdf') {
      response = NextResponse.json({ 
        success: false,
        error: "Only PDF files are supported"
      }, { status: 400 });
      return setCorsHeaders(response);
    }

    if (fileSize > 5 * 1024 * 1024) {
      response = NextResponse.json({ 
        success: false,
        error: "File too large (max 5MB)"
      }, { status: 400 });
      return setCorsHeaders(response);
    }

    // Step 1: Resume analysis
    const resumeAnalysis = await analyzeResumeWithAI(fileData, fileType);

    // Step 2: Question generation
    const questions = await generateInterviewQuestions(resumeAnalysis);

    response = NextResponse.json({
      success: true,
      resumeAnalysis,
      questions,
      questionsCount: questions.length
    });

    return setCorsHeaders(response);

  } catch (error) {
    // Handle specific error types
    if (error instanceof GeminiValidationError) {
      response = NextResponse.json({
        success: false,
        error: error.message.replace("VALIDATION_ERROR: ", "")
      }, { status: 400 });
      return setCorsHeaders(response);
    }

    if (error instanceof GeminiConfigurationError) {
      response = NextResponse.json({
        success: false,
        error: error.message.replace("CONFIG_ERROR: ", "")
      }, { status: 503 });
      return setCorsHeaders(response);
    }

    // Handle user-friendly formatted errors
    if (error instanceof Error && error.message.includes("**")) {
      response = NextResponse.json({
        success: false,
        error: error.message
      }, { status: 503 });
      return setCorsHeaders(response);
    }

    // Fallback for all other errors
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    response = NextResponse.json({
      success: false,
      error: `Resume analysis failed: ${errorMessage}. Please try again.`,
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        }
      })
    }, { status: 500 });

    return setCorsHeaders(response);
  }
}
