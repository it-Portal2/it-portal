"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Lock, Save, CreditCard, Upload, Trash2, Edit } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  uploadAvatarToCloudinary,
  uploadUpiQrToCloudinary,
} from "@/lib/cloudinary";
import { getAllPaymentDetailsAction, updateAvatar, updateProfile } from "@/app/actions/common-actions";
import { useAuthStore } from "@/lib/store/userStore";
import { auth } from "@/firebase";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { Separator } from "@/components/ui/separator";
import {
  deletePaymentMethodAction,
  saveBankDetailsAction,
  savePaypalDetailsAction,
  saveUpiDetailsAction,
} from "@/app/actions/admin-actions";
type PaymentDetailsForm = {
  paypal: {
    email: string;
    accountName: string;
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
};

const AdminSettings = () => {
  const { profile, setProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState({
    profile: false,
    password: false,
    avatar: false,
    paypal: false,
    upi: false,
    bankDetails: false,
    upiQr: false,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profileForm, setProfileForm] = useState({
    fullName: profile?.name || "Admin User",
    email: profile?.email || "",
    phone: profile?.phone || "",
    photoUrl: profile?.avatar || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        photoUrl: profile.avatar || "",
      });

      handleLoadPaymentDetails();
    }
  }, [profile]);

  // Handle profile form changes
  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name !== "email") {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle payment form changes
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

  const handleSaveProfile = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to update your profile");
      return;
    }
    setIsLoading((prev) => ({ ...prev, profile: true }));
    try {
      const profileData = {
        name: profileForm.fullName,
        phone: profileForm.phone,
      };
      const profileResult = await updateProfile(
        profile.uid,
        profileData,
        "/admin/settings"
      );
      if (profileResult.success) {
        const updatedProfile = {
          ...profile!,
          name: profileForm.fullName,
          phone: profileForm.phone,
        };
        setProfile(updatedProfile);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating profile");
    } finally {
      setIsLoading((prev) => ({ ...prev, profile: false }));
    }
  };

  const handleSavePassword = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to update your password");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords don't match", {
        description: "New password and confirm password must match.",
      });
      return;
    }
    setIsLoading((prev) => ({ ...prev, password: true }));
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error("No authenticated user found");
      }
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordForm.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordForm.newPassword);
      toast.success("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        toast.error("Current password is incorrect");
      } else if (error.code === "auth/weak-password") {
        toast.error("New password is too weak");
      } else {
        toast.error(
          error.message || "An error occurred while updating password"
        );
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, password: false }));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile?.uid) {
      toast.error("Please sign in to update your avatar");
      return;
    }
    if (!e.target.files || !e.target.files[0]) return;
    setIsLoading((prev) => ({ ...prev, avatar: true }));
    setUploadProgress(0);
    try {
      const file = e.target.files[0];
      const avatarUrl = await uploadAvatarToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });
      const result = await updateAvatar(
        profile.uid,
        avatarUrl,
        "/admin/settings"
      );
      if (result.success) {
        const updatedProfile = {
          ...profile!,
          avatar: avatarUrl,
        };
        setProfile(updatedProfile);
        toast.success("Avatar updated successfully");
        setProfileForm((prev) => ({ ...prev, photoUrl: avatarUrl }));
      } else {
        toast.error(result.error || "Failed to update avatar");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating avatar");
    } finally {
      setIsLoading((prev) => ({ ...prev, avatar: false }));
      setUploadProgress(0);
    }
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

  // Additional helper functions
  const handleLoadPaymentDetails = async () => {
    if (!profile?.uid) return;

    try {
      const result = await getAllPaymentDetailsAction();

      if (result.success && result.data && result.data.length > 0) {
        // Take the first payment details object and extract only the needed fields
        const paymentData = result.data[0];
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
        });
      } else if (result.error && result.error !== "Payment details not found") {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load payment details");
    }
  };

const handleDeletePaymentMethod = async (paymentType: keyof PaymentDetailsForm) => {
  if (!profile?.uid) {
    toast.error("Please sign in to delete payment method");
    return;
  }
  
  try {
    const result = await deletePaymentMethodAction(profile.uid, paymentType);
    
    if (result.success) {
      // Reset the payment method in local state
      setPaymentDetails((prev) => {
        const updated = { ...prev };
        switch (paymentType) {
          case 'upi':
            updated.upi = { upiId: "", qrCodeUrl: "" };
            break;
          case 'paypal':
            updated.paypal = { email: "", accountName: "" };
            break;
          case 'bankDetails':
            updated.bankDetails = {
              accountHolderName: "",
              accountNumber: "",
              bankName: "",
              ifscCode: "",
              branchName: "",
            };
            break;
        }
        return updated;
      });
      
      toast.success(`${paymentType.toUpperCase()} details deleted successfully`);
    } else {
      toast.error(result.error || "Failed to delete payment method");
    }
  } catch (error: any) {
    toast.error(error.message || "Failed to delete payment method");
  }
};
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="payment">Payment Details</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and public profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={
                        profileForm.photoUrl ||
                        "https://ui-avatars.com/api/?background=random&name=Admin+User" ||
                        "/placeholder.svg"
                      }
                      alt={profileForm.fullName || "Admin User"}
                    />
                    <AvatarFallback>
                      {profileForm.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-full space-y-2">
                    <Input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      onChange={handleAvatarChange}
                      accept="image/*"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() =>
                        document.getElementById("avatar-upload")?.click()
                      }
                      disabled={isLoading.avatar}
                    >
                      {isLoading.avatar ? "Uploading..." : "Change Avatar"}
                    </Button>
                    {isLoading.avatar && (
                      <div className="w-full space-y-1">
                        <Progress
                          value={uploadProgress}
                          className="h-2 w-full"
                        />
                        <p className="text-xs text-center">{uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={profileForm.fullName}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        value={profileForm.email}
                        readOnly
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                className="flex items-center gap-1"
                onClick={handleSaveProfile}
                disabled={isLoading.profile}
              >
                <Save className="h-4 w-4" />
                {isLoading.profile ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to maintain account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  })
                }
                disabled={isLoading.password}
              >
                Reset Fields
              </Button>
              <Button
                className="flex items-center gap-1"
                onClick={handleSavePassword}
                disabled={isLoading.password}
              >
                <Lock className="h-4 w-4" />
                {isLoading.password ? "Updating..." : "Update Password"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6 mt-6">
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
                      handlePaymentChange(
                        "paypal",
                        "accountName",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="destructive"
                onClick={() => handleDeletePaymentMethod("paypal")}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete PayPal
              </Button>
              <Button
                onClick={handleSavePayPal}
                disabled={isLoading.paypal}
                className="flex items-center gap-1"
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
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="destructive"
                onClick={() => handleDeletePaymentMethod("upi")}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete UPI
              </Button>
              <Button
                onClick={handleSaveUpi}
                disabled={isLoading.upi}
                className="flex items-center gap-1"
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
                  <Label htmlFor="accountHolderName">
                    Account Holder Name *
                  </Label>
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
                      handlePaymentChange(
                        "bankDetails",
                        "bankName",
                        e.target.value
                      )
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
                    handlePaymentChange(
                      "bankDetails",
                      "branchName",
                      e.target.value
                    )
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="destructive"
                onClick={() => handleDeletePaymentMethod("bankDetails")}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete Bank Details
              </Button>
              <Button
                onClick={handleSaveBankDetails}
                disabled={isLoading.bankDetails}
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                {isLoading.bankDetails ? "Saving..." : "Save Bank Details"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AdminSettings;
