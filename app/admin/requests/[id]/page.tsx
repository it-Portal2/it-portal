import ProjectDetailClient from "./ProjectDetailClient";
import type { Project } from "@/lib/types";
import { fetchAllProjects, fetchProjectById } from "@/app/actions/common-actions";

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
    const response = await fetchProjectById(id);

    if (!response.success || !response.data) {
      error = response.error || "Project not found";
    } else {
      project = response.data;
    }
  } catch (err) {
    console.error("Error fetching project:", err);
  }
  // Pass data to client component
  return <ProjectDetailClient project={project} error={error} />;
}

export async function generateStaticParams() {
  const response = await fetchAllProjects();
  const projects: Project[] =
    response.success && response.data ? response.data : [];

  return projects.map((project) => ({
    id: project.id.toString(),
  }));
}

