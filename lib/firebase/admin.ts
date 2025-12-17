import { FieldValue } from "firebase-admin/firestore";
import { PaymentRecord } from "./client";
import {
  AIKeyFromDB,
  Application,
  CorrectnessScore,
  OriginalityScore,
  ProjectDocument,
} from "../types";
import { adminAuth, adminDb } from "@/firebaseAdmin";

const convertTimestamp = (data: any): any => {
  if (!data) return data;

  // Handle Firestore Timestamp
  if (
    data &&
    typeof data === "object" &&
    "seconds" in data &&
    "nanoseconds" in data
  ) {
    return new Date(data.seconds * 1000).toISOString();
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => convertTimestamp(item));
  }

  // Handle objects
  if (typeof data === "object") {
    const newData: any = {};
    for (const key in data) {
      newData[key] = convertTimestamp(data[key]);
    }
    return newData;
  }

  return data;
};

export async function acceptProject(
  projectId: string,
  deadline: string,
  finalCost: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!projectId || !deadline || !finalCost) {
      return {
        success: false,
        error: "Project ID, deadline, and final cost are required",
      };
    }

    const projectRef = adminDb.collection("Projects").doc(projectId);
    await projectRef.update({
      status: "in-progress",
      deadline: deadline,
      finalCost: finalCost,
      startDate: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error accepting project:", error);
    return { success: false, error: "Failed to accept project" };
  }
}

/**
 * Add documents to a project (quotation or developer documents)
 */
export async function addProjectDocuments(
  projectId: string,
  documentType: "quotation" | "developer",
  documents: Omit<ProjectDocument, "id" | "version">[]
): Promise<{ success: boolean; error?: string; documentIds?: string[] }> {
  try {
    if (!projectId || !documents || documents.length === 0) {
      return {
        success: false,
        error: "Project ID and documents are required",
      };
    }

    console.log(
      `Adding ${documents.length} ${documentType} documents to project: ${projectId}`
    );

    const projectRef = adminDb.collection("Projects").doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    const projectData = projectDoc.data();
    const fieldName =
      documentType === "quotation"
        ? "quotationDocuments"
        : "developerDocuments";
    const existingDocuments = projectData?.[fieldName] || [];

    // Generate unique IDs and version numbers for new documents
    const newDocuments: ProjectDocument[] = documents.map((doc, index) => {
      const documentId = `${documentType}_${Date.now()}_${index}`;

      return {
        ...doc,
        id: documentId,
      };
    });

    // Update the project with new documents
    await projectRef.update({
      [fieldName]: FieldValue.arrayUnion(...newDocuments),
    });

    console.log(
      `Successfully added ${newDocuments.length} documents to project: ${projectId}`
    );

    return {
      success: true,
      documentIds: newDocuments.map((doc) => doc.id),
    };
  } catch (error) {
    console.error("Error adding project documents:", error);
    return { success: false, error: "Failed to add documents to project" };
  }
}

/**
 * Remove a document from a project
 */
export async function removeProjectDocument(
  projectId: string,
  documentType: "quotation" | "developer",
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!projectId || !documentId) {
      return {
        success: false,
        error: "Project ID and document ID are required",
      };
    }

    console.log(
      `Removing ${documentType} document ${documentId} from project: ${projectId}`
    );

    const projectRef = adminDb.collection("Projects").doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    const projectData = projectDoc.data();
    const fieldName =
      documentType === "quotation"
        ? "quotationDocuments"
        : "developerDocuments";
    const existingDocuments = projectData?.[fieldName] || [];

    // Find the document to remove
    const documentToRemove = existingDocuments.find(
      (doc: ProjectDocument) => doc.id === documentId
    );

    if (!documentToRemove) {
      return {
        success: false,
        error: "Document not found",
      };
    }

    // Remove the document
    await projectRef.update({
      [fieldName]: FieldValue.arrayRemove(documentToRemove),
    });

    console.log(
      `Successfully removed document ${documentId} from project: ${projectId}`
    );

    return { success: true };
  } catch (error) {
    console.error("Error removing project document:", error);
    return { success: false, error: "Failed to remove document from project" };
  }
}

