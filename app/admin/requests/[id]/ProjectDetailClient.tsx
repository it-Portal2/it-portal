"use client";

import React, { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Mail,
  Phone,
  Link as LINK,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Project } from "@/lib/types";
import Link from "next/link";
import { toast } from "sonner";
import {
  acceptProjectAction,
  rejectProjectAction,
} from "@/app/actions/admin-actions";

interface ProjectDetailClientProps {
  project: Project | null;
  error: string | null;
}
const ProjectRequestDetail = ({
  project,
  error: initialError,
}: ProjectDetailClientProps) => {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [error] = useState<string | null>(initialError);
  const [finalBudget, setFinalBudget] = useState(project?.projectBudget || "");

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <p className="text-destructive font-medium">
          {error || "Project not found"}
        </p>
        <Button onClick={() => router.push("/admin/requests")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
      </div>
    );
  }

  const handleAccept = async () => {
    if (!date) {
      toast.error("Deadline Required", {
        description: "Please set a deadline before accepting the project",
      });
      return;
    }

    if (
      !finalBudget ||
      isNaN(Number(finalBudget)) ||
      Number(finalBudget) <= 0
    ) {
      toast.error("Valid Budget Required", {
        description: "Please set a valid final budget for the project",
      });
      return;
    }

    const result = await acceptProjectAction(
      project.id,
      date.toISOString(),
      Number(finalBudget)
    );

    if (result.success) {
      toast.success("Project Accepted", {
        description: "The project has been moved to ongoing projects",
      });
      router.push("/admin/ongoing");
    } else {
      toast.error("Error", {
        description: result.error || "Failed to accept project",
      });
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error("Reason Required", {
        description: "Please provide a reason for rejection",
      });
      return;
    }

    const result = await rejectProjectAction(project.id, rejectionReason);

    if (result.success) {
      toast.success("Project Rejected", {
        description: "The project has been moved to rejected projects",
      });
      router.push("/admin/rejected");
    } else {
      toast.error("Error", {
        description: result.error || "Failed to reject project",
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-2 border-primary/20 shadow-sm"
          onClick={() => router.push("/admin/requests")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
        <h1 className="text-3xl font-bold text-primary-700">
          {project.projectName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Submitted on {format(new Date(project.submittedAt), "MMMM dd, yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glassmorphism shadow-md border-primary/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-xl">Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 leading-relaxed">{project.projectOverview}</p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-6">
                <Link href={project.cloudinaryQuotationUrl || ""}>
                  {" "}
                  <Button className="flex items-center gap-2 w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md">
                    <FileText className="h-4 w-4" />
                    View Quotation PDF
                  </Button>
                </Link>

                <Link href={project.cloudinaryDocumentationUrl || ""}>
                  {" "}
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 w-full sm:w-auto border-primary/20 shadow-sm"
                  >
                    <FileText className="h-4 w-4" />
                    View Developer Guide
                  </Button>
                </Link>
                {project.hasExistingDesign && project.designLink && (
                  <Link href={project.designLink}>
                    <Button className="flex items-center gap-2 w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md">
                      <LINK className="w-5 h-5 mr-2 " /> View Design
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism shadow-md border-primary/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-xl">Set Project Deadline</CardTitle>
              <CardDescription>
                Choose a deadline for project completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full sm:w-auto justify-start text-left font-normal border-primary/20 shadow-sm ${
                        !date && "text-muted-foreground"
                      }`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "MMMM dd, yyyy") : "Select deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                      className="rounded-md border border-primary/20"
                    />
                  </PopoverContent>
                </Popover>

                {date && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(date, "EEEE, MMMM do yyyy")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glassmorphism shadow-md border-primary/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-xl">Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{project.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${project.clientEmail}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {project.clientEmail}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{project.clientPhoneNumber}</p>
                  </div>
                </div>
                <Separator className="bg-primary/10" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estimated Budget
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-green-600 text-xl">
                      {" "}
                      {currencySymbol}
                    </span>
                    <p className="text-xl font-bold">
                      {project.projectBudget.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Separator className="bg-primary/10" />
                <div>
                  <Label
                    htmlFor="finalBudget"
                    className="text-sm text-muted-foreground"
                  >
                    Final Budget
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 ">
                      {currencySymbol}
                    </span>

                    <Input
                      id="finalBudget"
                      className="pl-10 border-primary/20 focus-visible:ring-primary/30"
                      value={finalBudget}
                      onChange={(e) => setFinalBudget(e.target.value)}
                      type="number"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism shadow-md border-primary/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-xl">Decision</CardTitle>
              <CardDescription>
                Accept or reject this project request
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showRejectionForm ? (
                <div className="flex flex-col gap-3">
                  <Button
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                    onClick={handleAccept}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Accept Project
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 shadow-sm"
                    onClick={() => setShowRejectionForm(true)}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please provide a reason for rejection:
                  </p>
                  <Textarea
                    placeholder="Enter rejection reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="border-primary/20 focus-visible:ring-primary/30"
                  />
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleReject}
                    >
                      Confirm Rejection
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-primary/20"
                      onClick={() => setShowRejectionForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectRequestDetail;
