"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, FileText } from "lucide-react";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/lib/types";

export default function ProjectOngoingClient({
  projects,
}: {
  projects: Project[] | undefined;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const completedProjects = projects?.filter(
    (project) => project.status === "in-progress"
  );
  const filteredProjects = completedProjects?.filter(
    (project) =>
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects or clients..."
            className="pl-9 w-full sm:w-[300px] bg-background/50 border-muted"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* <div className="w-full sm:w-auto flex justify-end">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div> */}
      </div>

      <ProjectTable
        data={filteredProjects || []}
        columns={[
          { header: "Project Name", accessor: "projectName" },
          { header: "Client", accessor: "clientName" },
          {
            header: "Deadline",
            accessor: "deadline",
            cell: (row) => {
              if (!row.deadline) return "Not set";
              const deadline = new Date(row.deadline);
              const today = new Date();
              const daysLeft = Math.ceil(
                (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div className="flex flex-col space-y-1">
                  <div className="text-sm font-medium">
                    {format(deadline, "MMM dd, yyyy")}
                  </div>
                  <div
                    className={`text-xs ${
                      daysLeft <= 3
                        ? "text-red-500 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {daysLeft <= 0 ? "Overdue" : `${daysLeft} days left`}
                  </div>
                </div>
              );
            },
          },
          {
            header: "Progress",
            accessor: "progress",
            cell: (row) => (
              <div className="flex items-center gap-2 w-full">
                <Progress
                  value={row.progress}
                  className="h-2"
                  color={"bg-blue-500"}
                />
                <span className="text-xs font-medium w-8">{row.progress}%</span>
              </div>
            ),
          },
          { header: "Status", accessor: "status" },
          {
            header: "Action",
            accessor: "actions",
            cell: (row) => (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/admin/ongoing/${row.id}`);
                }}
              >
                <FileText className="h-3.5 w-3.5" />
                View Details
              </Button>
            ),
          },
        ]}
        emptyMessage="No ongoing projects found"
        itemsPerPage={5}
      />

      {filteredProjects?.length === 0 && searchQuery && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            No projects found matching "{searchQuery}"
          </p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => setSearchQuery("")}
          >
            Clear search
          </Button>
        </div>
      )}
    </motion.div>
  );
}
