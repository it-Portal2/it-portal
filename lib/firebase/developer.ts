import {
  collection,
  getDocs,
  doc,
  query,
  where,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { Project, ProjectStatus, Task } from "../types";
import { db } from "@/firebase";

export async function getTasks(
    projectId: string
  ): Promise<{ success: boolean; data?: Task[]; error?: string }> {
    try {
      const tasksCollection = collection(db, "Tasks");
      const q = query(tasksCollection, where("projectId", "==", projectId));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        return { success: true, data: [] }; // No tasks found for this project
      }
  
      // Assuming one document per project for simplicity; take the first match
      const docSnap = querySnapshot.docs[0];
      const tasksData = docSnap.data();
      const tasks = tasksData.tasks as Task[];
  
      return { success: true, data: tasks };
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return { success: false, error: "Failed to fetch tasks" };
    }
}
  
export async function setProgressType(
  projectId: string,
  progressType: "task-based" | "manual" | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const projectRef = doc(db, "Projects", projectId);
    await updateDoc(projectRef, { progressType });
    return { success: true };
  } catch (error) {
    console.error("Error setting progress type:", error);
    return { success: false, error: "Failed to set progress type" };
  }
}

export async function updateProjectProgress(
  projectId: string,
  progress: number,
  isCompleted?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const projectRef = doc(db, "Projects", projectId);
    const updates: Partial<Project> = { progress };
    if (isCompleted !== undefined) updates.isCompleted = isCompleted;
    if (progress === 100) updates.isCompleted = true; // Only set isCompleted
    await updateDoc(projectRef, updates);
    return { success: true };
  } catch (error) {
    console.error("Error updating project progress:", error);
    return { success: false, error: "Failed to update progress" };
  }
}

export async function createTasks(
    tasks: Task[],
    projectId: string // Add projectId as a parameter
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!tasks.length || !projectId) {
        return { success: false, error: "Tasks array or projectId is missing" };
      }
  
      // Use projectId and a timestamp to create a unique document ID
      const autoId = `${projectId}-${Date.now()}`;
      const tasksDocRef = doc(db, "Tasks", autoId);
  
      // Structure the document with an array of tasks
      const tasksData = {
        projectId,
        tasks: tasks.map((task) => ({
          id: task.id,
          name: task.name,
          projectId: task.projectId,
          projectName: task.projectName,
          status: task.status,
        })),
        createdAt: new Date().toISOString(),
      };
  
      // Write the document to Firebase
      await setDoc(tasksDocRef, tasksData);
  
      return { success: true };
    } catch (error) {
      console.error("Error creating tasks:", error);
      return { success: false, error: "Failed to create tasks" };
    }
  }

export async function updateTaskStatus(
    taskId: string,
    status: "not-started" | "in-progress" | "completed",
    projectId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tasksCollection = collection(db, "Tasks");
      const q = query(tasksCollection, where("projectId", "==", projectId));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        return { success: false, error: "No tasks found for this project" };
      }
  
      const docSnap = querySnapshot.docs[0];
      const docRef = doc(db, "Tasks", docSnap.id);
      const tasksData = docSnap.data();
      const updatedTasks = tasksData.tasks.map((task: Task) =>
        task.id === taskId ? { ...task, status } : task
      );
  
      await updateDoc(docRef, { tasks: updatedTasks });
      return { success: true };
    } catch (error) {
      console.error("Error updating task status:", error);
      return { success: false, error: "Failed to update task status" };
    }
  }