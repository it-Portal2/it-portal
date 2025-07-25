import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { PaymentRecord } from "./client";

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

    const projectRef = doc(db, "Projects", projectId);
    await updateDoc(projectRef, {
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

    const projectRef = doc(db, "Projects", projectId);
    await updateDoc(projectRef, {
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

    const projectRef = doc(db, "Projects", projectId);
    await updateDoc(projectRef, {
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

    const projectRef = doc(db, "Projects", projectId);
    await updateDoc(projectRef, {
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

    await deleteDoc(doc(db, "Projects", projectId));

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

    const paymentRef = doc(db, "PaymentDetails", uid);
    const paymentDoc = await getDoc(paymentRef);

    const currentTime = new Date().toISOString();

    if (paymentDoc.exists()) {
      await updateDoc(paymentRef, {
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

      await setDoc(paymentRef, newPaymentDetails);
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

    const paymentRef = doc(db, "PaymentDetails", uid);
    await updateDoc(paymentRef, {
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

    await deleteDoc(doc(db, "PaymentDetails", uid));

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

    const paymentRef = doc(db, "PaymentDetails", uid);

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

    await updateDoc(paymentRef, resetData);

    return { success: true };
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return { success: false, error: "Failed to delete payment method" };
  }
}

export async function getAllPaymentRecords(): Promise<PaymentRecord[]> {
  try {
    const paymentRef = collection(db, "ClientPaymentDetails");
    const querySnapshot = await getDocs(paymentRef);
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
    const paymentRef = doc(db, "ClientPaymentDetails", paymentId);
    await updateDoc(paymentRef, {
      status: status,
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
}