export async function rejectProject(
  projectId: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!projectId || !rejectionReason) {
      return {
        success: false,
        error: "Project ID and rejection reason are required",
      };
    }

    const projectRef = adminDb.collection("Projects").doc(projectId);
    await projectRef.update({
      status: "rejected",
      rejectionReason: rejectionReason,
      rejectedDate: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error rejecting project:", error);
    return { success: false, error: "Failed to reject project" };
  }
}

export async function completeProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!projectId) {
      return {
        success: false,
        error: "Project ID is required",
      };
    }

    const projectRef = adminDb.collection("Projects").doc(projectId);
    await projectRef.update({
      status: "completed",
      progress: 100,
      endDate: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error completing project:", error);
    return { success: false, error: "Failed to complete project" };
  }
}

export async function restoreProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!projectId) {
      return {
        success: false,
        error: "Project ID is required",
      };
    }

    const projectRef = adminDb.collection("Projects").doc(projectId);
    await projectRef.update({
      status: "pending",
      rejectionReason: null, // Clear the rejection reason
      rejectedDate: null, // Clear the rejected date
    });

    return { success: true };
  } catch (error) {
    console.error("Error restoring project:", error);
    return { success: false, error: "Failed to restore project" };
  }
}

export async function deleteProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!projectId) {
      return {
        success: false,
        error: "Project ID is required",
      };
    }

    await adminDb.collection("Projects").doc(projectId).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

export interface PaymentDetails {
  uid: string;
  upi: {
    upiId: string;
    qrCodeUrl: string;
  };
  paypal: {
    email: string;
    accountName: string;
    paypalLink: string;
  };
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branchName: string;
  };
  crypto: {
    walletAddress: string;
    network: string;
    qrCodeUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

export async function savePaymentDetails(
  uid: string,
  paymentType: "upi" | "paypal" | "bankDetails" | "crypto",
  paymentData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid || !paymentType || !paymentData) {
      return {
        success: false,
        error: "User ID, payment type, and payment data are required",
      };
    }

    const paymentRef = adminDb.collection("PaymentDetails").doc(uid);
    const paymentDoc = await paymentRef.get();

    const currentTime = new Date().toISOString();

    if (paymentDoc.exists) {
      await paymentRef.update({
        [paymentType]: paymentData,
        updatedAt: currentTime,
      });
    } else {
      const newPaymentDetails: Partial<PaymentDetails> = {
        uid: uid,
        upi: { upiId: "", qrCodeUrl: "" },
        paypal: { email: "", accountName: "", paypalLink: "" },
        bankDetails: {
          accountHolderName: "",
          accountNumber: "",
          bankName: "",
          ifscCode: "",
          branchName: "",
        },
        crypto: {
          walletAddress: "",
          network: "",
          qrCodeUrl: "",
        },
        createdAt: currentTime,
        updatedAt: currentTime,
      };

      newPaymentDetails[paymentType] = paymentData;

      await paymentRef.set(newPaymentDetails);
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving payment details:", error);
    return { success: false, error: "Failed to save payment details" };
  }
}

export async function updatePaymentDetails(
  uid: string,
  updates: Partial<PaymentDetails>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid || !updates) {
      return {
        success: false,
        error: "User ID and updates are required",
      };
    }

    const paymentRef = adminDb.collection("PaymentDetails").doc(uid);
    await paymentRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating payment details:", error);
    return { success: false, error: "Failed to update payment details" };
  }
}

export async function deletePaymentDetails(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    await adminDb.collection("PaymentDetails").doc(uid).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting payment details:", error);
    return { success: false, error: "Failed to delete payment details" };
  }
}

export async function deletePaymentMethod(
  uid: string,
  paymentType: "upi" | "paypal" | "bankDetails" | "crypto"
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid || !paymentType) {
      return {
        success: false,
        error: "User ID and payment type are required",
      };
    }

    const paymentRef = adminDb.collection("PaymentDetails").doc(uid);

    let resetData: any = {};

    switch (paymentType) {
      case "upi":
        resetData = {
          upi: { upiId: "", qrCodeUrl: "" },
          updatedAt: new Date().toISOString(),
        };
        break;
      case "paypal":
        resetData = {
          paypal: { email: "", accountName: "" },
          updatedAt: new Date().toISOString(),
        };
        break;
      case "bankDetails":
        resetData = {
          bankDetails: {
            accountHolderName: "",
            accountNumber: "",
            bankName: "",
            ifscCode: "",
            branchName: "",
          },
          updatedAt: new Date().toISOString(),
        };
        break;
      case "crypto":
        resetData = {
          crypto: {
            walletAddress: "",
            network: "",
            qrCodeUrl: "",
          },
          updatedAt: new Date().toISOString(),
        };
        break;
    }

    await paymentRef.update(resetData);

    return { success: true };
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return { success: false, error: "Failed to delete payment method" };
  }
}

