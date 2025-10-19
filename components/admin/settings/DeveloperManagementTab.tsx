"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Trash2, Save, Plus } from "lucide-react";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createDeveloperAction, deleteDeveloperAction, fetchAllDevelopersAction, updateDeveloperAction } from "@/app/actions/admin-actions";


// Updated Types to match Firebase
type DeveloperRecord = {
  uid: string
  name: string | null
  email: string | null
  phone: string | null
  password: string | null
  avatar?: string | null
  role: "developer"
  createdAt: string
  lastLogin?: string | null
}

// Helpers
const formatDate = (iso?: string | null) => {
  if (!iso) return "N/A"
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

export default function DeveloperManagementTab() {
  // State management
  const [isFetching, setIsFetching] = React.useState(true)
  const [developers, setDevelopers] = React.useState<DeveloperRecord[]>([])

  // Load developers from Firebase
  React.useEffect(() => {
    const loadDevelopers = async () => {
      setIsFetching(true)
      try {
        const result = await fetchAllDevelopersAction()
        if (result.success && result.data) {
          setDevelopers(result.data)
        } else {
          toast.error(result.error || "Failed to load developers")
        }
      } catch (error) {
        console.error("Error loading developers:", error)
        toast.error("Failed to load developers")
      } finally {
        setIsFetching(false)
      }
    }

    loadDevelopers()
  }, [])

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [createLoading, setCreateLoading] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [newEmail, setNewEmail] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  
  // Validation states
  const [nameError, setNameError] = React.useState("")
  const [emailError, setEmailError] = React.useState("")
  const [passwordError, setPasswordError] = React.useState("")

  // View/edit dialog state
  const [isViewOpen, setIsViewOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<DeveloperRecord | null>(null)
  const [edited, setEdited] = React.useState<DeveloperRecord | null>(null)
  const [updateLoading, setUpdateLoading] = React.useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = React.useState<string | null>(null)
  const [showEditPassword, setShowEditPassword] = React.useState(false)

  // Validation functions
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  const clearErrors = () => {
    setNameError("")
    setEmailError("")
    setPasswordError("")
  }
  
  const validateFields = () => {
    let isValid = true
    clearErrors()
    
    if (!newName.trim()) {
      setNameError("Name is required")
      isValid = false
    }
    
    if (!newEmail.trim()) {
      setEmailError("Email is required")
      isValid = false
    } else if (!isValidEmail(newEmail.trim())) {
      setEmailError("Please enter a valid email address")
      isValid = false
    }
    
    if (!newPassword.trim()) {
      setPasswordError("Password is required")
      isValid = false
    } else if (newPassword.trim().length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      isValid = false
    }
    
    return isValid
  }

  const isEditedDirty = React.useMemo(() => {
    if (!selected || !edited) return false
    return (
      selected.name !== edited.name ||
      selected.email !== edited.email ||
      selected.phone !== edited.phone ||
      selected.password !== edited.password
    )
  }, [selected, edited])

  // Handlers with Firebase integration
  const openView = (row: DeveloperRecord) => {
    setSelected(row)
    setEdited({ ...row })
    setIsViewOpen(true)
    setShowEditPassword(false)
  }

  const handleCreate = async () => {
    if (!validateFields()) {
      return
    }
    
    setCreateLoading(true)
    try {
      const result = await createDeveloperAction(
        newEmail.trim(),
        newPassword.trim(),
        newName.trim()
      )
      
      if (result.success) {
        toast.success("Developer created successfully.")
        // Reload developers
        const developersResult = await fetchAllDevelopersAction()
        if (developersResult.success && developersResult.data) {
          setDevelopers(developersResult.data)
        }
        // Reset form
        setNewName("")
        setNewEmail("")
        setNewPassword("")
        setShowNewPassword(false)
        clearErrors()
        setIsCreateOpen(false)
      } else {
        toast.error(result.error || "Failed to create developer")
      }
    } catch (error) {
      console.error("Error creating developer:", error)
      toast.error("Failed to create developer")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selected || !edited || !isEditedDirty) return
    
    setUpdateLoading(true)
    try {
      const updates: any = {}
      if (edited.name !== selected.name) updates.name = edited.name
      if (edited.email !== selected.email) updates.email = edited.email
      if (edited.phone !== selected.phone) updates.phone = edited.phone
      if (edited.password !== selected.password) updates.password = edited.password

      const result = await updateDeveloperAction(selected.uid, updates)
      
      if (result.success) {
        toast.success("Developer updated successfully.")
        // Reload developers
        const developersResult = await fetchAllDevelopersAction()
        if (developersResult.success && developersResult.data) {
          setDevelopers(developersResult.data)
        }
        setIsViewOpen(false)
      } else {
        toast.error(result.error || "Failed to update developer")
      }
    } catch (error) {
      console.error("Error updating developer:", error)
      toast.error("Failed to update developer")
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleDelete = async (uid: string) => {
    setDeleteLoadingId(uid)
    try {
      const result = await deleteDeveloperAction(uid)
      
      if (result.success) {
        toast.success("Developer deleted successfully.")
        // Reload developers
        const developersResult = await fetchAllDevelopersAction()
        if (developersResult.success && developersResult.data) {
          setDevelopers(developersResult.data)
        }
        if (selected?.uid === uid) setIsViewOpen(false)
      } else {
        toast.error(result.error || "Failed to delete developer")
      }
    } catch (error) {
      console.error("Error deleting developer:", error)
      toast.error("Failed to delete developer")
    } finally {
      setDeleteLoadingId(null)
    }
  }

  // Table column model for ProjectTable
  const columns = [
    {
      header: "Developer Name",
      accessor: "name",
      cell: (row: DeveloperRecord) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={row.avatar ?? ""} alt={row.name ?? ""} />
            <AvatarFallback>
              {row?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.name}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Email",
      accessor: "email",
      cell: (row: DeveloperRecord) => <span>{row.email ?? "N/A"}</span>,
    },
    {
      header: "Phone",
      accessor: "phone",
      cell: (row: DeveloperRecord) => <span>{row.phone ?? "N/A"}</span>,
    },
    {
      header: "Role",
      accessor: "role",
      cell: (row: DeveloperRecord) => (
        <span className="capitalize">{row.role}</span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: DeveloperRecord) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openView(row)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      ),
    },
  ];

  // Transform data for ProjectTable
  const tableData = developers;

  return (
    <section className="space-y-6 border shadow-md rounded-xl px-6 pt-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-balance">
            Developer Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage developer accounts and contact details
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        </div>
      </header>

      <div>
        <ProjectTable
          columns={columns as any}
          data={tableData as any}
          loading={isFetching}
          emptyMessage="No developers found"
          itemsPerPage={6}
        />
      </div>

      {/* Create New Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Developer</DialogTitle>
            <DialogDescription>
              Provide the details for the new developer account. Name, Email,
              and Password are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Developer Name (required)</Label>
              <Input
                id="name"
                placeholder="Developer name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (nameError) setNameError("");
                }}
                className={nameError ? "border-red-500" : ""}
              />
              {nameError && (
                <span className="text-sm text-red-500">{nameError}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (required)</Label>
              <Input
                id="email"
                type="email"
                placeholder="developer@example.com"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && (
                <span className="text-sm text-red-500">{emailError}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password (required)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  className={passwordError ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <span className="text-sm text-red-500">{passwordError}</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">Role: Developer</div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                clearErrors();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {createLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg max-h-[100vh] w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Developer Details</DialogTitle>
            <DialogDescription>
              View and update developer details. Avatar is managed by Cloudinary
              and cannot be updated here.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {edited ? (
              <div className="grid gap-4 py-2">
                {/* Avatar */}
                {edited.avatar && (
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                      <img
                        src={edited.avatar}
                        alt="Developer Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Name */}
                {edited.name && (
                  <div className="grid gap-2">
                    <Label>Developer Name</Label>
                    <Input
                      value={edited.name ?? ""}
                      onChange={(e) =>
                        setEdited({
                          ...(edited as DeveloperRecord),
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                {/* Email */}
                {edited.email && (
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={edited.email ?? ""}
                      onChange={(e) =>
                        setEdited({
                          ...(edited as DeveloperRecord),
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                {/* Phone */}
                {edited.phone && (
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input
                      value={edited.phone ?? ""}
                      onChange={(e) =>
                        setEdited({
                          ...(edited as DeveloperRecord),
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                {/* Password */}
                {edited.password && (
                  <div className="grid gap-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showEditPassword ? "text" : "password"}
                        value={edited.password ?? ""}
                        onChange={(e) =>
                          setEdited({
                            ...(edited as DeveloperRecord),
                            password: e.target.value,
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                      >
                        {showEditPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Created At */}
                {edited.createdAt && (
                  <div className="grid gap-2">
                    <Label>Created At</Label>
                    <Input value={formatDate(edited.createdAt)} disabled />
                  </div>
                )}

                {/* Last Login */}
                {edited.lastLogin && (
                  <div className="grid gap-2">
                    <Label>Last Login</Label>
                    <Input value={formatDate(edited.lastLogin)} disabled />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No developer selected.
              </div>
            )}
          </div>
          <Separator />
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="destructive"
              onClick={() => selected && handleDelete(selected.uid)}
              disabled={!!deleteLoadingId}
              className="w-full sm:w-auto"
            >
              {deleteLoadingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {deleteLoadingId ? "Deleting..." : "Delete"}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!isEditedDirty || updateLoading}
              className="w-full sm:w-auto"
            >
              {updateLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {updateLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
