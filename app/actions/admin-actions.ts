"use server";

import { revalidatePath } from "next/cache";
import {
  acceptProject,
  completeProject,
  deletePaymentDetails,
  deletePaymentMethod,
  deleteProject,
  getAllPaymentRecords,
  rejectProject,
  restoreProject,
  savePaymentDetails,
  updatePaymentDetails,
  updatePaymentStatus,
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