"use client";

import { useState } from "react";
import Layout from "@/components/layout/Layout";
import type { Project, User } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FilePlus2 } from "lucide-react";
import Link from "next/link";
import ProjectStatusCard from "@/components/client components/dashboard/ProjectStatusCard";
import ProjectCard from "@/components/client components/dashboard/ProjectCard";

interface ClientDashboardUIProps {
  projects: Project[] | undefined;
  loading: boolean;
  error: string | null;
  profile: User | null;
}

// This is the client component that handles UI state and rendering
export default function ClientDashboardUI({
  projects,
  loading,
  error,
  profile,
}: ClientDashboardUIProps) {
  const [activeTab, setActiveTab] = useState("all");

  // Count projects by status
  const projectCounts = {
    pending: projects?.filter((p) => p.status === "pending").length,
    "in-progress": projects?.filter((p) => p.status === "in-progress").length,
    completed: projects?.filter((p) => p.status === "completed").length,
    rejected: projects?.filter((p) => p.status === "rejected").length,
  };


  // Filter projects based on active tab
  const filteredProjects =
    activeTab === "all"
      ? projects
      : projects?.filter((project) => project.status === activeTab);

  return (
    <Layout
      user={profile || ({} as User)}
      title="Client Dashboard"
      description="Monitor your project requests and their progress"
    >
      <div className="space-y-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProjectStatusCard
            status="pending"
            count={projectCounts?.pending || 0}
          />
          <ProjectStatusCard
            status="in-progress"
            count={projectCounts["in-progress"] || 0}
          />
          <ProjectStatusCard
            status="completed"
            count={projectCounts.completed || 0}
          />
          <ProjectStatusCard
            status="rejected"
            count={projectCounts?.rejected || 0}
          />
        </div>

        {/* Projects Tabs with New Project Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <Link href="/client/create-project">
            <Button className="w-full sm:w-auto">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Create New Project Request
            </Button>
          </Link>
        </div>

        {/* Projects List */}
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <p>Loading projects...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 border rounded-lg bg-red-50">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : filteredProjects?.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <h3 className="font-medium">No projects found</h3>
              <p className="text-muted-foreground mt-1">
                {activeTab === "all"
                  ? "You haven't submitted any projects yet."
                  : `You don't have any ${activeTab} projects.`}
              </p>
              <Link href="/client/create-project" className="mt-4 inline-block">
                <Button>
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects?.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
