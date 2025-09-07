"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import type { Project, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProjectDetailCard from "@/components/client components/dashboard/ProjectDetailCard";
import ProjectTimeline from "@/components/client components/dashboard/ProjectTimeline";

import { useAuthStore } from "@/lib/store/userStore";
import DocumentsList from "@/components/ui-custom/DocumentsList";

interface ProjectDetailClientProps {
  initialProject: Project | null;
  error: string | null;
}

export default function ProjectDetailClient({ 
  initialProject, 
  error: initialError 
}: ProjectDetailClientProps) {
  const { profile } = useAuthStore();
  const router = useRouter();
  const [project] = useState<Project | null>(initialProject);
  const [error] = useState<string | null>(initialError);

  if (error || !project) {
    return (
      <Layout user={profile || ({} as User)} title="Project Details" description="Error">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-destructive font-medium">
            {error || "Project not found"}
          </p>
          <Link href="/client" className="mt-4">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Dummy handlers for client view (no operations allowed)
  const handleDocumentRemoved = () => {
    // Client view - no operations allowed, so this won't be called
    console.log("Document operations not allowed in client view");
  };

  const handleAddDocuments = () => {
    // Client view - no operations allowed, so this won't be called
    console.log("Document operations not allowed in client view");
  };

  // Check if project has any documents to display
  const hasQuotationDocs = project.quotationDocuments && project.quotationDocuments.length > 0;
  const hasDeveloperDocs = project.developerDocuments && project.developerDocuments.length > 0;
  const hasAnyDocuments = hasQuotationDocs || hasDeveloperDocs;

  return (
    <Layout
      user={profile || ({} as User)}
      title="Project Details"
      description={`View details for ${project.projectName}`}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProjectDetailCard project={project} />
          </div>
          <div>
            <ProjectTimeline project={project} />
          </div>
        </div>

        {/* Documents Section */}
        {hasAnyDocuments && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Project Documents</h2>
              <p className="text-muted-foreground mb-6">
                View and download project-related documents
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quotation Documents */}
              {hasQuotationDocs && (
                <DocumentsList
                  documents={project.quotationDocuments || []}
                  documentType="quotation"
                  projectId={project.id}
                  onDocumentRemoved={handleDocumentRemoved}
                  onAddDocuments={handleAddDocuments}
                />
              )}

              {/* Developer Documents */}
              {hasDeveloperDocs && (
                <DocumentsList
                  documents={project.developerDocuments || []}
                  documentType="developer"
                  projectId={project.id}
                  onDocumentRemoved={handleDocumentRemoved}
                  onAddDocuments={handleAddDocuments}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
