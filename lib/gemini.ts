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
  ResumeAnalysis,
} from "./types";

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
  process.env.GOOGLE_API_KEY_3 || "",
].filter((key) => key !== "");

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
      console.warn(
        `API key attempt failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
      const cleanedResponse = response
        .replace(/^```json\s*|\s*```$/g, "")
        .trim();
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

interface HolisticAssessmentResult {
  overallScore: number;
  verdict: "recommend" | "proceed-with-caution" | "not-recommended";
  resumeAlignmentScore: number;
  strengths: string[];
  weaknesses: string[];
  rationale: string;
}
// Additional type imports for the new functions
interface OriginalityAnalysisResult {
  classification:
    | "human-written"
    | "potentially-copied"
    | "likely-ai-generated";
  originalityScore: number;
  reasoning: string;
}

interface CorrectnessAnalysisResult {
  correctnessScore: number;
  reasoning: string;
}

interface HolisticAssessmentResult {
  overallScore: number;
  verdict: "recommend" | "proceed-with-caution" | "not-recommended";
  rationale: string;
}


// ✅ ROBUST JSON CLEANING FUNCTION
function cleanJsonResponse(response: string): string {
  // Remove any markdown code blocks
  let cleaned = response.replace(/```json\s*/gi, "").replace(/```\s*/g, "");

  // Remove any trailing backticks
  cleaned = cleaned.replace(/`+$/g, "");

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  // If response starts with text before JSON, try to extract JSON
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  return cleaned;
}


// Optimized Strict Originality Analysis Prompt
const ORIGINALITY_PROMPT = `
You are an expert plagiarism detector and AI content classifier. Evaluate the following Q&A pair for originality and human authenticity with STRICT standards.

Question: {question}
Answer: {answer}

EVALUATION CRITERIA:

1. CONTENT QUALITY:
   - Relevant, coherent, professional?
   - Any gibberish, random text, or abusive language?
   - Too short/vague (e.g., "I don't know", "yes/no")?

2. PLAGIARISM CHECK:
   - Exact matches with tutorials/docs?
   - Paraphrased or templated content (Stack Overflow, guides)?
   - Repetitive boilerplate or style inconsistencies?

3. AI-GENERATION SIGNS:
   - Overly polished grammar/structure.
   - Generic, non-specific examples.
   - No personal context or challenges.
   - AI filler phrases: "In conclusion", "Furthermore", "It's important to note".

4. HUMAN MARKERS:
   - Specific projects or authentic examples.
   - Natural flow with minor imperfections.
   - Unique reasoning/problem-solving steps.
   - Real learning experiences.

SCORING SCALE:
- 90–100: Strongly original, personal, authentic.
- 70–89: Mostly original, some generic parts.
- 50–69: Mix of original + templated/copied.
- 30–49: Likely copied, little originality.
- 10–29: Clearly AI/plagiarized, no authenticity.
- 0–9: Gibberish, abusive, irrelevant.

CLASSIFICATION:
- "human-written": Score ≥70, authentic human voice.
- "potentially-copied": Score 30–69, templated or familiar phrasing.
- "likely-ai-generated": Score 0–29, or gibberish/irrelevant.

OUTPUT JSON ONLY:
{
  "classification": "[human-written/potentially-copied/likely-ai-generated]",
  "originalityScore": [0-100],
  "reasoning": "EXPLANATION (≤80 words): Specific evidence: copied phrases if any, AI style markers, quality/authenticity checks, and justification of score also if you find source add source."
}
`;

// Strict Correctness Analysis Prompt

const CORRECTNESS_PROMPT = `
You are an expert interviewer and evaluator with senior-level expertise across technical, behavioral, scenario-based, and leadership assessments. 
Evaluate the given answer STRICTLY by the type of question.

Question: {question}
Answer: {answer}

QUESTION TYPES & FOCUS:
- Technical: Correctness, accuracy, best practices, implementation depth.
- Behavioral: Authenticity, STAR structure (Situation, Task, Action, Result), self-awareness.
- Scenario: Reasoning clarity, problem-solving, trade-offs, feasibility.
- Leadership: Vision, team management, empathy, accountability, decision impact.

EVALUATION CRITERIA:

1. CONTENT VALIDITY: Is it relevant, meaningful, non-gibberish?
2. ACCURACY & RELEVANCE: Correctness depends on type (tech/behavioral/scenario/leadership).
3. COMPLETENESS: Covers key aspects with enough detail?
4. PRACTICALITY & AUTHENTICITY: Realistic, experience-driven, not generic.
5. COMMUNICATION: Clear, structured, professional, logical flow. STAR visible when applicable.

SCORING (STRICT):
- 9.0–10.0: Exceptional, comprehensive, insightful.
- 8.0–8.9: Excellent, strong, minor gaps.
- 7.0–7.9: Good, adequate, lacks some depth.
- 6.0–6.9: Acceptable, partial coverage.
- 4.0–5.9: Below average, weak or generic.
- 2.0–3.9: Poor, irrelevant or flawed.
- 0.0–1.9: Unacceptable, gibberish or inappropriate.

PENALTIES:
- Gibberish/random: 0.0
- Abusive: 0.0
- "I don’t know": max 1.0
- Irrelevant: max 0.5
- Major misconceptions: max 3.0

IMPORTANT: Return ONLY the JSON object below. Do NOT use markdown code blocks or backticks.
OUTPUT FORMAT (JSON ONLY):
{
  "correctnessScore": [0.0-10.0],
  "reasoning": "DETAILED ANALYSIS (≤80 words): Specific evidence tied to the question type. Point out strengths, weaknesses, and justify score."
}
`;

