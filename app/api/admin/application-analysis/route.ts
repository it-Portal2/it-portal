// app/api/admin/application-analysis/route.ts
import { NextResponse } from "next/server";
import { analyzeCompleteApplicationOptimized } from "@/lib/gemini";

// Set maximum duration to 60 seconds (Vercel free tier limit)
export const maxDuration = 60;

// Add timeout handler for the entire request
const GLOBAL_TIMEOUT = 55000; // 55 seconds to leave more buffer for response processing

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const { applicationDetails } = await request.json();
    
    if (!applicationDetails) {
      return NextResponse.json(
        { success: false, message: "Application details are required" },
        { status: 400 }
      );
    }

    // Validate required fields for analysis
    if (!applicationDetails.aiQuestions || applicationDetails.aiQuestions.length === 0) {
      return NextResponse.json(
        { success: false, message: "No technical interview questions found for analysis" },
        { status: 400 }
      );
    }

    // Additional validation for question structure
    const hasValidQuestions = applicationDetails.aiQuestions.every((q: any) => 
      q.id && q.question && q.answer && 
      typeof q.id === 'string' && 
      typeof q.question === 'string' && 
      typeof q.answer === 'string'
    );

    if (!hasValidQuestions) {
      return NextResponse.json(
        { success: false, message: "Invalid question format. Each question must have id, question, and answer fields." },
        { status: 400 }
      );
    }

    // console.log(`🚀 Starting AI analysis for candidate: ${applicationDetails.fullName || 'Unknown'}`);
    // console.log(`📊 Analyzing ${applicationDetails.aiQuestions.length} Q&A pairs`);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Global request timeout exceeded")), GLOBAL_TIMEOUT)
    );

    // Execute the optimized analysis with timeout
    const analysisPromise = analyzeCompleteApplicationOptimized(applicationDetails);
    
    // Race between analysis and timeout
    const analysisResult = await Promise.race([analysisPromise, timeoutPromise]);
    
    const processingTime = Date.now() - startTime;
    // console.log(`✅ Analysis completed successfully in ${processingTime}ms`);

    return NextResponse.json({ 
      success: true, 
      aiAnalysis: analysisResult.aiAnalysis,
      overallScore: analysisResult.overallScore,
      processingTime: processingTime,
      message: "Analysis completed successfully"
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(` Error in API route after ${processingTime}ms:`, error);
    
    // Enhanced error response based on error type
    let errorMessage = "Failed to analyze application";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("timeout") || error.message.includes("timed out")) {
        errorMessage = "Analysis timed out. The request took too long to process. Please try again.";
        statusCode = 408; // Request Timeout
      } else if (error.message.includes("API key") || error.message.includes("failed")) {
        errorMessage = "AI service temporarily unavailable. Please try again in a few moments.";
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes("JSON") || error.message.includes("parse")) {
        errorMessage = "AI response processing failed. Please retry the analysis.";
        statusCode = 422; // Unprocessable Entity
      } else if (error.message.includes("required") || error.message.includes("Invalid")) {
        errorMessage = error.message;
        statusCode = 400; // Bad Request
      } else if (error.message.includes("No Google API keys")) {
        errorMessage = "AI analysis service is not configured. Please contact support.";
        statusCode = 503;
      } else {
        errorMessage = `Analysis error: ${error.message}`;
        statusCode = 500;
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        processingTime: processingTime,
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : "Unknown error") : undefined
      },
      { status: statusCode }
    );
  }
}
