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

const PasswordTab = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSavePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("All password fields are required")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long")
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("New password must be different from current password")
      return
    }

    setIsLoading(true)

    try {
      const user = auth.currentUser
      if (!user || !user.email) {
        toast.error("User not authenticated")
        return
      }

      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword)

      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, passwordForm.newPassword)

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast.success("Password updated successfully!")
    } catch (error: any) {
      console.error("Password update error:", error)

      if (error.code === "auth/wrong-password") {
        toast.error("Current password is incorrect")
      } else if (error.code === "auth/weak-password") {
        toast.error("New password is too weak")
      } else {
        toast.error("Failed to update password. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your password to maintain account security</CardDescription>
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
          disabled={isLoading}
        >
          Reset Fields
        </Button>
        <Button className="flex items-center gap-1" onClick={handleSavePassword} disabled={isLoading}>
          <Lock className="h-4 w-4" />
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default PasswordTab