export async function getAllPaymentRecords(): Promise<PaymentRecord[]> {
  try {
    const paymentRef = adminDb.collection("ClientPaymentDetails");
    const querySnapshot = await paymentRef.get();
    const paymentRecords: PaymentRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      paymentRecords.push({
        id: doc.id,
        ...data,
      } as PaymentRecord);
    });

    return paymentRecords;
  } catch (error) {
    console.error("Error fetching all payment records:", error);
    return []; // Return empty array on error
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  status: "pending" | "verified" | "rejected"
) {
  try {
    const paymentRef = adminDb
      .collection("ClientPaymentDetails")
      .doc(paymentId);
    await paymentRef.update({
      status: status,
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
}

/**
 * Get all applications from Firebase
 */
export async function getAllApplications() {
  try {
    const applicationsRef = adminDb.collection("applications");
    const querySnapshot = await applicationsRef
      .orderBy("createdAt", "desc")
      .get();
    const applications: Application[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        id: doc.id,
        ...convertTimestamp(data),
      } as Application);
    });

    return applications;
  } catch (error) {
    console.error("Error fetching all applications:", error);
    return [];
  }
}

/**
 * Get application details by ID
 */
export async function getApplicationById(applicationId: string) {
  try {
    if (!applicationId) {
      return {
        success: false,
        error: "Application ID is required",
      };
    }

    const applicationRef = adminDb
      .collection("applications")
      .doc(applicationId);
    const applicationSnap = await applicationRef.get();

    if (applicationSnap.exists) {
      const data = applicationSnap.data();
      return {
        id: applicationSnap.id,
        ...convertTimestamp(data),
      } as Application;
    } else {
      throw new Error("Application not found");
    }
  } catch (error) {
    console.error("Error fetching application:", error);
    throw error;
  }
}

/**
 * Get applications filtered by status
 * @param status - Application status to filter by
 * @returns Promise<Application[]> - Array of filtered applications
 */
export async function getApplicationsByStatus(
  status: "Pending" | "Accepted" | "Rejected"
): Promise<Application[]> {
  try {
    const applicationsRef = adminDb.collection("applications");
    const querySnapshot = await applicationsRef
      .where("applicationStatus", "==", status)
      .orderBy("createdAt", "desc")
      .get();

    const applications: Application[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        id: doc.id,
        ...convertTimestamp(data),
      } as Application);
    });

    return applications;
  } catch (error) {
    console.error(`Error fetching applications with status ${status}:`, error);
    return [];
  }
}

/**
 * Delete application
 * @param applicationId - The ID of the application to delete
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function deleteApplication(
  applicationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!applicationId) {
      return {
        success: false,
        error: "Application ID is required",
      };
    }

    await adminDb.collection("applications").doc(applicationId).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting application:", error);
    return { success: false, error: "Failed to delete application" };
  }
}
/**
 * Update application status
 * @param applicationId - The ID of the application
 * @param status - The status to update ("Accepted" | "Rejected"  etc.)
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: "Accepted" | "Rejected"
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!applicationId) {
      return {
        success: false,
        error: "Application ID is required",
      };
    }

    const applicationRef = adminDb
      .collection("applications")
      .doc(applicationId);
    await applicationRef.update({
      applicationStatus: status,
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating application status:", error);
    return { success: false, error: "Failed to update application status" };
  }
}

/**
 * Update AI analysis for application
 * @param applicationId - The ID of the application
 * @param aiAnalysis - The AI analysis data
 * @param overallScore - Overall score from AI analysis
 * @returns Promise<{ success: boolean; error?: string }>
 */

