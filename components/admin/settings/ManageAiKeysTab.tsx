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
import {
  Loader2,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Save,
  ChevronDown,
  Check,
  Search,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Clock,
  Cpu,
  Key,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import {
  fetchAllAIKeysAction,
  createAIKeyAction,
  updateAIKeyAction,
  deleteAIKeyAction,
  toggleAIKeyStatusAction,
  getAiConfigAction,
  updateAiConfigAction,
  getGeminiModelsAction,
  testAIProviderAction,
  type AITestResult,
} from "@/app/actions/admin-actions";
import type { AiConfig } from "@/lib/types";

interface OpenRouterModel {
  id: string;
  name: string;
}

interface AIKey {
  docId: string;
  aiID: string;
  keyName: string;
  apiKey: string;
  provider: string;
  priority: number;
  status: "active" | "inactive";
  createdAt: string;
}

const CONFIG_DEFAULTS: AiConfig = {
  provider: "openrouter",
  openrouterModel: "deepseek/deepseek-v4-flash:free",
  geminiModel: "gemini-2.5-flash",
};

const ManageAiKeysTab = () => {
  // ── AI config ──────────────────────────────────────────────────────────
  const [aiConfig, setAiConfig] = useState<AiConfig>(CONFIG_DEFAULTS);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // ── OpenRouter model search ─────────────────────────────────────────────
  const [openrouterModels, setOpenrouterModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [orModelSearch, setOrModelSearch] = useState("");
  const [isModelPopoverOpen, setIsModelPopoverOpen] = useState(false);

  // ── Gemini model search ─────────────────────────────────────────────────
  const [geminiModels, setGeminiModels] = useState<{ id: string; displayName: string }[]>([]);
  const [isLoadingGeminiModels, setIsLoadingGeminiModels] = useState(false);
  const [geminiModelsError, setGeminiModelsError] = useState<string | null>(null);
  const [gmModelSearch, setGmModelSearch] = useState("");
  const [isGmModelPopoverOpen, setIsGmModelPopoverOpen] = useState(false);

  // ── Provider test ───────────────────────────────────────────────────────
  type TestState =
    | { status: "idle" }
    | { status: "loading" }
    | ({ status: "done" } & AITestResult);

  const [orTest, setOrTest] = useState<TestState>({ status: "idle" });
  const [gmTest, setGmTest] = useState<TestState>({ status: "idle" });

  // ── AI keys table ───────────────────────────────────────────────────────
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
  const [showApiKey, setShowApiKey] = useState({ create: false, edit: false });
  const [newKey, setNewKey] = useState({
    aiID: "",
    keyName: "",
    apiKey: "",
    provider: "",
    priority: 1,
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    fetchConfig();
    fetchAIKeys();
    fetchOpenRouterModels();
    fetchGeminiModels();
  }, []);

  // ── Data fetchers ───────────────────────────────────────────────────────

  const fetchConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const config = await getAiConfigAction();
      setAiConfig(config);
    } catch {
      // defaults remain
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const fetchOpenRouterModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models");
      if (res.ok) {
        const data = await res.json();
        const models: OpenRouterModel[] = (data.data ?? []).map(
          (m: { id: string; name: string }) => ({ id: m.id, name: m.name })
        );
        models.sort((a, b) => a.id.localeCompare(b.id));
        setOpenrouterModels(models);
      }
    } catch {
      // user can still type the model ID manually
    } finally {
      setIsLoadingModels(false);
    }
  };

  const fetchGeminiModels = async () => {
    setIsLoadingGeminiModels(true);
    setGeminiModelsError(null);
    try {
      const models = await getGeminiModelsAction();
      setGeminiModels(models);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch Gemini models";
      setGeminiModelsError(msg);
      console.error("[Gemini models]", msg);
    } finally {
      setIsLoadingGeminiModels(false);
    }
  };

  const handleTest = async (provider: "openrouter" | "gemini") => {
    const set = provider === "openrouter" ? setOrTest : setGmTest;
    set({ status: "loading" });
    try {
      const result = await testAIProviderAction(provider);
      set({ status: "done", ...result });
    } catch (err) {
      set({
        status: "done",
        success: false,
        model: provider === "openrouter" ? aiConfig.openrouterModel : aiConfig.geminiModel,
        durationMs: 0,
        error: err instanceof Error ? err.message : "Unexpected error",
        keysTried: [],
      });
    }
  };

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

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await updateAiConfigAction(aiConfig);
      toast.success("AI configuration saved!");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setIsSavingConfig(false);
    }
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
        setNewKey({ aiID: "", keyName: "", apiKey: "", provider: "", priority: 1, status: "active" });
        setShowApiKey((prev) => ({ ...prev, create: false }));
        setIsCreateDialogOpen(false);
        fetchAIKeys();
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
      const updates: Partial<AIKey> = {};
      if (editedKey.keyName !== selectedKey.keyName) updates.keyName = editedKey.keyName;
      if (editedKey.apiKey !== selectedKey.apiKey) updates.apiKey = editedKey.apiKey;
      if (editedKey.provider !== selectedKey.provider) updates.provider = editedKey.provider;
      if (editedKey.priority !== selectedKey.priority) updates.priority = editedKey.priority;
      if (editedKey.status !== selectedKey.status) updates.status = editedKey.status;

      if (Object.keys(updates).length > 0) {
        const result = await updateAIKeyAction(selectedKey.docId, updates);
        if (result.success) {
          toast.success("AI key updated successfully!");
          setSelectedKey(editedKey);
          fetchAIKeys();
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
        fetchAIKeys();
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
          `AI key ${newStatus === "active" ? "activated" : "deactivated"} successfully!`
        );
        if (selectedKey?.docId === docId) {
          setSelectedKey((prev) => (prev ? { ...prev, status: newStatus } : null));
          setEditedKey((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        fetchAIKeys();
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

  const handleViewDetails = (key: AIKey) => {
    setSelectedKey(key);
    setEditedKey({ ...key });
    setShowApiKey((prev) => ({ ...prev, edit: false }));
    setIsViewDialogOpen(true);
  };

  const hasChanges = () => {
    if (!selectedKey || !editedKey) return false;
    return (
      selectedKey.keyName !== editedKey.keyName ||
      selectedKey.apiKey !== editedKey.apiKey ||
      selectedKey.provider !== editedKey.provider ||
      selectedKey.priority !== editedKey.priority ||
      selectedKey.status !== editedKey.status
    );
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "openai":       return "bg-green-100 text-green-800 hover:bg-green-200";
      case "anthropic":    return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "google":       return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "cohere":       return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "mistral":      return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "huggingface":  return "bg-pink-100 text-pink-800 hover:bg-pink-200";
      case "together":     return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
      case "perplexity":   return "bg-teal-100 text-teal-800 hover:bg-teal-200";
      case "groq":         return "bg-red-100 text-red-800 hover:bg-red-200";
      case "replicate":    return "bg-cyan-100 text-cyan-800 hover:bg-cyan-200";
      default:             return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const filteredModels = openrouterModels.filter(
    (m) =>
      m.id.toLowerCase().includes(orModelSearch.toLowerCase()) ||
      m.name.toLowerCase().includes(orModelSearch.toLowerCase())
  );

  const filteredGeminiModels = geminiModels.filter(
    (m) =>
      m.id.toLowerCase().includes(gmModelSearch.toLowerCase()) ||
      m.displayName.toLowerCase().includes(gmModelSearch.toLowerCase())
  );

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
          disabled={isLoading.toggle || isLoading.fetch}
          className="flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          View Details
        </Button>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* AI Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Configuration</CardTitle>
          <CardDescription>
            Select the primary AI provider and configure model names
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingConfig ? (
            /* ── skeleton while config loads from Firestore ── */
            <div className="space-y-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="flex gap-6">
                  <div className="h-5 w-28 rounded bg-muted" />
                  <div className="h-5 w-24 rounded bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-9 w-full rounded bg-muted" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-9 w-full rounded bg-muted" />
              </div>
              <div className="flex justify-end">
                <div className="h-9 w-36 rounded bg-muted" />
              </div>
            </div>
          ) : (
            <>
              {/* Primary provider radios */}
              <div className="space-y-2">
                <Label>Primary Provider</Label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      value="openrouter"
                      checked={aiConfig.provider === "openrouter"}
                      disabled={isSavingConfig}
                      onChange={() =>
                        setAiConfig((p) => ({ ...p, provider: "openrouter" }))
                      }
                    />
                    OpenRouter
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      value="gemini"
                      checked={aiConfig.provider === "gemini"}
                      disabled={isSavingConfig}
                      onChange={() =>
                        setAiConfig((p) => ({ ...p, provider: "gemini" }))
                      }
                    />
                    Gemini
                  </label>
                </div>
              </div>

              {/* OpenRouter model — searchable combobox */}
              <div className="space-y-2">
                <Label>OpenRouter Model</Label>
                <Popover
                  open={isModelPopoverOpen}
                  onOpenChange={setIsModelPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                      disabled={isSavingConfig}
                    >
                      {isLoadingModels && openrouterModels.length === 0 ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading models...
                        </span>
                      ) : (
                        <span className="truncate text-sm">
                          {aiConfig.openrouterModel || "Select model..."}
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-(--radix-popover-trigger-width)"
                    align="start"
                  >
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search models..."
                          className="pl-8 h-9"
                          value={orModelSearch}
                          onChange={(e) => setOrModelSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    {isLoadingModels ? (
                      <div className="flex items-center justify-center py-6 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Loading models...
                        </span>
                      </div>
                    ) : filteredModels.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No models found
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {filteredModels.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer text-left"
                            onClick={() => {
                              setAiConfig((p) => ({
                                ...p,
                                openrouterModel: model.id,
                              }));
                              setIsModelPopoverOpen(false);
                              setOrModelSearch("");
                            }}
                          >
                            <Check
                              className={`h-4 w-4 shrink-0 ${
                                aiConfig.openrouterModel === model.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="font-mono text-xs truncate">
                                {model.id}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {model.name}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Gemini model — searchable combobox */}
              <div className="space-y-2">
                <Label>Gemini Model</Label>
                <Popover
                  open={isGmModelPopoverOpen}
                  onOpenChange={setIsGmModelPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                      disabled={isSavingConfig}
                    >
                      {isLoadingGeminiModels && geminiModels.length === 0 ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading models...
                        </span>
                      ) : (
                        <span className="truncate text-sm">
                          {aiConfig.geminiModel || "Select model..."}
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-(--radix-popover-trigger-width)"
                    align="start"
                  >
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search models..."
                          className="pl-8 h-9"
                          value={gmModelSearch}
                          onChange={(e) => setGmModelSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    {isLoadingGeminiModels ? (
                      <div className="flex items-center justify-center py-6 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Loading models...
                        </span>
                      </div>
                    ) : geminiModelsError ? (
                      <div className="py-6 px-4 text-center space-y-2">
                        <p className="text-sm text-destructive">{geminiModelsError}</p>
                        <button
                          type="button"
                          className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                          onClick={(e) => { e.stopPropagation(); fetchGeminiModels(); }}
                        >
                          Retry
                        </button>
                      </div>
                    ) : filteredGeminiModels.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No models found
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {filteredGeminiModels.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer text-left"
                            onClick={() => {
                              setAiConfig((p) => ({
                                ...p,
                                geminiModel: model.id,
                              }));
                              setIsGmModelPopoverOpen(false);
                              setGmModelSearch("");
                            }}
                          >
                            <Check
                              className={`h-4 w-4 shrink-0 ${
                                aiConfig.geminiModel === model.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="font-mono text-xs truncate">
                                {model.id}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {model.displayName}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Free model warning */}
              {aiConfig.provider === "openrouter" &&
                aiConfig.openrouterModel.includes(":free") && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        Free model selected — heavy AI operations will fail
                      </p>
                    </div>
                    <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 ml-6 list-disc">
                      <li>
                        Free models typically have an <strong>8,192 token context window</strong>.
                      </li>
                      <li>
                        This platform's AI operations (documentation generation, application
                        analysis, task generation) send <strong>3,000–5,000 input tokens</strong> and
                        request up to <strong>8,192 output tokens</strong> — totalling
                        10,000–13,000+ tokens per call, which exceeds the free limit.
                      </li>
                      <li>
                        The <em>Test AI</em> panel below uses only ~170 tokens and will
                        pass even on free models — a passing test does <strong>not</strong> mean
                        the model will work for real operations.
                      </li>
                      <li>
                        Free tiers are also rate-limited by total tokens per day; one
                        documentation generation burns ~76× more quota than one test.
                      </li>
                    </ul>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300 ml-6">
                      → Use a paid OpenRouter model (32k+ context) or switch Primary Provider
                      to <strong>Gemini</strong> for reliable production use.
                    </p>
                  </div>
                )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveConfig}
                  disabled={isSavingConfig}
                >
                  {isSavingConfig ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test AI Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Test AI Providers
          </CardTitle>
          <CardDescription>
            Send a live test request to each provider using your active keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["openrouter", "gemini"] as const).map((provider) => {
              const test = provider === "openrouter" ? orTest : gmTest;
              const model =
                provider === "openrouter"
                  ? aiConfig.openrouterModel
                  : aiConfig.geminiModel;
              const label = provider === "openrouter" ? "OpenRouter" : "Gemini";

              return (
                <div
                  key={provider}
                  className="rounded-lg border p-4 space-y-3"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="font-mono text-xs text-muted-foreground truncate max-w-50">
                        {model || "—"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={test.status === "loading" || isLoadingConfig}
                      onClick={() => handleTest(provider)}
                    >
                      {test.status === "loading" ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <FlaskConical className="mr-2 h-3.5 w-3.5" />
                          Run Test
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Result */}
                  {test.status === "done" && (
                    <div className="space-y-3">
                      {/* Status badge */}
                      <div className="flex items-center gap-2">
                        {test.success ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span className="text-sm font-medium text-green-600">
                              Working
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-destructive shrink-0" />
                            <span className="text-sm font-medium text-destructive">
                              Failed
                            </span>
                          </>
                        )}
                      </div>

                      {/* Response text */}
                      {test.response && (
                        <div className="rounded-md bg-muted px-3 py-2 text-sm italic text-muted-foreground">
                          &ldquo;{test.response.trim()}&rdquo;
                        </div>
                      )}

                      {/* Stats */}
                      {test.success && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Cpu className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{test.model}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Key className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{test.keyUsed ?? "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{test.durationMs}ms</span>
                          </div>
                          {test.tokens && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="font-mono">
                                ↑{test.tokens.prompt} ↓{test.tokens.completion}{" "}
                                ={test.tokens.total} tok
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Error */}
                      {!test.success && test.error && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 space-y-1">
                          <p className="text-xs font-medium text-destructive">
                            {test.error}
                          </p>
                          {test.durationMs > 0 && (
                            <p className="text-xs text-muted-foreground">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {test.durationMs}ms
                            </p>
                          )}
                        </div>
                      )}

                      {/* Keys tried (if any failed) */}
                      {test.keysTried && test.keysTried.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Keys tried:
                          </p>
                          {test.keysTried.map((k, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-1.5 text-xs"
                            >
                              <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                              <span>
                                <span className="font-mono font-medium">
                                  {k.keyId}
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  — {k.error}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Idle hint */}
                  {test.status === "idle" && (
                    provider === "openrouter" ? (
                      <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                            What this test validates
                          </p>
                        </div>
                        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5 ml-5 list-disc">
                          <li>API key is valid and authenticated</li>
                          <li>Model is reachable (~20 input + 150 output tokens)</li>
                        </ul>
                        <div className="flex items-start gap-1.5 ml-5">
                          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            A passing test does <strong>not</strong> guarantee the model can handle real operations
                            (10,000–13,000 tokens). Free models will pass this test but fail on
                            documentation generation, application analysis, and task generation.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Click &ldquo;Run Test&rdquo; to verify this provider.
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
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
                <Button
                  className="flex items-center gap-2 w-full sm:w-auto"
                  disabled={isLoading.fetch}
                >
                  {isLoading.fetch ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
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
                      disabled={isLoading.creating}
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
                      disabled={isLoading.creating}
                      onChange={(e) =>
                        setNewKey((prev) => ({ ...prev, keyName: e.target.value }))
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
                        disabled={isLoading.creating}
                        onChange={(e) =>
                          setNewKey((prev) => ({ ...prev, apiKey: e.target.value }))
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
                      disabled={isLoading.creating}
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
                        <SelectItem value="OpenRouter">OpenRouter</SelectItem>
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
                      disabled={isLoading.creating}
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
                        disabled={isLoading.creating}
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

      {/* View / Edit Key Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>AI Key Details</DialogTitle>
            <DialogDescription>View and edit AI key information</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {editedKey ? (
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="editAiID">AI ID</Label>
                  <Input id="editAiID" value={editedKey.aiID} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editKeyName">Key Name</Label>
                  <Input
                    id="editKeyName"
                    value={editedKey.keyName}
                    disabled={isLoading.updating || isLoading.deleting}
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
                      disabled={isLoading.updating || isLoading.deleting}
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
                    disabled={isLoading.updating || isLoading.deleting}
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
                      <SelectItem value="OpenRouter">OpenRouter</SelectItem>
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
                    disabled={isLoading.updating || isLoading.deleting}
                    onChange={(e) =>
                      setEditedKey((prev) =>
                        prev
                          ? { ...prev, priority: Number.parseInt(e.target.value) || 1 }
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
                      disabled={isLoading.updating || isLoading.deleting}
                      onCheckedChange={(checked) =>
                        setEditedKey((prev) =>
                          prev
                            ? { ...prev, status: checked ? "active" : "inactive" }
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
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No key selected</p>
              </div>
            )}
          </div>
          {editedKey && (
            <div className="shrink-0 border-t pt-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleUpdateKey}
                  disabled={!hasChanges() || isLoading.updating || isLoading.deleting}
                  className="flex-1 order-1 sm:order-0"
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
                  disabled={isLoading.deleting || isLoading.updating}
                  className="flex-1 order-2 sm:order-0"
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
