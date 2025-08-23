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

OVERALL ASSESSMENT:
- recommend: ≥8.0 (strong technical + good behavioral/leadership)
- proceed-with-caution: 6.0-7.9 (decent but has concerns)
- not-recommended: <6.0 (significant weaknesses)

RESPONSE REQUIREMENTS:
- originalityReasoning: Maximum 60 words, focus on specific indicators
- correctnessReasoning: Exactly 60 words, detailed type-specific assessment
- rationale: Maximum 100 words, detailed overall evaluation

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
    "verdict": "recommend/proceed-with-caution/not-recommended",
    "resumeAlignmentScore": 0-10,
    "rationale": "concise assessment focusing on technical competency and overall fit (max 100 words)"
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

      // Efficient verdict mapping with score validation
      const score = Math.max(
        0,
        Math.min(10, analysisResult.holisticAssessment.overallScore || 0)
      );
      let overallVerdict: AIVerdict;

      if (score >= 8.5) {
        overallVerdict = "Highly Recommended";
      } else if (score >= 8.0) {
        overallVerdict = "Recommended";
      } else if (score >= 6.0) {
        overallVerdict = "Requires Review";
      } else {
        overallVerdict = "Not Recommended";
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
