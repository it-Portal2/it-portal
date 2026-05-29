"use server";

import { NextResponse } from "next/server";
import {
  AIAnalysis,
  AIVerdict,
  Application,
  ClientTask,
  CorrectnessScore,
  OriginalityScore,
} from "./types";
import {
  extractQuestionTypeFromId,
  validateQuestionStructure,
} from "./analysis-utils";
import { getActiveOpenRouterAIKeys, getAiConfig } from "@/lib/firebase/admin";
import {
  AIKeyFromDB,
  AttemptResult,
  GEMINI_CONFIG,
} from "@/lib/types";
import {
  classifyAndLogError,
  generateUserFriendlyErrorMessage,
  getDatabaseErrorMessage,
  GeminiConfigurationError,
  GeminiValidationError,
} from "@/lib/gemini-errors";
import { generateDynamicRetryStrategy, withTimeout } from "@/lib/gemini-retry";

interface APIError extends Error {
  status?: number;
  headers?: Record<string, string>;
}

const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred";

// ---------------------------------------------------------------------------
// OpenRouter HTTP helper
// ---------------------------------------------------------------------------

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: object[]
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || data?.error) {
    const errBody = data?.error ?? data;
    const parts: string[] = [];
    if (errBody?.message) parts.push(errBody.message);
    if (errBody?.code !== undefined) parts.push(`code: ${errBody.code}`);
    if (errBody?.metadata?.provider_name) parts.push(`provider: ${errBody.metadata.provider_name}`);
    if (errBody?.metadata?.raw) parts.push(`raw: ${String(errBody.metadata.raw).slice(0, 200)}`);
    const msg = parts.length ? parts.join(" | ") : `HTTP ${res.status}`;
    const err = new Error(msg) as any;
    err.status = res.status;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    const err = new Error("OpenRouter returned no content in choices[0].message.content") as any;
    err.status = 500;
    throw err;
  }

  return content;
}

// ---------------------------------------------------------------------------
// Core retry loop — mirrors tryWithDatabaseKeysOptimized from gemini.ts
// ---------------------------------------------------------------------------

