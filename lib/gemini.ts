"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
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
import { getActiveGoogleAIKeys } from "@/lib/firebase/admin";
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

// Interfaces
interface APIError extends Error {
  status?: number;
  headers?: Record<string, string>;
}

const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred";

/**
 * Production-Grade Database-Driven Retry Strategy
 * Implements rotating attempts across all available keys with intelligent error handling
 */
async function tryWithDatabaseKeysOptimized<T>(
  generateFunction: (
    genAI: GoogleGenerativeAI,
    model: any,
    keyInfo: AIKeyFromDB
  ) => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const operationId = `operation_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {


    // 1. Fetch active Google AI keys from database
    const activeKeys = await getActiveGoogleAIKeys();

    if (activeKeys.length === 0) {
      console.error(
        `[GEMINI_SERVICE] No active Google API keys found in database`,
        {
          operationId,
          keysFound: 0,
          error: "CONFIG_ERROR",
        }
      );
      throw new GeminiConfigurationError(
        "CONFIG_ERROR: No active Google API keys found. Please activate at least one Google API key in Admin Panel → Settings → Manage AI Keys."
      );
    }



    // 2. Generate dynamic retry strategy
    const retryStrategy = generateDynamicRetryStrategy(activeKeys.length);

    if (retryStrategy.length === 0) {
      console.error(`[GEMINI_SERVICE] Failed to generate retry strategy`, {
        operationId,
        numKeys: activeKeys.length,
        maxExecutionTime: GEMINI_CONFIG.MAX_EXECUTION_TIME,
        error: "STRATEGY_ERROR",
      });
      throw new GeminiConfigurationError(
        "STRATEGY_ERROR: Unable to generate retry strategy - insufficient time budget or no keys available."
      );
    }



    // 3. Execute attempts with rotating key strategy
    let lastError: Error | null = null;
    const attemptResults: AttemptResult[] = [];

    for (
      let attemptIndex = 0;
      attemptIndex < retryStrategy.length;
      attemptIndex++
    ) {
      const attempt = retryStrategy[attemptIndex];
      const key = activeKeys[attempt.keyIndex];
      const attemptStartTime = Date.now();
      const timeElapsed = attemptStartTime - startTime;

      // Final time budget check
      if (
        timeElapsed >
        GEMINI_CONFIG.MAX_EXECUTION_TIME -
          attempt.timeout -
          GEMINI_CONFIG.TIMEOUT_BUFFER
      ) {
        break;
      }

      const attemptId = `${operationId}_attempt_${attemptIndex + 1}`;

      try {
        const genAI = new GoogleGenerativeAI(key.apiKey);
        const model = genAI.getGenerativeModel({
          model: GEMINI_CONFIG.MODEL_NAME,
          generationConfig: GEMINI_CONFIG.GENERATION_CONFIG,
        });

        const result = await withTimeout(
          generateFunction(genAI, model, key),
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

        console.error(`[GEMINI_SERVICE] API attempt failed`, {
          operationId,
          attemptId,
          keyId: key.aiId,
          keyPriority: key.priority,
          rotation: attempt.rotation,
          errorType: errorInfo.type,
          errorMessage: errorInfo.technicalMessage,
          attemptDurationMs: attemptDuration,
          timeoutMs: attempt.timeout,
          shouldRetryImmediately: errorInfo.shouldRetryImmediately,
          phase: "attempt_error",
        });

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

        // Smart retry delay logic
        const isLastAttempt = attemptIndex === retryStrategy.length - 1;
        if (!isLastAttempt && !errorInfo.shouldRetryImmediately) {
          const delayMs =
            errorInfo.type === "quota"
              ? 2000
              : errorInfo.type === "auth"
              ? 1000
              : 500;

          console.info(
            `[GEMINI_SERVICE] Applying retry delay before next attempt`,
            {
              operationId,
              attemptId,
              errorType: errorInfo.type,
              delayMs,
              nextAttemptIndex: attemptIndex + 2,
              phase: "retry_delay",
            }
          );

          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // Generate comprehensive failure summary
    const totalTime = Date.now() - startTime;
    const errorSummary = attemptResults.reduce((acc, result) => {
      acc[result.errorType] = (acc[result.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.error(
      `[GEMINI_SERVICE] All API attempts failed - operation complete failure`,
      {
        operationId,
        totalKeys: activeKeys.length,
        totalAttempts: attemptResults.length,
        maxRotations: Math.max(...attemptResults.map((r) => r.rotation)),
        totalTimeMs: totalTime,
        errorSummary,
        phase: "operation_failed",
      }
    );

    // Detailed attempt log for debugging
    attemptResults.forEach((result, index) => {
      console.debug(`[GEMINI_SERVICE] Attempt ${result.attemptIndex} details`, {
        operationId,
        attemptNumber: result.attemptIndex,
        keyId: result.aiId,
        keyPriority: result.priority,
        rotation: result.rotation,
        errorType: result.errorType,
        durationMs: result.duration,
        timeoutMs: result.timeout,
        phase: "attempt_summary",
      });
    });

    const userFriendlyError = generateUserFriendlyErrorMessage(
      attemptResults.map((r) => ({
        errorType: r.errorType,
        userMessage: r.errorMessage,
      })),
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
      console.error(`[GEMINI_SERVICE] Configuration or validation error`, {
        operationId,
        errorType: error.constructor.name,
        errorMessage: error.message,
        totalTimeMs: totalTime,
        phase: "operation_error",
      });
      throw error;
    }

    if (error instanceof Error && error.message.includes("DATABASE_ERROR")) {
      console.error(`[GEMINI_SERVICE] Database error during operation`, {
        operationId,
        errorMessage: error.message,
        totalTimeMs: totalTime,
        phase: "database_error",
      });
      throw new Error(getDatabaseErrorMessage(error));
    }

    console.error(`[GEMINI_SERVICE] Unexpected system error during operation`, {
      operationId,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
      totalTimeMs: totalTime,
      phase: "system_error",
    });

    throw new Error(
      `SYSTEM_ERROR: Failed to initialize AI service: ${
        error instanceof Error ? error.message : "Unknown system error"
      }`
    );
  }
}

/**
 * Main Analysis Function - Analyzes complete application with AI
 */
export async function analyzeCompleteApplicationOptimized(
  candidateData: Application
): Promise<{
  aiAnalysis: AIAnalysis;
  overallScore: number;
}> {

  try {
    // Pre-validation with detailed error messages
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

    const questionCounts = candidateData.aiQuestions.reduce((acc, qa) => {
      const type = extractQuestionTypeFromId(qa.id || "");
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return await tryWithDatabaseKeysOptimized(async (genAI, model, keyInfo) => {
      // Parse questions with type detection from ID
      const questionAnswerPairs =
        candidateData.aiQuestions
          ?.map((qa, index) => {
            const questionType = extractQuestionTypeFromId(
              qa.id || `q${index + 1}`
            );
            return `${qa.id} [${questionType.toUpperCase()}]: ${
              qa.question
            }\nANSWER: ${qa.answer}`;
          })
          .join("\n\n") || "No questions answered";

      // Construct analysis prompt
      const PROMPT = `Evaluate this cybersecurity candidate. Return ONLY valid JSON.

CANDIDATE PROFILE:
Education: ${candidateData.resumeAnalysis?.education || "N/A"}
Experience: ${candidateData.resumeAnalysis?.experience || "N/A"}  
Skills: ${candidateData.resumeAnalysis?.skills?.join(", ") || "N/A"}

QUESTION BREAKDOWN: ${JSON.stringify(questionCounts)}

QUESTIONS & ANSWERS:
${questionAnswerPairs}

EVALUATION FRAMEWORK:

TECHNICAL (${questionCounts.technical || 0} questions):
- Correctness: Accuracy of concepts, depth of knowledge, clarity, and ability to apply subject matter expertise
- Focus: Demonstrating relevant problem-solving using appropriate methods, tools, or frameworks for the given domain

BEHAVIORAL (${questionCounts.behavioral || 0} questions):  
- Correctness: Authenticity, relevance of experiences, ability to reflect, and structured communication
- Focus: Showcasing adaptability, collaboration, personal growth, and professional work habits

SCENARIO (${questionCounts.scenario || 0} questions):
- Correctness: Logical reasoning, practicality of solutions, clarity in steps, and alignment with real-world feasibility
- Focus: Applying structured problem-solving, analyzing constraints, and delivering actionable recommendations

LEADERSHIP (${questionCounts.leadership || 0} questions):
- Correctness: Demonstrated ability in guiding others, maintaining standards, and fostering growth
- Focus: Decision-making, accountability, continuous learning, ethical practices, and motivating teams

SCORING RULES:
Originality (0-100):
- 90-100: Highly personal, specific examples, unique insights
- 70-89: Mostly original with some common elements  
- 50-69: Mix of personal and generic content
- 30-49: Mostly templated/common responses
- 0-29: Copied/AI-generated/inappropriate

Correctness (0.0-10.0) - Type-specific:
- Technical: Accuracy of technical concepts and tools
- Behavioral: Quality of examples and self-reflection
- Scenario: Effectiveness of proposed solutions  
- Leadership: Strength of management and learning approaches

Classification:
- human-written: ≥70 originality, personal voice
- potentially-copied: 30-69 originality, templated feel
- likely-ai-generated: <30 originality, generic/AI patterns

VERDICT CRITERIA (Choose ONE):
"Highly Recommended": Tech excellence + behavioral strength + ethical integrity + leadership potential
"Recommended": Solid tech foundation + positive behaviors + ethical standards + role readiness  
"Requires Review": Shows potential BUT has concerns (ethics/originality/competency gaps)
"Not Recommended": Poor tech skills OR ethical red flags OR dishonest responses OR malpractice signs

RESPONSE REQUIREMENTS:
- originalityReasoning: (50–60 words), focus on specific indicators
- correctnessReasoning: (50–60 words), detailed type-specific assessment
- rationale: (90–100 words), detailed overall evaluation explaining your verdict choice

JSON OUTPUT:
{
  "questionAnalyses": [
    {
      "questionId": "question_id",
      "question": "question_text",
      "answer": "answer_text",
      "questionType": "technical/behavioral/scenario/leadership",
      "originalityScore": 0-100,
      "originalityReasoning": "brief specific analysis (max 60 words)",
      "correctnessScore": 0.0-10.0,
      "correctnessReasoning": "detailed type-specific assessment (exactly 60 words)",
      "classification": "human-written/potentially-copied/likely-ai-generated"
    }
  ],
  "holisticAssessment": {
    "overallScore": 0.0-10.0,
    "verdict": "Highly Recommended/Recommended/Requires Review/Not Recommended",
    "resumeAlignmentScore": 0-10,
    "rationale": "concise assessment explaining your verdict choice and focusing on technical competency and overall fit (max 100 words)"
  }
}`;

      const result = await model.generateContent(PROMPT);
      const response = await result.response.text();

      // Enhanced JSON parsing with better error recovery
      const cleanedResponse = cleanJsonResponse(response);
      let analysisResult: any;

      try {
        analysisResult = JSON.parse(cleanedResponse);

        if (
          !analysisResult.questionAnalyses ||
          !analysisResult.holisticAssessment
        ) {
          console.error(
            ` Response validation failed - missing required sections`,
            {
              keyId: keyInfo.aiId,
              hasQuestionAnalyses: !!analysisResult.questionAnalyses,
              hasHolisticAssessment: !!analysisResult.holisticAssessment,
              phase: "response_validation_error",
            }
          );
          throw new Error("Missing required analysis sections");
        }

      } catch (parseError) {
        console.error(
          `[GEMINI_ANALYSIS] JSON parsing failed, attempting recovery`,
          {
            keyId: keyInfo.aiId,
            parseError:
              parseError instanceof Error
                ? parseError.message
                : "Unknown parse error",
            responsePreview: cleanedResponse.substring(0, 500),
            phase: "json_parse_error",
          }
        );

        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            // Try fixing common JSON issues
            let fixedJson = jsonMatch[0]
              .replace(/,(\s*[}\]])/g, "$1")
              .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
              .replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([,}])/g, ': "$1"$2');

            analysisResult = JSON.parse(fixedJson);

          } catch (recoveryError) {
            console.error(`[GEMINI_ANALYSIS] JSON parsing recovery failed`, {
              keyId: keyInfo.aiId,
              recoveryError:
                recoveryError instanceof Error
                  ? recoveryError.message
                  : "Unknown recovery error",
              phase: "json_parse_recovery_failed",
            });
            throw new Error(
              `JSON parsing failed even after recovery attempts: ${recoveryError}`
            );
          }
        } else {
          console.error(
            `[GEMINI_ANALYSIS] No valid JSON structure found in response`,
            {
              keyId: keyInfo.aiId,
              phase: "json_structure_not_found",
            }
          );
          throw new Error("No valid JSON structure found in AI response");
        }
      }

      // Map scores efficiently with validation
      const originalityScores: OriginalityScore[] =
        analysisResult.questionAnalyses.map((analysis: any, index: number) => ({
          question: index + 1,
          score: Math.max(0, Math.min(100, analysis.originalityScore || 0)),
          reasoning: analysis.originalityReasoning || "Analysis not available",
        }));

      const correctnessScores: CorrectnessScore[] =
        analysisResult.questionAnalyses.map((analysis: any, index: number) => ({
          question: index + 1,
          score: Math.max(0, Math.min(10, analysis.correctnessScore || 0)),
          reasoning: analysis.correctnessReasoning || "Analysis not available",
        }));

      // Use AI-determined verdict directly from the response
      const score = Math.max(
        0,
        Math.min(10, analysisResult.holisticAssessment.overallScore || 0)
      );
      
      // Get verdict directly from AI response
      const aiVerdict = analysisResult.holisticAssessment.verdict || "Requires Review";
      
      // Map AI verdict to your AIVerdict type
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
        case "Requires Review":
        default:
          overallVerdict = "Requires Review";
          break;
      }

      const aiAnalysis: AIAnalysis = {
        originalityScores,
        correctnessScores,
        overallVerdict,
        aiRecommendation:
          analysisResult.holisticAssessment.rationale ||
          "Analysis completed successfully",
      };

      return { aiAnalysis, overallScore: score };
    });
  } catch (error) {

    // Re-throw custom errors as-is (they already have user-friendly messages)
    if (
      error instanceof GeminiConfigurationError ||
      error instanceof GeminiValidationError ||
      (error instanceof Error && error.message.includes("**"))
    ) {
      throw error;
    }

    // Fallback error
    throw new Error(
      error instanceof Error
        ? `Analysis Failed: ${error.message}. If this persists, please contact support.`
        : "Unexpected Error: An unexpected error occurred during analysis. Please try again or contact support if the issue persists."
    );
  }
}

// Helper function for JSON cleaning
function cleanJsonResponse(response: string): string {
  // Remove markdown and code blocks
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/`+/g, "")
    .trim();

  // Extract JSON object quickly
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Remove trailing commas and fix common JSON issues
  cleaned = cleaned
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":');

  return cleaned;
}