export async function updateApplicationOriginality(
  applicationId: string,
  originalityScores: OriginalityScore[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!applicationId || !originalityScores) {
      return {
        success: false,
        error: "Application ID and originality scores are required",
      };
    }

    const applicationRef = adminDb
      .collection("applications")
      .doc(applicationId);
    await applicationRef.update({
      "aiAnalysis.originalityScores": originalityScores,
      aiAnalysisStatus: "originality-complete",
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating originality scores:", error);
    return { success: false, error: "Failed to update originality scores" };
  }
}

export async function updateApplicationCorrectness(
  applicationId: string,
  correctnessScores: CorrectnessScore[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!applicationId || !correctnessScores) {
      return {
        success: false,
        error: "Application ID and correctness scores are required",
      };
    }

    const applicationRef = adminDb
      .collection("applications")
      .doc(applicationId);
    await applicationRef.update({
      "aiAnalysis.correctnessScores": correctnessScores,
      aiAnalysisStatus: "correctness-complete",
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating correctness scores:", error);
    return { success: false, error: "Failed to update correctness scores" };
  }
}

/**
 * Update AI analysis for application
 * @param applicationId - The ID of the application
 * @param aiAnalysis - The AI analysis data
 * @param overallScore - Overall score from AI analysis
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function updateApplicationAIAnalysis(
  applicationId: string,
  aiAnalysis: any,
  overallScore: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!applicationId || !aiAnalysis || overallScore === undefined) {
      return {
        success: false,
        error: "Application ID, AI analysis, and overall score are required",
      };
    }

    const applicationRef = adminDb
      .collection("applications")
      .doc(applicationId);
    await applicationRef.update({
      aiAnalysis: aiAnalysis,
      overallScore: overallScore,
      aiAnalysisStatus: "analyzed",
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating AI analysis:", error);
    return { success: false, error: "Failed to update AI analysis" };
  }
}

/**
 * Update application with career recommendations
 */
export async function updateApplicationCareerRecommendations(
  applicationId: string,
  careerRecommendations: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!applicationId || !Array.isArray(careerRecommendations)) {
      return {
        success: false,
        error:
          "Valid application ID and career recommendations array are required",
      };
    }

    const applicationRef = adminDb
      .collection("applications")
      .doc(applicationId);
    await applicationRef.update({
      careerRecommendations,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating career recommendations:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: `Failed to update career recommendations: ${errorMessage}`,
    };
  }
}

// Subadmin Management Functions
export interface SubadminProfile {
  uid: string;
  email: string;
  password: string; // Store for viewing purposes
  name: string;
  role: "subadmin";
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  createdBy: string;
}

/**
 * Create a new subadmin user
 */
export async function createSubadmin(
  email: string,
  password: string,
  name: string,
  createdBy: string
): Promise<{ success: boolean; error?: string; uid?: string }> {
  try {
    if (!email || !password || !name || !createdBy) {
      return {
        success: false,
        error: "Email, password, name, and createdBy are required",
      };
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      disabled: false,
    });

    // Set custom claims - subadmin role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "subadmin" });

    // Revoke refresh tokens to force immediate token refresh
    await adminAuth.revokeRefreshTokens(userRecord.uid);

    // Create user profile in Firestore
    const subadminProfile: SubadminProfile = {
      uid: userRecord.uid,
      email,
      password, // Store password for admin viewing
      name,
      role: "subadmin",
      isActive: true,
      avatar: "",
      createdAt: new Date().toISOString(),
      lastLogin: "Never",
      createdBy,
    };

    await adminDb.collection("users").doc(userRecord.uid).set(subadminProfile);

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating subadmin:", error);

    // Handle specific Firebase Auth errors
    if (error.code === "auth/email-already-exists") {
      return { success: false, error: "Email already exists" };
    }
    if (error.code === "auth/weak-password") {
      return { success: false, error: "Password is too weak" };
    }
    if (error.code === "auth/invalid-email") {
      return { success: false, error: "Invalid email format" };
    }

    return { success: false, error: "Failed to create subadmin" };
  }
}

/**
 * Get all subadmins
 */
