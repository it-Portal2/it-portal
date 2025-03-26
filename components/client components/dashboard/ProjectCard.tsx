import type { Project, ProjectStatus } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, FileText, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const statusColors: Record<ProjectStatus, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    "in-progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    delayed: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };

  const statusText: Record<ProjectStatus, string> = {
    pending: "Pending",
    "in-progress": "In Progress",
    completed: "Completed",
    rejected: "Rejected",
    delayed: "Delayed",
  };

  return (
    <Link href={`/client/projects/${project.id}`}>
      <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg line-clamp-1">
              {project.projectName}
            </h3>
            <Badge
              variant="outline"
              className={cn("capitalize", statusColors[project.status])}
            >
              {statusText[project.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {project.projectOverview}
          </p>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>
                  {formatDistanceToNow(project.submittedAt, {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {/* 
              {project.teamMembers && (
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{project.teamMembers.length} team members</span>
                </div>
              )} */}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Budget: ₹{project.projectBudget.toLocaleString()}
          </div>

          {project.cloudinaryDocumentationUrl && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>Documentation</span>
            </Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
