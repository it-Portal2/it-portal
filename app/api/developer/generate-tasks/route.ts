import { NextRequest, NextResponse } from "next/server";
import { generateTasksFromDeveloperDocumentationFromGeminiAI } from "@/lib/gemini";
import { 
  GeminiConfigurationError, 
  GeminiValidationError 
} from "@/lib/gemini-errors";

export const maxDuration = 60; 

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestBody = await request.json().catch(() => null);

    if (!requestBody || typeof requestBody !== "object") {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid request format. Expected JSON with a textContent field." 
        },
        { status: 400 }
      );
    }

    const { textContent } = requestBody;

    // Validate text content
    if (!textContent || typeof textContent !== "string" || textContent.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Text content is required and must be a non-empty string containing the documentation to analyze." 
        },
        { status: 400 }
      );
    }


    // Generate tasks
    const tasks = await generateTasksFromDeveloperDocumentationFromGeminiAI(textContent);

    return NextResponse.json({ 
      success: true, 
      tasks,
      tasksCount: tasks.length,
      message: "Tasks generated successfully"
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

    // Handle specific Gemini errors
    if (error instanceof GeminiValidationError) {
      return NextResponse.json(
        { success: false, message: error.message.replace("VALIDATION_ERROR: ", ""), errorType: "validation" },
        { status: 400 }
      );
    }

    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json(
        { success: false, message: error.message.replace("CONFIG_ERROR: ", ""), errorType: "configuration" },
        { status: 503 }
      );
    }

    // Handle general fallback
    return NextResponse.json(
      { 
        success: false, 
        message: `Task generation failed: ${errorMessage}. Please ensure your documentation content is well-formatted and try again.`,
        errorType: "internal",
        ...(process.env.NODE_ENV === "development" && {
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
