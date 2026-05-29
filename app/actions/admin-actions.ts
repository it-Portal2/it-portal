"use server";

import { revalidatePath } from "next/cache";
import {
  acceptProject,
  completeProject,
  deleteApplication,
  deletePaymentDetails,
  deletePaymentMethod,
  deleteProject,
  getAllApplications,
  getAllPaymentRecords,
  getApplicationById,
  getApplicationsByStatus,
  rejectProject,
  restoreProject,
  savePaymentDetails,
  updateApplicationStatus,
  updatePaymentDetails,
  updatePaymentStatus,
  updateApplicationOriginality,
  updateApplicationCorrectness,
  updateApplicationAIAnalysis,
  createSubadmin,
  getAllSubadmins,
  updateSubadmin,
  toggleSubadminStatus,
  deleteSubadmin,
  getAllAIKeys,
  deleteAIKey,
  toggleAIKeyStatus,
  updateAIKey,
  createAIKey,
  updateApplicationCareerRecommendations,
  deleteClient,
  updateClient,
  getAllClients,
  createClient,
  deleteDeveloper,
  updateDeveloper,
  getAllDevelopers,
  createDeveloper,
  removeProjectDocument,
  addProjectDocuments,
  getAiConfig,
  updateAiConfig,
  getActiveGoogleAIKeys,
  getActiveOpenRouterAIKeys,
} from "@/lib/firebase/admin";
import { ProjectDocument, AiConfig } from "@/lib/types";

