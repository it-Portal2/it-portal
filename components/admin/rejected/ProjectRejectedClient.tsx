"use client";
import React, { useState } from "react";
import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import Link from "next/link";
import { Project } from "@/lib/types";

const ProjectRejectedClient = ({
  projects,
}: {
  projects: Project[] | undefined;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const rejectedProjects = projects?.filter(
    (project) => project.status === "rejected"
  );
  // Filter projects based on search query
  const filteredProjects = rejectedProjects?.filter(
    (project) =>
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Table columns definition
  const columns = [
    { header: "Project", accessor: "projectName" },
    { header: "Client", accessor: "clientName" },
    {
      header: "Date Rejected",
      accessor: "rejectedDate",
    },
    {
      header: "Status",
      accessor: "status",
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/rejected/${row.id}`}>
            {" "}
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <File className="h-4 w-4" />
              View Deatils
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <ProjectTable
        data={filteredProjects || []}
        columns={columns}
        emptyMessage="No rejected projects found"
      />
    </div>
  );
};

export default ProjectRejectedClient;
