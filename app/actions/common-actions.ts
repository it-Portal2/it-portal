"use server"
import { getAllPaymentDetails, getAllProjects, getProjectById, ProfileUpdateData, updateUserAvatar, updateUserProfile } from "@/lib/firebase/common";
import { revalidatePath } from "next/cache";
export async function fetchAllProjects() {
    try {
      const projects = await getAllProjects();
      return { success: true, data: projects };
    } catch (error) {
      console.error("Error fetching projects:", error);
      return { success: false, error: "Failed to fetch projects" };
    }
  }
  

export async function fetchProjectById(id: string) {
  try {
    const project = await getProjectById(id);
    if (!project) {
      return { success: false, error: "Project not found" };
    }
    return { success: true, data: project };
  } catch (error) {
    console.error("Error fetching project:", error);
    return { success: false, error: "Failed to fetch project" };
  }
}

export async function updateProfile(
  uid: string,
  profileData: ProfileUpdateData,
  path?: string
) {
  try {
    await updateUserProfile(uid, profileData);

    if (path) revalidatePath(path);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
}


export async function updateAvatar(
  uid: string,
  avatarUrl: string,
  path?: string
) {
  try {
    await updateUserAvatar(uid, avatarUrl);

    if (path) revalidatePath(path);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating avatar:", error);
    return {
      success: false,
      error: error.message || "Failed to update avatar",
    };
  }
}

export async function getAllPaymentDetailsAction() {
  const result = await getAllPaymentDetails();
  return result;
}