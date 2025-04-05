"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeProjectAction } from "@/app/actions/admin-actions";
import { ArrowLeft, FileText, Calendar, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isValid } from "date-fns"; // Import isValid from date-fns
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Project } from "@/lib/types";
import Link from "next/link";

interface ProjectDetailClientProps {
  project: Project | null;
  error: string | null;
}

export default function OngoingProjectDetailsClient({
  project,
  error,
}: ProjectDetailClientProps) {
  const router = useRouter();

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

    // Check if deadline is a valid date
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

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    // Add more currencies as needed
  };

  const currencySymbol = currencySymbols[project?.currency || "₹"];

  // Function to safely format dates
  const safeFormatDate = (
    dateString: string | undefined | null,
    formatPattern: string = "MMMM dd, yyyy"
  ) => {
    if (!dateString) return "Not set";

    const date = new Date(dateString);
    return isValid(date) ? format(date, formatPattern) : "Invalid date";
  };

  // Calculate days left safely
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3 glassmorphism shadow-sm border-0">
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

        <Card className="lg:col-span-2 glassmorphism shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-xl">Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {project.projectOverview}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={project.cloudinaryQuotationUrl || "#"}>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                  disabled={!project.cloudinaryQuotationUrl}
                >
                  <FileText className="h-4 w-4" />
                  View Quotation PDF
                </Button>
              </Link>
              <Link href={project.cloudinaryDocumentationUrl || "#"}>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                  disabled={!project.cloudinaryDocumentationUrl}
                >
                  <FileText className="h-4 w-4" />
                  View Developer Guide PDF
                </Button>
              </Link>
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
              <p className="text-sm text-muted-foreground mb-1">
                Estimated Cost
              </p>
              <p className="text-2xl font-bold">
                {currencySymbol}
                {project.projectBudget.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Date Started</p>
              <p className="font-medium">{safeFormatDate(project.startDate)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
