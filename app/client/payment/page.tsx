"use client"
import type React from "react"
import { useEffect, useState } from "react"
import Layout from "@/components/layout/Layout"
import { useAuthStore, type UserProfile } from "@/lib/store/userStore"
import { toast } from "sonner"
import { getAllPaymentDetailsAction } from "@/app/actions/common-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CreditCard, Smartphone, Building2, ExternalLink, Copy, CheckCircle, XCircle, Info } from "lucide-react"
import ProjectTable from "@/components/ui-custom/ProjectTable"
import { motion } from "framer-motion"
import { uploadReceiptToCloudinary } from "@/lib/cloudinary"
import { log } from "console"

type PaymentDetailsForm = {
  paypal: {
    email: string
    accountName: string
  }
  upi: {
    upiId: string
    qrCodeUrl: string
  }
  bankDetails: {
    accountHolderName: string
    accountNumber: string
    bankName: string
    ifscCode: string
    branchName: string
  }
}

type PaymentRecord = {
  clientName: string
  projectName: string
  email: string
  modeOfPayment: string
  paidAmount: number
  currency: string
  receiptUrl: string
  status: "pending" | "verified" | "rejected"
  createdAt: string
}

type ReceiptForm = {
  projectName: string
  amount: string
  currency: string
  paymentMode: string
  receipt: File | null
}

