"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Save, Trash2, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingButton } from "@/components/ui-custom/loading-button";
import { toast } from "sonner";
import {
  deletePayuConfigAction,
  fetchPayuConfigAction,
  savePayuConfigAction,
} from "@/app/actions/payment-actions";

type PayuForm = {
  merchantKey: string;
  merchantSalt: string;
  clientId: string;
  clientSecret: string;
  appBaseUrl: string;
  isActive: boolean;
};

const EMPTY: PayuForm = {
  merchantKey: "",
  merchantSalt: "",
  clientId: "",
  clientSecret: "",
  appBaseUrl: "",
  isActive: false,
};

const PayuConfigCard = () => {
  const [form, setForm] = useState<PayuForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    fetchPayuConfigAction().then((res) => {
      if (res.success && res.data) {
        setForm({
          merchantKey: res.data.merchantKey || "",
          merchantSalt: res.data.merchantSalt || "",
          clientId: res.data.clientId || "",
          clientSecret: res.data.clientSecret || "",
          appBaseUrl: res.data.appBaseUrl || "",
          isActive: Boolean(res.data.isActive),
        });
      }
    });
  }, []);

  const set = (field: keyof PayuForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.merchantKey.trim() || !form.merchantSalt.trim()) {
      toast.error("Merchant Key and Salt are required");
      return;
    }
    setSaving(true);
    try {
      const result = await savePayuConfigAction({
        mode: "production",
        merchantKey: form.merchantKey.trim(),
        merchantSalt: form.merchantSalt.trim(),
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret.trim(),
        appBaseUrl: form.appBaseUrl.trim(),
        isActive: form.isActive,
      });
      if (result.success) toast.success("PayU configuration saved");
      else toast.error(result.error || "Failed to save PayU configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deletePayuConfigAction();
      if (result.success) {
        setForm(EMPTY);
        toast.success("PayU configuration deleted");
      } else {
        toast.error(result.error || "Failed to delete PayU configuration");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              PayU Gateway (Online Payments)
            </CardTitle>
            <CardDescription>
              Production credentials for direct online card/UPI payments. Stored
              securely and used server-side only.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => set("isActive", v)}
              aria-label="PayU gateway active"
            />
            <span
              className={`text-sm ${
                form.isActive ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {form.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payuAppBaseUrl">App Base URL</Label>
            <Input
              id="payuAppBaseUrl"
              placeholder="https://your-domain.com"
              value={form.appBaseUrl}
              onChange={(e) => set("appBaseUrl", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payuKey">Merchant Key *</Label>
            <Input
              id="payuKey"
              placeholder="PayU merchant key"
              value={form.merchantKey}
              onChange={(e) => set("merchantKey", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payuSalt">Merchant Salt *</Label>
            <div className="relative">
              <Input
                id="payuSalt"
                type={showSecrets ? "text" : "password"}
                placeholder="PayU salt (v1)"
                value={form.merchantSalt}
                onChange={(e) => set("merchantSalt", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={showSecrets ? "Hide secrets" : "Show secrets"}
                onClick={() => setShowSecrets((s) => !s)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                {showSecrets ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payuClientId">Client ID</Label>
            <Input
              id="payuClientId"
              placeholder="Optional (for refund/verify API)"
              value={form.clientId}
              onChange={(e) => set("clientId", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payuClientSecret">Client Secret</Label>
            <Input
              id="payuClientSecret"
              type={showSecrets ? "text" : "password"}
              placeholder="Optional (for refund/verify API)"
              value={form.clientSecret}
              onChange={(e) => set("clientSecret", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <LoadingButton
          variant="destructive"
          loading={deleting}
          loadingText="Deleting..."
          onClick={handleDelete}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </LoadingButton>
        <LoadingButton
          loading={saving}
          loadingText="Saving..."
          onClick={handleSave}
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4" />
          Save PayU Details
        </LoadingButton>
      </CardFooter>
    </Card>
  );
};

export default PayuConfigCard;