export async function acceptProjectAction(
  projectId: string,
  deadline: string,
  finalCost: number,
  redirectPath: string = "/admin/ongoing"
) {
  const result = await acceptProject(projectId, deadline, finalCost);

  if (result.success) {
    revalidatePath("/admin/requests");
    revalidatePath("/admin/ongoing");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function rejectProjectAction(
  projectId: string,
  rejectionReason: string,
  redirectPath: string = "/admin/rejected"
) {
  const result = await rejectProject(projectId, rejectionReason);

  if (result.success) {
    revalidatePath("/admin/requests");
    revalidatePath("/admin/rejected");
    revalidatePath(redirectPath);
  }

  return result;
}
/**
 * Add documents to project action
 */
export async function addProjectDocumentsAction(
  projectId: string,
  documentType: "quotation" | "developer",
  documents: Omit<ProjectDocument, "id" | "version">[],
  redirectPath: string = "/admin/ongoing"
) {
  const result = await addProjectDocuments(projectId, documentType, documents);

  if (result.success) {
    revalidatePath("/admin/ongoing");
    revalidatePath("/admin/completed");
    revalidatePath(`/admin/ongoing/${projectId}`);
    revalidatePath(redirectPath);
  }

  return result;
}

/**
 * Remove document from project action
 */
export async function removeProjectDocumentAction(
  projectId: string,
  documentType: "quotation" | "developer",
  documentId: string,
  redirectPath: string = "/admin/ongoing"
) {
  const result = await removeProjectDocument(
    projectId,
    documentType,
    documentId
  );

  if (result.success) {
    revalidatePath("/admin/ongoing");
    revalidatePath("/admin/completed");
    revalidatePath(`/admin/ongoing/${projectId}`);
    revalidatePath(redirectPath);
  }

  return result;
}
export async function completeProjectAction(
  projectId: string,
  redirectPath: string = "/admin/completed"
) {
  const result = await completeProject(projectId);

  if (result.success) {
    revalidatePath("/admin/ongoing");
    revalidatePath("/admin/completed");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function restoreProjectAction(
  projectId: string,
  redirectPath: string = "/admin/requests"
) {
  const result = await restoreProject(projectId);

  if (result.success) {
    revalidatePath("/admin/rejected");
    revalidatePath("/admin/requests");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function deleteProjectAction(
  projectId: string,
  redirectPath: string = "/admin/rejected"
) {
  const result = await deleteProject(projectId);

  if (result.success) {
    revalidatePath("/admin/rejected");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function savePaymentDetailsAction(
  uid: string,
  paymentType: "upi" | "paypal" | "bankDetails" | "crypto",
  paymentData: any,
  redirectPath: string = "/admin/settings"
) {
  const result = await savePaymentDetails(uid, paymentType, paymentData);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function updatePaymentDetailsAction(
  uid: string,
  updates: any,
  redirectPath: string = "/admin/settings"
) {
  const result = await updatePaymentDetails(uid, updates);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function deletePaymentDetailsAction(
  uid: string,
  redirectPath: string = "/admin/settings"
) {
  const result = await deletePaymentDetails(uid);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function deletePaymentMethodAction(
  uid: string,
  paymentType: "upi" | "paypal" | "bankDetails" | "crypto",
  redirectPath: string = "/admin/settings"
) {
  const result = await deletePaymentMethod(uid, paymentType);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

// Specific actions for each payment method
export async function saveUpiDetailsAction(
  uid: string,
  upiData: { upiId: string; qrCodeUrl: string },
  redirectPath: string = "/admin/settings"
) {
  return await savePaymentDetailsAction(uid, "upi", upiData, redirectPath);
}

export async function savePaypalDetailsAction(
  uid: string,
  paypalData: { email: string; accountName: string },
  redirectPath: string = "/admin/settings"
) {
  return await savePaymentDetailsAction(
    uid,
    "paypal",
    paypalData,
    redirectPath
  );
}

export async function saveBankDetailsAction(
  uid: string,
  bankData: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branchName: string;
  },
  redirectPath: string = "/admin/settings"
) {
  return await savePaymentDetailsAction(
    uid,
    "bankDetails",
    bankData,
    redirectPath
  );
}

export async function saveCryptoDetailsAction(
  uid: string,
  crypto: {
    walletAddress: string;
    network: string;
    qrCodeUrl: string;
  },
  redirectPath: string = "/admin/settings"
) {
  return await savePaymentDetailsAction(uid, "crypto", crypto, redirectPath);
}

// Update payment status action
export async function updatePaymentStatusAction(
  paymentId: string,
  status: "pending" | "verified" | "rejected",
  path?: "/admin/payments"
) {
  try {
    await updatePaymentStatus(paymentId, status);

    if (path) revalidatePath(path);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating payment status:", error);
    return {
      success: false,
      error: error.message || "Failed to update payment status",
    };
  }
}

// Get all payment records action (for admin)
export async function fetchAllPaymentRecordsAction(path?: "/admin/payments") {
  try {
    const paymentRecords = await getAllPaymentRecords();

    if (path) revalidatePath(path);

    return { success: true, data: paymentRecords || [] }; // Ensure data is always an array
  } catch (error: any) {
    console.error("Error fetching all payment records:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch payment records",
    };
  }
}

// Fetch all applications (with optional revalidation)
export async function fetchAllApplicationsAction(
  path?: "/admin/candidate-application"
) {
  try {
    const applications = await getAllApplications();

    if (path) revalidatePath(path);

    return { success: true, data: applications };
  } catch (error) {
    console.error("Error fetching all applications:", error);
    return { success: false, error: "Failed to fetch applications" };
  }
}

export async function fetchApplicationById(id: string) {
  try {
    const application = await getApplicationById(id);
    if (!application) {
      return { success: false, error: "Application not found" };
    }
    return { success: true, data: application };
  } catch (error) {
    console.error("Error fetching application:", error);
    return { success: false, error: "Failed to fetch application" };
  }
}
// Fetch applications by status
export async function fetchApplicationsByStatusAction(
  status: "Pending" | "Accepted" | "Rejected",
  path: string = "/admin/candidate-application"
) {
  try {
    const applications = await getApplicationsByStatus(status);

    if (path) revalidatePath(path);

    return { success: true, data: applications };
  } catch (error: any) {
    console.error("Error fetching applications by status:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch applications",
    };
  }
}

//  Update application status (Accept / Reject)

export async function updateApplicationStatusAction(
  applicationId: string,
  status: "Accepted" | "Rejected",
  redirectPath: string = "/admin/candidate-application"
) {
  const result = await updateApplicationStatus(applicationId, status);

  if (result.success) {
    revalidatePath("/admin/candidate-application");
    revalidatePath(`/admin/candidate-application/${applicationId}`);
    revalidatePath(redirectPath);
  }

  return result;
}

// Delete application
export async function deleteApplicationAction(
  applicationId: string,
  redirectPath: string = "/admin/candidate-application"
) {
  const result = await deleteApplication(applicationId);

  if (result.success) {
    revalidatePath("/admin/candidate-application");
    revalidatePath(redirectPath);
  }

  return result;
}

// Originality update action
export async function updateApplicationOriginalityAction(
  applicationId: string,
  originalityScores: any,
  redirectPath: string = "/admin/candidate-application"
) {
  const result = await updateApplicationOriginality(
    applicationId,
    originalityScores
  );

  if (result.success) {
    revalidatePath("/admin/candidate-application");
    revalidatePath(`/admin/candidate-application/${applicationId}`);
    revalidatePath(redirectPath);
  }

  return result;
}

// Correctness update action
export async function updateApplicationCorrectnessAction(
  applicationId: string,
  correctnessScores: any,
  redirectPath: string = "/admin/candidate-application"
) {
  const result = await updateApplicationCorrectness(
    applicationId,
    correctnessScores
  );

  if (result.success) {
    revalidatePath("/admin/candidate-application");
    revalidatePath(`/admin/candidate-application/${applicationId}`);
    revalidatePath(redirectPath);
  }

  return result;
}

// // Holistic final assessment action
// export async function updateApplicationAIAnalysisAction(
//   applicationId: string,
//   overallVerdict: any, // AIVerdict type
//   aiRecommendation: string,
//   overallScore: number,
//   redirectPath: string = "/admin/candidate-application"
// ) {
//   const result = await updateApplicationAIAnalysis(
//     applicationId,
//     overallVerdict,
//     aiRecommendation,
//     overallScore
//   );

//   if (result.success) {
//     revalidatePath("/admin/candidate-application");
//     revalidatePath(`/admin/candidate-application/${applicationId}`);
//     revalidatePath(redirectPath);
//   }

//   return result;
// }
//  Update AI analysis
export async function updateApplicationAIAnalysisAction(
  applicationId: string,
  aiAnalysis: any,
  overallScore: number,
  redirectPath: string = "/admin/candidate-application"
) {
  const result = await updateApplicationAIAnalysis(
    applicationId,
    aiAnalysis,
    overallScore
  );

  if (result.success) {
    revalidatePath("/admin/candidate-application");
    revalidatePath(`/admin/candidate-application/${applicationId}`);
    revalidatePath(redirectPath);
  }

  return result;
}
/**
 * Generate career path recommendations for highly recommended candidates
 */

export async function updateCareerRecommendationsOnly(
  applicationId: string,
  careerRecommendations: string[]
) {
  try {
    const updateResult = await updateApplicationCareerRecommendations(
      applicationId,
      careerRecommendations
    );

    if (updateResult.success) {
      revalidatePath("/admin/candidate-application");
      revalidatePath(`/admin/candidate-application/${applicationId}`);
    }

    return updateResult;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

// Updated Subadmin Management Actions - Only for subadmins

export async function createSubadminAction(
  email: string,
  password: string,
  name: string,
  createdBy: string,
  redirectPath: string = "/admin/settings"
) {
  const result = await createSubadmin(email, password, name, createdBy);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function fetchAllSubadminsAction(
  path: string = "/admin/settings"
) {
  try {
    const subadmins = await getAllSubadmins();

    revalidatePath(path);

    return { success: true, data: subadmins };
  } catch (error: any) {
    console.error("Error fetching subadmins:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch subadmins",
    };
  }
}

export async function updateSubadminAction(
  uid: string,
  updates: {
    email?: string;
    password?: string;
    name?: string;
    avatar?: string;
  },
  redirectPath: string = "/admin/settings"
) {
  const result = await updateSubadmin(uid, updates);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function toggleSubadminStatusAction(
  uid: string,
  isActive: boolean,
  redirectPath: string = "/admin/settings"
) {
  const result = await toggleSubadminStatus(uid, isActive);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function deleteSubadminAction(
  uid: string,
  redirectPath: string = "/admin/settings"
) {
  const result = await deleteSubadmin(uid);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

// Updated AI Key Management Actions

export async function createAIKeyAction(
  aiID: string,
  keyName: string,
  apiKey: string,
  provider: string,
  priority: number,
  status: "active" | "inactive" = "active",
  redirectPath: string = "/admin/settings"
) {
  const result = await createAIKey(
    aiID,
    keyName,
    apiKey,
    provider,
    priority,
    status
  );

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function updateAIKeyAction(
  docId: string,
  updates: {
    aiID?: string;
    keyName?: string;
    apiKey?: string;
    provider?: string;
    priority?: number;
    status?: "active" | "inactive";
  },
  redirectPath: string = "/admin/settings"
) {
  const result = await updateAIKey(docId, updates);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function toggleAIKeyStatusAction(
  docId: string,
  currentStatus: "active" | "inactive",
  redirectPath: string = "/admin/settings"
) {
  const result = await toggleAIKeyStatus(docId, currentStatus);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function deleteAIKeyAction(
  docId: string,
  redirectPath: string = "/admin/settings"
) {
  const result = await deleteAIKey(docId);

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath(redirectPath);
  }

  return result;
}

// Keep the existing fetch action
export async function fetchAllAIKeysAction(path: string = "/admin/settings") {
  try {
    const aiKeys = await getAllAIKeys();
    revalidatePath(path);
    return { success: true, data: aiKeys };
  } catch (error: any) {
    console.error("Error fetching AI keys:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch AI keys",
    };
  }
}

// Client Management Actions
export async function createClientAction(
  email: string,
  password: string,
  name: string,
  redirectPath: string = "/admin/clients"
) {
  const result = await createClient(email, password, name);

  if (result.success) {
    revalidatePath("/admin/clients");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function fetchAllClientsAction(path: string = "/admin/clients") {
  try {
    const clients = await getAllClients();
    revalidatePath(path);
    return { success: true, data: clients };
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch clients",
    };
  }
}

export async function updateClientAction(
  uid: string,
  updates: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    avatar?: string;
    lastLogin?: string;
  },
  redirectPath: string = "/admin/clients"
) {
  const result = await updateClient(uid, updates);

  if (result.success) {
    revalidatePath("/admin/clients");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function deleteClientAction(
  uid: string,
  redirectPath: string = "/admin/clients"
) {
  const result = await deleteClient(uid);

  if (result.success) {
    revalidatePath("/admin/clients");
    revalidatePath(redirectPath);
  }

  return result;
}

// Developer Management Actions
export async function createDeveloperAction(
  email: string,
  password: string,
  name: string,
  redirectPath: string = "/admin/developers"
) {
  const result = await createDeveloper(email, password, name);

  if (result.success) {
    revalidatePath("/admin/developers");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function fetchAllDevelopersAction(
  path: string = "/admin/developers"
) {
  try {
    const developers = await getAllDevelopers();
    revalidatePath(path);
    return { success: true, data: developers };
  } catch (error: any) {
    console.error("Error fetching developers:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch developers",
    };
  }
}

export async function updateDeveloperAction(
  uid: string,
  updates: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    avatar?: string;
    lastLogin?: string;
  },
  redirectPath: string = "/admin/developers"
) {
  const result = await updateDeveloper(uid, updates);

  if (result.success) {
    revalidatePath("/admin/developers");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function deleteDeveloperAction(
  uid: string,
  redirectPath: string = "/admin/developers"
) {
  const result = await deleteDeveloper(uid);

  if (result.success) {
    revalidatePath("/admin/developers");
    revalidatePath(redirectPath);
  }

  return result;
}

export async function getAiConfigAction(): Promise<AiConfig> {
  return await getAiConfig();
}

export async function updateAiConfigAction(patch: Partial<AiConfig>): Promise<void> {
  await updateAiConfig(patch);
  revalidatePath("/admin/settings");
}

export async function getGeminiModelsAction(): Promise<
  { id: string; displayName: string }[]
> {
  const keys = await getActiveGoogleAIKeys();
  if (keys.length === 0) {
    throw new Error(
      "No active Google keys found. Add a Google provider key in the API Keys table first."
    );
  }

  const lastError: string[] = [];

  for (const key of keys) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key.apiKey}`
    );

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body?.error?.message ?? detail;
      } catch { /* ignore */ }
      lastError.push(`Key ${key.aiId}: ${detail}`);
      continue; // try the next key
    }

    const data = await res.json();
    const models: { id: string; displayName: string }[] = [];

    for (const m of data.models ?? []) {
      if (
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes("generateContent") &&
        typeof m.name === "string"
      ) {
        models.push({
          id: (m.name as string).replace(/^models\//, ""),
          displayName: m.displayName ?? m.name,
        });
      }
    }

    return models.sort((a, b) => a.id.localeCompare(b.id));
  }

  // All keys failed
  throw new Error(
    `All Google keys failed: ${lastError.join(" | ")}`
  );
}

export interface AITestResult {
  success: boolean;
  model: string;
  keyUsed?: string;
  response?: string;
  durationMs: number;
  tokens?: { prompt: number; completion: number; total: number };
  error?: string;
  keysTried: { keyId: string; error: string }[];
}

const TEST_PROMPT =
  "Hello! Please respond with exactly one short friendly sentence confirming you are working correctly.";

export async function testAIProviderAction(
  provider: "openrouter" | "gemini"
): Promise<AITestResult> {
  const config = await getAiConfig();
  const start = Date.now();
  const keysTried: { keyId: string; error: string }[] = [];

  if (provider === "openrouter") {
    const keys = await getActiveOpenRouterAIKeys();
    if (keys.length === 0) {
      return {
        success: false,
        model: config.openrouterModel,
        durationMs: Date.now() - start,
        error: "No active OpenRouter keys found. Add one in the API Keys table.",
        keysTried: [],
      };
    }

    for (const key of keys) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.openrouterModel,
            messages: [{ role: "user", content: TEST_PROMPT }],
            max_tokens: 150,
            temperature: 0.7,
          }),
        });

        const durationMs = Date.now() - start;
        let body: any;
        try { body = await res.json(); } catch { body = null; }

        // Build a rich error string from whatever OpenRouter gives us
        const extractORError = (b: any, httpStatus: number): string => {
          if (!b) return `HTTP ${httpStatus}`;
          const e = b.error ?? b;
          const parts: string[] = [];
          if (e?.message) parts.push(e.message);
          if (e?.code !== undefined && e.code !== null) parts.push(`code: ${e.code}`);
          if (e?.metadata?.provider_name) parts.push(`provider: ${e.metadata.provider_name}`);
          if (e?.metadata?.raw) parts.push(`raw: ${String(e.metadata.raw).slice(0, 200)}`);
          return parts.length ? parts.join(" | ") : `HTTP ${httpStatus}`;
        };

        if (!res.ok) {
          keysTried.push({ keyId: key.aiId, error: extractORError(body, res.status) });
          continue;
        }

        // OpenRouter can return HTTP 200 with an error body (provider-side failure)
        if (body?.error) {
          keysTried.push({ keyId: key.aiId, error: extractORError(body, res.status) });
          continue;
        }

        const response = body?.choices?.[0]?.message?.content ?? "";
        const usage = body?.usage;

        return {
          success: true,
          model: body?.model ?? config.openrouterModel,
          keyUsed: key.aiId,
          response,
          durationMs,
          tokens: usage
            ? { prompt: usage.prompt_tokens ?? 0, completion: usage.completion_tokens ?? 0, total: usage.total_tokens ?? 0 }
            : undefined,
          keysTried,
        };
      } catch (err) {
        keysTried.push({ keyId: key.aiId, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return {
      success: false,
      model: config.openrouterModel,
      durationMs: Date.now() - start,
      error: `All ${keys.length} key(s) failed.`,
      keysTried,
    };
  } else {
    // Gemini — use REST API directly so we get full usage metadata
    const keys = await getActiveGoogleAIKeys();
    if (keys.length === 0) {
      return {
        success: false,
        model: config.geminiModel,
        durationMs: Date.now() - start,
        error: "No active Google keys found. Add one in the API Keys table.",
        keysTried: [],
      };
    }

    for (const key of keys) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${key.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: TEST_PROMPT }] }],
              generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
            }),
          }
        );

        const durationMs = Date.now() - start;

        if (!res.ok) {
          let errMsg = `HTTP ${res.status}`;
          try {
            const body = await res.json();
            errMsg = body?.error?.message ?? errMsg;
          } catch { /* ignore */ }
          keysTried.push({ keyId: key.aiId, error: errMsg });
          continue;
        }

        const data = await res.json();
        const response = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const usage = data.usageMetadata;

        return {
          success: true,
          model: config.geminiModel,
          keyUsed: key.aiId,
          response,
          durationMs,
          tokens: usage
            ? { prompt: usage.promptTokenCount ?? 0, completion: usage.candidatesTokenCount ?? 0, total: usage.totalTokenCount ?? 0 }
            : undefined,
          keysTried,
        };
      } catch (err) {
        keysTried.push({ keyId: key.aiId, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return {
      success: false,
      model: config.geminiModel,
      durationMs: Date.now() - start,
      error: `All ${keys.length} key(s) failed.`,
      keysTried,
    };
  }
}
