"use client";
import React, {  useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Star, ExternalLink } from "lucide-react";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import { motion } from "framer-motion";
import Link from "next/link";
import { Project } from "@/lib/types";


const ProjectCompletedClient = ({
  projects,
}: {
  projects: Project[] | undefined;
})  => {
  const [searchQuery, setSearchQuery] = useState("");

  const completedProjects = projects?.filter(
    (project) => project.status === "completed"
  );

  const filteredProjects = completedProjects?.filter(
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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div> */}
      </div>

      <div className="rounded-lg overflow-hidden glassmorphism shadow-sm">
        <ProjectTable
          data={filteredProjects || []}
          columns={[
            { header: "Project Name", accessor: "projectName" },
            { header: "Client", accessor: "clientName" },
            {
              header: "Final Cost",
              accessor: "finalCost",
              cell: (row) => {
                const currencySymbol = currencySymbols[row.currency] || "₹";
                return `${currencySymbol}${row.finalCost.toLocaleString()}`;
              },
            },
            {
              header: "Duration",
              accessor: "submittedAt",
              cell: (row) => {
                const startDate = new Date(row.submittedAt);
                const endDate = row.deadline
                  ? new Date(row.deadline)
                  : new Date();
                const durationInDays = Math.ceil(
                  (endDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return `${durationInDays} days`;
              },
            },
            // {
            //   header: "Feedback",
            //   accessor: "feedback",
            //   cell: () => {
            //     // Randomly generate 3-5 stars for demo purposes
            //     const stars = Math.floor(Math.random() * 3) + 3;
            //     return (
            //       <div className="flex">
            //         {[...Array(5)].map((_, i) => (
            //           <Star
            //             key={i}
            //             className={`h-4 w-4 ${
            //               i < stars
            //                 ? "text-yellow-400 fill-yellow-400"
            //                 : "text-gray-300"
            //             }`}
            //           />
            //         ))}
            //       </div>
            //     );
            //   },
            // },
            // {
            //   header: "Report",
            //   accessor: "report",
            //   cell: () => (
            //     <Button
            //       variant="ghost"
            //       size="sm"
            //       className="flex items-center gap-1"
            //     >
            //       <Download className="h-4 w-4" />
            //       <span>PDF</span>
            //     </Button>
            //   ),
            // },
            {
              header: "Actions",
              accessor: "actions",
              cell: (row) => (
                <Link href={`/admin/completed/${row.id}`}>
                  {" "}
                  <Button size="sm" className="flex items-center gap-1">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </Link>
              ),
            },
          ]}
          itemsPerPage={5}
          emptyMessage="No completed projects found"
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
};

export default ProjectCompletedClient;
