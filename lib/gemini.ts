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


// Interfaces

interface APIError extends Error {
  status?: number;
  headers?: Record<string, string>;
}

// interface HolisticAssessmentResult {
//   overallScore: number; 
//   verdict: "recommend" | "proceed-with-caution" | "not-recommended";
//   resumeAlignmentScore: number; 
//   rationale: string; 
// }

// interface QuestionAnalysisResult {
//   questionId: string;
//   question: string;
//   answer: string;
//   questionType: "technical" | "behavioral" | "scenario" | "leadership";
//   originalityScore: number; 
//   originalityReasoning: string;
//   correctnessScore: number; 
//   correctnessReasoning: string;
//   classification:
//     | "human-written"
//     | "potentially-copied"
//     | "likely-ai-generated";
// }


// Enhanced Constants with Generous Timeout Strategy

const MODEL_NAME = "gemini-2.0-flash";
const MAX_EXECUTION_TIME = 55000; // 55s total limit 

// Progressive timeout strategy - start generous, then increase
const FIRST_TIMEOUT = 25000; 
const SECOND_TIMEOUT = 30000; 
const FINAL_TIMEOUT = 40000; 
const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred";
// Progressive timeout strategy array
const TIMEOUT_STRATEGY = [FIRST_TIMEOUT, SECOND_TIMEOUT, FINAL_TIMEOUT];

// API keys with health tracking
const API_KEYS = [
  process.env.GOOGLE_API_KEY_1 || "",
  process.env.GOOGLE_API_KEY_2 || "",
  process.env.GOOGLE_API_KEY_3 || "",
].filter((key) => key !== "");

