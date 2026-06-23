import { cache } from "react";
import { fetchProjectById } from "@/app/actions/common-actions";
import { Project } from "@/lib/types";
import CompletedProjectDetailClient from "./CompletdProjectDetailClient";

// Dedupe the per-id read within a single request render.
const getProject = cache(fetchProjectById);

export default async function CompletedProjectDetailPage({
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
  // Pass data to client component
  return <CompletedProjectDetailClient project={project} error={error} />;
}
