"use client";

import React, { useEffect, useState } from "react";
import { Search, Download, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import Link from "next/link";
import { Project } from "@/lib/types";

export default function ProjectRequestsClient({
  projects,
}: {
  projects: Project[] | undefined;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const pendingProjects = projects?.filter(
    (project) => project.status === "pending"
  );

  const filteredProjects = pendingProjects?.filter(
    (project) =>
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Define currency symbols mapping
  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    // Add more currencies as needed
  };

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
            className="pl-9 w-full sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* <div className="w-full sm:w-auto flex justify-end">
          <Button variant="outline" className="bg-white/80 shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div> */}
      </div>
      <div className="rounded-lg overflow-hidden glassmorphism shadow-md">
        <ProjectTable
          data={filteredProjects || []}
          columns={[
            { header: "Project Name", accessor: "projectName" },
            { header: "Client", accessor: "clientName" },
            {
              header: "Estimated Cost",
              accessor: "projectBudget",
              cell: (row) => {
                // Get currency symbol based on the project's currency, default to $ if not found
                const currencySymbol = currencySymbols[row.currency] || "$";
                return `${currencySymbol}${row.projectBudget.toLocaleString()}`;
              },
            },
            { header: "Status", accessor: "status" },
            {
              header: "Actions",
              accessor: "actions",
              cell: (row) => (
                <div className="flex items-center gap-2">
                  <Link href={`/admin/requests/${row.id}`}>
                    {" "}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </div>
              ),
            },
          ]}
          itemsPerPage={5}
          emptyMessage="No pending project requests found"
        />
      </div>

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