// Quick Analysis Function
export async function quickAnalyze(
  candidateData: Application
): Promise<AIVerdict> {

  try {
    const result = await analyzeCompleteApplicationOptimized(candidateData);

    return result.aiAnalysis.overallVerdict;
  } catch (error) {
    console.error(` Quick analysis failed`, {
      candidateName: candidateData.fullName || "Unknown",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return "Requires Review";
  }
}

// Documentation generation functions
export async function generateImprovedDocumentationFromGeminiAI(
  textContent: string
): Promise<any> {

  try {

    return await tryWithDatabaseKeysOptimized(async (genAI, model, keyInfo) => {
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

      const result = await model.generateContent(PROMPT);
      const response = await result.response.text();

      // Remove any unnecessary AI-generated intro
         let cleanedResponse = response
        .replace(/```html\n?/gi, "")
        .replace(/```/g, "")
        .replace(/\*?\n\n##/g, "##")
        .replace(/body\s*{[^}]*}/g, "")
        .trim();

      
      return cleanedResponse;
    });
  } catch (error) {
    console.error(`Documentation generation failed`, {    errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof Error) {
      const apiError = error as APIError;
      return NextResponse.json(
        {
          name: apiError.name,
          status: apiError.status,
          headers: apiError.headers,
          message: apiError.message,
        },
        { status: apiError.status || 500 }
      );
    }

    return NextResponse.json(
      { message: DEFAULT_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}

export async function generateDocumentationFromGeminiAI(
  projectName: string,
  projectOverview: string,
  developmentAreas: string[]
): Promise<any> {

  try {
    return await tryWithDatabaseKeysOptimized(async (genAI, model, keyInfo) => {
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

      const result = await model.generateContent(PROMPT);
      const response = await result.response.text();

      let cleanedResponse = response
        .replace(/```html\n?/gi, "")
        .replace(/```/g, "")
        .replace(/\*?\n\n##/g, "##")
        .replace(/body\s*{[^}]*}/g, "")
        .trim();

      return cleanedResponse;
    });
  } catch (error) {
    console.error(
      `Project documentation generation failed`,
      {
        projectName,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      }
    );

    if (error instanceof Error) {
      const apiError = error as APIError;
      return NextResponse.json(
        {
          name: apiError.name,
          status: apiError.status,
          headers: apiError.headers,
          message: apiError.message,
        },
        { status: apiError.status || 500 }
      );
    }

    return NextResponse.json(
      { message: DEFAULT_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}

export async function generateTasksFromDeveloperDocumentationFromGeminiAI(
  textContent: string
): Promise<ClientTask[]> {


  try {


    return await tryWithDatabaseKeysOptimized(async (genAI, model, keyInfo) => {

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
        - Return the response as a JSON array of objects with the following structure:
          - \`id\`: a unique string identifier (e.g., "task-1", "task-2")
          - \`name\`: a concise description of the task (e.g., "Set up Firebase authentication")
          - \`completed\`: a boolean, always set to false
  
        ## Response Format
        Return the tasks in this exact JSON format:
        \`\`\`json
        [
          {"id": "task-1", "name": "Set up project repository", "completed": false},
          {"id": "task-2", "name": "Design database schema", "completed": false}
        ]
        \`\`\`
  
        ## Output
        Provide only the JSON array of tasks, with no additional text or markdown outside the JSON.
      `;

      const result = await model.generateContent(PROMPT);
      const response = await result.response.text();

      console.info(
        ` Task generation response received`,
        {
   
          keyId: keyInfo.aiId,
          responseLength: response.length,
        }
      );

      const cleanedResponse = response.replace(/^``````$/g, "").trim();
      const tasks: ClientTask[] = JSON.parse(cleanedResponse);

      if (
        !Array.isArray(tasks) ||
        tasks.some((t) => !t.id || !t.name || typeof t.completed !== "boolean")
      ) {
        console.error(`[GEMINI_TASK_GENERATION] Invalid task format returned`, {
          keyId: keyInfo.aiId,
          tasksLength: Array.isArray(tasks) ? tasks.length : "not_array",
        });
        throw new Error("Invalid task format returned by AI");
      }

      console.info(
        `[GEMINI_TASK_GENERATION] Task generation completed successfully`,
        {
          keyId: keyInfo.aiId,
          tasksGenerated: tasks.length,
        }
      );

      return tasks;
    });
  } catch (error) {
    console.error(`Task generation failed`, {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error(
      `Task generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Generate Career Path Recommendations for Highly Recommended Candidates
 * Uses AI to suggest 3 suitable job roles based on analysis results
 */
export async function generateCareerPathRecommendations(
  candidateData: Application
): Promise<string[]> {


  try {

    return await tryWithDatabaseKeysOptimized(async (genAI, model, keyInfo) => {
      // Construct career analysis prompt
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
${candidateData?.aiAnalysis?.aiRecommendation || "No specific insights available"}

TECHNICAL COMPETENCY:
Average Correctness Score: ${(candidateData?.aiAnalysis?.correctnessScores || []).reduce((acc, curr) => acc + curr.score, 0) / (candidateData?.aiAnalysis?.correctnessScores?.length || 1) || 0}/10
Average Authenticity: ${(candidateData?.aiAnalysis?.originalityScores ?? []).reduce((acc, curr) => acc + curr.score, 0) / (candidateData?.aiAnalysis?.originalityScores?.length || 1) || 0}%

INSTRUCTIONS:
1. Consider all global job roles across industries and domains (do not limit to a specific sector).
2. Suggest exactly 3 job roles that are:
   - Currently in demand worldwide
   - Realistic for this candidate based on skills, education, and experience
   - Offering progressive career growth and relevance in 2025
3. Do not explain, justify, or add extra text.

RESPONSE FORMAT:
Return exactly 3 job role titles, one per line, no additional text:
[Job Role 1]
[Job Role 2]
[Job Role 3]`;

      const result = await model.generateContent(PROMPT);
      const response = await result.response.text();

     
      const jobRoles: string[] = response
        .split('\n')
        .map((line: string) => line.trim()) 
        .filter((line: string) => line.length > 0 && !line.includes('[') && !line.includes(']'))
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


/**
 * Analyze resume PDF and extract key information
 */
export async function analyzeResumeWithAI(
  base64Data: string, 
  mimeType: string
): Promise<{
  skills: string[];
  experience: string;
  education: string;
  summary: string;
}> {
  const analysisStartTime = Date.now();
  const resumeAnalysisId = `resume_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.info(`[GEMINI_RESUME_ANALYSIS] Starting resume analysis`, {
      resumeAnalysisId,
      timestamp: new Date().toISOString(),
      phase: 'resume_analysis_start'
    });

    return await tryWithDatabaseKeysOptimized(async (genAI, model, keyInfo) => {
      console.info(`[GEMINI_RESUME_ANALYSIS] Processing with API key`, {
        resumeAnalysisId,
        keyId: keyInfo.aiId,
        keyPriority: keyInfo.priority,
        phase: 'prompt_preparation'
      });

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

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]);

      const response = await result.response.text();
      
      // Clean and parse response
      const cleanedResponse = cleanJsonResponse(response);
      const analysis = JSON.parse(cleanedResponse);
      
      // Validate and set defaults
      if (!analysis.skills || !Array.isArray(analysis.skills) || analysis.skills.length === 0) {
        analysis.skills = ["General skills"];
      }
      
      if (!analysis.experience) {
        analysis.experience = "0 years, Fresher/Entry level";
      }
      
      if (!analysis.education) {
        analysis.education = "Not specified";
      }
      
      if (!analysis.summary) {
        analysis.summary = "Candidate with available qualifications seeking opportunities.";
      }

      const totalAnalysisTime = Date.now() - analysisStartTime;
      
      console.info(`[GEMINI_RESUME_ANALYSIS] Resume analysis completed successfully`, {
        resumeAnalysisId,
        keyId: keyInfo.aiId,
        totalAnalysisTimeMs: totalAnalysisTime,
        skillsFound: analysis.skills.length,
        phase: 'resume_analysis_complete'
      });

      return analysis;
    });

  } catch (error) {
    const totalTime = Date.now() - analysisStartTime;
    
    console.error(`[GEMINI_RESUME_ANALYSIS] Resume analysis failed`, {
      resumeAnalysisId,
      totalTimeMs: totalTime,
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      phase: 'resume_analysis_failed'
    });

    throw new Error(
      error instanceof Error
        ? `Failed to analyze resume: ${error.message}`
        : "Failed to analyze resume due to an unexpected error"
    );
  }
}

/**
 * Generate exactly 10 interview questions based on resume analysis
 */
export async function generateInterviewQuestions(
  resumeData: {
    skills: string[];
    experience: string;
    education: string;
    summary: string;
  }
): Promise<Array<{ id: string; question: string; answer: string }>> {
  const questionStartTime = Date.now();
  const questionGenerationId = `question_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.info(`[GEMINI_QUESTION_GENERATION] Starting interview question generation`, {
      questionGenerationId,
      timestamp: new Date().toISOString(),
      skillsCount: resumeData.skills.length,
      phase: 'question_generation_start'
    });

    return await tryWithDatabaseKeysOptimized(async (genAI, model, keyInfo) => {
      console.info(`[GEMINI_QUESTION_GENERATION] Processing with API key`, {
        questionGenerationId,
        keyId: keyInfo.aiId,
        keyPriority: keyInfo.priority,
        phase: 'prompt_preparation'
      });

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
    {
      "id": "technical_q1",
      "question": "Technical question 1 based on their skills"
    },
    {
      "id": "technical_q2",
      "question": "Technical question 2 based on their skills"
    },
    {
      "id": "technical_q3",
      "question": "Technical question 3 based on their skills"
    },
    {
      "id": "technical_q4",
      "question": "Technical question 4 based on their skills"
    },
    {
      "id": "behavioral_q1",
      "question": "Behavioral question based on their experience"
    },
    {
      "id": "behavioral_q2",
      "question": "Behavioral question based on their experience"
    },
    {
      "id": "scenario_q1",
      "question": "Scenario-driven workplace challenge question"
    },
    {
      "id": "scenario_q2",
      "question": "Scenario-driven workplace challenge question"
    },
    {
      "id": "leadership_q1",
      "question": "Leadership and problem-solving question"
    },
    {
      "id": "leadership_q2",
      "question": "Leadership and problem-solving question"
    }
  ]
}

Generate exactly 10 questions following this distribution. Make them specific to their actual resume data.`;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      
      // Clean and parse response
      const cleanedResponse = cleanJsonResponse(response);
      const data = JSON.parse(cleanedResponse);
      
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid questions format in AI response");
      }
      
      const questions = data.questions.map((q: any, index: number) => ({
        id: q.id || `question_${index + 1}_${Date.now()}`,
        question: q.question,
        answer: ""
      }));
      
      // Ensure exactly 10 questions
      const finalQuestions = questions.slice(0, 10);

      const totalQuestionTime = Date.now() - questionStartTime;
      
      console.info(`[GEMINI_QUESTION_GENERATION] Question generation completed successfully`, {
        questionGenerationId,
        keyId: keyInfo.aiId,
        totalQuestionTimeMs: totalQuestionTime,
        questionsGenerated: finalQuestions.length,
        phase: 'question_generation_complete'
      });

      return finalQuestions;
    });

  } catch (error) {
    const totalTime = Date.now() - questionStartTime;
    
    console.error(`[GEMINI_QUESTION_GENERATION] Question generation failed`, {
      questionGenerationId,
      totalTimeMs: totalTime,
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      phase: 'question_generation_failed'
    });

    throw new Error(
      error instanceof Error
        ? `Failed to generate questions: ${error.message}`
        : "Failed to generate questions due to an unexpected error"
    );
  }
}
