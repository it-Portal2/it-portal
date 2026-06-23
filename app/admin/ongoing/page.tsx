
import { fetchAllProjects } from "@/app/actions/common-actions";
import ProjectOngoingClient from "@/components/admin/ongoing/ProjectOngoingClient";
export const revalidate = 30;
export default async function OngoingProject() {
  const response = await fetchAllProjects();
  return <ProjectOngoingClient projects={response.data} />;
}
