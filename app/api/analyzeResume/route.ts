// app/api/analyzeResume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { analyzeResumeWithAI, generateInterviewQuestions } from "@/lib/gemini";

export const maxDuration = 60;

// CORS headers - allow all origins for now to test
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Allow-Credentials': 'false',
};

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  console.log('OPTIONS request received for:', request.url);
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

export async function POST(request: NextRequest) {
  console.log('POST request received for:', request.url);
  
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
    console.error('API Error:', error);
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