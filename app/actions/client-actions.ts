"use server";
import {
  getClientProjects,
  getProjectsByStatus,
  getRecentProjects,
} from "@/lib/firebase/client";
import { ProjectStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { adminAuth } from "@/firebaseAdmin";

export async function fetchClientProjects(clientEmail: string, path?: string) {
  try {
    const projects = await getClientProjects(clientEmail);

    // Revalidate the path if provided
    if (path) revalidatePath(path);

    return { success: true, data: projects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { success: false, error: "Failed to fetch projects" };
  }
}

export async function fetchProjectsByStatus(
  clientEmail: string,
  status: ProjectStatus,
  path?: string
) {
  try {
    const projects = await getProjectsByStatus(clientEmail, status);

    if (path) revalidatePath(path);

    return { success: true, data: projects };
  } catch (error) {
    console.error(`Error fetching ${status} projects:`, error);
    return { success: false, error: `Failed to fetch ${status} projects` };
  }
}

export async function fetchRecentProjects(
  clientEmail: string,
  limit = 5,
  path?: string
) {
  try {
    const projects = await getRecentProjects(clientEmail, limit);

    if (path) revalidatePath(path);

    return { success: true, data: projects };
  } catch (error) {
    console.error("Error fetching recent projects:", error);
    return { success: false, error: "Failed to fetch recent projects" };
  }
}


// Optional: Validate token server-side if needed
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { success: true, uid: decodedToken.uid };
  } catch (error: any) {
    console.error("Error verifying ID token:", error);
    return { success: false, error: error.message || "Invalid token" };
  }
}