"use server";

import { extractTextFromPdf } from "@/lib/langchain";
import { generateImprovedDocumentationFromGeminiAI, generateTasksFromDeveloperDocumentationFromGeminiAI } from "@/lib/gemini";
import { ClientTask } from "@/lib/types";

interface DocumentationResult {
  success: boolean;
  message: string;
  data: {
    improvedDocumentation?: any;
  } | null;
}
interface TasksResult {
  success: boolean;
  message: string;
  data: {
    aiGeneratedTasks?: any;
  } | null;
}
/**
 * Sanitizes text to only include alphabetic characters
 * @param text - The text to sanitize
 * @returns Sanitized text with only alphabetic characters
 */
function sanitizeText(text: string): string {
  return text.replace(/[^a-zA-Z\s]/g, "").trim();
}

/**
 * Main function to generate developer documentation from a PDF file
 * @param uploadResponse - The upload response containing file information
 * @returns Result of the documentation generation process
 */
export async function generateDeveloperDocumentationFromPdf(
  uploadResponse: string
): Promise<DocumentationResult> {
  // Input validation
  if (!uploadResponse) {
    return {
      success: false,
      message: "Missing file URL in upload response",
      data: null,
    };
  }

  try {
    // Step 1: Extract text from PDF
    const extractedText = await extractTextFromPdf(uploadResponse);

    // Step 2: Process the extracted text - convert to array, sanitize, and filter
    const processedTextLines = extractedText
      .split("\n")
      .map((line) => sanitizeText(line))
      .filter((line) => line.length > 0); // Remove empty lines

    if (processedTextLines.length === 0) {
      return {
        success: false,
        message: "No valid text content found in the PDF",
        data: null,
      };
    }

    // Step 3: Convert array to a single paragraph string
    const extractedTextParagraph = processedTextLines.join(" ");

    // Step 4: Generate improved documentation using the paragraph text
    const improvedDocumentation =
      await generateImprovedDocumentationFromGeminiAI(extractedTextParagraph);

    if (!improvedDocumentation) {
      return {
        success: false,
        message: "Failed to generate documentation - no content returned",
        data: null,
      };
    }

    // Success! Return the generated documentation
    return {
      success: true,
      message: "Documentation generated successfully",
      data: {
        improvedDocumentation,
      },
    };
  } catch (error) {
    // Comprehensive error handling
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    console.error("Documentation generation failed:", errorMessage);

    return {
      success: false,
      message: `Documentation generation failed: ${errorMessage}`,
      data: null,
    };
  }
}
export async function generateTasksFromDeveloperDocumentation(
  uploadResponse: string
): Promise<ClientTask[]> {
  if (!uploadResponse) {
    throw new Error("Missing file URL in upload response");
  }

  try {
    // Extract text from PDF
    const extractedText = await extractTextFromPdf(uploadResponse);

    // Process text: split into lines, sanitize, and join
    const processedTextLines = extractedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (processedTextLines.length === 0) {
      throw new Error("No valid text content found in the PDF");
    }
    const extractedTextParagraph = processedTextLines.join(" ");

    // Generate tasks using Gemini AI
    const aiGeneratedTasks = await generateTasksFromDeveloperDocumentationFromGeminiAI(extractedTextParagraph);

    return aiGeneratedTasks;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Task generation failed:", errorMessage);
    throw new Error(errorMessage);
  }
}