import { fetchAllApplicationsAction } from "@/app/actions/admin-actions";
import CandidatesApplicationsClient from "@/components/admin/candidate-application/CandidatesApplicationsClient";

import { Suspense } from "react";

export const revalidate = 200;
export default async function CandidatesApplications() {
  const response = await fetchAllApplicationsAction();
  return (
    <Suspense fallback={<div>Loading applications...</div>}>
      <CandidatesApplicationsClient candidatesData={response.data} />
    </Suspense>
  );
}