async function tryWithOpenRouterKeys<T>(
  generateFunction: (apiKey: string, model: string) => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const operationId = `or_operation_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    const activeKeys = await getActiveOpenRouterAIKeys();
    const aiConfig = await getAiConfig();
    const model = aiConfig.openrouterModel;

    if (activeKeys.length === 0) {
      console.error(`[OPENROUTER] No active OpenRouter API keys found in database`, {
        operationId,
        error: "CONFIG_ERROR",
      });
      throw new GeminiConfigurationError(
        "CONFIG_ERROR: No active OpenRouter API keys found. Please activate at least one OpenRouter API key in Admin Panel → Settings → Manage AI Keys."
      );
    }

    const retryStrategy = generateDynamicRetryStrategy(activeKeys.length);

    if (retryStrategy.length === 0) {
      throw new GeminiConfigurationError(
        "STRATEGY_ERROR: Unable to generate retry strategy - insufficient time budget or no keys available."
      );
    }

    let lastError: Error | null = null;
    const attemptResults: AttemptResult[] = [];

    for (let attemptIndex = 0; attemptIndex < retryStrategy.length; attemptIndex++) {
      const attempt = retryStrategy[attemptIndex];
      const key = activeKeys[attempt.keyIndex];
      const attemptStartTime = Date.now();
      const timeElapsed = attemptStartTime - startTime;

      if (
        timeElapsed >
        GEMINI_CONFIG.MAX_EXECUTION_TIME - attempt.timeout - GEMINI_CONFIG.TIMEOUT_BUFFER
      ) {
        break;
      }

      try {
        console.log(`[AI:openrouter] attempt ${attemptIndex + 1}/${retryStrategy.length} — model: ${model} | key: ${key.aiId}`);
        const result = await withTimeout(
          generateFunction(key.apiKey, model),
          attempt.timeout,
          `Key "${key.aiId}" rotation ${attempt.rotation}`
        );
        return result;
      } catch (error) {
        const attemptDuration = Date.now() - attemptStartTime;

        const errorInfo = classifyAndLogError(
          error,
          key,
          attemptIndex,
          attempt.rotation,
          attemptDuration,
          attempt.timeout
        );

        attemptResults.push({
          attemptIndex: attemptIndex + 1,
          aiId: key.aiId,
          priority: key.priority,
          rotation: attempt.rotation,
          errorType: errorInfo.type,
          errorMessage: errorInfo.userMessage,
          duration: attemptDuration,
          timeout: attempt.timeout,
          shouldRetryImmediately: errorInfo.shouldRetryImmediately,
        });

        lastError = errorInfo.originalError;

        const isLastAttempt = attemptIndex === retryStrategy.length - 1;
        if (!isLastAttempt && !errorInfo.shouldRetryImmediately) {
          const delayMs =
            errorInfo.type === "quota" ? 2000 : errorInfo.type === "auth" ? 1000 : 500;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const errorSummary = attemptResults.reduce((acc, result) => {
      acc[result.errorType] = (acc[result.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.error(`[OPENROUTER] All API attempts failed`, {
      operationId,
      totalAttempts: attemptResults.length,
      totalTimeMs: totalTime,
      errorSummary,
    });

    const userFriendlyError = generateUserFriendlyErrorMessage(
      attemptResults.map((r) => ({ errorType: r.errorType, userMessage: r.errorMessage })),
      activeKeys.length,
      totalTime
    );

    throw new Error(userFriendlyError);
  } catch (error) {
    const totalTime = Date.now() - startTime;

    if (
      error instanceof GeminiConfigurationError ||
      error instanceof GeminiValidationError
    ) {
      throw error;
    }

    if (error instanceof Error && error.message.includes("DATABASE_ERROR")) {
      throw new Error(getDatabaseErrorMessage(error));
    }

    throw new Error(
      `SYSTEM_ERROR: Failed to initialize AI service: ${
        error instanceof Error ? error.message : "Unknown system error"
      }`
    );
  }
}

// ---------------------------------------------------------------------------
// JSON parsing helpers (verbatim from gemini.ts)
// ---------------------------------------------------------------------------

function cleanCandidateAnalysisResponse(response: string): string {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/`+/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":');

  cleaned = cleaned.replace(
    /("answer"\s*:\s*")([\s\S]*?)("\s*,\s*"questionType")/g,
    (match, prefix, content, suffix) => {
      const escapedContent = content
        .replace(/\\"/g, "###ESCAPED_QUOTE###")
        .replace(/"/g, '\\"')
        .replace(/###ESCAPED_QUOTE###/g, '\\"');
      return `${prefix}${escapedContent}${suffix}`;
    }
  );

  return cleaned;
}

function cleanJsonResponse(response: string): string {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/`+/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":');

  return cleaned;
}

// ---------------------------------------------------------------------------
// Exported functions — same signatures and prompts as gemini.ts
// ---------------------------------------------------------------------------

export async function analyzeCompleteApplicationOptimized(
  candidateData: Application
): Promise<{ aiAnalysis: AIAnalysis; overallScore: number }> {
  try {
    if (!candidateData.aiQuestions || candidateData.aiQuestions.length === 0) {
      throw new GeminiValidationError(
        "VALIDATION_ERROR: No interview questions available for analysis. Please ensure the candidate has completed the technical interview."
      );
    }

    if (!validateQuestionStructure(candidateData.aiQuestions)) {
      throw new GeminiValidationError(
        "VALIDATION_ERROR: Invalid question format detected. Each question must have an id, question text, and answer."
      );
    }

    return await tryWithOpenRouterKeys(async (apiKey, model) => {
      const sanitizeAnswer = (answer: string): string => {
        if (!answer) return "No answer provided";
        return answer
          .replace(/[ --]/g, "")
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n{3,}/g, "\n\n")
          .replace(/\t/g, " ")
          .trim()
          .substring(0, 5000);
      };

      const questionAnswerPairs =
        candidateData.aiQuestions
          ?.map((qa, index) => {
            const questionType = extractQuestionTypeFromId(qa.id || `q${index + 1}`);
            const sanitizedAnswer = sanitizeAnswer(qa.answer || "");
            const sanitizedQuestion = sanitizeAnswer(qa.question || "");
            return `${qa.id} [${questionType.toUpperCase()}]: ${sanitizedQuestion}\nANSWER: ${sanitizedAnswer}`;
          })
          .join("\n\n") || "No questions answered";

      const PROMPT = `Analyze candidate interview responses. Return ONLY valid JSON.

CANDIDATE: ${candidateData.resumeAnalysis?.education || "N/A"} | ${
        candidateData.resumeAnalysis?.experience || "N/A"
      } | ${candidateData.resumeAnalysis?.skills?.slice(0, 5).join(", ") || "N/A"}

QUESTIONS TO ANALYZE:
${questionAnswerPairs}

SCORING CRITERIA:
• Originality (0-100): 90-100=unique insight, 70-89=mostly original, 50-69=mixed, 30-49=templated, 0-29=copied/AI
• Correctness (0-10): accuracy, depth, practical application
• Classification: "human-written"(≥70), "potentially-copied"(30-69), "likely-ai-generated"(<30)

VERDICT OPTIONS: "Highly Recommended", "Recommended", "Requires Review", "Not Recommended"

IMPORTANT: Keep reasoning brief (25-35 words max). Return only the JSON below:
{
  "questionAnalyses": [
    {
      "questionId": "exact_id_from_input",
      "questionType": "technical|behavioral|scenario|leadership",
      "originalityScore": 0-100,
      "originalityReasoning": "25-35 words",
      "correctnessScore": 0-10,
      "correctnessReasoning": "25-35 words",
      "classification": "human-written|potentially-copied|likely-ai-generated"
    }
  ],
  "holisticAssessment": {
    "overallScore": 0-10,
    "verdict": "Highly Recommended|Recommended|Requires Review|Not Recommended",
    "resumeAlignmentScore": 0-10,
    "rationale": "50-60 words max"
  }
}`;

      const response = await callOpenRouter(apiKey, model, [
        { role: "user", content: PROMPT },
      ]);

      const cleanedResponse = cleanCandidateAnalysisResponse(response);

      let analysisResult: any;

      try {
        analysisResult = JSON.parse(cleanedResponse);
        if (!analysisResult.questionAnalyses || !analysisResult.holisticAssessment) {
          throw new Error("Missing required analysis sections");
        }
      } catch (parseError) {
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            let fixedJson = jsonMatch[0]
              .replace(/,(\s*[}\]])/g, "$1")
              .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
              .replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([,}])/g, ': "$1"$2');
            analysisResult = JSON.parse(fixedJson);
          } catch {
            throw new Error(`JSON parsing failed even after recovery attempts: ${parseError}`);
          }
        } else {
          throw new Error("No valid JSON structure found in AI response");
        }
      }

      const originalityScores: OriginalityScore[] = analysisResult.questionAnalyses.map(
        (analysis: any, index: number) => ({
          question: index + 1,
          score: Math.max(0, Math.min(100, analysis.originalityScore || 0)),
          reasoning: analysis.originalityReasoning || "Analysis not available",
        })
      );

      const correctnessScores: CorrectnessScore[] = analysisResult.questionAnalyses.map(
        (analysis: any, index: number) => ({
          question: index + 1,
          score: Math.max(0, Math.min(10, analysis.correctnessScore || 0)),
          reasoning: analysis.correctnessReasoning || "Analysis not available",
        })
      );

      const score = Math.max(
        0,
        Math.min(10, analysisResult.holisticAssessment.overallScore || 0)
      );
      const aiVerdict = analysisResult.holisticAssessment.verdict || "Requires Review";

      let overallVerdict: AIVerdict;
      switch (aiVerdict) {
        case "Highly Recommended":
          overallVerdict = "Highly Recommended";
          break;
        case "Recommended":
          overallVerdict = "Recommended";
          break;
        case "Not Recommended":
          overallVerdict = "Not Recommended";
          break;
        default:
          overallVerdict = "Requires Review";
      }

      const aiAnalysis: AIAnalysis = {
        originalityScores,
        correctnessScores,
        overallVerdict,
        aiRecommendation:
          analysisResult.holisticAssessment.rationale || "Analysis completed successfully",
      };

      return { aiAnalysis, overallScore: score };
    });
  } catch (error) {
    if (
      error instanceof GeminiConfigurationError ||
      error instanceof GeminiValidationError ||
      (error instanceof Error && error.message.includes("**"))
    ) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? `Analysis Failed: ${error.message}. If this persists, please contact support.`
        : "Unexpected Error: An unexpected error occurred during analysis. Please try again or contact support if the issue persists."
    );
  }
}

export async function quickAnalyze(candidateData: Application): Promise<AIVerdict> {
  try {
    const result = await analyzeCompleteApplicationOptimized(candidateData);
    return result.aiAnalysis.overallVerdict;
  } catch (error) {
    console.error(`Quick analysis failed`, {
      candidateName: candidateData.fullName || "Unknown",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return "Requires Review";
  }
}

export async function generateImprovedDocumentationFromGeminiAI(
  textContent: string
): Promise<any> {
  try {
    return await tryWithOpenRouterKeys(async (apiKey, model) => {
      const PROMPT = `
      You are an expert Project Architect & Senior Developer.
      Your task is to analyze, improve, and structure the client's developer document into a clear, comprehensive, and developer-friendly format in fully structured HTML. Additionally, you will create a detailed one-month project plan, breaking down tasks, targets, and achievements for each week.

      ## Client-Provided Developer Document
      Input Document:
      \`\`\`
      ${textContent}
      \`\`\`

      Response Format:
      AI must return fully structured, styled HTML with:
      - Headings (h1, h2, h3)
      - Bullet points (ul, li)
      - No special characters like **, \`\`\`

      Section Structure:
      Each section must dynamically adjust the number of points based on project requirements.

      AI Response: Well-Structured HTML Documentation
      Generate content only without any body styling. The HTML will be inserted into an existing page, so do not include any styles for the body element. Follow this format:

      \`\`\`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Documentation</title>
          <style>
              h1, h2, h3 {
                  color: #333;
                  border-bottom: 2px solid #ddd;
                  padding-bottom: 5px;
              }
              ul {
                  list-style-type: none;
                  padding: 0;
              }
              ul li::before {
                  content: "✅ ";
                  color: green;
              }
              pre {
                  background: #eee;
                  padding: 10px;
                  border-radius: 5px;
                  overflow-x: auto;
              }
          </style>
      </head>
      <body>
          <h1>Project Documentation</h1>
          <h2>1. Project Overview</h2>
          <ul>
              <li><strong>Project Name:</strong> [Dynamically generate]</li>
              <li><strong>Main Objective:</strong> [Summarize core purpose]</li>
              <li><strong>Key Features:</strong></li>
                <ul>
                    <li> [Feature 1]</li>
                    <li> [Feature 2]</li>
                    <li> [Feature 3] (More if needed)</li>
                </ul>
            </ul>
            <h2>3. Pages & Components Breakdown</h2>
            <h3>A. [Page Name] (Add more if needed)</h3>
            <ul>
                <li><strong>Purpose:</strong> [Brief explanation]</li>
                <li><strong>Features:</strong></li>
                <ul>
                    <li> [Feature 1]</li>
                    <li> [Feature 2]</li>
                    <li> [Feature 3] (More if needed)</li>
                </ul>
            </ul>
       <h2>3. One-Month Project Plan</h2>
      <h3>Week 1: [Focus Area]</h3>
      <ul>
        <li><strong>Tasks:</strong>
          <ul>
            <li>[Task 1]</li>
            <li>[Task 2]</li>
            <li>[Task 3] (Add more if needed)</li>
          </ul>
        </li>
      </ul>
      <h3>Week 2: [Focus Area]</h3>
      <ul>
        <li><strong>Tasks:</strong>
          <ul>
            <li>[Task 1]</li>
            <li>[Task 2]</li>
            <li>[Task 3] (Add more if needed)</li>
          </ul>
        </li>
      </ul>
      <h3>Week 3: [Focus Area]</h3>
      <ul>
        <li><strong>Tasks:</strong>
          <ul>
            <li>[Task 1]</li>
            <li>[Task 2]</li>
            <li>[Task 3] (Add more if needed)</li>
          </ul>
        </li>
      </ul>
      <h3>Week 4: [Focus Area]</h3>
      <ul>
        <li><strong>Tasks:</strong>
          <ul>
            <li>[Task 1]</li>
            <li>[Task 2]</li>
            <li>[Task 3] (Add more if needed)</li>
          </ul>
        </li>
      </ul>
      <h2>4. Workflow Summary</h2>
      <ul>
        <li><strong>Step 1:</strong> [Describe first step]</li>
        <li><strong>Step 2:</strong> [Describe second step]</li>
        <li><strong>Step 3:</strong> [Describe third step]</li>
      </ul>
      <h2>5. Tech Stack & Implementation</h2>
      <ul>
        <li><strong>Frontend:</strong> [Dynamically choose]</li>
        <li><strong>Backend:</strong> [Dynamically choose]</li>
        <li><strong>Database:</strong> [Choose between MongoDB, MySQL, or Firebase based on project requirements]</li>
      </ul>
    </body>
    </html>
          \`\`\`
    `;

      const response = await callOpenRouter(apiKey, model, [
        { role: "user", content: PROMPT },
      ]);

      let cleanedResponse = response
        .replace(/```html\n?/gi, "")
        .replace(/```/g, "")
        .replace(/\*?\n\n##/g, "##")
        .replace(/body\s*{[^}]*}/g, "")
        .trim();

      return cleanedResponse;
    });
  } catch (error) {
    console.error(`Documentation generation failed`, {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof Error) {
      const apiError = error as APIError;
      return NextResponse.json(
        { name: apiError.name, status: apiError.status, headers: apiError.headers, message: apiError.message },
        { status: apiError.status || 500 }
      );
    }

    return NextResponse.json({ message: DEFAULT_ERROR_MESSAGE }, { status: 500 });
  }
}

export async function generateDocumentationFromGeminiAI(
  projectName: string,
  projectOverview: string,
  developmentAreas: string[]
): Promise<any> {
  try {
    return await tryWithOpenRouterKeys(async (apiKey, model) => {
      const PROMPT = `
        You are an expert Project Architect & Senior Developer.
        Your task is to analyze, improve, and structure the client's given project name, project overview, and development areas into a clear, comprehensive, and developer-friendly format in fully structured HTML.

        ## Client-Provided Project Name
        Project Name:
        \`\`\`
        ${projectName}
        \`\`\`

        ## Client-Provided Project Overview
        Project Overview:
        \`\`\`
        ${projectOverview}
        \`\`\`

        ## Client-Provided Development Areas
        Development Areas:
        \`\`\`
        ${developmentAreas.join(", ")}
        \`\`\`

        Response Format:
        AI must return fully structured, styled HTML with:
        - Headings (h1, h2, h3)
        - Bullet points (ul, li)
        - No special characters like **, \`\`\`

        Section Structure:
        Each section must dynamically adjust the number of points based on project requirements.

        AI Response: Well-Structured HTML Documentation
        Generate content only without any body styling. The HTML will be inserted into an existing page, so do not include any styles for the body element. Follow this format:

        \`\`\`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${projectName} - Project Documentation</title>
            <style>
                h1, h2, h3 {
                    color: #333;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 5px;
                }
                ul {
                    list-style-type: none;
                    padding: 0;
                }
                ul li::before {
                    content: "✅ ";
                    color: green;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    background: #fff;
                }
                table, th, td {
                    border: 1px solid #ddd;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                }
                pre {
                    background: #eee;
                    padding: 10px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
            </style>
        </head>
        <body>

            <h1>${projectName} - Project Documentation</h1>

            <h2>1. Project Overview</h2>
            <ul>
                <li><strong>Project Name:</strong> ${projectName}</li>
              <li><strong>Main Objective:</strong> [Summarize core purpose]</li>
              <li><strong>Key Features:</strong></li>
              <ul>
                  <li> [Feature 1]</li>
                  <li> [Feature 2]</li>
                  <li> [Feature 3] (More if needed)</li>
              </ul>
          </ul>


            <h2>3. Pages & Components Breakdown</h2>

            <h3>A. [Page Name] (Add more if needed)</h3>
            <ul>
                <li><strong>Purpose:</strong> [Brief explanation]</li>
                <li><strong>Features:</strong></li>
                <ul>
                    <li> [Feature 1]</li>
                    <li> [Feature 2]</li>
                    <li> [Feature 3] (More if needed)</li>
                </ul>
            </ul>

     <h2>3. One-Month Project Plan</h2>
    <h3>Week 1: [Focus Area]</h3>
    <ul>
      <li><strong>Tasks:</strong>
        <ul>
          <li>[Task 1]</li>
          <li>[Task 2]</li>
          <li>[Task 3] (Add more if needed)</li>
        </ul>
      </li>
    </ul>
    <h3>Week 2: [Focus Area]</h3>
    <ul>
      <li><strong>Tasks:</strong>
        <ul>
          <li>[Task 1]</li>
          <li>[Task 2]</li>
          <li>[Task 3] (Add more if needed)</li>
        </ul>
      </li>
    </ul>
    <h3>Week 3: [Focus Area]</h3>
    <ul>
      <li><strong>Tasks:</strong>
        <ul>
          <li>[Task 1]</li>
          <li>[Task 2]</li>
          <li>[Task 3] (Add more if needed)</li>
        </ul>
      </li>
    </ul>
    <h3>Week 4: [Focus Area]</h3>
    <ul>
      <li><strong>Tasks:</strong>
        <ul>
          <li>[Task 1]</li>
          <li>[Task 2]</li>
          <li>[Task 3] (Add more if needed)</li>
        </ul>
      </li>
    </ul>
    <h2>4. Workflow Summary</h2>
    <ul>
      <li><strong>Step 1:</strong> [Describe first step]</li>
      <li><strong>Step 2:</strong> [Describe second step]</li>
      <li><strong>Step 3:</strong> [Describe third step]</li>
    </ul>

    <h2>5. Tech Stack & Implementation</h2>
    <ul>
      <li><strong>Frontend:</strong> [Dynamically choose]</li>
      <li><strong>Backend:</strong> [Dynamically choose]</li>
      <li><strong>Database:</strong> [Choose between MongoDB, MySQL, or Firebase based on project requirements]</li>
    </ul>
  </body>
  </html>
        \`\`\`
      `;

      const response = await callOpenRouter(apiKey, model, [
        { role: "user", content: PROMPT },
      ]);

      let cleanedResponse = response
        .replace(/```html\n?/gi, "")
        .replace(/```/g, "")
        .replace(/\*?\n\n##/g, "##")
        .replace(/body\s*{[^}]*}/g, "")
        .trim();

      return cleanedResponse;
    });
  } catch (error) {
    console.error(`Project documentation generation failed`, {
      projectName,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof Error) {
      const apiError = error as APIError;
      return NextResponse.json(
        { name: apiError.name, status: apiError.status, headers: apiError.headers, message: apiError.message },
        { status: apiError.status || 500 }
      );
    }

    return NextResponse.json({ message: DEFAULT_ERROR_MESSAGE }, { status: 500 });
  }
}

export async function generateTasksFromDeveloperDocumentationFromGeminiAI(
  textContent: string
): Promise<ClientTask[]> {
  try {
    return await tryWithOpenRouterKeys(async (apiKey, model) => {
      const PROMPT = `
        You are an expert Project Architect & Senior Developer.
        Your task is to analyze the provided developer documentation text and generate a concise, actionable list of tasks for a developer to implement the project. The tasks should be specific, clear, and focused on development work.

        ## Input Documentation Text
        \`\`\`
        ${textContent}
        \`\`\`

        ## Instructions
        - Generate a list of tasks based on the documentation.
        - Each task should be a single, actionable development step.
        - Avoid vague tasks like "Build the app" — break them into smaller, specific steps.
        - Generate between 8-15 tasks depending on project complexity.
        - Return the response as a JSON array of objects with the following structure:
          - \`id\`: a unique string identifier (e.g., "task-1", "task-2")
          - \`name\`: a concise description of the task (e.g., "Set up Firebase authentication")
          - \`completed\`: a boolean, always set to false

        ## Response Format
        Return ONLY valid JSON in this exact format (no markdown, no code blocks, no additional text):
        [
          {"id": "task-1", "name": "Set up project repository and initialize version control", "completed": false},
          {"id": "task-2", "name": "Design and implement database schema", "completed": false},
          {"id": "task-3", "name": "Create user authentication system", "completed": false},
          {"id": "task-4", "name": "Build main dashboard UI components", "completed": false},
          {"id": "task-5", "name": "Implement API endpoints for data management", "completed": false}
        ]

        IMPORTANT: Return ONLY the JSON array. No explanatory text, no markdown formatting, no code blocks.
      `;

      const response = await callOpenRouter(apiKey, model, [
        { role: "user", content: PROMPT },
      ]);

      function cleanTasksJsonResponse(raw: string): string {
        let cleaned = raw.trim();
        cleaned = cleaned.replace(/```json\s*/gi, "");
        cleaned = cleaned.replace(/```javascript\s*/gi, "");
        cleaned = cleaned.replace(/```\s*/g, "");
        cleaned = cleaned.replace(/`+/g, "");
        cleaned = cleaned.replace(/^[^[\{]*/, "");
        cleaned = cleaned.replace(/[^\]\}]*$/, "");
        const firstBracket = cleaned.indexOf("[");
        const lastBracket = cleaned.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          cleaned = cleaned.substring(firstBracket, lastBracket + 1);
        }
        cleaned = cleaned
          .replace(/,(\s*[\]\}])/g, "$1")
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
          .replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([,\]\}])/g, ': "$1"$2');
        return cleaned.trim();
      }

      const cleanedResponse = cleanTasksJsonResponse(response);

      let tasks: ClientTask[];

      try {
        tasks = JSON.parse(cleanedResponse);
      } catch (parseError) {
        try {
          const taskMatches = cleanedResponse.match(
            /\{\s*"id"\s*:\s*"[^"]+"\s*,\s*"name"\s*:\s*"[^"]+"\s*,\s*"completed"\s*:\s*false\s*\}/g
          );
          if (taskMatches && taskMatches.length > 0) {
            tasks = taskMatches.map((match) => JSON.parse(match));
          } else {
            throw new Error("Could not extract tasks from response using regex");
          }
        } catch {
          throw new Error(
            `JSON parsing failed: ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}`
          );
        }
      }

      if (!Array.isArray(tasks)) throw new Error("Response is not an array");
      if (tasks.length === 0) throw new Error("No tasks found in response");

      const validatedTasks = tasks
        .map((task, index) => {
          if (!task || typeof task !== "object") throw new Error(`Invalid task object at index ${index}`);
          return {
            id: task.id || `task-${index + 1}-${Date.now()}`,
            name: task.name || `Task ${index + 1}`,
            completed: Boolean(task.completed),
          };
        })
        .filter((task) => task.name.trim().length > 0);

      if (validatedTasks.length === 0) throw new Error("No valid tasks after validation");

      return validatedTasks;
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("JSON parsing failed")) {
      throw new Error(`AI response parsing failed. This is usually temporary - retry now.`);
    }
    throw new Error(
      `Task generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function generateCareerPathRecommendations(
  candidateData: Application
): Promise<string[]> {
  try {
    return await tryWithOpenRouterKeys(async (apiKey, model) => {
      const rawRecommendation =
        candidateData?.aiAnalysis?.aiRecommendation || "No specific insights available";
      const sanitizedRecommendation = rawRecommendation
        .replace(/[{}[\]"]/g, "")
        .substring(0, 500);

      const PROMPT = `You are a highly experienced global career advisor.
Analyze the following candidate profile and suggest exactly 3 modern, market-relevant job roles they are most likely to excel in.

CANDIDATE PROFILE:
Name: ${candidateData.fullName || "Unknown"}
Overall Score: ${candidateData.overallScore || 0}/10
AI Verdict: ${candidateData?.aiAnalysis?.overallVerdict}

PROFESSIONAL BACKGROUND:
Education: ${candidateData.resumeAnalysis?.education || "N/A"}
Experience: ${candidateData.resumeAnalysis?.experience || "N/A"}
Skills: ${candidateData.resumeAnalysis?.skills?.join(", ") || "N/A"}
Summary: ${candidateData.resumeAnalysis?.summary || "N/A"}

AI ANALYSIS INSIGHTS:
${sanitizedRecommendation}

TECHNICAL COMPETENCY:
Average Correctness Score: ${
        (candidateData?.aiAnalysis?.correctnessScores || []).reduce(
          (acc, curr) => acc + curr.score,
          0
        ) / (candidateData?.aiAnalysis?.correctnessScores?.length || 1) || 0
      }/10
Average Authenticity: ${
        (candidateData?.aiAnalysis?.originalityScores ?? []).reduce(
          (acc, curr) => acc + curr.score,
          0
        ) / (candidateData?.aiAnalysis?.originalityScores?.length || 1) || 0
      }%

INSTRUCTIONS:
1. Consider all global job roles across industries and domains (do not limit to a specific sector).
2. Suggest exactly 3 job roles that are:
   - Currently in demand worldwide
   - Realistic for this candidate based on skills, education, and experience
   - Offering progressive career growth and relevance in 2025
3. Do not explain, justify, or add extra text.
4. CRITICAL: Do NOT output JSON. Do NOT repeat the analysis. Return ONLY the list.

RESPONSE FORMAT:
Return exactly 3 job role titles, one per line, no additional text:
[Job Role 1]
[Job Role 2]
[Job Role 3]`;

      const response = await callOpenRouter(apiKey, model, [
        { role: "user", content: PROMPT },
      ]);

      const jobRoles: string[] = response
        .split("\n")
        .map((line: string) => line.trim())
        .filter(
          (line: string) =>
            line.length > 0 && !line.includes("[") && !line.includes("]")
        )
        .slice(0, 3);

      return jobRoles;
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Career analysis failed: ${error.message}`
        : "Career analysis failed due to an unexpected error"
    );
  }
}

