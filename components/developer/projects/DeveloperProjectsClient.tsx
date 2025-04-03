"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search, Clock, CheckCircle2, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import ProjectTable, {
  ProjectStatus,
} from "@/components/ui-custom/ProjectTable";
import { motion } from "framer-motion";
import { Project } from "@/lib/types";

export default function DeveloperProjectsClient({
  projects,
}: {
  projects: Project[] | undefined;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Filter projects based on search query and active tab
  const filteredProjects = projects?.filter((project) => {
    const matchesSearch =
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectOverview.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      (activeTab === "all" && project.status !== "pending") ||
      (activeTab === "in-progress" && project.status === "in-progress") ||
      (activeTab === "completed" && project.status === "completed");

    return matchesSearch && matchesTab;
  });

  // Table columns definition
  const columns = [
    {
      header: "Project Name",
      accessor: "projectName",
      cell: (row: any) => (
        <div>
          <div className="text-sm text-muted-foreground">{row.projectName}</div>
        </div>
      ),
    },
    {
      header: "Deadline",
      accessor: "deadline",
      cell: (row: any) => (
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          {row.deadline
            ? format(new Date(row.deadline), "MMMM dd, yyyy")
            : "Not set"}
        </div>
      ),
    },
    {
      header: "Progress",
      accessor: "progress",
      cell: (row: any) => (
        <div className="w-full max-w-[180px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium">{row.progress}%</span>
          </div>
          <Progress
            value={row.progress}
            className="h-2"
            color={"bg-blue-500"}
          />
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: any) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/developer/projects/${row.id}`);
          }}
        >
          <FileText className="h-3.5 w-3.5" />
          View Project
        </Button>
      ),
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glassmorphism-subtle border shadow rounded-lg p-4 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-blue-100">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              In Progress
            </p>
            <p className="text-2xl font-bold">
              {projects?.filter((p) => p.status === "in-progress").length}
            </p>
          </div>
        </div>

        <div className="glassmorphism-subtle border shadow rounded-lg p-4 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Completed
            </p>
            <p className="text-2xl font-bold">
              {projects?.filter((p) => p.status === "completed").length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>

              {/* <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button> */}
            </div>
          </div>

          <TabsContent value="all" className="mt-6">
            <ProjectTable
              data={filteredProjects || []}
              columns={columns}
              emptyMessage="No projects found"
            />
          </TabsContent>

          <TabsContent value="in-progress" className="mt-6">
            <ProjectTable
              data={filteredProjects || []}
              columns={columns}
              emptyMessage="No in-progress projects found"
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <ProjectTable
              data={filteredProjects || []}
              columns={columns}
              emptyMessage="No completed projects found"
            />
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <ProjectTable
              data={filteredProjects || []}
              columns={columns}
              emptyMessage="No pending projects found"
            />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