const Payment = () => {
    const { profile, setProfile } = useAuthStore();
    console.log(profile);
    
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsForm>({
    paypal: {
      email: "",
      accountName: "",
    },
    upi: {
      upiId: "",
      qrCodeUrl: "",
    },
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      branchName: "",
    },
  })

  const [receiptForm, setReceiptForm] = useState<ReceiptForm>({
    projectName: "",
    amount: "",
    currency: "INR",
    paymentMode: "",
    receipt: null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([
    // Mock data - replace with actual data from your backend
    {
      id: "1",
      clientName: "John Doe",
      projectName: "E-commerce Website",
      email: "john@example.com",
      modeOfPayment: "UPI",
      paidAmount: 50000,
      currency: "INR",
      receiptUrl: "/placeholder.svg?height=400&width=300",
      status: "pending",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      clientName: "Jane Smith",
      projectName: "Mobile App Development",
      email: "jane@example.com",
      modeOfPayment: "Bank Transfer",
      paidAmount: 750,
      currency: "USD",
      receiptUrl: "/placeholder.svg?height=400&width=300",
      status: "verified",
      createdAt: "2024-01-14",
    },
  ])

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

  const handleLoadPaymentDetails = async () => {
    if (!profile?.uid) return
    try {
      const result = await getAllPaymentDetailsAction()
      if (result.success && result.data && result.data.length > 0) {
        const paymentData = result.data[0]
        setPaymentDetails({
          paypal: paymentData.paypal || { email: "", accountName: "" },
          upi: paymentData.upi || { upiId: "", qrCodeUrl: "" },
          bankDetails: paymentData.bankDetails || {
            accountHolderName: "",
            accountNumber: "",
            bankName: "",
            ifscCode: "",
            branchName: "",
          },
        })
      } else if (result.error && result.error !== "Payment details not found") {
        toast.error(result.error)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load payment details")
    }
  }

  const handleReceiptFormChange = (field: keyof ReceiptForm, value: string | File | null) => {
    setReceiptForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleReceiptFormChange("receipt", e.target.files[0])
    }
  }

  const handleSubmitReceipt = async () => {
    if (!receiptForm.projectName || !receiptForm.amount || !receiptForm.currency || !receiptForm.paymentMode || !receiptForm.receipt) {
      toast.error("Please fill all fields and upload a receipt")
      return
    }

    setIsSubmitting(true)
    try {
      // Here you would upload the receipt and save the payment record
       const receiptUrl = await uploadReceiptToCloudinary(receiptForm.receipt);
      // const paymentRecord = await savePaymentRecord({...receiptForm, receiptUrl});

      // Mock success
      const newRecord: PaymentRecord = {
        clientName: profile?.name || "Unknown",
        projectName: receiptForm.projectName,
        email: profile?.email || "",
        modeOfPayment: receiptForm.paymentMode,
        paidAmount: Number.parseFloat(receiptForm.amount),
        currency: receiptForm.currency,
        receiptUrl: receiptUrl,
        status: "pending",
        createdAt: new Date().toISOString().split("T")[0],
      }

      setPaymentRecords((prev) => [newRecord, ...prev])
      setReceiptForm({
        projectName: "",
        amount: "",
        currency: "INR",
        paymentMode: "",
        receipt: null,
      })

      toast.success("Payment receipt submitted successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to submit receipt")
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  useEffect(() => {
    if (profile) {
      handleLoadPaymentDetails()
    }
  }, [profile])

  const hasPayPal = paymentDetails.paypal.email && paymentDetails.paypal.accountName
  const hasUPI = paymentDetails.upi.upiId
  const hasBankDetails =
    paymentDetails.bankDetails.accountHolderName &&
    paymentDetails.bankDetails.accountNumber &&
    paymentDetails.bankDetails.bankName

  return (
    <Layout
      user={profile || ({} as UserProfile)}
      title="Payment"
      description="Manage your payment details and receipts"
    >
      <div className="space-y-8">
        {/* Information Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className="border-blue-200 bg-blue-50 text-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription>
              For payment-related queries, please contact{" "}
              <a 
                href="mailto:client-relations@cehpoint.co.in" 
                className="font-medium underline hover:text-blue-600"
              >
                client-relations@cehpoint.co.in
              </a>
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Payment Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-6"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* PayPal Card */}
            {hasPayPal && (
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    PayPal
                  </CardTitle>
                  <CardDescription>PayPal payment details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{paymentDetails.paypal.email}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentDetails.paypal.email)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Account Name</Label>
                    <p className="text-sm font-medium">{paymentDetails.paypal.accountName}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* UPI Card */}
            {hasUPI && (
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    UPI
                  </CardTitle>
                  <CardDescription>UPI payment details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">UPI ID</Label>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{paymentDetails.upi.upiId}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentDetails.upi.upiId)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {paymentDetails.upi.qrCodeUrl && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">QR Code</Label>
                      <div className="mt-2">
                        <img
                          src={paymentDetails.upi.qrCodeUrl || "/placeholder.svg?height=200&width=200"}
                          alt="UPI QR Code"
                          className="w-32 h-32 object-cover rounded-lg border mx-auto"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Bank Details Card */}
            {hasBankDetails && (
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    Bank Transfer
                  </CardTitle>
                  <CardDescription>Bank account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Account Holder</Label>
                    <p className="text-sm font-medium">{paymentDetails.bankDetails.accountHolderName}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Account Number</Label>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">****{paymentDetails.bankDetails.accountNumber.slice(-4)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentDetails.bankDetails.accountNumber)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Bank & IFSC</Label>
                    <p className="text-sm font-medium">{paymentDetails.bankDetails.bankName}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{paymentDetails.bankDetails.ifscCode}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentDetails.bankDetails.ifscCode)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {!hasPayPal && !hasUPI && !hasBankDetails && (
            <Card className="text-center py-8">
              <CardContent>
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payment Methods Configured</h3>
                <p className="text-muted-foreground mb-4">
                  Configure your payment methods in settings to start receiving payments
                </p>
                <Button>Configure Payment Methods</Button>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <Separator />

        {/* Receipt Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Submit Payment Receipt
              </CardTitle>
              <CardDescription>Upload your payment receipt for verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    placeholder="Enter project name"
                    value={receiptForm.projectName}
                    onChange={(e) => handleReceiptFormChange("projectName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select
                    value={receiptForm.currency}
                    onValueChange={(value) => handleReceiptFormChange("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      {getCurrencySymbol(receiptForm.currency)}
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={receiptForm.amount}
                      onChange={(e) => handleReceiptFormChange("amount", e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Payment Mode *</Label>
                  <Select
                    value={receiptForm.paymentMode}
                    onValueChange={(value) => handleReceiptFormChange("paymentMode", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {hasPayPal && <SelectItem value="PayPal">PayPal</SelectItem>}
                      {hasUPI && <SelectItem value="UPI">UPI</SelectItem>}
                      {hasBankDetails && <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">Upload Receipt *</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleReceiptUpload}
                  className="cursor-pointer"
                />
                {receiptForm.receipt && (
                  <p className="text-sm text-muted-foreground">Selected: {receiptForm.receipt.name}</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSubmitReceipt} disabled={isSubmitting} className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit Receipt"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Separator />

        {/* Payment Records Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Payment Records</h2>
              <p className="text-muted-foreground">Track all your payment submissions and their status</p>
            </div>

            <ProjectTable
              data={paymentRecords}
              columns={[
                { header: "Name", accessor: "clientName" },
                { header: "Project Name", accessor: "projectName" },
                { header: "Email", accessor: "email" },
                { header: "Payment Mode", accessor: "modeOfPayment" },
                {
                  header: "Amount",
                  accessor: "paidAmount",
                  cell: (row) => formatAmount(row.paidAmount, row.currency),
                },
                {
                  header: "Status",
                  accessor: "status",
                  cell: (row) => (
                    <Badge
                      variant={
                        row.status === "verified" ? "default" : row.status === "rejected" ? "destructive" : "secondary"
                      }
                      className="flex items-center gap-1"
                    >
                      {row.status === "verified" && <CheckCircle className="h-3 w-3" />}
                      {row.status === "rejected" && <XCircle className="h-3 w-3" />}
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </Badge>
                  ),
                },
              ]}
              itemsPerPage={5}
              emptyMessage="No payment records found"
            />
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Payment