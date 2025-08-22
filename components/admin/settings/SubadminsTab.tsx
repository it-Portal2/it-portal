"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  UserPlus,
  Loader,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import { useAuthStore } from "@/lib/store/userStore";
import {
  fetchAllSubadminsAction,
  createSubadminAction,
  updateSubadminAction,
  toggleSubadminStatusAction,
  deleteSubadminAction,
} from "@/app/actions/admin-actions";

type Subadmin = {
  uid: string;
  email: string;
  password: string;
  name: string;
  role: "subadmin";
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  createdBy: string;
};

const SubadminsTab = () => {
  const { profile } = useAuthStore();
  const [subadmins, setSubadmins] = useState<Subadmin[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSubadmin, setSelectedSubadmin] = useState<Subadmin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isLoading, setIsLoading] = useState({
    fetch: true,
    create: false,
    update: false,
    delete: false,
    toggle: false,
  });

  // Simplified create form - only name, email, password
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    name: "",
  });

  const [viewForm, setViewForm] = useState({
    email: "",
    password: "",
    name: "",
    avatar: "",
  });

  const [originalViewForm, setOriginalViewForm] = useState({
    email: "",
    password: "",
    name: "",
    avatar: "",
  });

  // Fetch subadmins on component mount
  useEffect(() => {
    fetchSubadmins();
  }, []);

  const fetchSubadmins = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const result = await fetchAllSubadminsAction();
      if (result.success) {
        setSubadmins(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch subadmins");
      }
    } catch (error) {
      console.error("Error fetching subadmins:", error);
      toast.error("Failed to fetch subadmins");
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleViewFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setViewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateSubadmin = async () => {
    if (!createForm.email || !createForm.password || !createForm.name) {
      toast.error("Email, password, and name are required");
      return;
    }

    if (createForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    // Check if email already exists
    if (subadmins.some((admin) => admin.email === createForm.email)) {
      toast.error("Email already exists");
      return;
    }

    if (!profile?.uid) {
      toast.error("User not authenticated");
      return;
    }

    setIsLoading((prev) => ({ ...prev, create: true }));

    try {
      const result = await createSubadminAction(
        createForm.email,
        createForm.password,
        createForm.name,
        profile.uid
      );

      if (result.success) {
        toast.success("Subadmin created successfully!");
        setCreateForm({ email: "", password: "", name: "" });
        setIsCreateDialogOpen(false);
        fetchSubadmins(); // Refresh the list
      } else {
        toast.error(result.error || "Failed to create subadmin");
      }
    } catch (error) {
      console.error("Error creating subadmin:", error);
      toast.error("Failed to create subadmin");
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleViewDetails = (subadmin: Subadmin) => {
    setSelectedSubadmin(subadmin);
    setViewForm({
      email: subadmin.email,
      password: subadmin.password, // Show actual password
      name: subadmin.name,
      avatar: subadmin.avatar || "",
    });
    setOriginalViewForm({
      email: subadmin.email,
      password: subadmin.password,
      name: subadmin.name,
      avatar: subadmin.avatar || "",
    });
    setShowPassword(false);
    setIsViewDialogOpen(true);
  };

  const handleUpdateSubadmin = async () => {
    if (!viewForm.email || !viewForm.name) {
      toast.error("Email and name are required");
      return;
    }

    if (viewForm.password && viewForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!selectedSubadmin) return;

    // Check if email already exists (excluding current subadmin)
    if (subadmins.some((admin) => admin.email === viewForm.email && admin.uid !== selectedSubadmin.uid)) {
      toast.error("Email already exists");
      return;
    }

    setIsLoading((prev) => ({ ...prev, update: true }));

    try {
      const updates: any = {};
      
      if (viewForm.email !== originalViewForm.email) updates.email = viewForm.email;
      if (viewForm.name !== originalViewForm.name) updates.name = viewForm.name;
      if (viewForm.avatar !== originalViewForm.avatar) updates.avatar = viewForm.avatar;
      if (viewForm.password !== originalViewForm.password) updates.password = viewForm.password;

      // Update profile if there are changes
      if (Object.keys(updates).length > 0) {
        const result = await updateSubadminAction(selectedSubadmin.uid, updates);
        
        if (!result.success) {
          toast.error(result.error || "Failed to update subadmin");
          return;
        }
      }

      toast.success("Subadmin updated successfully!");
      
      // Update original form values
      setOriginalViewForm({
        email: viewForm.email,
        password: viewForm.password,
        name: viewForm.name,
        avatar: viewForm.avatar,
      });
      
      fetchSubadmins(); // Refresh the list
    } catch (error) {
      console.error("Error updating subadmin:", error);
      toast.error("Failed to update subadmin");
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const handleDeleteSubadmin = async (subadminId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));

    try {
      const result = await deleteSubadminAction(subadminId);
      
      if (result.success) {
        toast.success("Subadmin deleted successfully!");
        
        // Close dialog if we're deleting the currently viewed subadmin
        if (selectedSubadmin?.uid === subadminId) {
          setIsViewDialogOpen(false);
          setSelectedSubadmin(null);
        }
        
        fetchSubadmins(); // Refresh the list
      } else {
        toast.error(result.error || "Failed to delete subadmin");
      }
    } catch (error) {
      console.error("Error deleting subadmin:", error);
      toast.error("Failed to delete subadmin");
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  const handleToggleStatus = async (subadminId: string, currentStatus: boolean) => {
    setIsLoading((prev) => ({ ...prev, toggle: true }));

    try {
      const result = await toggleSubadminStatusAction(subadminId, !currentStatus);
      
      if (result.success) {
        toast.success(`Subadmin ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        
        // Update selected subadmin if it's the one being toggled
        if (selectedSubadmin?.uid === subadminId) {
          setSelectedSubadmin((prev) => prev ? { ...prev, isActive: !currentStatus } : null);
        }
        
        fetchSubadmins(); // Refresh the list
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsLoading((prev) => ({ ...prev, toggle: false }));
    }
  };

  // Check if form has changes
  const hasFormChanges = () => {
    return (
      viewForm.email !== originalViewForm.email ||
      viewForm.name !== originalViewForm.name ||
      viewForm.avatar !== originalViewForm.avatar ||
      viewForm.password !== originalViewForm.password
    );
  };

  const columns = [
    {
      header: "Subadmin",
      accessor: "admin",
      cell: (row: Subadmin) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={row.avatar} alt={row.name} />
            <AvatarFallback>{row.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "isActive",
      cell: (row: Subadmin) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.isActive}
            onCheckedChange={() => handleToggleStatus(row.uid, row.isActive)}
            disabled={isLoading.toggle}
          />
          <span className={`text-sm ${row.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {row.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      ),
    },
    {
      header: "Created At",
      accessor: "createdAt",
      cell: (row: Subadmin) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "Last Login",
      accessor: "lastLogin",
      cell: (row: Subadmin) => row.lastLogin === "Never" ? "Never" : new Date(row.lastLogin).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: Subadmin) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(row)}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Manage Subadmins
              </CardTitle>
              <CardDescription>Create and manage subadmin accounts for your platform</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-md mx-4 max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Create New Subadmin</DialogTitle>
                  <DialogDescription>Enter the basic details for the new subadmin account.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="create-name">Full Name</Label>
                      <Input
                        id="create-name"
                        name="name"
                        placeholder="Enter full name"
                        value={createForm.name}
                        onChange={handleCreateFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-email">Email Address</Label>
                      <Input
                        id="create-email"
                        name="email"
                        type="email"
                        placeholder="Enter email address"
                        value={createForm.email}
                        onChange={handleCreateFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-password">Password</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="create-password"
                          name="password"
                          type={showCreatePassword ? "text" : "password"}
                          placeholder="Enter password (min 6 characters)"
                          value={createForm.password}
                          onChange={handleCreateFormChange}
                          required
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="icon" 
                          onClick={() => setShowCreatePassword(!showCreatePassword)}
                        >
                          {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setCreateForm({ email: "", password: "", name: "" });
                      setShowCreatePassword(false);
                    }}
                    disabled={isLoading.create}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSubadmin}
                    disabled={isLoading.create}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    {isLoading.create ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {isLoading.create ? "Creating..." : "Create Subadmin"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectTable
            data={subadmins}
            columns={columns}
            emptyMessage="No subadmins found"
            itemsPerPage={10}
            loading={isLoading.fetch}
          />
        </CardContent>
      </Card>

      {/* View/Edit Details Dialog remains the same */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Subadmin Details</DialogTitle>
            <DialogDescription>View and manage subadmin account information.</DialogDescription>
          </DialogHeader>
          {selectedSubadmin && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6 py-2">
                {/* Avatar Section */}
                <div className="flex items-center justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={viewForm.avatar} alt={selectedSubadmin.name} />
                    <AvatarFallback className="text-lg">
                      {selectedSubadmin.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      name="name"
                      value={viewForm.name} 
                      onChange={handleViewFormChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input 
                      name="email"
                      value={viewForm.email} 
                      onChange={handleViewFormChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      value={viewForm.password} 
                      onChange={handleViewFormChange}
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Avatar URL</Label>
                  <Input 
                    name="avatar"
                    placeholder="https://example.com/avatar.jpg"
                    value={viewForm.avatar} 
                    onChange={handleViewFormChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input 
                    value="Subadmin" 
                    readOnly 
                    className="bg-gray-50" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedSubadmin.isActive}
                      onCheckedChange={() => handleToggleStatus(selectedSubadmin.uid, selectedSubadmin.isActive)}
                      disabled={isLoading.toggle}
                    />
                    <span className={`text-sm ${selectedSubadmin.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedSubadmin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Created At</Label>
                    <Input 
                      value={new Date(selectedSubadmin.createdAt).toLocaleDateString()} 
                      readOnly 
                      className="bg-gray-50" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Login</Label>
                    <Input 
                      value={selectedSubadmin.lastLogin === "Never" ? "Never" : new Date(selectedSubadmin.lastLogin).toLocaleDateString()} 
                      readOnly 
                      className="bg-gray-50" 
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsViewDialogOpen(false);
                setSelectedSubadmin(null);
                setShowPassword(false);
              }}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedSubadmin && handleDeleteSubadmin(selectedSubadmin.uid)}
              disabled={isLoading.delete}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              {isLoading.delete ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isLoading.delete ? "Deleting..." : "Delete"}
            </Button>
            <Button
              onClick={handleUpdateSubadmin}
              disabled={isLoading.update || !hasFormChanges()}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              {isLoading.update ? <Loader className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
              {isLoading.update ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubadminsTab;