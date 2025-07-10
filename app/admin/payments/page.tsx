"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProjectTable from "@/components/ui-custom/ProjectTable";

const mockPayments = [
  {
    id: "1",
    clientName: "Alice Sharma",
    email: "alice@example.com",
    projectName: "AI Assistant",
    modeOfPayment: "UPI",
    paidAmount: 25000,
    receiptUrl: "/receipts/receipt-1.png",
  },
  {
    id: "2",
    clientName: "Rahul Verma",
    email: "rahul@example.com",
    projectName: "E-commerce Site",
    modeOfPayment: "Credit Card",
    paidAmount: 40000,
    receiptUrl: "/receipts/receipt-2.png",
  },
];

const Payments = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = mockPayments.filter((payment) =>
    payment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            placeholder="Search clients or projects..."
            className="pl-9 w-full sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden glassmorphism shadow-sm">
        <ProjectTable
          data={filteredPayments}
          columns={[
            { header: "Client Name", accessor: "clientName" },
            { header: "Project Name", accessor: "projectName" },
            { header: "Email", accessor: "email" },
            { header: "Mode of Payment", accessor: "modeOfPayment" },
            {
              header: "Paid Amount",
              accessor: "paidAmount",
              cell: (row) => `₹${row.paidAmount.toLocaleString()}`,
            },
            {
              header: "Actions",
              accessor: "actions",
              cell: (row) => (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-1">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Payment Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <p><strong>Client:</strong> {row.clientName}</p>
                      <p><strong>Project:</strong> {row.projectName}</p>
                      <p><strong>Email:</strong> {row.email}</p>
                      <p><strong>Mode of Payment:</strong> {row.modeOfPayment}</p>
                      <p><strong>Amount Paid:</strong> ₹{row.paidAmount.toLocaleString()}</p>
                      <p><strong>Receipt:</strong></p>
                      <img
                        src={row.receiptUrl}
                        alt="Payment Receipt"
                        className="w-full h-auto border rounded-md"
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="destructive">Reject</Button>
                        <Button>Verify</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ),
            },
          ]}
          itemsPerPage={5}
          emptyMessage="No payment records found"
        />
      </div>

      {filteredPayments.length === 0 && searchQuery && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            No payments found matching "{searchQuery}"
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

export default Payments;
