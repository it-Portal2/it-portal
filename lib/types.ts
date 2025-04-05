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
