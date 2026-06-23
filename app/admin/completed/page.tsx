import { fetchAllProjects} from "@/app/actions/common-actions";
import ProjectCompletedClient from "@/components/admin/completed/ProjectCompletedClient";
export const revalidate = 30;
export default async function CompletedProjects() {
  const response = await fetchAllProjects();
  return <ProjectCompletedClient projects={response.data} />;
}
