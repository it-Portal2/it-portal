"use client"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  User,
  FileText,
  Percent,
} from "lucide-react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ProjectTable from "@/components/ui-custom/ProjectTable"
import { toast } from "sonner"
import { fetchAllPaymentRecordsAction, updatePaymentStatusAction } from "@/app/actions/admin-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { PaymentRecord } from "@/lib/firebase/client"

// Enhanced Payment Details Dialog
const PaymentDetailsDialog = ({
  payment,
  onStatusUpdate,
}: {
  payment: PaymentRecord
  onStatusUpdate: (id: string, status: "verified" | "rejected") => void
}) => {
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD":
        return "$"
      case "INR":
        return "₹"
      default:
        return "₹"
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${amount.toLocaleString()}`
  }

  const handleStatusUpdate = async (status: "verified" | "rejected") => {
    const result = await updatePaymentStatusAction(payment.id, status, "/admin/payments");
    if (result.success) {
      onStatusUpdate(payment.id, status);
      toast.success(`Payment ${status} successfully`);
    } else {
      toast.error(result.error || "Failed to update payment status");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1 bg-transparent">
          <ExternalLink className="h-3 w-3" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment Details - {payment.projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Quick Actions */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  payment.status === "verified"
                    ? "default"
                    : payment.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
                className="flex items-center gap-1"
              >
                {payment.status === "verified" && <CheckCircle className="h-3 w-3" />}
                {payment.status === "rejected" && <XCircle className="h-3 w-3" />}
                {payment.status === "pending" && <Clock className="h-3 w-3" />}
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Submitted on {new Date(payment.createdAt).toLocaleDateString()}
              </span>
            </div>
            {payment.status === "pending" && (
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={() => handleStatusUpdate("rejected")}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button size="sm" onClick={() => handleStatusUpdate("verified")}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verify
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{payment.clientName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{payment.clientEmail}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Project</Label>
                  <p className="font-medium">{payment.projectName}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Mode</Label>
                  <p className="font-medium">{payment.modeOfPayment}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Amount Paid</Label>
                  <p className="font-medium text-lg">{formatAmount(payment.paidAmount, payment.currency)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Type</Label>
                  <Badge variant="outline" className="w-fit">
                    {payment.paymentType === "full" ? "Full Payment" : "Installment Payment"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Installment Details */}
          {payment.paymentType === "installment" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Installment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Project Amount</Label>
                    <p className="font-medium text-lg">
                      {payment.totalProjectAmount
                        ? formatAmount(payment.totalProjectAmount, payment.currency)
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Percentage Paid</Label>
                    <p className="font-medium text-lg">{payment.installmentPercentage}%</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Remaining Amount</Label>
                    <p className="font-medium text-lg">
                      {payment.totalProjectAmount
                        ? formatAmount(payment.totalProjectAmount - payment.paidAmount, payment.currency)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Receipt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Payment Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/50">
                <img
                  src={payment.receiptUrl || "/placeholder.svg"}
                  alt="Payment Receipt"
                  className="w-full max-w-md mx-auto rounded-lg border"
                />
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Full Size
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const Payments = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all")
  const [percentageFilter, setPercentageFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"all" | "full" | "installment">("all")
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch payment records with filters
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true)
      try {
        const result = await fetchAllPaymentRecordsAction()
        if (result.success && result.data) {
          setPayments(result.data as PaymentRecord[]) // Explicitly cast to PaymentRecord[]
        } else {
          toast.error(result.error || "Failed to fetch payment records")
          setPayments([])
        }
      } catch (error) {
        console.error("Error fetching payments:", error)
        toast.error("Failed to fetch payment records")
        setPayments([])
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [statusFilter, paymentModeFilter, activeTab])

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD":
        return "$"
      case "INR":
        return "₹"
      default:
        return "₹"
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${amount.toLocaleString()}`
  }

  const handleStatusUpdate = (id: string, status: "verified" | "rejected") => {
    setPayments((prev) => prev.map((payment) => (payment.id === id ? { ...payment, status } : payment)))
  }

  // Filter payments based on all criteria
  const getFilteredPayments = () => {
    let filtered = payments || []

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (payment) =>
          payment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by payment type (tab)
    if (activeTab !== "all") {
      filtered = filtered.filter((payment) => payment.paymentType === activeTab)
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter)
    }

    // Filter by payment mode
    if (paymentModeFilter !== "all") {
      filtered = filtered.filter((payment) => payment.modeOfPayment === paymentModeFilter)
    }

    // Filter by percentage (only for installments)
    if (percentageFilter !== "all" && activeTab === "installment") {
      filtered = filtered.filter((payment) => {
        if (!payment.installmentPercentage) return false

        switch (percentageFilter) {
          case "low":
            return payment.installmentPercentage <= 30
          case "medium":
            return payment.installmentPercentage > 30 && payment.installmentPercentage <= 70
          case "high":
            return payment.installmentPercentage > 70
          default:
            return true
        }
      })
    }

    return filtered
  }

  const filteredPayments = getFilteredPayments()

  // Get statistics and counts for filters
  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    verified: payments.filter((p) => p.status === "verified").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
    fullPayments: payments.filter((p) => p.paymentType === "full").length,
    installmentPayments: payments.filter((p) => p.paymentType === "installment").length,
    
    // Payment mode counts
    upi: payments.filter((p) => p.modeOfPayment === "UPI").length,
    bankTransfer: payments.filter((p) => p.modeOfPayment === "Bank Transfer").length,
    paypal: payments.filter((p) => p.modeOfPayment === "PayPal").length,
    crypto: payments.filter((p) => p.modeOfPayment === "Cryptocurrency").length,
    
    // Percentage ranges for installments
    lowPercentage: payments.filter((p) => p.paymentType === "installment" && p.installmentPercentage && p.installmentPercentage <= 30).length,
    mediumPercentage: payments.filter((p) => p.paymentType === "installment" && p.installmentPercentage && p.installmentPercentage > 30 && p.installmentPercentage <= 70).length,
    highPercentage: payments.filter((p) => p.paymentType === "installment" && p.installmentPercentage && p.installmentPercentage > 70).length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[56px] w-full rounded-lg" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >

      {/* Search and Filters */}
      <Card className="py-4">
        <CardContent className="px-3">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients, projects, or emails..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({stats.total})</SelectItem>
                  <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
                  <SelectItem value="verified">Verified ({stats.verified})</SelectItem>
                  <SelectItem value="rejected">Rejected ({stats.rejected})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes ({stats.total})</SelectItem>
                  <SelectItem value="UPI">UPI ({stats.upi})</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer ({stats.bankTransfer})</SelectItem>
                  <SelectItem value="PayPal">PayPal ({stats.paypal})</SelectItem>
                  <SelectItem value="Cryptocurrency">Cryptocurrency ({stats.crypto})</SelectItem>
                </SelectContent>
              </Select>

              {activeTab === "installment" && (
                <Select value={percentageFilter} onValueChange={setPercentageFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Payment Amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Amounts ({stats.installmentPayments})</SelectItem>
                    <SelectItem value="low">Low Payment ≤30% ({stats.lowPercentage})</SelectItem>
                    <SelectItem value="medium">Medium Payment 31-70% ({stats.mediumPercentage})</SelectItem>
                    <SelectItem value="high">High Payment >70% ({stats.highPercentage})</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {(searchQuery || statusFilter !== "all" || paymentModeFilter !== "all" || percentageFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                    setPaymentModeFilter("all")
                    setPercentageFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Type Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "full" | "installment")}>
        <TabsList className="flex flex-col w-full h-full sm:h-auto sm:flex-row sm:w-auto">
          <TabsTrigger value="all" className="flex items-center gap-2 sm:w-auto w-full">
            <FileText className="h-4 w-4" />
            All Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="full" className="flex items-center gap-2 sm:w-auto w-full">
            <CheckCircle className="h-4 w-4" />
            Full Payments ({stats.fullPayments})
          </TabsTrigger>
          <TabsTrigger value="installment" className="flex items-center gap-2 sm:w-auto w-full">
            <TrendingUp className="h-4 w-4" />
            Installments ({stats.installmentPayments})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <PaymentTable payments={filteredPayments} onStatusUpdate={handleStatusUpdate} showInstallmentInfo={true} />
        </TabsContent>

        <TabsContent value="full" className="mt-6">
          <PaymentTable payments={filteredPayments} onStatusUpdate={handleStatusUpdate} showInstallmentInfo={false} />
        </TabsContent>

        <TabsContent value="installment" className="mt-6">
          <PaymentTable payments={filteredPayments} onStatusUpdate={handleStatusUpdate} showInstallmentInfo={true} />
        </TabsContent>
      </Tabs>

      {filteredPayments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? `No payments found matching "${searchQuery}"` : "No payments match your current filters"}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setPaymentModeFilter("all")
                setPercentageFilter("all")
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

// Separate Payment Table Component
const PaymentTable = ({
  payments = [],
  onStatusUpdate,
  showInstallmentInfo,
}: {
  payments?: PaymentRecord[]
  onStatusUpdate: (id: string, status: "verified" | "rejected") => void
  showInstallmentInfo: boolean
}) => {
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD":
        return "$"
      case "INR":
        return "₹"
      default:
        return "₹"
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${amount.toLocaleString()}`
  }

  const baseColumns = [
    { header: "Client Name", accessor: "clientName" as keyof PaymentRecord },
    { header: "Project Name", accessor: "projectName" as keyof PaymentRecord },
    { header: "Email", accessor: "clientEmail" as keyof PaymentRecord },
    { header: "Payment Mode", accessor: "modeOfPayment" as keyof PaymentRecord },
    {
      header: "Type",
      accessor: "paymentType" as keyof PaymentRecord,
      cell: (row: PaymentRecord) => (
        <Badge variant="outline" className="text-xs">
          {row.paymentType === "full" ? "Full" : "Installment"}
        </Badge>
      ),
    },
  ]

  const installmentColumns = showInstallmentInfo
    ? [
        {
          header: "Percentage",
          accessor: "installmentPercentage" as keyof PaymentRecord,
          cell: (row: PaymentRecord) => {
            if (row.paymentType === "installment" && row.installmentPercentage) {
              return (
                <Badge variant="outline" className="text-xs font-medium">
                  {row.installmentPercentage}%
                </Badge>
              )
            }
            return <span className="text-xs text-muted-foreground">N/A</span>
          },
        },
      ]
    : []

  const endColumns = [
    {
      header: "Amount",
      accessor: "paidAmount" as keyof PaymentRecord,
      cell: (row: PaymentRecord) => formatAmount(row.paidAmount, row.currency),
    },
    {
      header: "Status",
      accessor: "status" as keyof PaymentRecord,
      cell: (row: PaymentRecord) => (
        <Badge
          variant={row.status === "verified" ? "default" : row.status === "rejected" ? "destructive" : "secondary"}
          className="flex items-center gap-1"
        >
          {row.status === "verified" && <CheckCircle className="h-3 w-3" />}
          {row.status === "rejected" && <XCircle className="h-3 w-3" />}
          {row.status === "pending" && <Clock className="h-3 w-3" />}
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: "id" as keyof PaymentRecord,
      cell: (row: PaymentRecord) => <PaymentDetailsDialog payment={row} onStatusUpdate={onStatusUpdate} />,
    },
  ]

  const columns = [...baseColumns, ...installmentColumns, ...endColumns]

  return (
    <div className="rounded-lg overflow-hidden border">
      <ProjectTable data={payments} columns={columns} itemsPerPage={6} emptyMessage="No payment records found" />
    </div>
  )
}

export default Payments