//  Comprehensive Holistic Assessment Prompt
// Optimized Comprehensive Holistic Assessment Prompt
const HOLISTIC_ASSESSMENT_PROMPT = `
You are a senior hiring manager with 15+ years of experience. Perform a STRICT holistic evaluation of the candidate across Technical, Behavioral, Scenario-based, and Leadership aspects.

Candidate Resume Summary:
Education: {education}
Experience: {experience}
Skills: {skills}
Professional Summary: {summary}

Question-Answer Analysis Results:
{analysisResults}

ASSESSMENT CRITERIA:

1. TECHNICAL COMPETENCY:
   - Depth, correctness, and real-world application.
   - Alignment of answers with claimed experience/skills.

2. AUTHENTICITY:
   - No plagiarism or templated/AI signs.
   - Consistent personal voice, realistic experiences.

3. BEHAVIORAL & SOFT SKILLS:
   - Clear communication, STAR usage.
   - Emotional intelligence, adaptability, confidence.

4. PROBLEM-SOLVING & DECISION-MAKING:
   - Scenario: structured, logical, creative.
   - Leadership: vision, accountability, people-focus.
   - Handles trade-offs and risks.

5. PROFESSIONALISM:
   - Respectful, clear tone.
   - Can explain to both technical & non-technical.

6. ROLE FIT:
   - Skills + mindset vs job needs.
   - Balance of hard/soft skills.
   - Growth potential, cultural fit.

SCORING:
- 9.0–10.0: Exceptional – Strong across all areas
- 8.0–8.9: Strong – Very good overall, minor gaps
- 7.0–7.9: Solid – Adequate, some concerns
- 6.0–6.9: Average – Meets basics, multiple improvement needs
- 4.0–5.9: Below expectations – Major concerns
- 2.0–3.9: Poor – Serious red flags
- 0.0–1.9: Unacceptable – Plagiarism, gibberish, or no relevant skills

VERDICT:
- "recommend": ≥8.0, authentic, strong technical + soft skills
- "proceed-with-caution": 6.0–7.9, potential with concerns
- "not-recommended": ≤5.9, major skill/authenticity/professionalism issues

SPECIAL RULES:
- Heavy penalty: plagiarism, irrelevant/gibberish answers
- Resume vs performance must align
- Multiple weak responses = lack of preparation
- "I don’t know"/nonsense = red flag

IMPORTANT: Return ONLY the JSON object below. Do NOT use markdown code blocks or backticks:

OUTPUT JSON ONLY:
{
  "overallScore": [0.0-10.0],
  "verdict": "[recommend/proceed-with-caution/not-recommended]",
  "resumeAlignmentScore": [0-10],
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "weaknesses": ["Specific weakness 1", "Specific weakness 2"],
  "rationale": "COMPREHENSIVE ANALYSIS (≤120 words): Evidence-based explanation: how answers align with resume, technical & soft-skill performance, authenticity check, concerns/positives, and why the final verdict was given."
}
`;

