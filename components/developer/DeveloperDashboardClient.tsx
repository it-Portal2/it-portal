"use client";
import Link from "next/link";
import {
  Calendar,
  CheckCircle,
  Clock,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Project } from "@/lib/types";

export default function DeveloperDashboardClient({
  projects,
}: {
  projects: Project[] | undefined;
}) {

  // Calculate project statistics dynamically
  const projectStats = {
    total: projects?.length || 0,
    inProgress: projects?.filter((p) => p.status === "in-progress").length || 0,
    completed: projects?.filter((p) => p.status === "completed").length || 0,
    notStarted: projects?.filter(
      (p) => p.status !== "in-progress" && p.status !== "completed"
    ).length || 0,
  };

  // Use dynamic current date
  const currentDate = new Date(); // Real-time current date

  // Calculate days remaining and filter upcoming deadlines (30 days or less)
  const upcomingDeadlines = projects
    ?.map((project) => {
      if (!project.deadline) return null;
      const deadlineDate = new Date(project.deadline);
      const timeDiff = deadlineDate.getTime() - currentDate.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return {
        id: project.id,
        name: project.projectName,
        deadline: project.deadline.split("T")[0], // Format as YYYY-MM-DD
        daysRemaining,
        progress: project.progress,
      };
    })
    .filter(
      (project): project is NonNullable<typeof project> =>
        project !== null && project.daysRemaining >= 0 && project.daysRemaining <= 30 // Only upcoming within 30 days
    )
    .sort((a, b) => a.daysRemaining - b.daysRemaining) || []; // Sort by closest deadline

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{projectStats.total}</div>
              <Layers className="h-10 w-10 text-muted-foreground/70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {projectStats.inProgress}
              </div>
              <Clock className="h-10 w-10 text-blue-500/70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{projectStats.completed}</div>
              <CheckCircle className="h-10 w-10 text-green-500/70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {upcomingDeadlines.length}
              </div>
              <Calendar className="h-10 w-10 text-orange-500/70" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="col-span-1 lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Deadlines</CardTitle>
                <Link href="/developer/projects">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    View All
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <CardDescription>
                Projects due in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((project) => (
                    <div
                      key={project.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3.5 w-3.5 mr-1" /> Due:{" "}
                            {project.deadline}
                          </div>
                        </div>
                        <Badge
                          className={
                            project.daysRemaining <= 7
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : project.daysRemaining <= 14
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }
                        >
                          {project.daysRemaining} days left
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress
                          value={project.progress}
                          className="h-2"
                          color={"bg-blue-500"}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No upcoming deadlines within 30 days.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/developer/projects">
                <Button className="w-full" variant="outline">
                  Manage All Projects
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}