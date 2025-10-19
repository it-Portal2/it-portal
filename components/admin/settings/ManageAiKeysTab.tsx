"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye, EyeOff, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import {
  fetchAllAIKeysAction,
  createAIKeyAction,
  updateAIKeyAction,
  deleteAIKeyAction,
  toggleAIKeyStatusAction,
} from "@/app/actions/admin-actions";

interface AIKey {
  docId: string; // Firestore document ID
  aiID: string; // User-defined unique AI identifier
  keyName: string;
  apiKey: string;
  provider: string;
  priority: number;
  status: "active" | "inactive";
  createdAt: string;
}

const ManageAiKeysTab = () => {
  const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<AIKey | null>(null);
  const [editedKey, setEditedKey] = useState<AIKey | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState({
    fetch: true,
    creating: false,
    updating: false,
    deleting: false,
    toggle: false,
  });
  const [showApiKey, setShowApiKey] = useState({
    create: false,
    edit: false,
  });
  const [newKey, setNewKey] = useState({
    aiID: "", // User will set this unique ID
    keyName: "",
    apiKey: "",
    provider: "",
    priority: 1,
    status: "active" as "active" | "inactive",
  });

  // Fetch AI keys on component mount
  useEffect(() => {
    fetchAIKeys();
  }, []);

  const fetchAIKeys = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const result = await fetchAllAIKeysAction();
      if (result.success) {
        setAiKeys(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch AI keys");
      }
    } catch (error) {
      console.error("Error fetching AI keys:", error);
      toast.error("Failed to fetch AI keys");
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasChanges = () => {
    if (!selectedKey || !editedKey) return false;
    return (
      selectedKey.aiID !== editedKey.aiID ||
      selectedKey.keyName !== editedKey.keyName ||
      selectedKey.apiKey !== editedKey.apiKey ||
      selectedKey.provider !== editedKey.provider ||
      selectedKey.priority !== editedKey.priority ||
      selectedKey.status !== editedKey.status
    );
  };

  const handleViewDetails = (key: AIKey) => {
    setSelectedKey(key);
    setEditedKey({ ...key });
    setShowApiKey((prev) => ({ ...prev, edit: false }));
    setIsViewDialogOpen(true);
  };

  const handleCreateKey = async () => {
    if (
      !newKey.aiID ||
      !newKey.keyName ||
      !newKey.apiKey ||
      !newKey.provider ||
      !newKey.priority
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading((prev) => ({ ...prev, creating: true }));

    try {
      const result = await createAIKeyAction(
        newKey.aiID,
        newKey.keyName,
        newKey.apiKey,
        newKey.provider,
        newKey.priority,
        newKey.status
      );

      if (result.success) {
        toast.success("AI key created successfully!");
        setNewKey({
          aiID: "",
          keyName: "",
          apiKey: "",
          provider: "",
          priority: 1,
          status: "active",
        });
        setShowApiKey((prev) => ({ ...prev, create: false }));
        setIsCreateDialogOpen(false);
        fetchAIKeys(); // Refresh the list
      } else {
        toast.error(result.error || "Failed to create AI key");
      }
    } catch (error) {
      console.error("Error creating AI key:", error);
      toast.error("Failed to create AI key");
    } finally {
      setIsLoading((prev) => ({ ...prev, creating: false }));
    }
  };

  const handleUpdateKey = async () => {
    if (!editedKey || !selectedKey) return;

    setIsLoading((prev) => ({ ...prev, updating: true }));

    try {
      const updates: any = {};

      if (editedKey.aiID !== selectedKey.aiID) updates.aiID = editedKey.aiID;
      if (editedKey.keyName !== selectedKey.keyName)
        updates.keyName = editedKey.keyName;
      if (editedKey.apiKey !== selectedKey.apiKey)
        updates.apiKey = editedKey.apiKey;
      if (editedKey.provider !== selectedKey.provider)
        updates.provider = editedKey.provider;
      if (editedKey.priority !== selectedKey.priority)
        updates.priority = editedKey.priority;
      if (editedKey.status !== selectedKey.status)
        updates.status = editedKey.status;

      if (Object.keys(updates).length > 0) {
        const result = await updateAIKeyAction(selectedKey.docId, updates);

        if (result.success) {
          toast.success("AI key updated successfully!");
          setSelectedKey(editedKey);
          fetchAIKeys(); // Refresh the list
        } else {
          toast.error(result.error || "Failed to update AI key");
        }
      }
    } catch (error) {
      console.error("Error updating AI key:", error);
      toast.error("Failed to update AI key");
    } finally {
      setIsLoading((prev) => ({ ...prev, updating: false }));
    }
  };

  const handleDeleteKey = async () => {
    if (!selectedKey) return;

    setIsLoading((prev) => ({ ...prev, deleting: true }));

    try {
      const result = await deleteAIKeyAction(selectedKey.docId);

      if (result.success) {
        toast.success("AI key deleted successfully!");
        setIsViewDialogOpen(false);
        setSelectedKey(null);
        fetchAIKeys(); // Refresh the list
      } else {
        toast.error(result.error || "Failed to delete AI key");
      }
    } catch (error) {
      console.error("Error deleting AI key:", error);
      toast.error("Failed to delete AI key");
    } finally {
      setIsLoading((prev) => ({ ...prev, deleting: false }));
    }
  };

  const handleToggleStatus = async (
    docId: string,
    currentStatus: "active" | "inactive"
  ) => {
    setIsLoading((prev) => ({ ...prev, toggle: true }));

    try {
      const result = await toggleAIKeyStatusAction(docId, currentStatus);

      if (result.success) {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        toast.success(
          `AI key ${
            newStatus === "active" ? "activated" : "deactivated"
          } successfully!`
        );

        // Update selected key if it's the one being toggled
        if (selectedKey?.docId === docId) {
          setSelectedKey((prev) =>
            prev ? { ...prev, status: newStatus } : null
          );
          setEditedKey((prev) =>
            prev ? { ...prev, status: newStatus } : null
          );
        }

        fetchAIKeys(); // Refresh the list
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

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "openai":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "anthropic":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "google":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "cohere":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "mistral":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "huggingface":
        return "bg-pink-100 text-pink-800 hover:bg-pink-200";
      case "together":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
      case "perplexity":
        return "bg-teal-100 text-teal-800 hover:bg-teal-200";
      case "groq":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "replicate":
        return "bg-cyan-100 text-cyan-800 hover:bg-cyan-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Define columns for the table
  const columns = [
    {
      header: "AI ID",
      accessor: "aiID",
      cell: (row: AIKey) => (
        <span className="font-mono text-sm font-medium">{row.aiID}</span>
      ),
    },
    {
      header: "Key Name",
      accessor: "keyName",
      cell: (row: AIKey) => <span className="font-medium">{row.keyName}</span>,
    },
    {
      header: "Provider",
      accessor: "provider",
      cell: (row: AIKey) => (
        <Badge variant="secondary" className={getProviderColor(row.provider)}>
          {row.provider}
        </Badge>
      ),
    },
    {
      header: "Priority",
      accessor: "priority",
      cell: (row: AIKey) => (
        <Badge variant="outline" className="font-mono">
          {row.priority}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row: AIKey) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.status === "active"}
            onCheckedChange={() => handleToggleStatus(row.docId, row.status)}
            disabled={isLoading.toggle}
            className="data-[state=checked]:bg-green-500"
          />
          <span
            className={`text-sm ${
              row.status === "active" ? "text-green-600" : "text-red-600"
            }`}
          >
            {row.status === "active" ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "Created At",
      accessor: "createdAt",
      cell: (row: AIKey) => formatDate(row.createdAt),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: AIKey) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDetails(row)}
          className="flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle>Manage AI Keys</CardTitle>
            <CardDescription>
              Manage your AI API keys and their configurations
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Create New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New AI Key</DialogTitle>
                  <DialogDescription>
                    Add a new AI API key to your collection
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="aiID">
                      AI ID *{" "}
                      <span className="text-xs text-muted-foreground">
                        (Unique identifier)
                      </span>
                    </Label>
                    <Input
                      id="aiID"
                      placeholder="e.g., openai-prod-001"
                      value={newKey.aiID}
                      onChange={(e) =>
                        setNewKey((prev) => ({ ...prev, aiID: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name *</Label>
                    <Input
                      id="keyName"
                      placeholder="e.g., OpenAI Production"
                      value={newKey.keyName}
                      onChange={(e) =>
                        setNewKey((prev) => ({
                          ...prev,
                          keyName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key *</Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showApiKey.create ? "text" : "password"}
                        placeholder="Enter your API key"
                        value={newKey.apiKey}
                        onChange={(e) =>
                          setNewKey((prev) => ({
                            ...prev,
                            apiKey: e.target.value,
                          }))
                        }
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowApiKey((prev) => ({
                            ...prev,
                            create: !prev.create,
                          }))
                        }
                      >
                        {showApiKey.create ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider *</Label>
                    <Select
                      value={newKey.provider}
                      onValueChange={(value) =>
                        setNewKey((prev) => ({ ...prev, provider: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OpenAI">OpenAI</SelectItem>
                        <SelectItem value="Anthropic">Anthropic</SelectItem>
                        <SelectItem value="Google">Google</SelectItem>
                        <SelectItem value="Cohere">Cohere</SelectItem>
                        <SelectItem value="Mistral">Mistral</SelectItem>
                        <SelectItem value="HuggingFace">HuggingFace</SelectItem>
                        <SelectItem value="Together">Together</SelectItem>
                        <SelectItem value="Perplexity">Perplexity</SelectItem>
                        <SelectItem value="Groq">Groq</SelectItem>
                        <SelectItem value="Replicate">Replicate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      value={newKey.priority}
                      onChange={(e) =>
                        setNewKey((prev) => ({
                          ...prev,
                          priority: Number.parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="status"
                        checked={newKey.status === "active"}
                        onCheckedChange={(checked) =>
                          setNewKey((prev) => ({
                            ...prev,
                            status: checked ? "active" : "inactive",
                          }))
                        }
                        className="data-[state=checked]:bg-green-500"
                      />
                      <Label htmlFor="status" className="text-sm">
                        {newKey.status === "active" ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateKey}
                    className="w-full"
                    disabled={isLoading.creating}
                  >
                    {isLoading.creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create AI Key"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectTable
            data={aiKeys}
            columns={columns}
            emptyMessage="No AI keys found"
            itemsPerPage={6}
            loading={isLoading.fetch}
          />
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>AI Key Details</DialogTitle>
            <DialogDescription>
              View and edit AI key information
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {editedKey ? (
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="editAiID">AI ID</Label>
                  <Input
                    id="editAiID"
                    value={editedKey.aiID}
                    disabled
                    onChange={(e) =>
                      setEditedKey((prev) =>
                        prev ? { ...prev, aiID: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editKeyName">Key Name</Label>
                  <Input
                    id="editKeyName"
                    value={editedKey.keyName}
                    onChange={(e) =>
                      setEditedKey((prev) =>
                        prev ? { ...prev, keyName: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editApiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="editApiKey"
                      type={showApiKey.edit ? "text" : "password"}
                      value={editedKey.apiKey}
                      onChange={(e) =>
                        setEditedKey((prev) =>
                          prev ? { ...prev, apiKey: e.target.value } : null
                        )
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowApiKey((prev) => ({ ...prev, edit: !prev.edit }))
                      }
                    >
                      {showApiKey.edit ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editProvider">Provider</Label>
                  <Select
                    value={editedKey.provider}
                    onValueChange={(value) =>
                      setEditedKey((prev) =>
                        prev ? { ...prev, provider: value } : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OpenAI">OpenAI</SelectItem>
                      <SelectItem value="Anthropic">Anthropic</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Cohere">Cohere</SelectItem>
                      <SelectItem value="Mistral">Mistral</SelectItem>
                      <SelectItem value="HuggingFace">HuggingFace</SelectItem>
                      <SelectItem value="Together">Together</SelectItem>
                      <SelectItem value="Perplexity">Perplexity</SelectItem>
                      <SelectItem value="Groq">Groq</SelectItem>
                      <SelectItem value="Replicate">Replicate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPriority">Priority</Label>
                  <Input
                    id="editPriority"
                    type="number"
                    min="1"
                    value={editedKey.priority}
                    onChange={(e) =>
                      setEditedKey((prev) =>
                        prev
                          ? {
                              ...prev,
                              priority: Number.parseInt(e.target.value) || 1,
                            }
                          : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStatus">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="editStatus"
                      checked={editedKey.status === "active"}
                      onCheckedChange={(checked) =>
                        setEditedKey((prev) =>
                          prev
                            ? {
                                ...prev,
                                status: checked ? "active" : "inactive",
                              }
                            : null
                        )
                      }
                      className="data-[state=checked]:bg-green-500"
                    />
                    <Label htmlFor="editStatus" className="text-sm">
                      {editedKey.status === "active" ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Created At</Label>
                  <Input
                    value={formatDate(editedKey.createdAt)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                {/* <div className="space-y-2">
                  <Label>Document ID</Label>
                  <Input
                    value={editedKey.docId}
                    disabled
                    className="bg-muted font-mono text-xs"
                  />
                </div> */}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No key selected</p>
              </div>
            )}
          </div>
          {editedKey && (
            <div className="flex-shrink-0 border-t pt-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleUpdateKey}
                  disabled={!hasChanges() || isLoading.updating}
                  className="flex-1 order-1 sm:order-none"
                >
                  {isLoading.updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteKey}
                  disabled={isLoading.deleting}
                  className="flex-1 order-2 sm:order-none"
                >
                  {isLoading.deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageAiKeysTab;
