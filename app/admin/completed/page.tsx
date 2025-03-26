import { fetchAllProjects} from "@/app/actions/common-actions";
import ProjectCompletedClient from "@/components/admin/completed/ProjectCompletedClient";
export const revalidate = 200;
export default async function CompletedProjects() {
  const response = await fetchAllProjects();
  return <ProjectCompletedClient projects={response.data} />;
}
