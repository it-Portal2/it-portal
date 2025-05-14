import type { Project } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface ProjectTimelineProps {
  project: Project;
}

export default function ProjectTimeline({ project }: ProjectTimelineProps) {
  // Create timeline events based on project data
  const timelineEvents = [];
  
  // Helper function to safely format dates
  const safeFormatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "No date provided";
    try {
      return format(parseISO(dateString), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Add submission event
  if (project.submittedAt) {
    timelineEvents.push({
      date: project.submittedAt,
      title: "Project Submitted",
      description: "Project request was submitted for review",
      status: "completed",
    });
  }

  // Add start event
  if ((project.status === "in-progress" || project.status === "completed") && project.startDate) {
    timelineEvents.push({
      date: project.startDate,
      title: "Project Started",
      description: "Development work has begun",
      status: "completed",
    });
  }

  // Add delay event
  if (project.status === "delayed" && project.startDate) {
    timelineEvents.push({
      date: project.startDate,
      title: "Project Delayed",
      description: "Development has been delayed",
      status: "delayed",
    });
  }

  // Add completion event
  if (project.status === "completed" && project.endDate) {
    timelineEvents.push({
      date: project.endDate,
      title: "Project Completed",
      description: "All development work has been completed",
      status: "completed",
    });
  }

  // Add rejection event
  if (project.status === "rejected" && project.rejectedDate) {
    timelineEvents.push({
      date: project.rejectedDate,
      title: "Project Rejected",
      description: project.rejectionReason || "Project request was not approved",
      status: "rejected",
    });
  }

  // Sort events by date if they all have valid dates
  // We don't need to sort if we have fixed the event addition logic

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Project Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-8 space-y-6">
          {/* Vertical line */}
          <div className="absolute top-0 left-3 bottom-0 w-px bg-border" />

          {timelineEvents.length > 0 ? (
            timelineEvents.map((event, index) => (
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
                    {safeFormatDate(event.date)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No timeline events available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}