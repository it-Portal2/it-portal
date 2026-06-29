"use client";

import { useEffect, useState } from "react";
import { Globe, Plus, Pencil, Trash2, X, Save, Download } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingButton } from "@/components/ui-custom/loading-button";
import ProjectTable from "@/components/ui-custom/ProjectTable";
import { toast } from "sonner";
import {
  createInternationalBankAccountAction,
  deleteInternationalBankAccountAction,
  fetchAllInternationalBankAccountsAction,
  seedInternationalBankAccountsAction,
  toggleInternationalBankAccountActiveAction,
  updateInternationalBankAccountAction,
} from "@/app/actions/payment-actions";
import { InternationalBankAccount } from "@/lib/types";

// Client-only stable id so removing a row doesn't shuffle React keys and
// corrupt controlled inputs. Stripped before persisting.
type FieldRow = { id: string; label: string; value: string };

const newFieldRow = (): FieldRow => ({
  id: crypto.randomUUID(),
  label: "",
  value: "",
});

type FormState = {
  country: string;
  bankName: string;
  accountHolderName: string;
  paymentMethod: string;
  accountType: string;
  beneficiaryAddress: string;
  currency: string;
  priority: string;
  isActive: boolean;
  fields: FieldRow[];
};

const EMPTY_FORM: FormState = {
  country: "",
  bankName: "",
  accountHolderName: "",
  paymentMethod: "",
  accountType: "",
  beneficiaryAddress: "",
  currency: "",
  priority: "0",
  isActive: true,
  fields: [],
};

