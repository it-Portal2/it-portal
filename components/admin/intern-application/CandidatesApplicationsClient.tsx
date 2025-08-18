"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent} from "@/components/ui/card";
import {
  Search,
  Eye,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import { InsertApplication } from "@/lib/types";

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
  if (score === null) return <span className="text-muted-foreground">-</span>;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <Badge variant="outline" className={cn("font-mono", getScoreColor(score))}>
      {score.toFixed(1)}
    </Badge>
  );
};

const CandidatesApplicationsClient = ({ candidatesData, }: {
  candidatesData:InsertApplication[]
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all"
  );
  const [filteredData, setFilteredData] = useState(candidatesData);

  // Filter data based on search and status
  React.useEffect(() => {
    let filtered = candidatesData;

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
  }, [searchTerm, statusFilter]);

  const columns = [
    {
      header: "Applicant",
      accessor: "fullName",
      cell: (row: any) => (
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
      cell: (row: any) => <StatusBadge status={row.applicationStatus} />,
    },
    {
      header: "AI Score",
      accessor: "overallScore",
      cell: (row: any) => <ScoreBadge score={row.overallScore} />,
    },
    {
      header: "Applied",
      accessor: "createdAt",
      cell: (row: any) => (
        <div className="text-sm">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Experience",
      accessor: "experience",
      cell: (row: any) => (
        <div className="text-sm">{row.resumeAnalysis.experience}</div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/intern-application/${row.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>
          </Link>
          {row.applicationStatus === "Rejected" && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-red-50 text-red-600 hover:text-red-700 border-red-200 "
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  const stats = {
    total: candidatesData.length,
    pending: candidatesData.filter((c) => c.applicationStatus === "pending")
      .length,
    accepted: candidatesData.filter((c) => c.applicationStatus === "accepted")
      .length,
    rejected: candidatesData.filter((c) => c.applicationStatus === "rejected")
      .length,
  };

  return (
    <div className=" space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Users className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
        <CardContent>
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
              {["all", "Pending", "Accepted", "Rejected"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setStatusFilter(status as ApplicationStatus | "all")
                  }
                  className={cn(
                    "capitalize",
                    statusFilter === status &&
                      "bg-gradient-to-r from-blue-600 to-indigo-600"
                  )}
                >
                  {status === "all" ? "All" : status.replace("-", " ")}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <div className="rounded-lg border shadow-sm">
        <ProjectTable
          data={filteredData}
          columns={columns}
          emptyMessage="No applications found matching your criteria"
          itemsPerPage={10}
        />
      </div>
    </div>
  );
};

export default CandidatesApplicationsClient;
