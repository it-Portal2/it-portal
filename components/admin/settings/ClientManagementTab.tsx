"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Trash2, Save, Plus, FileDown } from "lucide-react"
import ProjectTable from "@/components/ui-custom/ProjectTable"
import { createClientAction, deleteClientAction, fetchAllClientsAction, updateClientAction } from "@/app/actions/admin-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


// Updated Types to match Firebase
type ClientRecord = {
  uid: string
  name: string | null
  email: string | null
  phone: string | null
  password: string | null
  avatar?: string | null
  role: "client"
  createdAt: string
  lastLogin?: string | null
}

type ColumnKey = "name" | "email" | "phone" | "role" | "createdAt" | "lastLogin"

// Helpers remain the same
const formatDate = (iso?: string | null) => {
  if (!iso) return "N/A"
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

const toCsv = (rows: ClientRecord[], columns: ColumnKey[]) => {
  const headers = columns.map((c) => c)
  const body = rows.map((r) =>
    columns
      .map((c) => {
        const val = (() => {
          switch (c) {
            case "createdAt":
              return formatDate(r.createdAt)
            case "lastLogin":
              return formatDate(r.lastLogin)
            case "name":
              return r.name ?? "N/A"
            case "email":
              return r.email ?? "N/A"
            case "phone":
              return r.phone ?? "N/A"
            default:
              return String((r as any)[c] ?? "")
          }
        })()
        const s = String(val)
        if (/[",\n]/.test(s)) {
          return `"${s.replace(/"/g, '""')}"`
        }
        return s
      })
      .join(","),
  )
  return [headers.join(","), ...body].join("\n")
}

export default function ClientManagementTab() {
  // State management
  const [isFetching, setIsFetching] = React.useState(true)
  const [clients, setClients] = React.useState<ClientRecord[]>([])

  // Load clients from Firebase
  React.useEffect(() => {
    const loadClients = async () => {
      setIsFetching(true)
      try {
        const result = await fetchAllClientsAction()
        if (result.success && result.data) {
          setClients(result.data)
        } else {
          toast.error(result.error || "Failed to load clients")
        }
      } catch (error) {
        console.error("Error loading clients:", error)
        toast.error("Failed to load clients")
      } finally {
        setIsFetching(false)
      }
    }

    loadClients()
  }, [])

  // Dialog states remain the same
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
  const [selected, setSelected] = React.useState<ClientRecord | null>(null)
  const [edited, setEdited] = React.useState<ClientRecord | null>(null)
  const [updateLoading, setUpdateLoading] = React.useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = React.useState<string | null>(null)
  const [showEditPassword, setShowEditPassword] = React.useState(false)

  // Export dialog state
  const [isExportOpen, setIsExportOpen] = React.useState(false)
  const [exportLoading, setExportLoading] = React.useState(false)
  const [exportCols, setExportCols] = React.useState<Record<ColumnKey, boolean>>({
    name: true,
    email: true,
    phone: true,
    role: false,
    createdAt: false,
    lastLogin: false,
  })

  // Validation functions remain the same
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
  const openView = (row: ClientRecord) => {
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
      const result = await createClientAction(
        newEmail.trim(),
        newPassword.trim(),
        newName.trim()
      )
      
      if (result.success) {
        toast.success("Client created successfully.")
        // Reload clients
        const clientsResult = await fetchAllClientsAction()
        if (clientsResult.success && clientsResult.data) {
          setClients(clientsResult.data)
        }
        // Reset form
        setNewName("")
        setNewEmail("")
        setNewPassword("")
        setShowNewPassword(false)
        clearErrors()
        setIsCreateOpen(false)
      } else {
        toast.error(result.error || "Failed to create client")
      }
    } catch (error) {
      console.error("Error creating client:", error)
      toast.error("Failed to create client")
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

      const result = await updateClientAction(selected.uid, updates)

      if (result.success) {
        toast.success("Client updated successfully.")
        // Reload clients
        const clientsResult = await fetchAllClientsAction()
        if (clientsResult.success && clientsResult.data) {
          setClients(clientsResult.data)
        }
        setIsViewOpen(false)
      } else {
        toast.error(result.error || "Failed to update client")
      }
    } catch (error) {
      console.error("Error updating client:", error)
      toast.error("Failed to update client")
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleDelete = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      return
    }

    setDeleteLoadingId(uid)
    try {
      const result = await deleteClientAction(uid)
      
      if (result.success) {
        toast.success("Client deleted successfully.")
        // Reload clients
        const clientsResult = await fetchAllClientsAction()
        if (clientsResult.success && clientsResult.data) {
          setClients(clientsResult.data)
        }
        if (selected?.uid === uid) setIsViewOpen(false)
      } else {
        toast.error(result.error || "Failed to delete client")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      toast.error("Failed to delete client")
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleExport = async () => {
    const cols = (Object.keys(exportCols) as ColumnKey[]).filter((k) => exportCols[k])
    if (cols.length === 0) {
      toast.error("Select at least one column to export.")
      return
    }
    setExportLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 400))
      const csv = toCsv(clients, cols)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Export generated.")
      setIsExportOpen(false)
    } catch {
      toast.error("Failed to generate export.")
    } finally {
      setExportLoading(false)
    }
  }

  // Table column model - updated to use uid instead of id
  const columns = [
    {
      header: "Client Name", accessor: "name",
      cell: (row: ClientRecord) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={row.avatar ?? ""} alt={row.name ?? ""} />
            <AvatarFallback>{row?.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.name}</div>
          </div>
        </div>
      ),},
    {
      header: "Email",
      accessor: "email",
      cell: (row: ClientRecord) => <span>{row.email ?? "N/A"}</span>,
    },
    {
      header: "Phone",
      accessor: "phone",
      cell: (row: ClientRecord) => <span>{row.phone ?? "N/A"}</span>,
    },
    {
      header: "Role",
      accessor: "role",
      cell: (row: ClientRecord) => <span className="capitalize">{row.role}</span>,
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: ClientRecord) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openView(row)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      ),
    },
  ]

  const tableData = clients

  return (
    <section className="space-y-6 border shadow-md rounded-xl px-6 pt-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-balance">Client Management</h2>
          <p className="text-sm text-muted-foreground">Manage client accounts and contact details</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create New
          </Button>
          <Button variant="outline" onClick={() => setIsExportOpen(true)}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </header>

      <div>
        <ProjectTable 
          columns={columns as any} 
          data={tableData as any} 
          loading={isFetching} 
          emptyMessage="No clients found" 
          itemsPerPage={6}
        />
      </div>

      {/* Create New Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Provide the details for the new client account. Name, Email, and Password are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Client Name (required)</Label>
              <Input 
                id="name" 
                placeholder="Client name" 
                value={newName} 
                onChange={(e) => {
                  setNewName(e.target.value)
                  if (nameError) setNameError("")
                }}
                className={nameError ? "border-red-500" : ""}
              />
              {nameError && <span className="text-sm text-red-500">{nameError}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (required)</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value)
                  if (emailError) setEmailError("")
                }}
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && <span className="text-sm text-red-500">{emailError}</span>}
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
                    setNewPassword(e.target.value)
                    if (passwordError) setPasswordError("")
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
              {passwordError && <span className="text-sm text-red-500">{passwordError}</span>}
            </div>
            <div className="text-sm text-muted-foreground">Role: Client</div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false)
              clearErrors()
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {createLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Dialog - Updated to use uid */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg max-h-[100vh] w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>View and update client details. Avatar is managed by Cloudinary and cannot be updated here.</DialogDescription>
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
                        alt="Client Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {/* Name */}
                <div className="grid gap-2">
                  <Label>Client Name</Label>
                  <Input
                    value={edited.name ?? ""}
                    onChange={(e) => setEdited({ ...(edited as ClientRecord), name: e.target.value })}
                  />
                </div>
                
                {/* Email */}
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={edited.email ?? ""}
                    onChange={(e) => setEdited({ ...(edited as ClientRecord), email: e.target.value })}
                  />
                </div>
                
                {/* Phone */}
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={edited.phone ?? ""}
                    onChange={(e) => setEdited({ ...(edited as ClientRecord), phone: e.target.value })}
                  />
                </div>
                
                {/* Password */}
                <div className="grid gap-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showEditPassword ? "text" : "password"}
                      value={edited.password ?? ""}
                      onChange={(e) => setEdited({ ...(edited as ClientRecord), password: e.target.value })}
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
                
                {/* Created At */}
                {/* <div className="grid gap-2">
                  <Label>Created At</Label>
                  <Input value={formatDate(edited.createdAt)} disabled />
                </div> */}
                
                {/* Last Login */}
                {/* <div className="grid gap-2">
                  <Label>Last Login</Label>
                  <Input value={formatDate(edited.lastLogin)} disabled />
                </div> */}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No client selected.</div>
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
              {updateLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {updateLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog remains the same */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export to Excel (CSV)</DialogTitle>
            <DialogDescription>Select columns to include in the export.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {(Object.keys(exportCols) as ColumnKey[]).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={exportCols[key]}
                  onCheckedChange={(v) => setExportCols((s) => ({ ...s, [key]: Boolean(v) }))}
                />
                <span className="capitalize">
                  {key === "createdAt" ? "Created At" : key === "lastLogin" ? "Last Login" : key}
                </span>
              </label>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exportLoading}>
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              {exportLoading ? "Generating..." : "Generate CSV"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
