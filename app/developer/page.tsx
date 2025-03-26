
import DeveloperDashboardClient from "@/components/developer/DeveloperDashboardClient";
import { fetchAllProjects } from "../actions/common-actions";


export const revalidate = 100;
export default async  function AdminDashboard() {
  const response = await fetchAllProjects();

  return <DeveloperDashboardClient projects={response.data}/>
}
