"use server"

import { createTasks, getTasks, setProgressType, updateProjectProgress, updateTaskStatus } from "@/lib/firebase/developer";
import { Task } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getTasksAction(projectId: string) {
    return await getTasks(projectId);
  }
  
  export async function setProgressTypeAction(projectId: string, progressType: "task-based" | "manual", path?: string) {
    const result = await setProgressType(projectId, progressType);
    if (result.success && path) revalidatePath(path);
    return result;
  }
  
  export async function updateProjectProgressAction(projectId: string, progress: number, isCompleted?: boolean, path?: string) {
    const result = await updateProjectProgress(projectId, progress, isCompleted);
    if (result.success && path) revalidatePath(path);
    return result;
  }
  
  export async function createTasksAction(tasks: Task[], projectId: string, path?: string) {
    const result = await createTasks(tasks, projectId);
    if (result.success && path) revalidatePath(path);
    return result;
  }
  
  export async function updateTaskStatusAction(taskId: string, status: "not-started" | "in-progress" | "completed", projectId: string, path?: string) {
    const result = await updateTaskStatus(taskId, status, projectId);
    if (result.success && path) revalidatePath(path);
    return result;
  }