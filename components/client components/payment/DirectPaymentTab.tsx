"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap, Info, Loader2, Tag, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButton } from "@/components/ui-custom/loading-button";
import { toast } from "sonner";
import { auth } from "@/firebase";
import { useAuthStore } from "@/lib/store/userStore";
import { fetchClientProjects } from "@/app/actions/client-actions";
import {
  getPayuPublicStatusAction,
  validateCouponAction,
} from "@/app/actions/payment-actions";
import { Project } from "@/lib/types";

type AppliedCoupon = {
  code: string;
  originalAmount: number;
  discountedAmount: number;
  discountLabel: string;
};

const DirectPaymentTab = () => {
  const { profile } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [payuActive, setPayuActive] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [paying, setPaying] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // A coupon is tied to a specific project — drop it when the selection changes.
  useEffect(() => {
    setAppliedCoupon(null);
    setCouponInput("");
  }, [selectedId]);

  useEffect(() => {
    if (!profile?.email) return;
    let active = true;
    Promise.all([
      fetchClientProjects(profile.email),
      getPayuPublicStatusAction(),
    ])
      .then(([projectsRes, statusRes]) => {
        if (!active) return;
        if (projectsRes.success && projectsRes.data) {
          // Payable online = admin-accepted (in-progress) INR projects with a
          // quoted finalCost. Paying moves them to "started".
          const payable = projectsRes.data.filter(
            (p) =>
              p.status === "in-progress" &&
              (!p.currency || p.currency === "INR") &&
              (p.finalCost ?? 0) > 0
          );
          setProjects(payable);
        }
        setPayuActive(statusRes.isActive);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profile?.email]);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId),
    [projects, selectedId]
  );
  // In-progress projects always carry a quoted finalCost; fall back defensively.
  const amount = selected
    ? selected.finalCost || selected.projectBudget
    : 0;
  // What the client will actually be charged.
  const payableAmount = appliedCoupon ? appliedCoupon.discountedAmount : amount;

  const handleApplyCoupon = async () => {
    if (!selected) {
      toast.error("Select a project first");
      return;
    }
    if (!couponInput.trim()) {
      toast.error("Enter a coupon code");
      return;
    }
    setApplyingCoupon(true);
    try {
      const res = await validateCouponAction(couponInput.trim(), selected.id);
      if (
        res.success &&
        res.discountedAmount != null &&
        res.originalAmount != null
      ) {
        setAppliedCoupon({
          code: couponInput.trim().toUpperCase(),
          originalAmount: res.originalAmount,
          discountedAmount: res.discountedAmount,
          discountLabel: res.discountLabel || "Discount applied",
        });
        toast.success("Coupon applied");
      } else {
        setAppliedCoupon(null);
        toast.error(res.error || "Invalid coupon");
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };

  const handlePay = async () => {
    if (!selected) {
      toast.error("Please select a project to pay for");
      return;
    }
    setPaying(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/payu/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selected.id,
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not start payment");
      }

      // Hand off to PayU via a top-level form POST (hosted checkout).
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.action;
      Object.entries(data.params as Record<string, string>).forEach(
        ([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
      );
      document.body.appendChild(form);
      form.submit();
    } catch (error: any) {
      toast.error(error.message || "Could not start payment");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading your projects…
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Pay Online (PayU)
        </CardTitle>
        <CardDescription>
          Select a project and pay its quoted amount securely via PayU. The
          project starts automatically once payment succeeds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!payuActive && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Online payment is currently unavailable. Please use the Manual
              Payment tab.
            </AlertDescription>
          </Alert>
        )}

        {projects.length === 0 ? (
          <Alert className="border-blue-200 bg-blue-50 text-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You have no projects awaiting payment. Online payment is available
              once an admin accepts your project and sets its final cost.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="selectProject">Select project</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="selectProject">
                  <SelectValue placeholder="Choose a project to pay for" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.projectName} — ₹
                      {(p.finalCost || p.projectBudget).toLocaleString("en-IN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected && (
              <>
                <div className="rounded-lg border bg-muted/40 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Amount payable
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">
                        ₹{payableAmount.toLocaleString("en-IN")}
                      </p>
                      {appliedCoupon && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{appliedCoupon.originalAmount.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Full payment · INR
                  </span>
                </div>

                {/* Coupon */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {appliedCoupon.code}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        {appliedCoupon.discountLabel}
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      aria-label="Remove coupon"
                      className="text-green-700 hover:text-green-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="couponInput">Have a coupon?</Label>
                    <div className="flex gap-2">
                      <Input
                        id="couponInput"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) =>
                          setCouponInput(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        className="font-mono"
                      />
                      <LoadingButton
                        variant="outline"
                        loading={applyingCoupon}
                        loadingText="Applying…"
                        onClick={handleApplyCoupon}
                      >
                        Apply
                      </LoadingButton>
                    </div>
                  </div>
                )}
              </>
            )}

            <LoadingButton
              loading={paying}
              loadingText="Redirecting to PayU…"
              onClick={handlePay}
              disabled={!payuActive || !selected || applyingCoupon}
              className="w-full"
            >
              <Zap className="h-4 w-4" />
              {selected
                ? `Pay ₹${payableAmount.toLocaleString("en-IN")} with PayU`
                : "Pay with PayU"}
            </LoadingButton>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DirectPaymentTab;
