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
  addDoc
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
// Types for payment records
export type PaymentRecord = {
  id: string
  clientName: string
  email: string
  projectName: string
  modeOfPayment: string
  paidAmount: number
  currency: string
  receiptUrl: string
  status: "pending" | "verified" | "rejected"
  createdAt: string
  paymentType: "full" | "installment"
  installmentPercentage?: number
  totalProjectAmount?: number
}

export interface PaymentFormData {
  id?: string
  clientName: string
  projectName: string
  clientEmail: string
  modeOfPayment: string
  paidAmount: number
  currency: string
  receiptUrl: string
  status: "pending" | "verified" | "rejected"
  createdAt: string
  paymentType: "full" | "installment"
  installmentPercentage?: number
  totalProjectAmount?: number
}

// Submit payment record
export async function submitPaymentRecord(paymentData: PaymentFormData) {
  try {
    const paymentRecord: Omit<PaymentRecord, 'id'> = {
      ...paymentData,
      status: "pending",
    };

    const docRef = await addDoc(collection(db, "ClientPaymentDetails"), paymentRecord);
    
    return {
      success: true,
      id: docRef.id,
      data: {
        id: docRef.id,
        ...paymentRecord,
      } as PaymentRecord
    };
  } catch (error) {
    console.error("Error submitting payment record:", error);
    throw error;
  }
}

// Get all payment records for a specific client
export async function getClientPaymentRecords(clientEmail: string) {
  try {
    const paymentRef = collection(db, "ClientPaymentDetails");
    const q = query(
      paymentRef,
      where("clientEmail", "==", clientEmail),
    );

    const querySnapshot = await getDocs(q);
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
    console.error("Error fetching client payment records:", error);
    throw error;
  }
}



