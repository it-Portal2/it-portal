import { cache } from "react";
import { fetchProjectById } from "@/app/actions/common-actions";
import { fetchProjectPaymentRecordsAction } from "@/app/actions/client-actions";
import ProjectDetailClient from "./ProjectDetailClient";
import type { Project } from "@/lib/types";
import type { PaymentRecord } from "@/lib/firebase/client";

// Dedupe the per-id read within a single request render.
const getProject = cache(fetchProjectById);

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Server-side data fetching
  let project: Project | null = null;
  let error: string | null = null;

  try {
    const response = await getProject(id);

    if (!response.success || !response.data) {
      error = response.error || "Project not found";
    } else {
      project = response.data;
    }
  } catch (err) {
    console.error("Error fetching project:", err);
  }

  let payments: PaymentRecord[] = [];
  if (project?.clientEmail && project?.projectName) {
    const paymentsRes = await fetchProjectPaymentRecordsAction(
      project.clientEmail,
      project.projectName
    );
    if (paymentsRes.success && paymentsRes.data) payments = paymentsRes.data;
  }

  // Pass data to client component
  return (
    <ProjectDetailClient
      initialProject={project}
      payments={payments}
      error={error}
    />
  );
}