// Enhanced Timeout Wrapper with Better Error Context

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  context: string = "Operation"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`${context} timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
  return Promise.race([promise, timeoutPromise]);
}

// Smart Retry Strategy with Progressive Generous Timeouts

async function tryWithMultipleKeysOptimized<T>(
  generateFunction: (genAI: GoogleGenerativeAI, model: any) => Promise<T>
): Promise<T> {
  if (API_KEYS.length === 0) {
    throw new Error("No Google API keys are configured");
  }

  const startTime = Date.now();
  let lastError: Error | null = null;
  const attemptResults: Array<{
    keyIndex: number;
    error: string;
    duration: number;
    timeout: number;
  }> = [];

  for (let i = 0; i < API_KEYS.length; i++) {
    const attemptStartTime = Date.now();
    const timeElapsed = attemptStartTime - startTime;

    // Get timeout for this attempt (25s -> 30s -> 40s)
    const timeoutForAttempt = TIMEOUT_STRATEGY[i] || FINAL_TIMEOUT;

    // Check if we have enough time for this attempt (with 3s buffer)
    if (timeElapsed > MAX_EXECUTION_TIME - timeoutForAttempt - 3000) {
      console.warn(
        `⏰ Skipping API key ${
          i + 1
        } due to insufficient time. Elapsed: ${timeElapsed}ms, Need: ${timeoutForAttempt}ms`
      );
      break;
    }

    const apiKey = API_KEYS[i];

    try {
      console.log(
        `🔄 Attempting API key ${i + 1}/${
          API_KEYS.length
        } (generous timeout: ${timeoutForAttempt}ms, elapsed: ${timeElapsed}ms)`
      );

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          temperature: 0.1,
          // Keep consistent token count since we're using generous timeouts
          maxOutputTokens: 5120,
        },
      });

      const result = await withTimeout(
        generateFunction(genAI, model),
        timeoutForAttempt,
        `API key ${i + 1} (${timeoutForAttempt}ms timeout)`
      );

     // const totalTime = Date.now() - startTime;
      // console.log(
      //   `✅ Success with API key ${i + 1} in ${
      //     Date.now() - attemptStartTime
      //   }ms (total: ${totalTime}ms)`
      // );
      return result;
    } catch (error) {
      const attemptDuration = Date.now() - attemptStartTime;
   //   const totalElapsed = Date.now() - startTime;

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      attemptResults.push({
        keyIndex: i + 1,
        error: errorMessage,
        duration: attemptDuration,
        timeout: timeoutForAttempt,
      });

      // console.warn(
      //   `❌ API key ${
      //     i + 1
      //   } failed in ${attemptDuration}ms (timeout: ${timeoutForAttempt}ms, total: ${totalElapsed}ms): ${errorMessage}`
      // );

      lastError = error instanceof Error ? error : new Error(String(error));

      // Quick decision: if this was a timeout and we have more keys, continue immediately
      if (errorMessage.includes("timed out") && i < API_KEYS.length - 1) {
        console.log(` Moving to next API key immediately due to timeout...`);
        continue;
      }

      // For non-timeout errors, add a small delay before retry
      if (i < API_KEYS.length - 1) {
        console.log(` Waiting 1s before trying next API key...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Enhanced error context with timeout information
  const summaryError = `All ${
    API_KEYS.length
  } API keys failed. Attempts: ${attemptResults
    .map(
      (r) =>
        `Key${r.keyIndex}(${r.duration}ms/${r.timeout}ms: ${
          r.error.includes("timed out") ? "TIMEOUT" : r.error.split(" ")[0]
        })`
    )
    .join(", ")}`;

  console.error(`Final failure summary: ${summaryError}`);
  throw lastError || new Error(summaryError);
}

// ===============================
// Enhanced Main Analysis Function
// ===============================
export async function analyzeCompleteApplicationOptimized(
  candidateData: Application
): Promise<{
  aiAnalysis: AIAnalysis;
  overallScore: number;
}> {
  const analysisStartTime = Date.now();

  try {
    // Pre-validation
    if (!candidateData.aiQuestions || candidateData.aiQuestions.length === 0) {
      throw new Error("No questions available for analysis");
    }

    if (!validateQuestionStructure(candidateData.aiQuestions)) {
      throw new Error("Invalid question format detected");
    }

    // console.log(
    //   `🚀 Starting AI analysis for candidate: ${
    //     candidateData.fullName || "Unknown"
    //   }`
    // );
    // console.log(
    //   `📊 Analyzing ${candidateData.aiQuestions.length} Q&A pairs with generous timeouts (${FIRST_TIMEOUT}ms → ${SECOND_TIMEOUT}ms → ${FINAL_TIMEOUT}ms)`
    // );

    return await tryWithMultipleKeysOptimized(async (genAI, model) => {
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

      // Count questions by type for context
      const questionCounts =
        candidateData.aiQuestions?.reduce((acc, qa) => {
          const type = extractQuestionTypeFromId(qa.id || "");
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      // Your existing optimized prompt with word limits
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
          throw new Error("Missing required analysis sections");
        }
      } catch (parseError) {
        console.error("🔧 JSON Parse Error - attempting recovery:", parseError);
        console.error(
          "📝 Response preview:",
          cleanedResponse.substring(0, 500)
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
            throw new Error(
              `JSON parsing failed even after recovery attempts: ${recoveryError}`
            );
          }
        } else {
          throw new Error("No valid JSON structure found in AI response");
        }
      }


      // if (
      //   analysisResult.questionAnalyses.length !==
      //   (candidateData.aiQuestions?.length || 0)
      // ) {
      //   console.warn(
      //     `⚠️  Expected ${candidateData.aiQuestions?.length} analyses, got ${analysisResult.questionAnalyses.length}`
      //   );
      // }

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

      // const totalAnalysisTime = Date.now() - analysisStartTime;
      // console.log(
      //   `✅ Analysis completed successfully in ${totalAnalysisTime}ms`
      // );

      return {
        aiAnalysis,
        overallScore: score,
      };
    });
  } catch (error) {
    // const totalTime = Date.now() - analysisStartTime;
    // console.error(
    //   `❌ Error analyzing complete application after ${totalTime}ms:`,
    //   error
    // );

    // Enhanced error categorization and user-friendly messages
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("timed out")) {
        throw new Error(
          "Analysis timed out despite generous timeouts - AI service is heavily loaded. Please wait 60 seconds and try again."
        );
      } else if (
        errorMessage.includes("json") ||
        errorMessage.includes("parse")
      ) {
        throw new Error(
          " AI response processing failed. The analysis was interrupted - please retry."
        );
      } else if (
        errorMessage.includes("api key") ||
        (errorMessage.includes("all") && errorMessage.includes("failed"))
      ) {
        throw new Error(
          " All AI service endpoints temporarily unavailable. Please try again in 30-60 seconds."
        );
      } else if (
        errorMessage.includes("no questions") ||
        errorMessage.includes("invalid")
      ) {
        throw new Error(
          " Invalid application data. Please check the candidate's responses."
        );
      } else if (errorMessage.includes("no google api keys")) {
        throw new Error(
          "AI analysis service is not properly configured. Please contact support."
        );
      }
    }

    // Fallback error
    throw new Error(
      error instanceof Error
        ? `Analysis failed: ${error.message}`
        : "Analysis failed due to an unexpected error"
    );
  }
}

// Optimized JSON Cleaning

function cleanJsonResponse(response: string): string {
  // Remove markdown and code blocks efficiently
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
    console.error("Quick analysis failed:", error);
    return "Requires Review";
  }
}

//  For documentation generation...

