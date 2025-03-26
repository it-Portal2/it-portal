"use client";
import React, { useState, useEffect } from "react";
import { Key, Lock, Save, User } from "lucide-react";
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
import { uploadAvatarToCloudinary } from "@/lib/cloudinary";
import { updateAvatar, updateProfile } from "@/app/actions/common-actions";
import { useAuthStore } from "@/lib/store/userStore";
import { auth } from "@/firebase";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

const AdminSettings = () => {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState({
    profile: false,
    password: false,
    avatar: false,
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

  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        photoUrl: profile.avatar || "",
      });
    }
  }, [profile]);

  // Handle profile form changes
  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name !== "email") {
      // Prevent email changes if you want to keep it read-only like in ClientSettings
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
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

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 w-full md:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
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
                        "https://ui-avatars.com/api/?background=random&name=Admin+User"
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
                      className="w-full"
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
      </Tabs>
    </motion.div>
  );
};

export default AdminSettings;
