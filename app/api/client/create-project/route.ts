// app/api/client/create-project/route.ts
import { NextResponse } from "next/server";
import { generateDocumentationFromGeminiAI } from "@/lib/gemini"; // Adjust path as needed

export const maxDuration = 30; // Set to 30 seconds

export async function POST(request: Request) {
  try {
    const { projectName, projectOverview, developmentAreas } = await request.json();
    const documentation = await generateDocumentationFromGeminiAI(
      projectName,
      projectOverview,
      developmentAreas
    );
    return NextResponse.json({ success: true, documentation });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to generate documentation" },
      { status: 500 }
    );
  }
}