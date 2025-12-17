import { adminDb } from "@/firebaseAdmin";
import { Project, ProjectStatus } from "../types";
import { PaymentDetails } from "./admin";

// Get all the projects request for admin to see
export const getAllProjects = async () => {
  try {
    const projectsRef = adminDb.collection("Projects");
    const querySnapshot = await projectsRef.get();
    const projects: Project[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        ...data,
        quotationDocuments: data.quotationDocuments || [],
        developerDocuments: data.developerDocuments || [],
      } as Project);
    });

    return projects;
  } catch (error) {
    console.error("Error fetching all projects:", error);
    throw error;
  }
};

// Get a single project by ID
export async function getProjectById(projectId: string) {
  try {
    const projectRef = adminDb.collection("Projects").doc(projectId);
    const projectSnap = await projectRef.get();

    if (projectSnap.exists) {
      const data = projectSnap.data();
      return {
        id: projectSnap.id,
        ...data,
      } as Project;
    } else {
      throw new Error("Project not found");
    }
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  avatar?: string;
}

export async function updateUserProfile(
  uid: string,
  profileData: ProfileUpdateData
): Promise<void> {
  try {
    const userRef = adminDb.collection("users").doc(uid);

    await userRef.update({
      ...profileData,
      updatedAt: new Date().toLocaleString(),
    });

    console.log("Profile updated successfully");
  } catch (error: any) {
    console.error("Error updating profile:", error);
    throw new Error(error.message || "Failed to update profile");
  }
}

export async function updateUserAvatar(
  uid: string,
  avatarUrl: string
): Promise<void> {
  try {
    const userRef = adminDb.collection("users").doc(uid);

    await userRef.update({
      avatar: avatarUrl,
      updatedAt: new Date().toLocaleString(),
    });

    console.log("Avatar updated successfully");
  } catch (error: any) {
    console.error("Error updating avatar:", error);
    throw new Error(error.message || "Failed to update avatar");
  }
}
export async function getAllPaymentDetails(): Promise<{
  success: boolean;
  data?: PaymentDetails[];
  error?: string;
}> {
  try {
    const paymentCollection = adminDb.collection("PaymentDetails");
    const querySnapshot = await paymentCollection.get();

    const paymentDetails: PaymentDetails[] = [];
    querySnapshot.forEach((doc) => {
      paymentDetails.push(doc.data() as PaymentDetails);
    });

    return {
      success: true,
      data: paymentDetails,
    };
  } catch (error) {
    console.error("Error getting all payment details:", error);
    return { success: false, error: "Failed to get payment details" };
  }
}
