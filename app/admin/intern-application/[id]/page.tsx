import { Application } from "@/lib/types";
import ApplicationDetailPageClient from "./ApplicationDetailPageClient";
import { fetchAllApplicationsAction, fetchApplicationById } from "@/app/actions/admin-actions";

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
    const response = await fetchApplicationById(id);

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

// Generate static params for all applications (if you want static generation)
// Remove this if you prefer dynamic rendering
export async function generateStaticParams() {
  try {
    const response = await fetchAllApplicationsAction();
    
    // Check if the response is successful and has data
    if (!response.success || !response.data) {
      console.error("Failed to fetch applications for static params");
      return [];
    }

    return response.data.map((application: Application) => ({
      id: application.id,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}