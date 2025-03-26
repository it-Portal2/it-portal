"use client";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CircleCheckBig,
  FileText,
  Inbox,
  LayoutDashboard,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { Project } from "@/lib/types";

export default function AdminDashboardClient({
  projects,
}: {
  projects: Project[] | undefined;
}) {
  // Exchange rate: 1 USD = 83 INR (as of March 2025, adjust as needed)
  const USD_TO_INR_RATE = 83;

  // Default stats when no projects exist
  const stats = {
    totalProjects: projects?.length || 0,
    pendingRequests:
      projects?.filter((p) => p.status === "pending").length || 0,
    ongoingProjects:
      projects?.filter(
        (p) =>
          p.status === "in-progress" || (p.progress > 0 && p.progress < 100)
      ).length || 0,
    completedProjects:
      projects?.filter((p) => p.status === "completed").length || 0,
    totalRevenue:
      projects
        ?.filter((p) => (p.finalCost || 0) > 0)
        .reduce((sum, p) => {
          const cost = p.finalCost || 0;
          return sum + (p.currency === "USD" ? cost * USD_TO_INR_RATE : cost);
        }, 0) || 0,
  };

  // Calculate upcoming deadlines (10 days or less, in-progress only)
  const upcomingDeadlines =
    projects
      ?.filter(
        (p): p is Project & { deadline: string } =>
          p.deadline !== undefined && p.status === "in-progress"
      )
      .map((p) => {
        const deadlineDate = new Date(p.deadline);
        const today = new Date();
        const daysLeft = Math.ceil(
          (deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
        );
        return {
          id: p.id,
          name: p.projectName,
          client: p.clientName,
          deadline: p.deadline,
          daysLeft: daysLeft > 0 ? daysLeft : 0,
          progress: p.progress,
          currency: p.currency,
        };
      })
      .filter((d) => d.daysLeft <= 10 && d.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft) || [];

  // Get recent requests (only pending projects)
  const recentRequests =
    projects
      ?.filter((p) => p.status === "pending")
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        projectName: p.projectName,
        clientName: p.clientName,
        submittedDate: new Date(p.submittedAt).toISOString().split("T")[0],
        estimatedCost: p.projectBudget,
        currency: p.currency,
      })) || [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
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
              <div className="text-3xl font-bold">{stats.totalProjects}</div>
              <LayoutDashboard className="h-10 w-10 text-muted-foreground/70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.pendingRequests}</div>
              <Inbox className="h-10 w-10 text-amber-500/70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                ₹{stats.totalRevenue.toLocaleString()}
              </div>
              <IndianRupee className="h-10 w-10 text-green-500/70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {stats.completedProjects}
              </div>
              <CircleCheckBig className="h-10 w-10 text-blue-500/70" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2"
      >
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>
                In-progress projects due within the next 10 days
              </CardDescription>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">{deadline.name}</div>
                      <div
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          deadline.daysLeft <= 3
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {deadline.daysLeft} days left
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Client: {deadline.client}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={deadline.progress}
                        className="h-2"
                        color={"bg-blue-500"}
                      />
                      <span className="text-xs font-medium">
                        {deadline.progress}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No in-progress projects with upcoming deadlines
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/admin/ongoing" className="flex items-center gap-2">
                <span>View all ongoing projects</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Recent Project Requests</CardTitle>
              <CardDescription>
                Latest client project submissions (Pending)
              </CardDescription>
            </div>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.projectName}
                      </TableCell>
                      <TableCell>{request.clientName}</TableCell>
                      <TableCell className="text-right">
                        {request.currency === "INR" ? "₹" : "$"}
                        {request.estimatedCost.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No pending project requests available
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/admin/requests" className="flex items-center gap-2">
                <span>View all requests</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}