"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Import Sonner toast
import { restoreProjectAction } from "@/app/actions/admin-actions";
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  User,
  Mail,
  Phone,
  Clock,
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Project } from "@/lib/types";
import Link from "next/link";

interface ProjectDetailClientProps {
  project: Project | null;
  error: string | null;
}

export default function RejectedProjectDetailClient({
  project,
  error,
}: ProjectDetailClientProps) {
  const router = useRouter();

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The project you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/admin/rejected")}>
          Go Back to Rejected Projects
        </Button>
      </div>
    );
  }

  const handleRestore = async () => {
    const result = await restoreProjectAction(project.id);

    if (result.success) {
      toast.success("Project Restored", {
        description: `${project.projectName} has been moved to Project Requests.`,
      });
      router.push("/admin/requests");
    } else {
      toast.error("Error", {
        description: result.error || "Failed to restore project",
      });
    }
  };

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    // Add more currencies as needed
  };

  const currencySymbol = currencySymbols[project?.currency || "₹"];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="flex items-center mb-6"
        onClick={() => router.push("/admin/rejected")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Rejected Projects
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="col-span-1 lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {project.projectName}
                  </CardTitle>
                  <CardDescription>
                    Client: {project.clientName}
                  </CardDescription>
                </div>
                <Badge variant="destructive" className="text-sm">
                  Rejected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Project Description
                </h3>
                <p>{project.projectOverview}</p>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Rejection Reason
                </h3>
                <p className="text-destructive">
                  {project.rejectionReason || "No reason provided"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Rejected on{" "}
                  {project.rejectedDate
                    ? new Date(project.rejectedDate).toLocaleDateString()
                    : "Unknown date"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                className="flex items-center gap-1"
                onClick={handleRestore}
              >
                <RefreshCw className="h-4 w-4" />
                Restore Project
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          className="col-span-1 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{project.clientName}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{project.clientEmail}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{project.clientPhoneNumber}</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 text-xl mr-2">
                  {currencySymbol}
                </span>
                <span>{project.projectBudget.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={project.cloudinaryQuotationUrl || ""}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View Quotation PDF
                </Button>
              </Link>
              <Link href={project.cloudinaryDocumentationUrl || ""}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View Developer Guide
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
