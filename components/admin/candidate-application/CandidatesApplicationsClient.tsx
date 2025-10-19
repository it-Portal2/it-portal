"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Eye, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import { Application } from "@/lib/types";
import { deleteApplicationAction } from "@/app/actions/admin-actions";

type ApplicationStatus = "Pending" | "Accepted" | "Rejected";

const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const statusConfig = {
    Pending: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Clock,
      label: "Pending",
    },
    Accepted: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
      label: "Accepted",
    },
    Rejected: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
      label: "Rejected",
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("flex items-center gap-1", config.color)}
    >
      <IconComponent className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const ScoreBadge = ({ score }: { score: number | null }) => {
  if (score === null || score === undefined)
    return (
      <Badge
        variant="outline"
        className="font-mono bg-gray-100 text-gray-600 border-gray-200"
      >
        N/A
      </Badge>
    );

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <Badge variant="outline" className={cn("font-mono", getScoreColor(score))}>
      {score?.toFixed(1)}
    </Badge>
  );
};

const CandidatesApplicationsClient = ({
  candidatesData,
}: {
  candidatesData: Application[] | undefined;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all"
  );
  const candidates = candidatesData ?? [];
  const [filteredData, setFilteredData] = useState<Application[]>(candidates);

  const handleDelete = async (applicationId: string, applicantName: string) => {
    try {
      const result = await deleteApplicationAction(applicationId);

      if (result.success) {
        toast.success("Application deleted successfully!", {
          description: `${applicantName}'s application has been removed.`,
          duration: 4000,
        });

        // Update local state to remove the deleted item
        setFilteredData((prev) =>
          prev.filter((app) => app.id !== applicationId)
        );
      } else {
        toast.error("Failed to delete application", {
          description: result.error || "Please try again later.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Error deleting application", {
        description: "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
    }
  };

  // Filter data based on search and status
  React.useEffect(() => {
    let filtered = candidates;

    if (searchTerm) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.phone.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (candidate) => candidate.applicationStatus === statusFilter
      );
    }

    setFilteredData(filtered);
  }, [searchTerm, statusFilter, candidates]);

  const columns = [
    {
      header: "Applicant",
      accessor: "fullName",
      cell: (row: Application) => (
        <div className="space-y-1">
          <div className="font-medium">{row.fullName}</div>
          <div className="text-sm text-muted-foreground">{row.email}</div>
          <div className="text-xs text-muted-foreground">{row.phone}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "applicationStatus",
      cell: (row: Application) => (
        <StatusBadge status={row.applicationStatus} />
      ),
    },
    {
      header: "AI Score",
      accessor: "overallScore",
      cell: (row: Application) => <ScoreBadge score={row.overallScore} />,
    },
    {
      header: "Applied",
      accessor: "createdAt",
      cell: (row: Application) => {
        // Convert Firebase timestamp to JavaScript Date
        const convertFirebaseTimestamp = (timestamp: any) => {
          if (timestamp && timestamp.seconds) {
            return new Date(
              timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
            );
          }
          // Fallback for regular date strings
          return new Date(timestamp);
        };

        const date = convertFirebaseTimestamp(row.createdAt);

        return (
          <div className="text-sm">
            <div>{date.toLocaleDateString()}</div>
            <div className="text-xs text-muted-foreground">
              {date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        );
      },
    },
    {
      header: "Experience",
      accessor: "experience",
      cell: (row: Application) => (
        <div className="text-sm">{row.resumeAnalysis?.experience}</div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: Application) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/candidate-application/${row.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>
          </Link>
          {/* ✅ UPDATED: Delete button with proper handler */}
          {row.applicationStatus === "Rejected" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(row.id, row.fullName)}
              className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 border-red-200 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  const stats = {
    total: candidates.length,
    pending: candidates.filter((c) => c.applicationStatus === "Pending").length,
    accepted: candidates.filter((c) => c.applicationStatus === "Accepted")
      .length,
    rejected: candidates.filter((c) => c.applicationStatus === "Rejected")
      .length,
  };

  return (
    <div className="space-y-3">
      {/* Filters Section */}
      <Card className="border-0 py-4  shadow-sm  backdrop-blur-sm">
        <CardContent className="px-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  key: "all",
                  label: "All",
                  count: stats.total,
                  color: "bg-gray-100 text-gray-700",
                },
                {
                  key: "Pending",
                  label: "Pending",
                  count: stats.pending,
                  color: "bg-yellow-100 text-yellow-800",
                },
                {
                  key: "Accepted",
                  label: "Accepted",
                  count: stats.accepted,
                  color: "bg-green-100 text-green-800",
                },
                {
                  key: "Rejected",
                  label: "Rejected",
                  count: stats.rejected,
                  color: "bg-red-100 text-red-800",
                },
              ].map((statusObj) => (
                <Button
                  key={statusObj.key}
                  variant={
                    statusFilter === statusObj.key ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setStatusFilter(statusObj.key as ApplicationStatus | "all")
                  }
                  className={cn(
                    "capitalize flex items-center gap-2",
                    statusFilter === statusObj.key &&
                      "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  )}
                >
                  <span>{statusObj.label}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs px-1 py-0.5 rounded-full",
                      statusObj.color,
                      statusFilter === statusObj.key && "bg-white/20 text-white"
                    )}
                  >
                    {statusObj.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border shadow-sm">
        <ProjectTable
          data={filteredData}
          columns={columns}
          emptyMessage="No applications found matching your criteria"
          itemsPerPage={5}
        />
      </div>
    </div>
  );
};

export default CandidatesApplicationsClient;
