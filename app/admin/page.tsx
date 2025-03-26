import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { fetchAllProjects } from "../actions/common-actions";


export const revalidate = 100;
export default async  function AdminDashboard() {
  const response = await fetchAllProjects();

  return <AdminDashboardClient projects={response.data}/>
}
