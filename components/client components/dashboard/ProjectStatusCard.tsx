import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectStatus } from "@/lib/types";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  FileQuestion,
  XCircle,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectStatusCardProps {
  status: ProjectStatus | "all";
  count: number;
}

export default function ProjectStatusCard({
  status,
  count,
}: ProjectStatusCardProps) {
  const statusConfig: Record<
    ProjectStatus | "all",
    {
      title: string;
      icon: React.ReactNode;
      color: string;
      href: string;
    }
  > = {
    all: {
      title: "All Projects",
      icon: <Briefcase className="h-5 w-5" />,
      color: "text-primary bg-primary/10",
      href: "/client/projects",
    },
    pending: {
      title: "Pending",
      icon: <FileQuestion className="h-5 w-5" />,
      color: "text-yellow-500 bg-yellow-500/10",
      href: "/client/pending",
    },
    "in-progress": {
      title: "In Progress",
      icon: <Clock className="h-5 w-5" />,
      color: "text-blue-500 bg-blue-500/10",
      href: "/client/in-progress",
    },
    completed: {
      title: "Completed",
      icon: <CheckCircle className="h-5 w-5" />,
      color: "text-green-500 bg-green-500/10",
      href: "/client/completed",
    },
    rejected: {
      title: "Rejected",
      icon: <XCircle className="h-5 w-5" />,
      color: "text-red-500 bg-red-500/10",
      href: "/client/rejected",
    },
    delayed: {
      title: "Delayed",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-orange-500 bg-orange-500/10",
      href: "/client/delayed",
    },
  };

  const { title, icon, color} = statusConfig[status];

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-full", color)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">
          {count === 1 ? "project" : "projects"}
        </p>
      </CardContent>
    </Card>
  );
}
