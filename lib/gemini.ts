"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { AIAnalysis, AIVerdict, Application, ClientTask, CorrectnessScore, OriginalityScore, ResumeAnalysis } from "./types";

// Type definitions
interface APIError extends Error {
  status?: number;
  headers?: Record<string, string>;
}

// Constants
const MODEL_NAME = "gemini-2.5-flash";
const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred";

// API keys configuration
const API_KEYS = [
  process.env.GOOGLE_API_KEY_1 || "",
  process.env.GOOGLE_API_KEY_2 || "",
  process.env.GOOGLE_API_KEY_3 || ""
].filter(key => key !== "");

/**
 * Attempts to execute an AI generation function with multiple API keys
 * @param generateFunction - The function to execute with a specific API key
 * @returns The result of the successful function execution
 */
async function tryWithMultipleKeys<T>(
  generateFunction: (genAI: GoogleGenerativeAI, model: any) => Promise<T>
): Promise<T> {
  if (API_KEYS.length === 0) {
    throw new Error("No Google API keys are configured");
  }

  let lastError: Error | null = null;

  // Try each API key until one works
  for (const apiKey of API_KEYS) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      return await generateFunction(genAI, model);
    } catch (error) {
      console.warn(`API key attempt failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to the next API key
    }
  }

  // If we get here, all API keys failed
  throw lastError || new Error("All API keys failed without specific errors");
}

/**
 * Generates structured project documentation using Google's Generative AI.
 * @param textContent - Raw project details provided by the client.
 * @returns Generated developer-friendly documentation in HTML format.
 */
export async function generateImprovedDocumentationFromGeminiAI(
  textContent: string
): Promise<any> {
  try {
    return await tryWithMultipleKeys(async (genAI, model) => {
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
      // Remove the ```html at the start and ``` at the end
      let cleanedResponse = response.replace(/^```html\s*|\s*```$/g, "").trim();

      // Remove patterns like `*?\n\n##` and replace them with `##`
      cleanedResponse = cleanedResponse.replace(/\*?\n\n##/g, "##");

      // Further processing to remove body styling if it's still included
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
    return await tryWithMultipleKeys(async (genAI, model) => {
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

      // Remove any unnecessary AI-generated intro
      // Remove the ```html at the start and ``` at the end
      let cleanedResponse = response.replace(/^```html\s*|\s*```$/g, "").trim();

      // Remove patterns like `*?\n\n##` and replace them with `##`
      cleanedResponse = cleanedResponse.replace(/\*?\n\n##/g, "##");

      // Further processing to remove body styling if it's still included
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
    return await tryWithMultipleKeys(async (genAI, model) => {
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

      // Clean and parse the response
      const cleanedResponse = response.replace(/^```json\s*|\s*```$/g, "").trim();
      const tasks: ClientTask[] = JSON.parse(cleanedResponse);

      // Validate the parsed tasks
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
// Additional types for AI analysis

interface HolisticAssessmentResult {
  overallScore: number;
  verdict: "recommend" | "proceed-with-caution" | "not-recommended";
  resumeAlignmentScore: number;
  strengths: string[];
  weaknesses: string[];
  rationale: string;
}

interface QuestionAnalysisResult {
  questionId: string;
  question: string;
  answer: string;
  originalityScore: number;
  originalityReasoning: string;
  correctnessScore: number;
  correctnessReasoning: string;
  classification: "human-written" | "potentially-copied" | "likely-ai-generated";
}
interface HolisticAssessmentResult {
  overallScore: number;
  verdict: "recommend" | "proceed-with-caution" | "not-recommended";
  resumeAlignmentScore: number;
  strengths: string[];
  weaknesses: string[];
  rationale: string;
}

interface QuestionAnalysisResult {
  questionId: string;
  question: string;
  answer: string;
  originalityScore: number;
  originalityReasoning: string;
  correctnessScore: number;
  correctnessReasoning: string;
  classification: "human-written" | "potentially-copied" | "likely-ai-generated";
}

interface FullAIAnalysisResult {
  candidateId: string;
  questionAnalyses: QuestionAnalysisResult[];
  holisticAssessment: HolisticAssessmentResult;
  timestamp: string;
  analysisVersion: number;
}

// ✅ SINGLE COMPREHENSIVE ANALYSIS PROMPT - OPTIMIZED FOR SPEED & ACCURACY
const COMPREHENSIVE_AI_ANALYSIS_PROMPT = `
You are a senior technical hiring manager and AI content detection expert. Analyze this complete candidate application with STRICT evaluation standards.

CANDIDATE PROFILE:
Education: {education}
Experience: {experience}
Skills: {skills}
Summary: {summary}

QUESTION-ANSWER PAIRS:
{questionAnswerPairs}

PERFORM COMPREHENSIVE ANALYSIS FOR EACH Q&A PAIR:

1. ORIGINALITY & AUTHENTICITY CHECK:
- Content quality: coherent, relevant, no gibberish/abuse/unprofessional language
- Plagiarism: exact matches with tutorials/documentation, templated responses
- AI detection: perfect grammar, generic examples, common AI phrases
- Human markers: personal projects, natural flow, authentic problem-solving

2. TECHNICAL CORRECTNESS CHECK:
- Technical accuracy of facts, concepts, explanations
- Relevance and completeness addressing the question
- Practical understanding vs theoretical knowledge
- Communication clarity and professionalism

3. HOLISTIC ASSESSMENT:
- Overall technical competency alignment with resume
- Authenticity and integrity across all responses
- Communication and professionalism standards
- Role suitability and growth potential

STRICT SCORING:
Originality: 0-100 (90-100: clearly original, 70-89: mostly original, 50-69: mixed, 30-49: likely copied, 0-29: plagiarized/AI/gibberish)
Correctness: 0.0-10.0 (9.0-10.0: exceptional, 8.0-8.9: excellent, 7.0-7.9: good, 6.0-6.9: acceptable, 4.0-5.9: below average, 2.0-3.9: poor, 0.0-1.9: unacceptable)
Overall: 0.0-10.0 based on combined performance

CLASSIFICATION RULES:
- "human-written": Score 70+, shows personal experience, authentic voice
- "potentially-copied": Score 30-69, templated responses
- "likely-ai-generated": Score 0-29, or gibberish/inappropriate content

VERDICT MAPPING:
- "recommend": Score 8.0+, high authenticity, strong technical skills
- "proceed-with-caution": Score 6.0-7.9, some concerns but potential
- "not-recommended": Score 0.0-5.9, significant issues

CRITICAL: Return ONLY valid JSON without markdown blocks, backticks, or code formatting:

{
  "questionAnalyses": [
    {
      "questionId": "q1",
      "question": "actual question text",
      "answer": "actual answer text",
      "originalityScore": 0-100,
      "originalityReasoning": "specific evidence and analysis",
      "correctnessScore": 0.0-10.0,
      "correctnessReasoning": "technical accuracy assessment",
      "classification": "human-written/potentially-copied/likely-ai-generated"
    }
  ],
  "holisticAssessment": {
    "overallScore": 0.0-10.0,
    "verdict": "recommend/proceed-with-caution/not-recommended",
    "resumeAlignmentScore": 0-10,
    "strengths": ["specific strength 1", "specific strength 2"],
    "weaknesses": ["specific weakness 1", "specific weakness 2"],
    "rationale": "comprehensive analysis explaining verdict with specific evidence"
  }
}
`;

// ✅ ROBUST JSON CLEANING FUNCTION
function cleanJsonResponse(response: string): string {
  // Remove any markdown code blocks
  let cleaned = response.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  // Remove any trailing backticks
  cleaned = cleaned.replace(/`+$/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // If response starts with text before JSON, try to extract JSON
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  return cleaned;
}

/**
 * ✅ SINGLE OPTIMIZED FUNCTION - Complete AI Analysis in One Call
 */
export async function analyzeCompleteApplicationOptimized(candidateData: Application): Promise<{
  aiAnalysis: AIAnalysis;
  overallScore: number;
}> {
  try {
    return await tryWithMultipleKeys(async (genAI, model) => {
      // Prepare question-answer pairs for the prompt
      const questionAnswerPairs = candidateData.aiQuestions?.map((qa, index) => 
        `Q${index + 1}: ${qa.question}\nA${index + 1}: ${qa.answer}`
      ).join('\n\n') || "No questions answered";

      const prompt = COMPREHENSIVE_AI_ANALYSIS_PROMPT
        .replace("{education}", candidateData.resumeAnalysis?.education || "N/A")
        .replace("{experience}", candidateData.resumeAnalysis?.experience || "N/A")
        .replace("{skills}", candidateData.resumeAnalysis?.skills?.join(", ") || "N/A")
        .replace("{summary}", candidateData.resumeAnalysis?.summary || "N/A")
        .replace("{questionAnswerPairs}", questionAnswerPairs);

      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      
      // ✅ IMPROVED JSON PARSING with robust cleaning
      const cleanedResponse = cleanJsonResponse(response);
      
      let analysisResult: FullAIAnalysisResult;
      try {
        analysisResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Cleaned Response:", cleanedResponse);
        console.error("Original Response:", response);
        throw new Error("Failed to parse AI analysis response as JSON");
      }

      // Convert to existing AIAnalysis format
      const originalityScores: OriginalityScore[] = analysisResult.questionAnalyses.map((analysis, index) => ({
        question: index + 1,
        score: analysis.originalityScore,
        reasoning: analysis.originalityReasoning,
      }));

      const correctnessScores: CorrectnessScore[] = analysisResult.questionAnalyses.map((analysis, index) => ({
        question: index + 1,
        score: analysis.correctnessScore,
        reasoning: analysis.correctnessReasoning,
      }));

      // Map verdict to AIVerdict type
      let overallVerdict: AIVerdict;
      switch (analysisResult.holisticAssessment.verdict) {
        case "recommend":
          overallVerdict = analysisResult.holisticAssessment.overallScore >= 8 ? "Highly Recommended" : "Recommended";
          break;
        case "proceed-with-caution":
          overallVerdict = "Requires Review";
          break;
        case "not-recommended":
          overallVerdict = "Not Recommended";
          break;
        default:
          overallVerdict = "Requires Review";
      }

      const aiAnalysis: AIAnalysis = {
        originalityScores,
        correctnessScores,
        overallVerdict,
        aiRecommendation: analysisResult.holisticAssessment.rationale,
      };

      return {
        aiAnalysis,
        overallScore: analysisResult.holisticAssessment.overallScore,
      };
    });
  } catch (error) {
    console.error("Error analyzing complete application:", error);
    throw new Error(
      error instanceof Error 
        ? `AI Analysis failed: ${error.message}` 
        : "Failed to analyze complete application"
    );
  }
}

