"use server";

import * as gemini from "@/lib/gemini";
import * as openrouter from "@/lib/openrouter";
import { getAiConfig } from "@/lib/firebase/admin";

async function callWithFallback<T>(
  operationName: string,
  openrouterFn: () => Promise<T>,
  geminiFn: () => Promise<T>
): Promise<T> {
  const config = await getAiConfig();
  const isPrimaryOpenRouter = config.provider === "openrouter";
  const [primary, fallback, primaryName, fallbackName] = isPrimaryOpenRouter
    ? [openrouterFn, geminiFn, "openrouter", "gemini"]
    : [geminiFn, openrouterFn, "gemini", "openrouter"];

  const primaryModel = isPrimaryOpenRouter ? config.openrouterModel : config.geminiModel;
  console.log(`[AI] ${operationName} → provider: ${primaryName} | model: ${primaryModel}`);

  try {
    return await primary();
  } catch (err) {
    console.warn(
      `[AI] ${operationName}: ${primaryName} failed, falling over to ${fallbackName}:`,
      err
    );
    return await fallback();
  }
}

export async function analyzeCompleteApplicationOptimized(
  ...args: Parameters<typeof gemini.analyzeCompleteApplicationOptimized>
) {
  return callWithFallback(
    "analyzeCompleteApplicationOptimized",
    () => openrouter.analyzeCompleteApplicationOptimized(...args),
    () => gemini.analyzeCompleteApplicationOptimized(...args)
  );
}

export async function quickAnalyze(
  ...args: Parameters<typeof gemini.quickAnalyze>
) {
  return callWithFallback(
    "quickAnalyze",
    () => openrouter.quickAnalyze(...args),
    () => gemini.quickAnalyze(...args)
  );
}

export async function generateImprovedDocumentationFromGeminiAI(
  ...args: Parameters<typeof gemini.generateImprovedDocumentationFromGeminiAI>
) {
  return callWithFallback(
    "generateImprovedDocumentationFromGeminiAI",
    () => openrouter.generateImprovedDocumentationFromGeminiAI(...args),
    () => gemini.generateImprovedDocumentationFromGeminiAI(...args)
  );
}

export async function generateDocumentationFromGeminiAI(
  ...args: Parameters<typeof gemini.generateDocumentationFromGeminiAI>
) {
  return callWithFallback(
    "generateDocumentationFromGeminiAI",
    () => openrouter.generateDocumentationFromGeminiAI(...args),
    () => gemini.generateDocumentationFromGeminiAI(...args)
  );
}

export async function generateTasksFromDeveloperDocumentationFromGeminiAI(
  ...args: Parameters<typeof gemini.generateTasksFromDeveloperDocumentationFromGeminiAI>
) {
  return callWithFallback(
    "generateTasksFromDeveloperDocumentationFromGeminiAI",
    () => openrouter.generateTasksFromDeveloperDocumentationFromGeminiAI(...args),
    () => gemini.generateTasksFromDeveloperDocumentationFromGeminiAI(...args)
  );
}

export async function generateCareerPathRecommendations(
  ...args: Parameters<typeof gemini.generateCareerPathRecommendations>
) {
  return callWithFallback(
    "generateCareerPathRecommendations",
    () => openrouter.generateCareerPathRecommendations(...args),
    () => gemini.generateCareerPathRecommendations(...args)
  );
}

export async function analyzeResumeWithAI(
  ...args: Parameters<typeof gemini.analyzeResumeWithAI>
) {
  return callWithFallback(
    "analyzeResumeWithAI",
    () => openrouter.analyzeResumeWithAI(...args),
    () => gemini.analyzeResumeWithAI(...args)
  );
}

export async function generateInterviewQuestions(
  ...args: Parameters<typeof gemini.generateInterviewQuestions>
) {
  return callWithFallback(
    "generateInterviewQuestions",
    () => openrouter.generateInterviewQuestions(...args),
    () => gemini.generateInterviewQuestions(...args)
  );
}
