import { NextRequest, NextResponse } from "next/server";
import { analyzeResumeWithAI, generateInterviewQuestions } from "@/lib/gemini";

export const maxDuration = 60;

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { fileData, fileName, fileType, fileSize } = requestBody;

    // Input validation
    if (!fileData) {
      return NextResponse.json({ 
        success: false,
        error: "No file data provided"
      }, { status: 400 });
    }

    if (fileType !== 'application/pdf') {
      return NextResponse.json({ 
        success: false,
        error: "Only PDF files are supported"
      }, { status: 400 });
    }

    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false,
        error: "File too large (max 5MB)"
      }, { status: 400 });
    }

    // Step 1: Resume analysis
    const resumeAnalysis = await analyzeResumeWithAI(fileData, fileType);

    // Step 2: Question generation
    const questions = await generateInterviewQuestions(resumeAnalysis);

    return NextResponse.json({
      success: true,
      resumeAnalysis,
      questions,
      questionsCount: questions.length
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    return NextResponse.json({
      success: false,
      error: `Resume analysis failed: ${errorMessage}. Please try again.`
    }, { status: 500 });
  }
}
