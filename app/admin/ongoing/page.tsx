
import { fetchAllProjects } from "@/app/actions/common-actions";
import ProjectOngoingClient from "@/components/admin/ongoing/ProjectOngoingClient";
export const revalidate = 200;
export default async function OngoingProject() {
  const response = await fetchAllProjects();
  return <ProjectOngoingClient projects={response.data} />;
}
