import { cache } from "react";
import { Application } from "@/lib/types";
import ApplicationDetailPageClient from "./ApplicationDetailPageClient";
import { fetchApplicationById } from "@/app/actions/admin-actions";

// Dedupe the per-id read within a single request render.
const getApplication = cache(fetchApplicationById);

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Server-side data fetching from Firebase
  let applicationDetails: Application | null = null;
  let error: string | null = null;

  try {
    const response = await getApplication(id);

    if (!response.success || !response.data) {
      error = response.error || "Application not found";
    } else {
      applicationDetails = response.data as Application;
    }
  } catch (err) {
    console.error("Error fetching application:", err);
    error = "Failed to load application data";
  }

  return (
    <ApplicationDetailPageClient
      applicationDetails={applicationDetails}
      error={error}
    />
  );
}
