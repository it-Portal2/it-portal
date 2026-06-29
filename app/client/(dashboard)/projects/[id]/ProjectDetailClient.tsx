"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";
import type { PaymentRecord } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import ProjectDetailCard from "@/components/client components/dashboard/ProjectDetailCard";
import ProjectTimeline from "@/components/client components/dashboard/ProjectTimeline";
import DocumentsList from "@/components/ui-custom/DocumentsList";
import ProjectTable from "@/components/ui-custom/ProjectTable";

interface ProjectDetailClientProps {
  initialProject: Project | null;
  payments?: PaymentRecord[];
  error: string | null;
}

export default function ProjectDetailClient({
  initialProject,
  payments = [],
  error: initialError,
}: ProjectDetailClientProps) {
  const router = useRouter();
  const [project] = useState<Project | null>(initialProject);
  const [error] = useState<string | null>(initialError);

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-destructive font-medium">
          {error || "Project not found"}
        </p>
        <Link href="/client/" className="mt-4">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Dummy handlers for client view (no operations allowed)
  const handleDocumentRemoved = () => {
    // Client view - no operations allowed, so this won't be called
    console.log("Document operations not allowed in client view");
  };

  const handleAddDocuments = () => {
    // Client view - no operations allowed, so this won't be called
    console.log("Document operations not allowed in client view");
  };

  // Check if project has any documents to display
  const hasQuotationDocs = project.quotationDocuments && project.quotationDocuments.length > 0;
  const hasDeveloperDocs = project.developerDocuments && project.developerDocuments.length > 0;
  const hasAnyDocuments = hasQuotationDocs || hasDeveloperDocs;

  return (
    <>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProjectDetailCard project={project} />
          </div>
          <div>
            <ProjectTimeline project={project} />
          </div>
        </div>

        {/* Documents Section */}
        {hasAnyDocuments && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Project Documents</h2>
              <p className="text-muted-foreground mb-6">
                View and download project-related documents
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quotation Documents */}
              {hasQuotationDocs && (
                <DocumentsList
                  documents={project.quotationDocuments || []}
                  documentType="quotation"
                  projectId={project.id}
                  onDocumentRemoved={handleDocumentRemoved}
                  onAddDocuments={handleAddDocuments}
                />
              )}

              {/* Developer Documents */}
              {hasDeveloperDocs && (
                <DocumentsList
                  documents={project.developerDocuments || []}
                  documentType="developer"
                  projectId={project.id}
                  onDocumentRemoved={handleDocumentRemoved}
                  onAddDocuments={handleAddDocuments}
                />
              )}
            </div>
          </div>
        )}

        {/* Payments for this project (manual receipts + PayU online) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
            <p className="text-muted-foreground">
              Payments recorded against this project
            </p>
          </div>
          <ProjectTable
            data={payments}
            columns={[
              {
                header: "Date",
                accessor: "createdAt",
                cell: (row: PaymentRecord) =>
                  new Date(row.createdAt).toLocaleDateString(),
              },
              { header: "Payment Mode", accessor: "modeOfPayment" },
              {
                header: "Type",
                accessor: "paymentType",
                cell: (row: PaymentRecord) => (
                  <Badge variant="outline" className="text-xs">
                    {row.paymentType === "full" ? "Full" : "Installment"}
                  </Badge>
                ),
              },
              {
                header: "Amount",
                accessor: "paidAmount",
                cell: (row: PaymentRecord) =>
                  `${row.currency === "USD" ? "$" : "₹"}${row.paidAmount.toLocaleString()}`,
              },
              {
                header: "Status",
                accessor: "status",
                cell: (row: PaymentRecord) => (
                  <Badge
                    variant={
                      row.status === "verified"
                        ? "default"
                        : row.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className="flex items-center gap-1 w-fit"
                  >
                    {row.status === "verified" && (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    {row.status === "rejected" && (
                      <XCircle className="h-3 w-3" />
                    )}
                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                  </Badge>
                ),
              },
            ]}
            itemsPerPage={5}
            emptyMessage="No payments recorded for this project yet"
          />
        </div>
      </div>
    </>
  );
}