export async function generateImprovedDocumentationFromGeminiAI(
  textContent: string
): Promise<any> {
  try {
    return await tryWithMultipleKeysOptimized(async (genAI, model) => {
      const PROMPT = `
      🔹 **You are an expert Project Architect & Senior Developer.**
      Your task is to **analyze, improve, and structure** the client's developer document into a **clear, comprehensive, and developer-friendly format in fully structured HTML.** Additionally, you will create a detailed one-month project plan, breaking down tasks, targets, and achievements for each week.

      ---

      ## 📌 **Client-Provided Developer Document**
      🔹 **Input Document:**
      \`\`\`
      ${textContent}
      \`\`\`

      ---
      📌 **Response Format:**  
          ✅ AI must return **fully structured, styled HTML** with:  
          - ✅ **Headings (h1, h2, h3)**
          - ✅ **Bullet points (ul, li)**
          - ✅ **No special characters like **, \`\`\`**
        
          📌 **Section Structure:**  
          ✅ Each section must dynamically adjust the **number of points** based on project requirements.  
        
          ## **🎯 AI Response: Well-Structured HTML Documentation**  
          **Generate content only without any body styling. The HTML will be inserted into an existing page, so do not include any styles for the body element. Follow this format:**
        
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
              /* Do not include any body styles */
          </style>
      </head>
      <body>

          <h1>📌 Project Documentation</h1>

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
        
              <h3>📌 A. [Page Name] (Add more if needed)</h3>
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
      let cleanedResponse = response.replace(/^```html\s*|\s*```$/g, "").trim();
      cleanedResponse = cleanedResponse.replace(/\*?\n\n##/g, "##");
      cleanedResponse = cleanedResponse.replace(/body\s*{[^}]*}/g, "");

      return cleanedResponse;
    });
  } catch (error) {
    console.error("Documentation generation error:", error);

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
    return await tryWithMultipleKeysOptimized(async (genAI, model) => {
      // Your existing prompt for documentation generation
      const PROMPT = `
        🔹 **You are an expert Project Architect & Senior Developer.**  
        Your task is to **analyze, improve, and structure** the client's given project name, project overview, and development areas into a **clear, comprehensive, and developer-friendly format in fully structured HTML.**  
      
        ---
      
        ## 📌 **Client-Provided Project Name**  
        🔹 **Project Name:**  
        \`\`\`
        ${projectName}
        \`\`\`
      
        ## 📌 **Client-Provided Project Overview**  
        🔹 **Project Overview:**  
        \`\`\`
        ${projectOverview}
        \`\`\`
      
        ## 📌 **Client-Provided Development Areas**  
        🔹 **Development Areas:**  
        \`\`\`
        ${developmentAreas.join(", ")}
        \`\`\`
      
        ---
        📌 **Response Format:**  
        ✅ AI must return **fully structured, styled HTML** with:  
        - ✅ **Headings (h1, h2, h3)**
        - ✅ **Bullet points (ul, li)**
        - ✅ **No special characters like **, \`\`\`**
      
        📌 **Section Structure:**  
        ✅ Each section must dynamically adjust the **number of points** based on project requirements.  
      
        ## **🎯 AI Response: Well-Structured HTML Documentation**  
        **Generate content only without any body styling. The HTML will be inserted into an existing page, so do not include any styles for the body element. Follow this format:**
      
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
                /* Do not include any body styles */
            </style>
        </head>
        <body>
      
            <h1>📌 ${projectName} - Project Documentation</h1>
      
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
      
            <h3>📌 A. [Page Name] (Add more if needed)</h3>
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

      let cleanedResponse = response.replace(/^```html\s*|\s*```$/g, "").trim();
      cleanedResponse = cleanedResponse.replace(/\*?\n\n##/g, "##");
      cleanedResponse = cleanedResponse.replace(/body\s*{[^}]*}/g, "");

      return cleanedResponse;
    });
  } catch (error) {
    console.error("Documentation generation error:", error);

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
    return await tryWithMultipleKeysOptimized(async (genAI, model) => {
      const PROMPT = `
        🔹 **You are an expert Project Architect & Senior Developer.**
        Your task is to analyze the provided developer documentation text and generate a concise, actionable list of tasks for a developer to implement the project. The tasks should be specific, clear, and focused on development work.
  
        ---
  
        ## 📌 **Input Documentation Text**
        \`\`\`
        ${textContent}
        \`\`\`
  
        ---
  
        ## 📌 **Instructions**
        - Generate a list of tasks based on the documentation.
        - Each task should be a single, actionable development step.
        - Avoid vague tasks like "Build the app" — break them into smaller, specific steps.
        - Return the response as a JSON array of objects with the following structure:
          - \`id\`: a unique string identifier (e.g., "task-1", "task-2")
          - \`name\`: a concise description of the task (e.g., "Set up Firebase authentication")
          - \`completed\`: a boolean, always set to false
  
        ## 📌 **Response Format**
        Return the tasks in this exact JSON format:
        \`\`\`json
        [
          {"id": "task-1", "name": "Set up project repository", "completed": false},
          {"id": "task-2", "name": "Design database schema", "completed": false}
        ]
        \`\`\`
  
        ---
  
        ## 🎯 **Output**
        Provide only the JSON array of tasks, with no additional text or markdown outside the JSON.
      `;

      const result = await model.generateContent(PROMPT);
      const response = await result.response.text();

      const cleanedResponse = response
        .replace(/^```json\s*|\s*```$/g, "")
        .trim();
      const tasks: ClientTask[] = JSON.parse(cleanedResponse);

      if (
        !Array.isArray(tasks) ||
        tasks.some((t) => !t.id || !t.name || typeof t.completed !== "boolean")
      ) {
        throw new Error("Invalid task format returned by AI");
      }

      return tasks;
    });
  } catch (error) {
    console.error("Task generation error:", error);
    throw new Error(
      `Task generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
