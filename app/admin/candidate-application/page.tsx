import { fetchAllApplicationsAction } from "@/app/actions/admin-actions";
import CandidatesApplicationsClient from "@/components/admin/candidate-application/CandidatesApplicationsClient";

export const revalidate = 200;
export default async function CandidatesApplications() {
    const response = await fetchAllApplicationsAction();
  return <CandidatesApplicationsClient candidatesData={response.data} />;
}