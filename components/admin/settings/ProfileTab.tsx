"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { uploadAvatarToCloudinary } from "@/lib/cloudinary"

import { useAuthStore } from "@/lib/store/userStore"
import { updateAvatar, updateProfile } from "@/app/actions/common-actions"

const ProfileTab = () => {
  const { profile, setProfile } = useAuthStore()
  const [isLoading, setIsLoading] = useState({
    profile: false,
    avatar: false,
  })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [profileForm, setProfileForm] = useState({
    fullName: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    photoUrl: profile?.avatar || "",
  })


  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.name || "",
        email: profile.email || "",
        // Don't show phone for subadmin users
        phone: profile.role === "subadmin" ? "" : (profile.phone || ""),
        photoUrl: profile.avatar || "",
      })
    }
  }, [profile])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

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

  const handleSaveProfile = async () => {
    if (!profile?.uid) {
      toast.error("Please sign in to update your profile");
      return;
    }
    setIsLoading((prev) => ({ ...prev, profile: true }));
    try {
      const profileData: any = {
        name: profileForm.fullName,
      };
      
      // Only include phone if user is not subadmin
      if (profile.role !== "subadmin") {
        profileData.phone = profileForm.phone;
      }

      const profileResult = await updateProfile(
        profile.uid,
        profileData,
        "/admin/settings"
      );
      if (profileResult.success) {
        const updatedProfile = {
          ...profile!,
          name: profileForm.fullName,
          ...(profile.role !== "subadmin" && { phone: profileForm.phone }),
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your account details and public profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={
                  profileForm.photoUrl ||
                  "https://ui-avatars.com/api/?background=random&name=User" ||
                  "/placeholder.svg"
                }
                alt={profileForm.fullName || "User"}
              />
              <AvatarFallback>
                {profileForm.fullName
                  ? profileForm.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "U"}
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
                onClick={() => document.getElementById("avatar-upload")?.click()}
                disabled={isLoading.avatar}
              >
                {isLoading.avatar ? "Uploading..." : "Change Avatar"}
              </Button>
              {isLoading.avatar && (
                <div className="w-full space-y-1">
                  <Progress value={uploadProgress} className="h-2 w-full" />
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
            {/* Conditionally render phone field - only if NOT subadmin */}
            {profile?.role !== "subadmin" && (
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
            )}
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
  )
}

export default ProfileTab
