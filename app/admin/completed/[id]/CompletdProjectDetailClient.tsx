"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Project } from "@/lib/types";
import Link from "next/link";

interface ProjectDetailClientProps {
  project: Project | null;
  error: string | null;
}
// Client component
export default function CompletedProjectDetailClient({
  project,
  error,
}: ProjectDetailClientProps) {
  const router = useRouter();

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    // Add more currencies as needed
  };

  const currencySymbol = currencySymbols[project?.currency || "₹"];
  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/admin/completed")}>
            Go Back to Completed Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="flex items-center mb-6"
          onClick={() => router.push("/admin/completed")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Completed Projects
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {project.projectName}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Client: {project.clientName}
                  </p>
                </div>
                <Badge
                  // variant="success"
                  className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Completed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Project Description
                      </h3>
                      <p className="text-sm">{project.projectOverview}</p>
                    </div>

                    {/* <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Client Feedback
                      </h3>
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <div className="flex mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < 0 //have to give dynamic value
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm italic">{"good work"}</p>
                      </div>
                    </div> */}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                          Estimated Cost
                        </h3>
                        <div className="flex items-center">
                          <span className="text-lg font-medium">
                            <span className="text-green-600 text-xl mr-2">
                              {" "}
                              {currencySymbol}
                            </span>
                            {project.projectBudget.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                          Actual Cost
                        </h3>
                        <div className="flex items-center">
                          <span className="text-lg font-medium">
                            <span className="text-green-600 text-xl mr-2">
                              {" "}
                              {currencySymbol}
                            </span>
                            {project?.finalCost?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-lg border">
                      <h3 className="font-medium mb-3">Project Progress</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completion Status</span>
                          <span className="font-medium">100%</span>
                        </div>
                        <Progress value={100} className="h-2" />

                        <div className="pt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Started:{" "}
                              {new Date(project.startDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Deadline:{" "}
                              {new Date(
                                project?.deadline || 0
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>
                              Completed:{" "}
                              {new Date(
                                project?.endDate || 0
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Total Duration:{" "}
                              {Math.ceil(
                                (new Date(project.endDate).getTime() -
                                  new Date(project.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              days
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border">
                      <h3 className="font-medium mb-3">Client Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{project.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm overflow-hidden">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {project.clientEmail}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{project.clientPhoneNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-3">Project Documentation</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link href={project.cloudinaryQuotationUrl || ""}>
                      <Button variant="outline" className="justify-start">
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="truncate">Quotation PDF</span>
                        <Download className="ml-auto h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={project.cloudinaryDocumentationUrl || ""}>
                    <Button variant="outline" className="justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="truncate">Developer Guide</span>
                      <Download className="ml-auto h-4 w-4" />
                    </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
