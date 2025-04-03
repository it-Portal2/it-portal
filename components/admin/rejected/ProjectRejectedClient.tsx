"use client";
import React, { useState } from "react";
import { File, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import Link from "next/link";
import { Project } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteProjectAction, restoreProjectAction } from "@/app/actions/admin-actions";
import { useRouter } from "next/navigation";

const ProjectRejectedClient = ({
  projects,
}: {
  projects: Project[] | undefined;
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const rejectedProjects = projects?.filter(
    (project) => project.status === "rejected"
  );
  
  // Filter projects based on search query
  const filteredProjects = rejectedProjects?.filter(
    (project) =>
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteProjectAction(projectToDelete);
      
      if (result.success) {
        toast.success("Project deleted successfully");
        // Force refresh the page to update the list
        router.refresh();
      } else {
        toast.error("Failed to delete project", {
          description: result.error || "An error occurred"
        });
      }
    } catch (error) {
      toast.error("Failed to delete project", {
        description: "An unexpected error occurred"
      });
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };



  // Table columns definition
  const columns = [
    { header: "Project", accessor: "projectName" },
    { header: "Client", accessor: "clientName" },
    {
      header: "Date Rejected",
      accessor: "rejectedDate",
      cell: (row: any) => {
        const date = row.rejectedDate ? new Date(row.rejectedDate) : null;
        return date ? date.toLocaleDateString() : "N/A";
      }
    },
    {
      header: "Reason",
      accessor: "rejectionReason",
      cell: (row: any) => {
        const reason = row.rejectionReason || "No reason provided";
        // Truncate long reasons
        return reason.length > 30 ? `${reason.substring(0, 30)}...` : reason;
      }
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/rejected/${row.id}`}>
            <Button
              size="sm"
              //variant="outline"
              className="flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <File className="h-4 w-4" />
              View Details
            </Button>
          </Link>      
          <Button
            size="sm"
            variant="destructive"
            className="flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
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

      {/* Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Project Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone and all project data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectRejectedClient;