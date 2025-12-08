export type UserRole = "admin" | "developer" | "client" | "subadmin";

export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  phone?: string | null;
  role: UserRole;
  avatar: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  budget: number;
}

export type ProjectStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "rejected"
  | "delayed";

export type ProjectDocument = {
  id: string;
  fileName: string;
  cloudinaryUrl: string;
};

export type DocumentType = "quotation" | "developer";

export type Project = {
  id: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  projectBudget: number;
  finalCost?: number;
  status: ProjectStatus;
  deadline?: string;
  progress: number;
  submittedAt: string;
  startDate: string;
  endDate: string;
  rejectedDate: string;
  currency?: "INR" | "USD";
  rejectionReason?: string;
  projectOverview: string;

  // Legacy single document fields (keep for backward compatibility)
  cloudinaryQuotationUrl?: string;
  cloudinaryDocumentationUrl?: string;

  // New document arrays
  quotationDocuments?: ProjectDocument[];
  developerDocuments?: ProjectDocument[];

  progressType?: "task-based" | "manual" | null;
  isCompleted?: boolean; // Flag to lock edits when progress reaches 100%
  designLink: string | null; // Added design link field
  hasExistingDesign: boolean; // Added flag to track if user has existing design
};
export type ClientTask = {
  id: string;
  name: string;
  completed: boolean;
};
export type Task = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  status: "not-started" | "in-progress" | "completed";
  deadline?: string; // Optional, can be set if needed
};

// export type ProjectTask = {
//   id: string;
//   title: string;
//   description: string;
//   assignedTo: string;
//   status: "todo" | "in-progress" | "completed";
//   dueDate: any;
// };

// export type TaskStatus = "not-started" | "in-progress" | "completed";

// export interface TeamMember {
//   id: string;
//   name: string;
//   role: "developer" | "designer";
//   projectsAssigned: string[];
//   availability: "available" | "busy" | "unavailable";
//   avatar: string;
// }

// export interface Message {
//   id: string;
//   senderId: string;
//   receiverId: string;
//   content: string;
//   timestamp: string;
//   read: boolean;
// }
export interface ResumeAnalysis {
  skills: string[];
  experience: string;
  education: string;
  summary: string;
}

export interface AIQuestion {
  id: string;
  question: string;
  answer?: string;
}
export interface AnalysisResult {
  success: boolean;
  resumeAnalysis: ResumeAnalysis;
  questions: AIQuestion[];
}
export interface QuestionAndAnswer {
  id?: string;
  question: string;
  answer: string;
}

export interface OriginalityScore {
  question: number;
  score: number;
  reasoning: string;
}

export interface CorrectnessScore {
  question: number;
  score: number;
  reasoning: string;
}
export type ApplicationStatus = "Pending" | "Accepted" | "Rejected";
export type AIAnalysisStatus =
  | "not-analyzed"
  | "originality-analyzing"
  | "originality-complete"
  | "correctness-analyzing"
  | "correctness-complete"
  | "holistic-analyzing"
  | "analyzed";

export type AIVerdict =
  | "Highly Recommended"
  | "Recommended"
  | "Not Recommended"
  | "Requires Review";

export interface AIAnalysis {
  originalityScores: OriginalityScore[];
  correctnessScores: CorrectnessScore[];
  overallVerdict: AIVerdict;
  aiRecommendation: string;
}

export interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  linkedin?: string;
  applicationStatus: ApplicationStatus;
  createdAt: string;
  startDate: string;
  stipendExpectation: string;
  weeklyCommitment: string;
  trialAccepted: string;
  additionalComments?: string;
  aiAnalysisStatus: AIAnalysisStatus;
  overallScore: number | null;
  resumeAnalysis: ResumeAnalysis;
  aiQuestions?: QuestionAndAnswer[];
  aiAnalysis?: AIAnalysis | null;
  careerRecommendations?: string[];
}

// Props interface for the client component
export interface ApplicationDetailClientProps {
  applicationDetails: Application;
  error: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface InsertApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  linkedin?: string;
  applicationStatus: string;
  stipendExpectation: string;
  startDate: string;
  createdAt: string;
  weeklyCommitment: string;
  trialAccepted: string;
  overallScore: number | null;
  aiAnalysisStatus: string;
  additionalComments?: string;
  resumeAnalysis: ResumeAnalysis;
}
// AI Key Database Types
export interface AIKeyFromDB {
  aiId: string; // Unique identifier (replaces Firebase doc id)
  apiKey: string; // The actual API key
  priority: number; // Priority order (1 = highest)
  status: "active" | "inactive"; // Key status
}

// Retry Strategy Types
export interface RetryAttempt {
  keyIndex: number;
  timeout: number;
  rotation: number;
}

// Error Classification Types
export type AIErrorType =
  | "timeout"
  | "auth"
  | "quota"
  | "network"
  | "parsing"
  | "validation"
  | "database"
  | "configuration"
  | "unknown";

export interface ClassifiedError {
  type: AIErrorType;
  shouldRetryImmediately: boolean;
  userMessage: string;
  technicalMessage: string;
  originalError: Error;
}

export interface AttemptResult {
  attemptIndex: number;
  aiId: string;
  priority: number;
  rotation: number;
  errorType: AIErrorType;
  errorMessage: string;
  duration: number;
  timeout: number;
  shouldRetryImmediately: boolean;
}

// Configuration Constants
export const GEMINI_CONFIG = {
  MODEL_NAME: "gemini-2.5-flash",
  MAX_EXECUTION_TIME: 60000, // 55 seconds (Vercel Hobby plan limit is 60s)
  BASE_TIMEOUT: 50000, // 25 seconds per attempt
  MAX_TIMEOUT: 60000, // 30 seconds maximum timeout
  TIMEOUT_BUFFER: 6000, // 3 second buffer
  GENERATION_CONFIG: {
    temperature: 0.1,
    maxOutputTokens: 8192,
  } as any,
};

export const CANDIDATE_ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    questionAnalyses: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          questionId: { type: "STRING" },
          questionType: {
            type: "STRING",
            enum: ["technical", "behavioral", "scenario", "leadership"],
          },
          originalityScore: {
            type: "INTEGER",
            minimum: 0,
            maximum: 100,
          },
          originalityReasoning: { type: "STRING" },
          correctnessScore: {
            type: "NUMBER",
            minimum: 0,
            maximum: 10,
          },
          correctnessReasoning: { type: "STRING" },
          classification: {
            type: "STRING",
            enum: [
              "human-written",
              "potentially-copied",
              "likely-ai-generated",
            ],
          },
        },
        required: [
          "questionId",
          "questionType",
          "originalityScore",
          "originalityReasoning",
          "correctnessScore",
          "correctnessReasoning",
          "classification",
        ],
      },
    },
    holisticAssessment: {
      type: "OBJECT",
      properties: {
        overallScore: {
          type: "NUMBER",
          minimum: 0,
          maximum: 10,
        },
        verdict: {
          type: "STRING",
          enum: [
            "Highly Recommended",
            "Recommended",
            "Requires Review",
            "Not Recommended",
          ],
        },
        resumeAlignmentScore: {
          type: "INTEGER",
          minimum: 0,
          maximum: 10,
        },
        rationale: { type: "STRING" },
      },
      required: [
        "overallScore",
        "verdict",
        "resumeAlignmentScore",
        "rationale",
      ],
    },
  },
  required: ["questionAnalyses", "holisticAssessment"],
};
