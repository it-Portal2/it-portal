import { NextRequest, NextResponse } from "next/server";
import { analyzeResumeWithAI, generateInterviewQuestions } from "@/lib/gemini";

export const maxDuration = 60;

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const requestBody = await request.json();
    const { fileData, fileName, fileType, fileSize } = requestBody;

    // Input validation
    if (!fileData) {
      return new NextResponse(JSON.stringify({ 
        success: false,
        error: "No file data provided"
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    if (fileType !== 'application/pdf') {
      return new NextResponse(JSON.stringify({ 
        success: false,
        error: "Only PDF files are supported"
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    if (fileSize > 5 * 1024 * 1024) {
      return new NextResponse(JSON.stringify({ 
        success: false,
        error: "File too large (max 5MB)"
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    // Step 1: Resume analysis
    const resumeAnalysis = await analyzeResumeWithAI(fileData, fileType);

    // Step 2: Question generation
    const questions = await generateInterviewQuestions(resumeAnalysis);

    return new NextResponse(JSON.stringify({
      success: true,
      resumeAnalysis,
      questions,
      questionsCount: questions.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    return new NextResponse(JSON.stringify({
      success: false,
      error: `Resume analysis failed: ${errorMessage}. Please try again.`
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }
}
