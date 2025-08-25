// app/api/analyzeResume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { analyzeResumeWithAI, generateInterviewQuestions } from "@/lib/gemini";

export const maxDuration = 60;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://internlink.cehpoint.co.in',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
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
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    if (fileType !== 'application/pdf') {
      return NextResponse.json({
        success: false,
        error: "Only PDF files are supported"
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: "File too large (max 5MB)"
      }, { 
        status: 400,
        headers: corsHeaders
      });
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
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        
    return NextResponse.json({
      success: false,
      error: `Resume analysis failed: ${errorMessage}. Please try again.`
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}