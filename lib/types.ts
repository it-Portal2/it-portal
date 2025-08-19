export type UserRole = "admin" | "developer" | "client";

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
    cloudinaryQuotationUrl?: string;
    cloudinaryDocumentationUrl?: string;
    progressType?: "task-based" | "manual"; // New field to lock tracking method
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
export type AIAnalysisStatus = "not-analyzed" | "analyzing" | "analyzed";
export type AIVerdict = "Highly Recommended" | "Recommended" | "Not Recommended" | "Requires Review";

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
