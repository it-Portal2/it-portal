// Updated OngoingProjectDetailsClient component
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeProjectAction } from "@/app/actions/admin-actions";
import { ArrowLeft, FileText, Calendar, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isValid } from "date-fns"; 
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Project, DocumentType } from "@/lib/types";
import Link from "next/link";
import DocumentUploadModal from "@/components/admin/ongoing/DocumentUploadModal";
import DocumentsList from "@/components/ui-custom/DocumentsList";


interface ProjectDetailClientProps {
  project: Project | null;
  error: string | null;
  onProjectUpdate?: () => void;
}

export default function OngoingProjectDetailsClient({
  project,
  error,
  onProjectUpdate,
}: ProjectDetailClientProps) {
  const router = useRouter();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>("quotation");

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <h2 className="text-2xl font-semibold mb-2">Project Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The requested project could not be found.
        </p>
        <Button onClick={() => router.push("/admin/ongoing")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const isDeadlineSoon = () => {
    if (!project.deadline) return false;
    const deadline = new Date(project.deadline);
    if (!isValid(deadline)) return false;
    const today = new Date();
    const daysLeft = Math.ceil(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 3;
  };

  const handleMarkAsCompleted = async () => {
    const result = await completeProjectAction(project.id);

    if (result.success) {
      toast.success("Project Marked as Completed", {
        description: "The project has been moved to completed projects",
      });
      router.push("/admin/completed");
    } else {
      toast.error("Error", {
        description: result.error || "Failed to mark project as completed",
      });
    }
  };

  const handleAddDocuments = (documentType: DocumentType) => {
    setSelectedDocumentType(documentType);
    setUploadModalOpen(true);
  };

  const handleDocumentsChanged = () => {
    // Trigger a re-fetch of project data if needed
    if (onProjectUpdate) {
      onProjectUpdate();
    } else {
      // Alternatively, refresh the page
      window.location.reload();
    }
  };

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
  };

  const currencySymbol = currencySymbols[project?.currency || "INR"] || "₹";

  const safeFormatDate = (
    dateString: string | undefined | null,
    formatPattern: string = "MMMM dd, yyyy"
  ) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return isValid(date) ? format(date, formatPattern) : "Invalid date";
  };

  const calculateDeadlineStatus = () => {
    if (!project.deadline) return null;
    const deadline = new Date(project.deadline);
    if (!isValid(deadline)) return "Invalid deadline";
    const today = new Date();
    const daysLeft = Math.ceil(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 0) return `Overdue by ${Math.abs(daysLeft)} days`;
    if (daysLeft === 0) return "Due today";
    return `${daysLeft} days remaining`;
  };

  const deadlineStatus = calculateDeadlineStatus();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => router.push("/admin/ongoing")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{project.projectName}</h1>
              <p className="text-muted-foreground mt-1">
                Client: {project.clientName}
              </p>
            </div>

            <Button
              className="flex items-center gap-2"
              onClick={handleMarkAsCompleted}
            >
              <CheckSquare className="h-4 w-4" />
              Mark as Completed
            </Button>
          </div>
        </div>

        {/* Progress Section */}
        <Card className="glassmorphism shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2 mb-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-3 w-full" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {project.progress < 30
                ? "Project is in early development stages."
                : project.progress < 70
                ? "Project is making steady progress."
                : "Project is nearing completion."}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Overview */}
          <Card className="lg:col-span-2 glassmorphism shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-xl">Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground leading-relaxed">
                {project.projectOverview}
              </p>
              
              {/* Legacy document links (if available) */}
              <div className="flex flex-col sm:flex-row gap-3">
                {project.cloudinaryQuotationUrl && (
                  <Link href={project.cloudinaryQuotationUrl}>
                    <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                      <FileText className="h-4 w-4" />
                      View Legacy Quotation PDF
                    </Button>
                  </Link>
                )}
                {project.cloudinaryDocumentationUrl && (
                  <Link href={project.cloudinaryDocumentationUrl}>
                    <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                      <FileText className="h-4 w-4" />
                      View Legacy Developer Guide PDF
                    </Button>
                  </Link>
                )}
                {project.hasExistingDesign && project.designLink && (
                  <Link href={project.designLink}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4" />
                      View Design
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card className="glassmorphism shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-xl">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Deadline</p>
                <div className="flex items-center gap-2">
                  <Calendar
                    className={`h-5 w-5 ${
                      isDeadlineSoon() ? "text-red-500" : "text-blue-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium">
                      {safeFormatDate(project.deadline)}
                    </p>
                    {project.deadline && deadlineStatus && (
                      <p
                        className={`text-xs ${
                          isDeadlineSoon()
                            ? "text-red-500 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {deadlineStatus}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Estimated Cost</p>
                <p className="text-2xl font-bold">
                  {currencySymbol}
                  {project.projectBudget.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Final Cost</p>
                <p className="text-2xl font-bold">
                  {currencySymbol}
                  {(project.finalCost ?? 0).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Date Started</p>
                <p className="font-medium">{safeFormatDate(project.startDate)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quotation Documents */}
          <DocumentsList
            documents={project.quotationDocuments || []}
            documentType="quotation"
            projectId={project.id}
            onDocumentRemoved={handleDocumentsChanged}
            onAddDocuments={() => handleAddDocuments("quotation")}
          />

          {/* Developer Documents */}
          <DocumentsList
            documents={project.developerDocuments || []}
            documentType="developer"
            projectId={project.id}
            onDocumentRemoved={handleDocumentsChanged}
            onAddDocuments={() => handleAddDocuments("developer")}
          />
        </div>
      </motion.div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        projectId={project.id}
        documentType={selectedDocumentType}
        onDocumentsAdded={handleDocumentsChanged}
      />
    </>
  );
}
