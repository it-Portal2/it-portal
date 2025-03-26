"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { ClientTask } from "./types";

// Type definitions
interface APIError extends Error {
  status?: number;
  headers?: Record<string, string>;
}

// Constants
const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.GOOGLE_API_KEY;

const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred";

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Generates structured project documentation using Google's Generative AI.
 * @param textContent - Raw project details provided by the client.
 * @returns Generated developer-friendly documentation in HTML format.
 */
export async function generateImprovedDocumentationFromGeminiAI(
  textContent: string
): Promise<any> {
  if (!API_KEY) {
    throw new Error("Google API key is not configured");
  }

  try {
    const PROMPT = `
      🔹 **You are an expert Project Architect & Senior Developer.**
      Your task is to **analyze, improve, and structure** the client's developer document into a **clear, comprehensive, and developer-friendly format in fully structured HTML.**

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
      - ✅ **Tables for structured data**
      - ✅ **Code snippets for setup instructions**
      - ✅ **No special characters like **, \`\`\`**

      📌 **Section Structure:**
      ✅ Each section must dynamically adjust the **number of points** based on project requirements.

      ## **🎯 AI Response: Well-Structured HTML Documentation**
      **Generate a full HTML document with styling and structure, following this format:**

      \`\`\`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Documentation</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  margin: 40px;
                  background-color: #f9f9f9;
                  padding: 20px;
              }
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

          <h1>📌 Project Documentation</h1>

          <h2>1. Project Overview</h2>
          <ul>
              <li><strong>Project Name:</strong> [Dynamically generate]</li>
              <li><strong>Main Objective:</strong> [Summarize core purpose]</li>
              <li><strong>Key Features:</strong></li>
              <ul>
                  <li>✅ [Feature 1]</li>
                  <li>✅ [Feature 2]</li>
                  <li>✅ [Feature 3] (More if needed)</li>
              </ul>
              <li><strong>Target Users:</strong> [Specify end-users]</li>
              <li><strong>Tech Stack:</strong> [Dynamically define based on project]</li>
          </ul>

          <h2>2. Project Structure</h2>
          <ul>
              <li><strong>Frontend:</strong> [Dynamically generate]</li>
              <li><strong>Backend:</strong> [Dynamically generate]</li>
              <li><strong>Database:</strong> [Dynamically define]</li>
              <li><strong>API Layer:</strong> [Dynamically describe]</li>
              <li><strong>Real-Time Features:</strong> [If applicable]</li>
          </ul>

          <h2>3. Pages & Components Breakdown</h2>

          <h3>📌 A. [Page Name]</h3>
          <ul>
              <li><strong>Purpose:</strong> [Brief explanation]</li>
              <li><strong>Features:</strong></li>
              <ul>
                  <li>✔ [Feature 1]</li>
                  <li>✔ [Feature 2]</li>
                  <li>✔ [Feature 3] (More if needed)</li>
              </ul>
          </ul>

          <h3>📌 Table Schema (if applicable)</h3>
          <table>
              <tr>
                  <th>Column Name</th>
                  <th>Data Type</th>
                  <th>Constraints</th>
              </tr>
              <tr>
                  <td>[Column 1]</td>
                  <td>[Type]</td>
                  <td>[Constraints]</td>
              </tr>
              <tr>
                  <td>[Column 2]</td>
                  <td>[Type]</td>
                  <td>[Constraints]</td>
              </tr>
          </table>

          <h3>📌 API Endpoints</h3>
          <table>
              <tr>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Description</th>
              </tr>
              <tr>
                  <td>[API Route]</td>
                  <td>GET/POST</td>
                  <td>[Functionality]</td>
              </tr>
              <tr>
                  <td>[API Route]</td>
                  <td>PUT/DELETE</td>
                  <td>[Functionality]</td>
              </tr>
          </table>

          <h2>4. Workflow Summary</h2>
          <ul>
              <li>1️⃣ <strong>Step 1:</strong> [Describe first step]</li>
              <li>2️⃣ <strong>Step 2:</strong> [Describe second step]</li>
              <li>3️⃣ <strong>Step 3:</strong> [Describe third step]</li>
          </ul>

          <h2>5. Tech Stack & Implementation</h2>
          <ul>
              <li>✔ <strong>Frontend:</strong> [Dynamically Choose]</li>
              <li>✔ <strong>Backend:</strong> [Dynamically Choose]</li>
              <li>✔ <strong>Database:</strong> [Dynamically Choose]</li>
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

    return cleanedResponse;
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
  if (!API_KEY) {
    throw new Error("Google API key is not configured");
  }

  try {
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
        - ✅ **Tables for structured data**
        - ✅ **Code snippets for setup instructions**
        - ✅ **No special characters like **, \`\`\`**
      
        📌 **Section Structure:**  
        ✅ Each section must dynamically adjust the **number of points** based on project requirements.  
      
        ## **🎯 AI Response: Well-Structured HTML Documentation**  
        **Generate a full HTML document with styling and structure, following this format:**
      
        \`\`\`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${projectName} - Project Documentation</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 40px;
                    background-color: #f9f9f9;
                    padding: 20px;
                }
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
      
            <h1>📌 ${projectName} - Project Documentation</h1>
      
            <h2>1. Project Overview</h2>
            <ul>
                <li><strong>Project Name:</strong> ${projectName}</li>
              <li><strong>Main Objective:</strong> [Summarize core purpose]</li>
              <li><strong>Key Features:</strong></li>
              <ul>
                  <li>✅ [Feature 1]</li>
                  <li>✅ [Feature 2]</li>
                  <li>✅ [Feature 3] (More if needed)</li>
              </ul>
              <li><strong>Target Users:</strong> [Specify end-users]</li>
              <li><strong>Tech Stack:</strong> [Dynamically define based on project]</li>
          </ul>
      
            <h2>2. Project Structure</h2>
            <ul>
                <li><strong>Frontend:</strong> [Dynamically generate based on project]</li>
                <li><strong>Backend:</strong> [Dynamically generate based on project]</li>
                <li><strong>Database:</strong> [Dynamically define based on project]</li>
                <li><strong>API Layer:</strong> [Dynamically describe based on project]</li>
                <li><strong>Real-Time Features:</strong> [If applicable]</li>
            </ul>
      
            <h2>3. Pages & Components Breakdown</h2>
      
            <h3>📌 A. [Page Name]</h3>
            <ul>
                <li><strong>Purpose:</strong> [Brief explanation]</li>
                <li><strong>Features:</strong></li>
                <ul>
                    <li>✔ [Feature 1]</li>
                    <li>✔ [Feature 2]</li>
                    <li>✔ [Feature 3] (More if needed)</li>
                </ul>
            </ul>
      
            <h3>📌 Table Schema (if applicable)</h3>
            <table>
                <tr>
                    <th>Column Name</th>
                    <th>Data Type</th>
                    <th>Constraints</th>
                </tr>
                <tr>
                    <td>[Column 1]</td>
                    <td>[Type]</td>
                    <td>[Constraints]</td>
                </tr>
                <tr>
                    <td>[Column 2]</td>
                    <td>[Type]</td>
                    <td>[Constraints]</td>
                </tr>
            </table>
      
            <h3>📌 API Endpoints</h3>
            <table>
                <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Description</th>
                </tr>
                <tr>
                    <td>[API Route]</td>
                    <td>GET/POST</td>
                    <td>[Functionality]</td>
                </tr>
                <tr>
                    <td>[API Route]</td>
                    <td>PUT/DELETE</td>
                    <td>[Functionality]</td>
                </tr>
            </table>
      
            <h2>4. Workflow Summary</h2>
            <ul>
                <li>1️⃣ <strong>Step 1:</strong> [Describe first step]</li>
                <li>2️⃣ <strong>Step 2:</strong> [Describe second step]</li>
                <li>3️⃣ <strong>Step 3:</strong> [Describe third step]</li>
            </ul>
      
            <h2>5. Tech Stack & Implementation</h2>
            <ul>
                <li>✔ <strong>Frontend:</strong> [Dynamically Choose]</li>
                <li>✔ <strong>Backend:</strong> [Dynamically Choose]</li>
                <li>✔ <strong>Database:</strong> [Dynamically Choose]</li>
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
    //  console.log(cleanedResponse);

    return cleanedResponse;
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
    if (!API_KEY) {
      throw new Error("Google API key is not configured");
    }
  
    try {
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
      if (!Array.isArray(tasks) || tasks.some((t) => !t.id || !t.name || typeof t.completed !== "boolean")) {
        throw new Error("Invalid task format returned by AI");
      }
  
      return tasks;
    } catch (error) {
      console.error("Task generation error:", error);
      throw new Error(`Task generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }