// Create: app/api/public/analyze-resume/route.ts
// This is a completely new endpoint to avoid any middleware conflicts

import { NextRequest, NextResponse } from "next/server";
import { analyzeResumeWithAI, generateInterviewQuestions } from "@/lib/gemini";

export const runtime = 'nodejs';
export const maxDuration = 60;

// Handle ALL requests with proper CORS
async function handleCORS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Requested-With');
  headers.set('Access-Control-Max-Age', '86400');
  
  return headers;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: await handleCORS()
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = await handleCORS();
  
  try {
    console.log('Received POST request to /api/public/analyze-resume');
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { fileData, fileName, fileType, fileSize } = requestBody;
    console.log('Request data:', { fileName, fileType, fileSize, hasFileData: !!fileData });

    // Input validation
    if (!fileData) {
      return NextResponse.json(
        { success: false, error: "No file data provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (fileType !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 5MB)" },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Starting resume analysis...');
    
    // Step 1: Resume analysis
    const resumeAnalysis = await analyzeResumeWithAI(fileData, fileType);
    console.log('Resume analysis completed');

    // Step 2: Question generation
    const questions = await generateInterviewQuestions(resumeAnalysis);
    console.log('Questions generated:', questions.length);

    return NextResponse.json({
      success: true,
      resumeAnalysis,
      questions,
      questionsCount: questions.length
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('API Error in /api/public/analyze-resume:', error);
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

// Also handle GET for testing
export async function GET() {
  const corsHeaders = await handleCORS();
  
  return NextResponse.json({
    message: "Resume analysis API is working",
    endpoints: {
      POST: "/api/public/analyze-resume - Upload and analyze resume"
    }
  }, {
    status: 200,
    headers: corsHeaders
  });
}