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
} from "@/lib/firebase/admin";

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
  return await savePaymentDetailsAction(uid, "paypal", paypalData, redirectPath);
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
  return await savePaymentDetailsAction(uid, "bankDetails", bankData, redirectPath);
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
    return { success: false, error: error.message || "Failed to update payment status" };
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
    return { success: false, error: error.message || "Failed to fetch payment records" };
  }
}

// Fetch all applications (with optional revalidation)
export async function fetchAllApplicationsAction(
  path?:  "/admin/intern-application"
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
  path: string = "/admin/intern-application"
) {
  try {
    const applications = await getApplicationsByStatus(status);

    if (path) revalidatePath(path);

    return { success: true, data: applications };
  } catch (error: any) {
    console.error("Error fetching applications by status:", error);
    return { success: false, error: error.message || "Failed to fetch applications" };
  }
}

//  Update application status (Accept / Reject)

export async function updateApplicationStatusAction(
  applicationId: string,
  status: "Accepted" | "Rejected",
  redirectPath: string = "/admin/intern-application"
) {
  const result = await updateApplicationStatus(applicationId, status);

  if (result.success) {
    revalidatePath("/admin/intern-application"); 
    revalidatePath(`/admin/intern-application/${applicationId}`); 
    revalidatePath(redirectPath);
  }

  return result;
}

// Delete application
export async function deleteApplicationAction(
  applicationId: string,
  redirectPath: string = "/admin/intern-application"
) {
  const result = await deleteApplication(applicationId);

  if (result.success) {
    revalidatePath("/admin/intern-application");
    revalidatePath(redirectPath);
  }

  return result;
}

// Originality update action
export async function updateApplicationOriginalityAction(
  applicationId: string,
  originalityScores: any,
  redirectPath: string = "/admin/intern-application"
) {
  const result = await updateApplicationOriginality(applicationId, originalityScores);

  if (result.success) {
    revalidatePath("/admin/intern-application");
    revalidatePath(`/admin/intern-application/${applicationId}`);
    revalidatePath(redirectPath);
  }

  return result;
}

// Correctness update action
export async function updateApplicationCorrectnessAction(
  applicationId: string,
  correctnessScores: any,
  redirectPath: string = "/admin/intern-application"
) {
  const result = await updateApplicationCorrectness(applicationId, correctnessScores);

  if (result.success) {
    revalidatePath("/admin/intern-application");
    revalidatePath(`/admin/intern-application/${applicationId}`);
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
//   redirectPath: string = "/admin/intern-application"
// ) {
//   const result = await updateApplicationAIAnalysis(
//     applicationId,
//     overallVerdict,
//     aiRecommendation,
//     overallScore
//   );

//   if (result.success) {
//     revalidatePath("/admin/intern-application");
//     revalidatePath(`/admin/intern-application/${applicationId}`);
//     revalidatePath(redirectPath);
//   }

//   return result;
// }
//  Update AI analysis
export async function updateApplicationAIAnalysisAction(
  applicationId: string,
  aiAnalysis: any,
  overallScore: number,
  redirectPath: string = "/admin/intern-application"
) {
  const result = await updateApplicationAIAnalysis(
    applicationId,
    aiAnalysis,
    overallScore
  );

  if (result.success) {
    revalidatePath("/admin/intern-application");
    revalidatePath(`/admin/intern-application/${applicationId}`);
    revalidatePath(redirectPath);
  }

  return result;
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


export async function fetchAllSubadminsAction(path: string = "/admin/settings") {
  try {
    const subadmins = await getAllSubadmins();

    revalidatePath(path);

    return { success: true, data: subadmins };
  } catch (error: any) {
    console.error("Error fetching subadmins:", error);
    return { success: false, error: error.message || "Failed to fetch subadmins" };
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
