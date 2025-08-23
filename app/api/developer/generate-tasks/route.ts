import { NextRequest, NextResponse } from "next/server";
import { generateTasksFromDeveloperDocumentationFromGeminiAI } from "@/lib/gemini";
import { 
  GeminiConfigurationError, 
  GeminiValidationError 
} from "@/lib/gemini-errors";

export const maxDuration = 30; // Set to 30 seconds for task generation

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `task_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.info(`[API_TASK_GENERATION] Incoming task generation request`, {
      requestId,
      timestamp: new Date().toISOString(),
      phase: 'request_start'
    });

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error(`[API_TASK_GENERATION] Request body parsing failed`, {
        requestId,
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        phase: 'request_parsing_error'
      });
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid request format. Expected JSON with textContent field.",
          requestId
        },
        { status: 400 }
      );
    }

    const { textContent } = requestBody;

    // Validate required fields
    if (!textContent || typeof textContent !== 'string' || textContent.trim().length === 0) {
      console.warn(`[API_TASK_GENERATION] Invalid or missing text content`, {
        requestId,
        hasTextContent: !!textContent,
        textContentType: typeof textContent,
        phase: 'validation_error'
      });
      return NextResponse.json(
        { 
          success: false, 
          message: "Text content is required and must be a non-empty string containing the documentation to analyze.",
          requestId
        },
        { status: 400 }
      );
    }

    if (textContent.length < 50) {
      console.warn(`[API_TASK_GENERATION] Text content too short for meaningful task generation`, {
        requestId,
        textLength: textContent.length,
        phase: 'validation_error'
      });
      return NextResponse.json(
        { 
          success: false, 
          message: "Text content must be at least 50 characters long to generate meaningful tasks.",
          requestId
        },
        { status: 400 }
      );
    }

    console.info(`[API_TASK_GENERATION] Request validation completed successfully`, {
      requestId,
      textContentLength: textContent.length,
      phase: 'validation_complete'
    });

    // Generate tasks
    const tasks = await generateTasksFromDeveloperDocumentationFromGeminiAI(textContent);
    
    const processingTime = Date.now() - startTime;

    console.info(`[API_TASK_GENERATION] Task generation completed successfully`, {
      requestId,
      tasksGenerated: tasks.length,
      processingTimeMs: processingTime,
      phase: 'request_complete'
    });

    return NextResponse.json({ 
      success: true, 
      tasks,
      tasksCount: tasks.length,
      processingTime,
      message: "Tasks generated successfully",
      requestId
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error(`[API_TASK_GENERATION] Task generation failed`, {
      requestId,
      processingTimeMs: processingTime,
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      phase: 'request_failed'
    });

    // Handle specific error types
    if (error instanceof GeminiValidationError) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message.replace("VALIDATION_ERROR: ", ""),
          processingTime,
          requestId,
          errorType: 'validation'
        },
        { status: 400 }
      );
    }

    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message.replace("CONFIG_ERROR: ", ""),
          processingTime,
          requestId,
          errorType: 'configuration'
        },
        { status: 503 }
      );
    }

    // Handle user-friendly formatted errors
    if (error instanceof Error && error.message.includes("**")) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message,
          processingTime,
          requestId,
          errorType: 'service'
        },
        { status: 503 }
      );
    }

    // Fallback for all other errors
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    return NextResponse.json(
      { 
        success: false, 
        message: `Task generation failed: ${errorMessage}. Please ensure your documentation content is well-formatted and try again.`,
        processingTime,
        requestId,
        errorType: 'internal',
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          }
        })
      },
      { status: 500 }
    );
  }
}