export async function analyzeResumeWithAI(
  base64Data: string,
  mimeType: string
): Promise<{ skills: string[]; experience: string; education: string; summary: string }> {
  try {
    return await tryWithOpenRouterKeys(async (apiKey, model) => {
      const prompt = `You are an expert HR professional and resume analyzer. Analyze this resume document carefully and extract key information.

IMPORTANT: Extract ONLY information that is explicitly present in the resume. Do not infer or assume information.

EDGE CASE HANDLING:
- If NO work experience is found → Mark as "0 years, Fresher/Entry level"
- If NO skills are explicitly mentioned → Return ["General skills"] or skills inferred from education/projects
- If NO education is found → Mark as "Not specified"
- If NO clear summary can be formed → Create brief summary from available information

Extract the following data and return it in JSON format:
1. Technical and professional skills (array of specific skills mentioned or inferred from projects/education)
2. Years of experience and seniority level (calculate from work history or mark as fresher)
3. Educational background and qualifications (degrees, certifications, institutions)
4. Brief professional summary (2-3 sentences highlighting available strengths)

EXPERIENCE LEVEL CALCULATION:
- 0 years = "0 years, Fresher/Entry level"
- 0-2 years = "X years, Junior level"
- 2-5 years = "X years, Mid level"
- 5-8 years = "X years, Senior level"
- 8+ years = "X years, Lead/Principal level"

Return JSON in this exact format:
{
  "skills": ["specific_skill_1", "specific_skill_2", "specific_skill_3"],
  "experience": "X years, [Fresher/Junior/Mid/Senior/Lead] level",
  "education": "Degree, Institution, Year (or 'Not specified' if unavailable)",
  "summary": "Professional summary highlighting key strengths and expertise based on available information"
}

Be precise and handle missing information gracefully by using appropriate defaults.`;

      const response = await callOpenRouter(apiKey, model, [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Data}` },
            },
            { type: "text", text: prompt },
          ],
        },
      ]);

      const cleanedResponse = cleanJsonResponse(response);
      const analysis = JSON.parse(cleanedResponse);

      if (!analysis.skills || !Array.isArray(analysis.skills) || analysis.skills.length === 0) {
        analysis.skills = ["General skills"];
      }
      if (!analysis.experience) analysis.experience = "0 years, Fresher/Entry level";
      if (!analysis.education) analysis.education = "Not specified";
      if (!analysis.summary)
        analysis.summary = "Candidate with available qualifications seeking opportunities.";

      return analysis;
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to analyze resume: ${error.message}`
        : "Failed to analyze resume due to an unexpected error"
    );
  }
}

export async function generateInterviewQuestions(resumeData: {
  skills: string[];
  experience: string;
  education: string;
  summary: string;
}): Promise<Array<{ id: string; question: string; answer: string }>> {
  try {
    return await tryWithOpenRouterKeys(async (apiKey, model) => {
      const prompt = `You are a senior HR director at a Fortune 500 company. Based on the candidate's resume analysis, generate EXACTLY 10 interview questions for this candidate.

CANDIDATE ANALYSIS:
- Skills: ${resumeData.skills.join(", ")}
- Experience: ${resumeData.experience}
- Education: ${resumeData.education}
- Summary: ${resumeData.summary}

GENERATE EXACTLY 10 QUESTIONS WITH THIS DISTRIBUTION:
- 4 TECHNICAL QUESTIONS: Core technical knowledge questions based on their specific skills
- 2 BEHAVIORAL-FOCUSED: Use STAR method frameworks (Situation, Task, Action, Result) to assess past experiences and behaviors but in the question dont mention user that it is start method or answer the question in star method
- 2 SCENARIO-DRIVEN: Present realistic workplace challenges they might face
- 2 LEADERSHIP & PROBLEM-SOLVING: Assess critical thinking and decision-making abilities based on their background

Technical Questions Must Focus ONLY On:
${resumeData.skills.join(", ")} (use ONLY these skills from their resume)

STRICT RULE: Do not ask about technologies, frameworks, or skills that are NOT mentioned in their resume.

Return JSON in this exact format with EXACTLY 10 questions:
{
  "questions": [
    {"id": "technical_q1", "question": "Technical question 1 based on their skills"},
    {"id": "technical_q2", "question": "Technical question 2 based on their skills"},
    {"id": "technical_q3", "question": "Technical question 3 based on their skills"},
    {"id": "technical_q4", "question": "Technical question 4 based on their skills"},
    {"id": "behavioral_q1", "question": "Behavioral question based on their experience"},
    {"id": "behavioral_q2", "question": "Behavioral question based on their experience"},
    {"id": "scenario_q1", "question": "Scenario-driven workplace challenge question"},
    {"id": "scenario_q2", "question": "Scenario-driven workplace challenge question"},
    {"id": "leadership_q1", "question": "Leadership and problem-solving question"},
    {"id": "leadership_q2", "question": "Leadership and problem-solving question"}
  ]
}

Generate exactly 10 questions following this distribution. Make them specific to their actual resume data.`;

      const response = await callOpenRouter(apiKey, model, [
        { role: "user", content: prompt },
      ]);

      const cleanedResponse = cleanJsonResponse(response);
      const data = JSON.parse(cleanedResponse);

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid questions format in AI response");
      }

      const questions = data.questions.map((q: any, index: number) => ({
        id: q.id || `question_${index + 1}_${Date.now()}`,
        question: q.question,
        answer: "",
      }));

      return questions.slice(0, 10);
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to generate questions: ${error.message}`
        : "Failed to generate questions due to an unexpected error"
    );
  }
}
