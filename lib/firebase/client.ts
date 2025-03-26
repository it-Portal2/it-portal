import {
  collection,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  limit,
  setDoc,
} from "firebase/firestore";
import { Project, ProjectStatus, Task } from "../types";
import { db } from "@/firebase";

// Get all projects for a specific client
export async function getClientProjects(clientEmail: string) {
  try {
    const projectsRef = collection(db, "Projects");
    const q = query(projectsRef, where("clientEmail", "==", clientEmail));

    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        ...data,
      } as Project);
    });

    return projects;
  } catch (error) {
    console.error("Error fetching client projects:", error);
    throw error;
  }
}

// Get projects by status
export async function getProjectsByStatus(
  clientEmail: string,
  status: ProjectStatus
) {
  try {
    const projectsRef = collection(db, "Projects");
    const q = query(
      projectsRef,
      where("clientEmail", "==", clientEmail),
      where("status", "==", status),
      orderBy("submittedAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate() || new Date(),
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
      } as Project);
    });

    return projects;
  } catch (error) {
    console.error(`Error fetching ${status} projects:`, error);
    throw error;
  }
}

// Get recent projects (limited number)
export async function getRecentProjects(clientEmail: string, limitCount = 5) {
  try {
    const projectsRef = collection(db, "Projects");
    const q = query(
      projectsRef,
      where("clientEmail", "==", clientEmail),
      orderBy("submittedAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate() || new Date(),
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
      } as Project);
    });

    return projects;
  } catch (error) {
    console.error("Error fetching recent projects:", error);
    throw error;
  }
}

