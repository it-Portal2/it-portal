"use client";

import { useEffect, useState } from "react";
import { Ticket, Plus, Trash2, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  createCouponAction,
  deleteCouponAction,
  fetchAllCouponsAction,
  toggleCouponActiveAction,
} from "@/app/actions/payment-actions";
import { Coupon, CouponDiscountType } from "@/lib/types";

const randomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const CouponsTab = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] =
    useState<CouponDiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetchAllCouponsAction();
    if (res.success && res.data) setCoupons(res.data);
    else if (res.error) toast.error(res.error);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const value = Number(discountValue);
    if (!code.trim()) {
      toast.error("Enter or generate a coupon code");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (discountType === "percentage" && value > 100) {
      toast.error("Percentage discount cannot exceed 100");
      return;
    }

    setCreating(true);
    try {
      const result = await createCouponAction({
        code: code.trim(),
        discountType,
        discountValue: value,
        isActive,
      });
      if (result.success) {
        toast.success("Coupon created");
        setCode("");
        setDiscountValue("");
        setDiscountType("percentage");
        setIsActive(true);
        await load();
      } else {
        toast.error(result.error || "Failed to create coupon");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    setTogglingCode(coupon.code);
    const result = await toggleCouponActiveAction(coupon.code, !coupon.isActive);
    if (result.success) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.code === coupon.code ? { ...c, isActive: !c.isActive } : c
        )
      );
    } else {
      toast.error(result.error || "Failed to update coupon");
    }
    setTogglingCode(null);
  };

  const handleDelete = async () => {
    if (!deleteCode) return;
    setDeleting(true);
    const result = await deleteCouponAction(deleteCode);
    if (result.success) {
      toast.success("Coupon deleted");
      setCoupons((prev) => prev.filter((c) => c.code !== deleteCode));
      setDeleteCode(null);
    } else {
      toast.error(result.error || "Failed to delete coupon");
    }
    setDeleting(false);
  };

  const columns = [
    {
      header: "Code",
      accessor: "code",
      cell: (row: Coupon) => (
        <span className="font-mono font-medium">{row.code}</span>
      ),
    },
    {
      header: "Discount",
      accessor: "discountValue",
      cell: (row: Coupon) =>
        row.discountType === "percentage"
          ? `${row.discountValue}%`
          : `₹${row.discountValue.toLocaleString("en-IN")}`,
    },
    {
      header: "Type",
      accessor: "discountType",
      cell: (row: Coupon) => (
        <Badge variant="outline" className="capitalize">
          {row.discountType}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessor: "isActive",
      cell: (row: Coupon) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.isActive}
            onCheckedChange={() => handleToggle(row)}
            disabled={togglingCode === row.code}
            aria-label={`Toggle coupon ${row.code}`}
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
      cell: (row: Coupon) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Delete coupon ${row.code}`}
          className="h-8 w-8 p-0 text-red-600"
          onClick={() => setDeleteCode(row.code)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Create Coupon
          </CardTitle>
          <CardDescription>
            Generate discount coupons clients can apply at online (PayU)
            checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="couponCode"
                  placeholder="e.g. WELCOME10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCode(randomCode())}
                >
                  <Sparkles className="h-4 w-4" />
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="couponType">Discount Type *</Label>
              <Select
                value={discountType}
                onValueChange={(v) => setDiscountType(v as CouponDiscountType)}
              >
                <SelectTrigger id="couponType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="flat">Flat amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="couponValue">
                {discountType === "percentage"
                  ? "Discount Percentage *"
                  : "Discount Amount (₹) *"}
              </Label>
              <Input
                id="couponValue"
                type="number"
                min="1"
                max={discountType === "percentage" ? "100" : undefined}
                placeholder={discountType === "percentage" ? "10" : "500"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <Switch
                id="couponActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="couponActive" className="text-sm font-normal">
                {isActive ? "Active" : "Inactive"}
              </Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <LoadingButton
            loading={creating}
            loadingText="Creating..."
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4" />
            Create Coupon
          </LoadingButton>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Coupons</CardTitle>
          <CardDescription>
            Toggle a coupon off to instantly stop it from being accepted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectTable
            data={coupons.map((c) => ({ ...c, id: c.code }))}
            columns={columns}
            loading={loading}
            itemsPerPage={6}
            emptyMessage="No coupons yet. Create one above."
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(deleteCode)}
        onOpenChange={(open) => !open && setDeleteCode(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon {deleteCode}?</AlertDialogTitle>
            <AlertDialogDescription>
              Clients will no longer be able to apply this code.
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
    </div>
  );
};

export default CouponsTab;
