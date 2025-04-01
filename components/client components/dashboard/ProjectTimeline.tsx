import type { Project } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ProjectTimelineProps {
  project: Project;
}

export default function ProjectTimeline({ project }: ProjectTimelineProps) {
  // Create timeline events based on project data
  const timelineEvents = [
    {
      date: project.submittedAt,
      title: "Project Submitted",
      description: "Project request was submitted for review",
      status: "completed",
    },
  ];

  // Add conditional events based on project status
  if (project.status === "in-progress" || project.status === "completed") {
    timelineEvents.push({
      date: project.startDate || "",
      title: "Project Started",
      description: "Development work has begun",
      status: "completed",
    });
  }

  if (project.status === "delayed") {
    timelineEvents.push({
      date: project.startDate || "",
      title: "Project Delayed",
      description: "Development has been delayed",
      status: "delayed",
    });
  }

  if (project.status === "completed") {
    timelineEvents.push({
      date: project.endDate || "",
      title: "Project Completed",
      description: "All development work has been completed",
      status: "completed",
    });
  }

  if (project.status === "rejected") {
    timelineEvents.push({
      date: project.endDate || "",
      title: "Project Rejected",
      description: "Project request was not approved",
      status: "rejected",
    });
  }

  // Sort events by date
  //    timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Project Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-8 space-y-6">
          {/* Vertical line */}
          <div className="absolute top-0 left-3 bottom-0 w-px bg-border" />

          {timelineEvents.map((event, index) => (
            <div key={index} className="relative">
              {/* Timeline dot */}
              <div
                className={cn(
                  "absolute left-[-30px] w-6 h-6 rounded-full border-2 border-background flex items-center justify-center",
                  event.status === "completed"
                    ? "bg-green-500"
                    : event.status === "delayed"
                    ? "bg-orange-500"
                    : event.status === "rejected"
                    ? "bg-red-500"
                    : "bg-blue-500"
                )}
              >
                <div className="w-2 h-2 rounded-full bg-background" />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">{event.title}</div>
                <div className="text-xs text-muted-foreground">
                  {format(event.date, "PPP")}
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