// ✅ ANALYSIS FUNCTION 1: ORIGINALITY (Uses API Key 1)
export async function analyzeOriginality(candidateData: Application): Promise<{
  originalityScores: OriginalityScore[];
}> {
  try {
    // Use first API key specifically
    const apiKey = API_KEYS[0];
    if (!apiKey) {
      throw new Error("First API key not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const originalityScores: OriginalityScore[] = [];

    if (candidateData.aiQuestions && candidateData.aiQuestions.length > 0) {
      for (let i = 0; i < candidateData.aiQuestions.length; i++) {
        const qa = candidateData.aiQuestions[i];

        const prompt = ORIGINALITY_PROMPT.replace(
          "{question}",
          qa.question
        ).replace("{answer}", qa.answer);

        const result = await model.generateContent(prompt);
        const response = await result.response.text();

        const cleanedResponse = cleanJsonResponse(response);
        const analysisResult: OriginalityAnalysisResult =
          JSON.parse(cleanedResponse);

        originalityScores.push({
          question: i + 1,
          score: analysisResult.originalityScore,
          reasoning: analysisResult.reasoning,
        });
      }
    }

    return { originalityScores };
  } catch (error) {
    console.error("Error analyzing originality:", error);
    throw new Error(
      error instanceof Error
        ? `Originality analysis failed: ${error.message}`
        : "Failed to analyze originality"
    );
  }
}

// ✅ ANALYSIS FUNCTION 2: CORRECTNESS (Uses API Key 2)
export async function analyzeCorrectness(candidateData: Application): Promise<{
  correctnessScores: CorrectnessScore[];
}> {
  try {
    // Use second API key specifically
    const apiKey = API_KEYS[1];
    if (!apiKey) {
      throw new Error("Second API key not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const correctnessScores: CorrectnessScore[] = [];

    if (candidateData.aiQuestions && candidateData.aiQuestions.length > 0) {
      for (let i = 0; i < candidateData.aiQuestions.length; i++) {
        const qa = candidateData.aiQuestions[i];

        const prompt = CORRECTNESS_PROMPT.replace(
          "{question}",
          qa.question
        ).replace("{answer}", qa.answer);

        const result = await model.generateContent(prompt);
        const response = await result.response.text();

        const cleanedResponse = cleanJsonResponse(response);
        const analysisResult: CorrectnessAnalysisResult =
          JSON.parse(cleanedResponse);

        correctnessScores.push({
          question: i + 1,
          score: analysisResult.correctnessScore,
          reasoning: analysisResult.reasoning,
        });
      }
    }

    return { correctnessScores };
  } catch (error) {
    console.error("Error analyzing correctness:", error);
    throw new Error(
      error instanceof Error
        ? `Correctness analysis failed: ${error.message}`
        : "Failed to analyze correctness"
    );
  }
}

// ✅ ANALYSIS FUNCTION 3: HOLISTIC ASSESSMENT (Uses API Key 3)
export async function analyzeHolistic(
  candidateData: Application,
  originalityScores: OriginalityScore[],
  correctnessScores: CorrectnessScore[]
): Promise<{
  overallVerdict: AIVerdict;
  aiRecommendation: string;
  overallScore: number;
}> {
  try {
    // Use third API key specifically
    const apiKey = API_KEYS[2];
    if (!apiKey) {
      throw new Error("Third API key not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Prepare analysis results for the prompt
    const analysisResults =
      candidateData.aiQuestions
        ?.map(
          (qa, index) =>
            `Q${index + 1}: ${qa.question}
Originality: ${originalityScores[index]?.score || 0}/100
Correctness: ${correctnessScores[index]?.score || 0}/10
Originality Reasoning: ${originalityScores[index]?.reasoning || "N/A"}
Correctness Reasoning: ${correctnessScores[index]?.reasoning || "N/A"}`
        )
        .join("\n\n") || "No questions analyzed";

    const prompt = HOLISTIC_ASSESSMENT_PROMPT.replace(
      "{education}",
      candidateData.resumeAnalysis?.education || "N/A"
    )
      .replace(
        "{experience}",
        candidateData.resumeAnalysis?.experience || "N/A"
      )
      .replace(
        "{skills}",
        candidateData.resumeAnalysis?.skills?.join(", ") || "N/A"
      )
      .replace("{summary}", candidateData.resumeAnalysis?.summary || "N/A")
      .replace("{analysisResults}", analysisResults);

    const result = await model.generateContent(prompt);
    const response = await result.response.text();

    const cleanedResponse = cleanJsonResponse(response);
    const assessmentResult: HolisticAssessmentResult =
      JSON.parse(cleanedResponse);

    // Map verdict to AIVerdict type
    let overallVerdict: AIVerdict;
    switch (assessmentResult.verdict) {
      case "recommend":
        overallVerdict =
          assessmentResult.overallScore >= 8
            ? "Highly Recommended"
            : "Recommended";
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

    return {
      overallVerdict,
      aiRecommendation: assessmentResult.rationale,
      overallScore: assessmentResult.overallScore,
    };
  } catch (error) {
    console.error("Error performing holistic assessment:", error);
    throw new Error(
      error instanceof Error
        ? `Holistic assessment failed: ${error.message}`
        : "Failed to perform holistic assessment"
    );
  }
}
