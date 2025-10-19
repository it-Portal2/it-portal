"use client"

import type React from "react"
import { useState } from "react"
import { Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { auth } from "@/firebase"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface LoadingState {
  admin: boolean
  developer: boolean
}

const PasswordTab = () => {
  const [isLoading, setIsLoading] = useState<LoadingState>({
    admin: false,
    developer: false
  })

  const [adminPasswordForm, setAdminPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // const [developerPasswordForm, setDeveloperPasswordForm] = useState<PasswordForm>({
  //   currentPassword: "",
  //   newPassword: "",
  //   confirmPassword: "",
  // })

  const handleAdminPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAdminPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // const handleDeveloperPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target
  //   setDeveloperPasswordForm((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }))
  // }

  const validatePasswordForm = (form: PasswordForm, userType: string): boolean => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error(`All ${userType} password fields are required`)
      return false
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match", {
        description: "New password and confirm password must match.",
      })
      return false
    }

    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long")
      return false
    }

    if (form.currentPassword === form.newPassword) {
      toast.error("New password must be different from current password")
      return false
    }

    return true
  }

  const updateAdminPassword = async (form: PasswordForm) => {
    if (!validatePasswordForm(form, 'admin')) {
      return
    }

    setIsLoading((prev) => ({ ...prev, admin: true }))

    try {
      const user = auth.currentUser
      if (!user || !user.email) {
        toast.error("User not authenticated")
        return
      }

      const credential = EmailAuthProvider.credential(user.email, form.currentPassword)
      
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, form.newPassword)

      setAdminPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast.success("Admin password updated successfully!")
    } catch (error: any) {
      console.error("Admin password update error:", error)

      if (error.code === "auth/wrong-password") {
        toast.error("Current password is incorrect")
      } else if (error.code === "auth/weak-password") {
        toast.error("New password is too weak")
      } else if (error.code === "auth/requires-recent-login") {
        toast.error("Please sign out and sign back in before changing your password")
      } else {
        toast.error(error.message || "Failed to update admin password. Please try again.")
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, admin: false }))
    }
  }

  // const updateDeveloperPassword = async (form: PasswordForm) => {
  //   if (!validatePasswordForm(form, 'developer')) {
  //     return
  //   }

  //   setIsLoading((prev) => ({ ...prev, developer: true }))

  //   try {
  //     const developerEmail = "developer@gmail.com"
      
  //     // Create credential for developer email
  //     const credential = EmailAuthProvider.credential(developerEmail, form.currentPassword)
      
  //     // Sign in as developer temporarily to update password
  //     const { signInWithEmailAndPassword } = await import("firebase/auth")
  //     const developerUser = await signInWithEmailAndPassword(auth, developerEmail, form.currentPassword)
      
  //     if (!developerUser.user) {
  //       throw new Error("Failed to authenticate developer account")
  //     }

  //     // Update developer password
  //     await updatePassword(developerUser.user, form.newPassword)

  //     setDeveloperPasswordForm({
  //       currentPassword: "",
  //       newPassword: "",
  //       confirmPassword: "",
  //     })

  //     toast.success("Developer password updated successfully!")
      
  //     // Note: You might want to sign back in as the original admin user here
  //     // This depends on your application's authentication flow requirements
      
  //   } catch (error: any) {
  //     console.error("Developer password update error:", error)

  //     if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
  //       toast.error("Developer current password is incorrect")
  //     } else if (error.code === "auth/weak-password") {
  //       toast.error("New password is too weak")
  //     } else if (error.code === "auth/too-many-requests") {
  //       toast.error("Too many failed attempts. Please try again later.")
  //     } else {
  //       toast.error(error.message || "Failed to update developer password. Please try again.")
  //     }
  //   } finally {
  //     setIsLoading((prev) => ({ ...prev, developer: false }))
  //   }
  // }

  const handleSaveAdminPassword = () => updateAdminPassword(adminPasswordForm)
  // const handleSaveDeveloperPassword = () => updateDeveloperPassword(developerPasswordForm)

  const resetAdminFields = () => {
    setAdminPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  // const resetDeveloperFields = () => {
  //   setDeveloperPasswordForm({
  //     currentPassword: "",
  //     newPassword: "",
  //     confirmPassword: "",
  //   })
  // }

  const renderPasswordCard = (
    title: string,
    description: string,
    form: PasswordForm,
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    handleSave: () => void,
    resetFields: () => void,
    loading: boolean,
    userType: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${userType}CurrentPassword`}>Current Password</Label>
          <Input
            id={`${userType}CurrentPassword`}
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${userType}NewPassword`}>New Password</Label>
          <Input
            id={`${userType}NewPassword`}
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${userType}ConfirmPassword`}>Confirm New Password</Label>
          <Input
            id={`${userType}ConfirmPassword`}
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={resetFields}
          disabled={loading}
        >
          Reset Fields
        </Button>
        <Button 
          className="flex items-center gap-1" 
          onClick={handleSave} 
          disabled={loading}
        >
          <Lock className="h-4 w-4" />
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Admin Password Section */}
      {renderPasswordCard(
        "Admin Password Change",
        "Update Admin's password to maintain account security",
        adminPasswordForm,
        handleAdminPasswordChange,
        handleSaveAdminPassword,
        resetAdminFields,
        isLoading.admin,
        "admin"
      )}

      {/* Developer Password Section */}
      {/* {renderPasswordCard(
        "Developer Password Change",
        "Update Developer's password to maintain account security",
        developerPasswordForm,
        handleDeveloperPasswordChange,
        handleSaveDeveloperPassword,
        resetDeveloperFields,
        isLoading.developer,
        "developer"
      )} */}
    </div>
  )
}

export default PasswordTab