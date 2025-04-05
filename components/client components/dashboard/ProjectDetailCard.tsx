import type { Project } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ProjectDetailCardProps {
  project: Project;
}

export default function ProjectDetailCard({ project }: ProjectDetailCardProps) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    "in-progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    delayed: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };

  const statusText: Record<string, string> = {
    pending: "Pending",
    "in-progress": "In Progress",
    completed: "Completed",
    rejected: "Rejected",
    delayed: "Delayed",
  };

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    // Add more currencies as needed
  };

  const currencySymbol = currencySymbols[project?.currency || "₹"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <CardTitle>{project.projectName}</CardTitle>
          <Badge
            variant="outline"
            className={cn("capitalize", statusColors[project.status])}
          >
            {statusText[project.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Project Overview</h3>
          <p className="text-sm text-muted-foreground">
            {project.projectOverview}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Project Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd>{format(new Date(project.submittedAt), "PPP")}</dd>
              </div>

              {project.startDate && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Started</dt>
                  <dd>{format(new Date(project.startDate), "PPP")}</dd>
                </div>
              )}

              {project.endDate && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Completed</dt>
                  <dd>{format(new Date(project.endDate), "PPP")}</dd>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Budget</dt>
                <dd>
                  {currencySymbol}
                  {project.projectBudget.toLocaleString()}
                </dd>
              </div>

              {(project.finalCost || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Final Cost</dt>
                  <dd>
                    {currencySymbol}
                    {project.finalCost?.toLocaleString() || "0"}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Contact Information</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Client</dt>
                <dd>{project.clientName}</dd>
              </div>

              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate max-w-[180px]">
                  {project.clientEmail}
                </dd>
              </div>

              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{project.clientPhoneNumber}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <h3 className="font-medium">Project Progress</h3>
            <span>{project.progress}% Complete</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {project.cloudinaryDocumentationUrl && (
          <div>
            <h3 className="text-sm font-medium mb-2">
              Developer Documentation
            </h3>
            <Link
              href={project.cloudinaryDocumentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View Documentation
            </Link>
          </div>
        )}
        {project.hasExistingDesign && project.designLink && (
          <div>
            <h3 className="text-sm font-medium mb-2">Submitted Design</h3>
            <Link
              href={project.designLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View Design
            </Link>
          </div>
        )}
        {project.cloudinaryQuotationUrl && (
          <div>
            <h3 className="text-sm font-medium mb-2">Quotation</h3>
            <Link
              href={project.cloudinaryQuotationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View Quotation
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