const InternationalAccountsManager = () => {
  const [accounts, setAccounts] = useState<InternationalBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetchAllInternationalBankAccountsAction();
    if (res.success && res.data) setAccounts(res.data);
    else if (res.error) toast.error(res.error);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      priority: String(accounts.length + 1),
      fields: [newFieldRow()],
    });
    setDialogOpen(true);
  };

  const openEdit = (account: InternationalBankAccount) => {
    setEditingId(account.id);
    setForm({
      country: account.country,
      bankName: account.bankName,
      accountHolderName: account.accountHolderName,
      paymentMethod: account.paymentMethod,
      accountType: account.accountType,
      beneficiaryAddress: account.beneficiaryAddress,
      currency: account.currency || "",
      priority: String(account.priority ?? 0),
      isActive: account.isActive,
      fields:
        account.fields.length > 0
          ? account.fields.map((f) => ({ ...f, id: crypto.randomUUID() }))
          : [newFieldRow()],
    });
    setDialogOpen(true);
  };

  const setField = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateDynamicField = (
    index: number,
    key: "label" | "value",
    value: string
  ) =>
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === index ? { ...f, [key]: value } : f
      ),
    }));

  const addDynamicField = () =>
    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, newFieldRow()],
    }));

  const removeDynamicField = (index: number) =>
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));

  const handleSave = async () => {
    if (!form.country.trim() || !form.bankName.trim()) {
      toast.error("Country and Bank Name are required");
      return;
    }
    const cleanedFields = form.fields
      .filter((f) => f.label.trim() && f.value.trim())
      .map((f) => ({ label: f.label.trim(), value: f.value.trim() }));
    const payload = {
      country: form.country.trim(),
      bankName: form.bankName.trim(),
      accountHolderName: form.accountHolderName.trim(),
      paymentMethod: form.paymentMethod.trim(),
      accountType: form.accountType.trim(),
      beneficiaryAddress: form.beneficiaryAddress.trim(),
      currency: form.currency.trim(),
      priority: Number(form.priority) || 0,
      isActive: form.isActive,
      fields: cleanedFields,
    };

    setSaving(true);
    try {
      const result = editingId
        ? await updateInternationalBankAccountAction(editingId, payload)
        : await createInternationalBankAccountAction(payload);
      if (result.success) {
        toast.success(editingId ? "Account updated" : "Account added");
        setDialogOpen(false);
        await load();
      } else {
        toast.error(result.error || "Failed to save account");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (account: InternationalBankAccount) => {
    setTogglingId(account.id);
    const result = await toggleInternationalBankAccountActiveAction(
      account.id,
      !account.isActive
    );
    if (result.success) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === account.id ? { ...a, isActive: !a.isActive } : a
        )
      );
    } else {
      toast.error(result.error || "Failed to update status");
    }
    setTogglingId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteInternationalBankAccountAction(deleteId);
    if (result.success) {
      toast.success("Account deleted");
      setAccounts((prev) => prev.filter((a) => a.id !== deleteId));
      setDeleteId(null);
    } else {
      toast.error(result.error || "Failed to delete account");
    }
    setDeleting(false);
  };

  const handleSeed = async () => {
    setSeeding(true);
    const result = await seedInternationalBankAccountsAction();
    if (result.success) {
      toast.success(
        result.seeded > 0
          ? `Seeded ${result.seeded} default accounts`
          : "Accounts already present — nothing to seed"
      );
      await load();
    } else {
      toast.error(result.error || "Failed to seed accounts");
    }
    setSeeding(false);
  };

  const columns = [
    { header: "Country", accessor: "country" },
    { header: "Bank", accessor: "bankName" },
    { header: "Method", accessor: "paymentMethod" },
    {
      header: "Status",
      accessor: "isActive",
      cell: (row: InternationalBankAccount) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.isActive}
            onCheckedChange={() => handleToggle(row)}
            disabled={togglingId === row.id}
          />
          <span
            className={`text-sm ${
              row.isActive ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {row.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row: InternationalBankAccount) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Edit ${row.country} account`}
            className="h-8 w-8 p-0"
            onClick={() => openEdit(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${row.country} account`}
            className="h-8 w-8 p-0 text-red-600"
            onClick={() => setDeleteId(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              International Bank Accounts
            </CardTitle>
            <CardDescription>
              Per-country accounts shown on the client Manual payment tab. Only
              active accounts are visible to clients.
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            {accounts.length === 0 && !loading && (
              <LoadingButton
                variant="outline"
                loading={seeding}
                loadingText="Seeding..."
                onClick={handleSeed}
              >
                <Download className="h-4 w-4" />
                Seed defaults
              </LoadingButton>
            )}
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add account
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ProjectTable
          data={accounts}
          columns={columns}
          loading={loading}
          itemsPerPage={6}
          emptyMessage="No international accounts yet. Add one or seed the defaults."
        />
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit account" : "Add international account"}
            </DialogTitle>
            <DialogDescription>
              Add the country&apos;s bank details. Use the custom fields for
              anything specific (IBAN, SWIFT, routing, BSB, etc.).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                  placeholder="United States"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Name *</Label>
                <Input
                  value={form.bankName}
                  onChange={(e) => setField("bankName", e.target.value)}
                  placeholder="JPMorgan Chase & Co."
                />
              </div>
              <div className="space-y-2">
                <Label>Account Holder</Label>
                <Input
                  value={form.accountHolderName}
                  onChange={(e) =>
                    setField("accountHolderName", e.target.value)
                  }
                  placeholder="CEHPOINT"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Input
                  value={form.paymentMethod}
                  onChange={(e) => setField("paymentMethod", e.target.value)}
                  placeholder="ACH / SWIFT / SEPA"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Input
                  value={form.accountType}
                  onChange={(e) => setField("accountType", e.target.value)}
                  placeholder="Business checking account"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                  placeholder="USD"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setField("priority", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beneficiary Address</Label>
              <Input
                value={form.beneficiaryAddress}
                onChange={(e) =>
                  setField("beneficiaryAddress", e.target.value)
                }
                placeholder="383 Madison Ave, New York, NY 10179, USA"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Custom fields</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDynamicField}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add field
                </Button>
              </div>
              <div className="space-y-2">
                {form.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="Label (e.g. IBAN)"
                      value={field.label}
                      onChange={(e) =>
                        updateDynamicField(index, "label", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) =>
                        updateDynamicField(index, "value", e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Remove field"
                      className="h-9 w-9 p-0 shrink-0"
                      onClick={() => removeDynamicField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setField("isActive", v)}
              />
              <span className="text-sm">
                {form.isActive ? "Active (visible to clients)" : "Inactive"}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <LoadingButton
              loading={saving}
              loadingText="Saving..."
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              {editingId ? "Update account" : "Add account"}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account from the client payment page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default InternationalAccountsManager;
