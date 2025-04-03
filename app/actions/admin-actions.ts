"use server";

import { revalidatePath } from "next/cache";
import { acceptProject, completeProject, deleteProject, rejectProject, restoreProject } from "@/lib/firebase/admin";

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