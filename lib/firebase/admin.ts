import {
  collection,
  getDocs,
  doc,
  query,
  where,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Project, ProjectStatus } from "../types";
import { db } from "@/firebase";

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

//  mark project as completed
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
      rejectedDate: null,   // Clear the rejected date
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
    
    // Delete the project document
    await deleteDoc(doc(db, "Projects", projectId));
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}