
import { fetchAllProjects } from "@/app/actions/common-actions";
import DeveloperProjectsClient from "@/components/developer/projects/DeveloperProjectsClient";

export const revalidate = 30;

export default async function ProjectRequests() {
  const response = await fetchAllProjects();
  return <DeveloperProjectsClient projects={response.data} />;
}
