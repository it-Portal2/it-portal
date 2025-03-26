import { fetchAllProjects } from "@/app/actions/common-actions";
import ProjectRequestsClient from "@/components/admin/request/ProjectRequestsClient";

export const revalidate = 200;
export default async function ProjectRequests() {
  const response = await fetchAllProjects();
  return <ProjectRequestsClient projects={response.data} />;
}
