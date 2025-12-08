"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
// Types for our table
export type ProjectStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "rejected"
  | "delayed";

type Column = {
  header: string;
  accessor: string;
  cell?: (row: any) => React.ReactNode;
};

type ProjectTableProps = {
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
  baseRoute?: string;
  emptyMessage?: string;
  itemsPerPage?: number;
  loading?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
};

const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  let bgColor = "";
  let textColor = "";
  let icon = null;
  let label = "";

  switch (status) {
    case "pending":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-700";
      icon = <Clock className="h-3.5 w-3.5 mr-1" />;
      label = "Pending";
      break;
    case "in-progress":
      bgColor = "bg-blue-100";
      textColor = "text-blue-700";
      icon = <Clock className="h-3.5 w-3.5 mr-1" />;
      label = "In Progress";
      break;
    case "completed":
      bgColor = "bg-green-100";
      textColor = "text-green-700";
      icon = <CheckCircle className="h-3.5 w-3.5 mr-1" />;
      label = "Completed";
      break;
    case "rejected":
      bgColor = "bg-red-100";
      textColor = "text-red-700";
      icon = <XCircle className="h-3.5 w-3.5 mr-1" />;
      label = "Rejected";
      break;
    case "delayed":
      bgColor = "bg-orange-100";
      textColor = "text-orange-700";
      icon = <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      label = "Delayed";
      break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-700";
      label = status;
  }

  return (
    <span
      className={cn(
        "px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit",
        bgColor,
        textColor
      )}
    >
      {icon}
      {label}
    </span>
  );
};

// Skeleton loading animation component
const SkeletonRow = ({ columns }: { columns: number }) => {
  return (
    <TableRow className="animate-pulse">
      {Array.from({ length: columns }).map((_, index) => (
        <TableCell key={index}>
          <div className="h-5 bg-muted/60 rounded w-[80%]"></div>
        </TableCell>
      ))}
    </TableRow>
  );
};
const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

const ProjectTable: React.FC<ProjectTableProps> = ({
  data,
  columns,
  emptyMessage = "No data available",
  itemsPerPage = 5,
  loading = false,
  currentPage: externalCurrentPage,
  onPageChange,
}) => {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);

  const currentPage = externalCurrentPage || internalCurrentPage;

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  // Animation variants for rows
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut" as const,
      },
    }),
  };

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg glassmorphism ">
        <Table className="w-full">
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className="font-medium">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Display skeleton loading rows
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <SkeletonRow key={index} columns={columns.length} />
              ))
            ) : currentItems.length > 0 ? (
              currentItems.map((row, rowIndex) => (
                <motion.tr
                  key={row.id || rowIndex}
                  className={cn(
                    "transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                    hoveredRowId === row.id && "bg-muted/30"
                  )}
                  onMouseEnter={() => setHoveredRowId(row.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  initial="hidden"
                  animate="visible"
                  custom={rowIndex}
                  variants={rowVariants}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell ? (
                        column.cell(row)
                      ) : column.accessor === "status" ? (
                        <StatusBadge
                          status={row[column.accessor] as ProjectStatus}
                        />
                      ) : column.accessor === "progress" ? (
                        <ProgressBar value={row[column.accessor]} />
                      ) : column.accessor === "actions" ? (
                        <Button variant="ghost" size="icon" asChild>
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        row[column.accessor]
                      )}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader className="h-5 w-5 animate-spin mr-2" />
                      <span>Loading data...</span>
                    </div>
                  ) : (
                    emptyMessage
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex justify-center m-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;

                // Show first page, last page, current page, and pages around current
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 &&
                    pageNumber <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNumber);
                        }}
                        isActive={pageNumber === currentPage}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  (pageNumber === 2 && currentPage > 3) ||
                  (pageNumber === totalPages - 1 &&
                    currentPage < totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      handlePageChange(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ProjectTable;