export async function getAllSubadmins(): Promise<SubadminProfile[]> {
  try {
    const usersRef = adminDb.collection("users");
    const querySnapshot = await usersRef.where("role", "==", "subadmin").get();
    const subadmins: SubadminProfile[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      subadmins.push({
        uid: doc.id,
        ...data,
      } as SubadminProfile);
    });

    return subadmins;
  } catch (error) {
    console.error("Error fetching subadmins:", error);
    return [];
  }
}

/**
 * Update subadmin profile
 */
export async function updateSubadmin(
  uid: string,
  updates: {
    email?: string;
    password?: string;
    name?: string;
    avatar?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid) {
      return {
        success: false,
        error: "UID is required",
      };
    }

    const updateData: any = {
      ...updates,
      lastLogin: new Date().toISOString(),
    };

    // Update Firebase Auth if email, name, or password is being changed
    const authUpdates: any = {};
    if (updates.email) authUpdates.email = updates.email;
    if (updates.name) authUpdates.displayName = updates.name;
    if (updates.password) authUpdates.password = updates.password;

    if (Object.keys(authUpdates).length > 0) {
      await adminAuth.updateUser(uid, authUpdates);
    }

    // Revoke refresh tokens to apply changes immediately
    await adminAuth.revokeRefreshTokens(uid);

    // Update Firestore document
    const userRef = adminDb.collection("users").doc(uid);
    await userRef.update(updateData);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating subadmin:", error);

    if (error.code === "auth/email-already-exists") {
      return { success: false, error: "Email already exists" };
    }
    if (error.code === "auth/invalid-email") {
      return { success: false, error: "Invalid email format" };
    }

    return { success: false, error: "Failed to update subadmin" };
  }
}

/**
 * Toggle subadmin active status
 */
export async function toggleSubadminStatus(
  uid: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid) {
      return {
        success: false,
        error: "UID is required",
      };
    }

    // Update Firebase Auth disabled status (opposite of isActive)
    await adminAuth.updateUser(uid, { disabled: !isActive });

    // Revoke refresh tokens to apply changes immediately
    await adminAuth.revokeRefreshTokens(uid);

    // Update Firestore document
    const userRef = adminDb.collection("users").doc(uid);
    await userRef.update({ isActive });

    return { success: true };
  } catch (error) {
    console.error("Error toggling subadmin status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

/**
 * Delete subadmin
 */
export async function deleteSubadmin(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid) {
      return {
        success: false,
        error: "UID is required",
      };
    }

    console.log(`Deleting subadmin: ${uid}`);

    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete from Firestore
    await adminDb.collection("users").doc(uid).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting subadmin:", error);
    return { success: false, error: "Failed to delete subadmin" };
  }
}

// AI Key Management Functions with unique aiID
export interface AIKey {
  docId: string; // Firestore document ID (auto-generated)
  aiID: string; // User-defined unique AI identifier
  keyName: string;
  apiKey: string;
  provider: string;
  priority: number;
  status: "active" | "inactive";
  createdAt: string;
}

/**
 * Check if aiID already exists
 */
export async function checkAIIDExists(aiID: string): Promise<boolean> {
  try {
    const aiKeysRef = adminDb.collection("aiKeys");
    const querySnapshot = await aiKeysRef.where("aiID", "==", aiID).get();
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking aiID existence:", error);
    return false;
  }
}

/**
 * Get all AI keys
 */
export async function getAllAIKeys(): Promise<AIKey[]> {
  try {
    const aiKeysRef = adminDb.collection("aiKeys");
    const querySnapshot = await aiKeysRef.orderBy("priority", "asc").get();
    const aiKeys: AIKey[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      aiKeys.push({
        docId: doc.id, // Firestore document ID
        ...data,
      } as AIKey);
    });

    return aiKeys;
  } catch (error) {
    console.error("Error fetching AI keys:", error);
    return [];
  }
}

/**
 * Create a new AI key with unique aiID validation
 */
