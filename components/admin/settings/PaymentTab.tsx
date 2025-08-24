"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Save, CreditCard, Upload, Trash2, Edit, Bitcoin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { uploadUpiQrToCloudinary } from "@/lib/cloudinary";
import { getAllPaymentDetailsAction } from "@/app/actions/common-actions";
import {
  deletePaymentMethodAction,
  saveBankDetailsAction,
  saveCryptoDetailsAction,
  savePaypalDetailsAction,
  saveUpiDetailsAction,
} from "@/app/actions/admin-actions";
import { useAuthStore } from "@/lib/store/userStore";

type PaymentDetailsForm = {
  paypal: {
    email: string;
    accountName: string;
    paypalLink: string;
  };
  upi: {
    upiId: string;
    qrCodeUrl: string;
  };
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branchName: string;
  };
  crypto: {
    walletAddress: string;
    network: string;
    qrCodeUrl: string;
  };
};

const PaymentTab = () => {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState({
    paypal: false,
    crypto: false,
    cryptoQr: false,
    upi: false,
    bankDetails: false,
    upiQr: false,
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsForm>({
    paypal: {
      email: "",
      accountName: "",
      paypalLink: "",
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
    crypto: {
      walletAddress: "",
      network: "",
      qrCodeUrl: "",
    },
  });

  const handlePaymentChange = (
    section: keyof PaymentDetailsForm,
    field: string,
    value: string
  ) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleUpiQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile?.uid) {
      toast.error("Please sign in to update UPI QR code");
      return;
    }
    if (!e.target.files || !e.target.files[0]) return;

    setIsLoading((prev) => ({ ...prev, upiQr: true }));
    setUploadProgress(0);

    try {
      const file = e.target.files[0];
      const qrCodeUrl = await uploadUpiQrToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });

      setPaymentDetails((prev) => ({
        ...prev,
        upi: {
          ...prev.upi,
          qrCodeUrl: qrCodeUrl,
        },
      }));

      toast.success("UPI QR code uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "An error occurred while uploading QR code");
    } finally {
      setIsLoading((prev) => ({ ...prev, upiQr: false }));
      setUploadProgress(0);
    }
  };

  const handleDeleteUpiQr = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to delete UPI QR code");
      return;
    }

    try {
      const updatedUpiData = {
        ...paymentDetails.upi,
        qrCodeUrl: "",
      };

      const result = await saveUpiDetailsAction(profile.uid, updatedUpiData);

      if (result.success) {
        setPaymentDetails((prev) => ({
          ...prev,
          upi: {
            ...prev.upi,
            qrCodeUrl: "",
          },
        }));
        toast.success("UPI QR code removed successfully");
      } else {
        toast.error(result.error || "Failed to remove UPI QR code");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while removing QR code");
    }
  };

  const handleSavePayPal = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to save PayPal details");
      return;
    }

    if (!paymentDetails.paypal.email || !paymentDetails.paypal.accountName) {
      toast.error("Please fill in all PayPal details");
      return;
    }

    setIsLoading((prev) => ({ ...prev, paypal: true }));

    try {
      const result = await savePaypalDetailsAction(
        profile.uid,
        paymentDetails.paypal
      );

      if (result.success) {
        toast.success("PayPal details saved successfully");
      } else {
        toast.error(result.error || "Failed to save PayPal details");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save PayPal details");
    } finally {
      setIsLoading((prev) => ({ ...prev, paypal: false }));
    }
  };

  const handleSaveUpi = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to save UPI details");
      return;
    }

    if (!paymentDetails.upi.upiId) {
      toast.error("Please enter UPI ID");
      return;
    }

    setIsLoading((prev) => ({ ...prev, upi: true }));

    try {
      const result = await saveUpiDetailsAction(
        profile.uid,
        paymentDetails.upi
      );

      if (result.success) {
        toast.success("UPI details saved successfully");
      } else {
        toast.error(result.error || "Failed to save UPI details");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save UPI details");
    } finally {
      setIsLoading((prev) => ({ ...prev, upi: false }));
    }
  };

  const handleSaveBankDetails = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to save bank details");
      return;
    }

    const { accountHolderName, accountNumber, bankName, ifscCode, branchName } =
      paymentDetails.bankDetails;

    if (
      !accountHolderName ||
      !accountNumber ||
      !bankName ||
      !ifscCode ||
      !branchName
    ) {
      toast.error("Please fill in all bank details");
      return;
    }

    setIsLoading((prev) => ({ ...prev, bankDetails: true }));

    try {
      const result = await saveBankDetailsAction(
        profile.uid,
        paymentDetails.bankDetails
      );

      if (result.success) {
        toast.success("Bank details saved successfully");
      } else {
        toast.error(result.error || "Failed to save bank details");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save bank details");
    } finally {
      setIsLoading((prev) => ({ ...prev, bankDetails: false }));
    }
  };

  const handleLoadPaymentDetails = async () => {
    if (!profile?.uid) return;

    try {
      const result = await getAllPaymentDetailsAction();

      if (result.success && result.data && result.data.length > 0) {
        const paymentData = result.data[0];
        setPaymentDetails({
          paypal: paymentData.paypal || {
            email: "",
            accountName: "",
            paypalLink: "",
          },
          upi: paymentData.upi || { upiId: "", qrCodeUrl: "" },
          bankDetails: paymentData.bankDetails || {
            accountHolderName: "",
            accountNumber: "",
            bankName: "",
            ifscCode: "",
            branchName: "",
          },
          crypto: paymentData.crypto || {
            // Initialize crypto data
            walletAddress: "",
            network: "",
            qrCodeUrl: "",
          },
        });
      } else if (result.error && result.error !== "Payment details not found") {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load payment details");
    }
  };
  // Add new handler for crypto QR code upload
  const handleCryptoQrUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!profile?.uid) {
      toast.error("Please sign in to update crypto QR code");
      return;
    }
    if (!e.target.files || !e.target.files[0]) return;

    setIsLoading((prev) => ({ ...prev, cryptoQr: true }));
    setUploadProgress(0);

    try {
      const file = e.target.files[0];
      const qrCodeUrl = await uploadUpiQrToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });

      setPaymentDetails((prev) => ({
        ...prev,
        crypto: {
          ...prev.crypto,
          qrCodeUrl: qrCodeUrl,
        },
      }));

      toast.success("Crypto QR code uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "An error occurred while uploading QR code");
    } finally {
      setIsLoading((prev) => ({ ...prev, cryptoQr: false }));
      setUploadProgress(0);
    }
  };

  // Add new handler for deleting crypto QR code
  const handleDeleteCryptoQr = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to delete crypto QR code");
      return;
    }

    try {
      const updatedCryptoData = {
        ...paymentDetails.crypto,
        qrCodeUrl: "",
      };

      const result = await saveCryptoDetailsAction(
        profile.uid,
        updatedCryptoData
      );

      if (result.success) {
        setPaymentDetails((prev) => ({
          ...prev,
          crypto: {
            ...prev.crypto,
            qrCodeUrl: "",
          },
        }));
        toast.success("Crypto QR code removed successfully");
      } else {
        toast.error(result.error || "Failed to remove crypto QR code");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while removing QR code");
    }
  };

  // Add new handler for saving crypto details
  const handleSaveCrypto = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to save crypto details");
      return;
    }

    if (
      !paymentDetails.crypto.walletAddress ||
      !paymentDetails.crypto.network
    ) {
      toast.error("Please fill in all required crypto details");
      return;
    }

    setIsLoading((prev) => ({ ...prev, crypto: true }));

    try {
      const result = await saveCryptoDetailsAction(
        profile.uid,
        paymentDetails.crypto
      );

      if (result.success) {
        toast.success("Crypto details saved successfully");
      } else {
        toast.error(result.error || "Failed to save crypto details");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save crypto details");
    } finally {
      setIsLoading((prev) => ({ ...prev, crypto: false }));
    }
  };

  const handleDeletePaymentMethod = async (
    paymentType: keyof PaymentDetailsForm
  ) => {
    if (!profile?.uid) {
      toast.error("Please sign in to delete payment method");
      return;
    }

    try {
      const result = await deletePaymentMethodAction(profile.uid, paymentType);

      if (result.success) {
        setPaymentDetails((prev) => {
          const updated = { ...prev };
          switch (paymentType) {
            case "upi":
              updated.upi = { upiId: "", qrCodeUrl: "" };
              break;
            case "paypal":
              updated.paypal = { email: "", accountName: "", paypalLink: "" };
              break;
            case "bankDetails":
              updated.bankDetails = {
                accountHolderName: "",
                accountNumber: "",
                bankName: "",
                ifscCode: "",
                branchName: "",
              };
              break;
            case "crypto":
              updated.crypto = {
                walletAddress: "",
                network: "",
                qrCodeUrl: "",
              };
              break;
          }
          return updated;
        });

        toast.success(
          `${paymentType.toUpperCase()} details deleted successfully`
        );
      } else {
        toast.error(result.error || "Failed to delete payment method");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete payment method");
    }
  };
  useEffect(() => {
    handleLoadPaymentDetails();
  }, []);
  return (
    <div className="space-y-6">
      {/* PayPal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            PayPal Details
          </CardTitle>
          <CardDescription>
            Configure your PayPal account for payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paypalEmail">PayPal Email *</Label>
              <Input
                id="paypalEmail"
                type="email"
                placeholder="your-email@example.com"
                value={paymentDetails.paypal.email}
                onChange={(e) =>
                  handlePaymentChange("paypal", "email", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypalAccountName">Account Name *</Label>
              <Input
                id="paypalAccountName"
                placeholder="Account holder name"
                value={paymentDetails.paypal.accountName}
                onChange={(e) =>
                  handlePaymentChange("paypal", "accountName", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypalLink">PayPal Payment Link</Label>
              <Input
                id="paypalLink"
                type="url"
                placeholder="https://paypal.me/yourusername"
                value={paymentDetails.paypal.paypalLink}
                onChange={(e) =>
                  handlePaymentChange("paypal", "paypalLink", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            variant="destructive"
            onClick={() => handleDeletePaymentMethod("paypal")}
            className="flex items-center gap-1 w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            Delete PayPal
          </Button>
          <Button
            onClick={handleSavePayPal}
            disabled={isLoading.paypal}
            className="flex items-center gap-1 w-full sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {isLoading.paypal ? "Saving..." : "Save PayPal Details"}
          </Button>
        </CardFooter>
      </Card>

      {/* UPI Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            UPI Details
          </CardTitle>
          <CardDescription>
            Configure your UPI ID and QR code for payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID *</Label>
            <Input
              id="upiId"
              placeholder="yourname@paytm"
              value={paymentDetails.upi.upiId}
              onChange={(e) =>
                handlePaymentChange("upi", "upiId", e.target.value)
              }
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>UPI QR Code</Label>
            {paymentDetails.upi.qrCodeUrl ? (
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="relative">
                  <img
                    src={paymentDetails.upi.qrCodeUrl || "/placeholder.svg"}
                    alt="UPI QR Code"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    id="upi-qr-upload"
                    className="hidden"
                    onChange={handleUpiQrUpload}
                    accept="image/*"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("upi-qr-upload")?.click()
                    }
                    disabled={isLoading.upiQr}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Update QR Code
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteUpiQr}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove QR Code
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  type="file"
                  id="upi-qr-upload"
                  className="hidden"
                  onChange={handleUpiQrUpload}
                  accept="image/*"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("upi-qr-upload")?.click()
                  }
                  disabled={isLoading.upiQr}
                  className="flex items-center gap-1"
                >
                  <Upload className="h-4 w-4" />
                  {isLoading.upiQr ? "Uploading..." : "Upload QR Code"}
                </Button>
              </div>
            )}
            {isLoading.upiQr && (
              <div className="w-full space-y-1">
                <Progress value={uploadProgress} className="h-2 w-full" />
                <p className="text-xs text-center">{uploadProgress}%</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            variant="destructive"
            onClick={() => handleDeletePaymentMethod("upi")}
            className="flex items-center gap-1 w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            Delete UPI
          </Button>
          <Button
            onClick={handleSaveUpi}
            disabled={isLoading.upi}
            className="flex items-center gap-1 w-full sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {isLoading.upi ? "Saving..." : "Save UPI Details"}
          </Button>
        </CardFooter>
      </Card>

      {/* Bank Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Details
          </CardTitle>
          <CardDescription>
            Configure your bank account details for payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name *</Label>
              <Input
                id="accountHolderName"
                placeholder="Full name as per bank records"
                value={paymentDetails.bankDetails.accountHolderName}
                onChange={(e) =>
                  handlePaymentChange(
                    "bankDetails",
                    "accountHolderName",
                    e.target.value
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                placeholder="Bank account number"
                value={paymentDetails.bankDetails.accountNumber}
                onChange={(e) =>
                  handlePaymentChange(
                    "bankDetails",
                    "accountNumber",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                placeholder="Name of the bank"
                value={paymentDetails.bankDetails.bankName}
                onChange={(e) =>
                  handlePaymentChange("bankDetails", "bankName", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code *</Label>
              <Input
                id="ifscCode"
                placeholder="Bank IFSC code"
                value={paymentDetails.bankDetails.ifscCode}
                onChange={(e) =>
                  handlePaymentChange(
                    "bankDetails",
                    "ifscCode",
                    e.target.value.toUpperCase()
                  )
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchName">Branch Name *</Label>
            <Input
              id="branchName"
              placeholder="Bank branch name"
              value={paymentDetails.bankDetails.branchName}
              onChange={(e) =>
                handlePaymentChange("bankDetails", "branchName", e.target.value)
              }
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            variant="destructive"
            onClick={() => handleDeletePaymentMethod("bankDetails")}
             className="flex items-center gap-1 w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            Delete Bank Details
          </Button>
          <Button
            onClick={handleSaveBankDetails}
            disabled={isLoading.bankDetails}
            className="flex items-center gap-1 w-full sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {isLoading.bankDetails ? "Saving..." : "Save Bank Details"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
            Crypto Payment Details
          </CardTitle>
          <CardDescription>
            Configure your cryptocurrency wallet for payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="walletAddress">Wallet Address *</Label>
              <Input
                id="walletAddress"
                placeholder="0x... or bc1..."
                value={paymentDetails.crypto.walletAddress}
                onChange={(e) =>
                  handlePaymentChange("crypto", "walletAddress", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="network">Network *</Label>
              <Input
                id="network"
                placeholder="E.g., Ethereum, Bitcoin, Solana"
                value={paymentDetails.crypto.network}
                onChange={(e) =>
                  handlePaymentChange("crypto", "network", e.target.value)
                }
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Crypto Wallet QR Code</Label>
            {paymentDetails.crypto.qrCodeUrl ? (
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="relative">
                  <img
                    src={paymentDetails.crypto.qrCodeUrl || "/placeholder.svg"}
                    alt="Crypto Wallet QR Code"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    id="crypto-qr-upload"
                    className="hidden"
                    onChange={handleCryptoQrUpload}
                    accept="image/*"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("crypto-qr-upload")?.click()
                    }
                    disabled={isLoading.cryptoQr}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Update QR Code
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteCryptoQr}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove QR Code
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  type="file"
                  id="crypto-qr-upload"
                  className="hidden"
                  onChange={handleCryptoQrUpload}
                  accept="image/*"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("crypto-qr-upload")?.click()
                  }
                  disabled={isLoading.cryptoQr}
                  className="flex items-center gap-1"
                >
                  <Upload className="h-4 w-4" />
                  {isLoading.cryptoQr ? "Uploading..." : "Upload QR Code"}
                </Button>
              </div>
            )}
            {isLoading.cryptoQr && (
              <div className="w-full space-y-1">
                <Progress value={uploadProgress} className="h-2 w-full" />
                <p className="text-xs text-center">{uploadProgress}%</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            variant="destructive"
            onClick={() => handleDeletePaymentMethod("crypto")}
            className="flex items-center gap-1 w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            Delete Crypto
          </Button>
          <Button
            onClick={handleSaveCrypto}
            disabled={isLoading.crypto}
            className="flex items-center gap-1 w-full sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {isLoading.crypto ? "Saving..." : "Save Crypto Details"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentTab;
