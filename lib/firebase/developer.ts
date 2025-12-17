import { adminDb } from "@/firebaseAdmin";
import { Project, ProjectStatus, Task } from "../types";

export async function getTasks(
  projectId: string
): Promise<{ success: boolean; data?: Task[]; error?: string }> {
  try {
    const tasksCollection = adminDb.collection("Tasks");
    const querySnapshot = await tasksCollection
      .where("projectId", "==", projectId)
      .get();

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
  progressType: "task-based" | "manual" | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const projectRef = adminDb.collection("Projects").doc(projectId);
    await projectRef.update({ progressType });
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
    const projectRef = adminDb.collection("Projects").doc(projectId);
    const updates: Partial<Project> = { progress };
    if (isCompleted !== undefined) updates.isCompleted = isCompleted;
    if (progress === 100) updates.isCompleted = true; // Only set isCompleted
    await projectRef.update(updates);
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
    const tasksDocRef = adminDb.collection("Tasks").doc(autoId);

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
    await tasksDocRef.set(tasksData);

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
    const tasksCollection = adminDb.collection("Tasks");
    const querySnapshot = await tasksCollection
      .where("projectId", "==", projectId)
      .get();

    if (querySnapshot.empty) {
      return { success: false, error: "No tasks found for this project" };
    }

    const docSnap = querySnapshot.docs[0];
    const docRef = adminDb.collection("Tasks").doc(docSnap.id);
    const tasksData = docSnap.data();
    const updatedTasks = tasksData.tasks.map((task: Task) =>
      task.id === taskId ? { ...task, status } : task
    );

    await docRef.update({ tasks: updatedTasks });
    return { success: true };
  } catch (error) {
    console.error("Error updating task status:", error);
    return { success: false, error: "Failed to update task status" };
  }
}