export async function createAIKey(
  aiID: string,
  keyName: string,
  apiKey: string,
  provider: string,
  priority: number,
  status: "active" | "inactive" = "active"
): Promise<{ success: boolean; error?: string; docId?: string }> {
  try {
    if (!aiID || !keyName || !apiKey || !provider || !priority) {
      return {
        success: false,
        error: "AI ID, key name, API key, provider, and priority are required",
      };
    }

    console.log(`Creating AI key with aiID: ${aiID}`);

    // Check if aiID already exists
    const aiIDExists = await checkAIIDExists(aiID);
    if (aiIDExists) {
      return {
        success: false,
        error: `Duplicate AI ID '${aiID}' not allowed. Please use a unique AI ID.`,
      };
    }

    // Check if priority already exists
    const existingKeysRef = adminDb.collection("aiKeys");
    const prioritySnapshot = await existingKeysRef
      .where("priority", "==", priority)
      .get();

    if (!prioritySnapshot.empty) {
      return {
        success: false,
        error: `Priority ${priority} already exists. Please choose a different priority.`,
      };
    }

    const aiKeyData = {
      aiID,
      keyName,
      apiKey,
      provider,
      priority,
      status,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("aiKeys").add(aiKeyData);
    console.log(`AI key created with docId: ${docRef.id}, aiID: ${aiID}`);

    return { success: true, docId: docRef.id };
  } catch (error: any) {
    console.error("Error creating AI key:", error);
    return { success: false, error: "Failed to create AI key" };
  }
}

/**
 * Update AI key using docId
 */
export async function updateAIKey(
  docId: string,
  updates: {
    aiID?: string;
    keyName?: string;
    apiKey?: string;
    provider?: string;
    priority?: number;
    status?: "active" | "inactive";
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!docId) {
      return {
        success: false,
        error: "Document ID is required",
      };
    }

    console.log(`Updating AI key with docId: ${docId}`);

    // Check if new aiID conflicts with existing keys (if aiID is being updated)
    if (updates.aiID) {
      const existingKeysRef = adminDb.collection("aiKeys");
      const aiIDSnapshot = await existingKeysRef
        .where("aiID", "==", updates.aiID)
        .get();

      // Check if any existing key (other than current one) has this aiID
      const conflictingKey = aiIDSnapshot.docs.find((doc) => doc.id !== docId);
      if (conflictingKey) {
        return {
          success: false,
          error: `AI ID '${updates.aiID}' already exists. Please use a unique AI ID.`,
        };
      }
    }

    // Check if new priority conflicts with existing keys (if priority is being updated)
    if (updates.priority) {
      const existingKeysRef = adminDb.collection("aiKeys");
      const prioritySnapshot = await existingKeysRef
        .where("priority", "==", updates.priority)
        .get();

      // Check if any existing key (other than current one) has this priority
      const conflictingKey = prioritySnapshot.docs.find(
        (doc) => doc.id !== docId
      );
      if (conflictingKey) {
        return {
          success: false,
          error: `Priority ${updates.priority} already exists. Please choose a different priority.`,
        };
      }
    }

    const aiKeyRef = adminDb.collection("aiKeys").doc(docId);
    await aiKeyRef.update(updates);
    console.log(`AI key updated with docId: ${docId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating AI key:", error);
    return { success: false, error: "Failed to update AI key" };
  }
}

/**
 * Toggle AI key status using docId
 */
export async function toggleAIKeyStatus(
  docId: string,
  currentStatus: "active" | "inactive"
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!docId) {
      return {
        success: false,
        error: "Document ID is required",
      };
    }

    const newStatus = currentStatus === "active" ? "inactive" : "active";
    console.log(
      `Toggling status for AI key with docId: ${docId} to ${newStatus}`
    );

    const aiKeyRef = adminDb.collection("aiKeys").doc(docId);
    await aiKeyRef.update({ status: newStatus });

    console.log(`Status toggled for AI key with docId: ${docId}`);
    return { success: true };
  } catch (error) {
    console.error("Error toggling AI key status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

/**
 * Delete AI key using docId
 */
export async function deleteAIKey(
  docId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!docId) {
      return {
        success: false,
        error: "Document ID is required",
      };
    }

    console.log(`Deleting AI key with docId: ${docId}`);
    await adminDb.collection("aiKeys").doc(docId).delete();
    console.log(`AI key deleted with docId: ${docId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting AI key:", error);
    return { success: false, error: "Failed to delete AI key" };
  }
}

/**
 * Get all active AI keys optimized for Gemini API
 * Only fetches required fields: aiId, apiKey, priority, status
 */
export async function getActiveGoogleAIKeys(): Promise<AIKeyFromDB[]> {
  try {
    const aiKeysRef = adminDb.collection("aiKeys");
    const querySnapshot = await aiKeysRef
      .where("status", "==", "active")
      .where("provider", "==", "Google")
      .orderBy("priority", "asc")
      .get();

    const aiKeys: AIKeyFromDB[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Only extract required fields
      if (data.aiID && data.apiKey && typeof data.priority === "number") {
        aiKeys.push({
          aiId: data.aiID,
          apiKey: data.apiKey,
          priority: data.priority,
          status: data.status,
        });
      }
    });

    return aiKeys;
  } catch (error) {
    console.error("Error fetching AI keys:", error);
    throw new Error(
      `DATABASE_ERROR: Failed to fetch AI keys from database: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export interface ClientRecord {
  uid: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  password: string; // Store for viewing purposes
  avatar?: string | null;
  role: "client";
  createdAt: string;
  lastLogin?: string | null;
}

/**
 * Create a new client user
 */
export async function createClient(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string; uid?: string }> {
  try {
    if (!email || !password || !name) {
      return {
        success: false,
        error: "Email, password, and name are required",
      };
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      disabled: false,
    });

    // Set custom claims - client role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "client" });

    // Revoke refresh tokens to force immediate token refresh
    await adminAuth.revokeRefreshTokens(userRecord.uid);

    // Create user profile in Firestore - using "users" collection
    const clientProfile: ClientRecord = {
      uid: userRecord.uid,
      email,
      password, // Store password for admin viewing
      name,
      phone: null,
      role: "client",
      avatar: null,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    await adminDb.collection("users").doc(userRecord.uid).set(clientProfile);
    console.log(
      `Client profile created in Firestore users collection: ${userRecord.uid}`
    );

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating client:", error);

    // Handle specific Firebase Auth errors
    if (error.code === "auth/email-already-exists") {
      return { success: false, error: "Email already exists" };
    }
    if (error.code === "auth/weak-password") {
      return { success: false, error: "Password is too weak" };
    }
    if (error.code === "auth/invalid-email") {
      return { success: false, error: "Invalid email format" };
    }
    return { success: false, error: "Failed to create client" };
  }
}

/**
 * Get all clients from users collection where role is "client"
 */
export async function getAllClients(): Promise<ClientRecord[]> {
  try {
    const usersRef = adminDb.collection("users");
    const querySnapshot = await usersRef.where("role", "==", "client").get();
    const clients: ClientRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      clients.push({
        uid: doc.id,
        ...data,
      } as ClientRecord);
    });

    return clients;
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

/**
 * Update client profile in users collection
 */
export async function updateClient(
  uid: string,
  updates: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    avatar?: string;
    lastLogin?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid) {
      return {
        success: false,
        error: "UID is required",
      };
    }

    const updateData: any = { ...updates };

    // Update Firebase Auth if email, name, or password is being changed
    const authUpdates: any = {};
    if (updates.email) authUpdates.email = updates.email;
    if (updates.name) authUpdates.displayName = updates.name;
    if (updates.password) authUpdates.password = updates.password;

    if (Object.keys(authUpdates).length > 0) {
      await adminAuth.updateUser(uid, authUpdates);
    }

    // Revoke refresh tokens to apply changes immediately
    await adminAuth.revokeRefreshTokens(uid);

    // Update Firestore document in users collection
    const clientRef = adminDb.collection("users").doc(uid);
    await clientRef.update(updateData);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating client:", error);

    if (error.code === "auth/email-already-exists") {
      return { success: false, error: "Email already exists" };
    }
    if (error.code === "auth/invalid-email") {
      return { success: false, error: "Invalid email format" };
    }

    return { success: false, error: "Failed to update client" };
  }
}

/**
 * Delete client from users collection and Firebase Auth
 */
export async function deleteClient(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid) {
      return {
        success: false,
        error: "UID is required",
      };
    }

    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete from Firestore users collection
    await adminDb.collection("users").doc(uid).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: "Failed to delete client" };
  }
}

// Developer Management Functions - Using "users" collection with role filter
export interface DeveloperRecord {
  uid: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  password: string; // Store for viewing purposes
  avatar?: string | null;
  role: "developer";
  createdAt: string;
  lastLogin?: string | null;
}

/**
 * Create a new developer user
 */
export async function createDeveloper(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string; uid?: string }> {
  try {
    if (!email || !password || !name) {
      return {
        success: false,
        error: "Email, password, and name are required",
      };
    }

    console.log(`Creating developer: ${email}`);

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      disabled: false,
    });

    console.log(`User created in Firebase Auth: ${userRecord.uid}`);

    // Set custom claims - developer role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "developer" });
    console.log(`Custom claims set for: ${userRecord.uid}`);

    // Revoke refresh tokens to force immediate token refresh
    await adminAuth.revokeRefreshTokens(userRecord.uid);
    console.log(`Refresh tokens revoked for: ${userRecord.uid}`);

    // Create user profile in Firestore - using "users" collection
    const developerProfile: DeveloperRecord = {
      uid: userRecord.uid,
      email,
      password, // Store password for admin viewing
      name,
      phone: null,
      role: "developer",
      avatar: null,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    await adminDb.collection("users").doc(userRecord.uid).set(developerProfile);
    console.log(
      `Developer profile created in Firestore users collection: ${userRecord.uid}`
    );

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating developer:", error);

    // Handle specific Firebase Auth errors
    if (error.code === "auth/email-already-exists") {
      return { success: false, error: "Email already exists" };
    }
    if (error.code === "auth/weak-password") {
      return { success: false, error: "Password is too weak" };
    }
    if (error.code === "auth/invalid-email") {
      return { success: false, error: "Invalid email format" };
    }
    return { success: false, error: "Failed to create developer" };
  }
}

/**
 * Get all developers from users collection where role is "developer"
 */
export async function getAllDevelopers(): Promise<DeveloperRecord[]> {
  try {
    const usersRef = adminDb.collection("users");
    const querySnapshot = await usersRef.where("role", "==", "developer").get();
    const developers: DeveloperRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      developers.push({
        uid: doc.id,
        ...data,
      } as DeveloperRecord);
    });

    console.log(
      `Retrieved ${developers.length} developers from users collection`
    );
    return developers;
  } catch (error) {
    console.error("Error fetching developers:", error);
    return [];
  }
}

/**
 * Update developer profile in users collection
 */
export async function updateDeveloper(
  uid: string,
  updates: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    avatar?: string;
    lastLogin?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid) {
      return {
        success: false,
        error: "UID is required",
      };
    }

    console.log(`Updating developer: ${uid}`);

    const updateData: any = { ...updates };

    // Update Firebase Auth if email, name, or password is being changed
    const authUpdates: any = {};
    if (updates.email) authUpdates.email = updates.email;
    if (updates.name) authUpdates.displayName = updates.name;
    if (updates.password) authUpdates.password = updates.password;

    if (Object.keys(authUpdates).length > 0) {
      await adminAuth.updateUser(uid, authUpdates);
      console.log(`Firebase Auth updated for: ${uid}`);
    }

    // Revoke refresh tokens to apply changes immediately
    await adminAuth.revokeRefreshTokens(uid);
    console.log(`Refresh tokens revoked for updated developer: ${uid}`);

    // Update Firestore document in users collection
    const developerRef = adminDb.collection("users").doc(uid);
    await developerRef.update(updateData);
    console.log(`Firestore users collection updated for: ${uid}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating developer:", error);

    if (error.code === "auth/email-already-exists") {
      return { success: false, error: "Email already exists" };
    }
    if (error.code === "auth/invalid-email") {
      return { success: false, error: "Invalid email format" };
    }

    return { success: false, error: "Failed to update developer" };
  }
}

/**
 * Delete developer from users collection and Firebase Auth
 */
export async function deleteDeveloper(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!uid) {
      return {
        success: false,
        error: "UID is required",
      };
    }

    console.log(`Deleting developer: ${uid}`);

    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete from Firestore users collection
    await adminDb.collection("users").doc(uid).delete();

    console.log(`Developer deleted from users collection: ${uid}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting developer:", error);
    return { success: false, error: "Failed to delete developer" };
  }
}
