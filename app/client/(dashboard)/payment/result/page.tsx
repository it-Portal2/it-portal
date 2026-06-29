"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchPayuTransactionAction } from "@/app/actions/payment-actions";

type TxnView = {
  txnid: string;
  status: string;
  amount: number;
  projectId: string;
  projectName: string;
  mihpayid?: string;
};

function ResultInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txnid = searchParams.get("txnid") || "";
  const verified = searchParams.get("v") !== "0";

  const [loading, setLoading] = useState(true);
  const [txn, setTxn] = useState<TxnView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!txnid) {
      setLoading(false);
      setError("Missing transaction reference");
      return;
    }
    fetchPayuTransactionAction(txnid)
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) setTxn(res.data);
        else setError(res.error || "Could not load payment");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [txnid]);

  // A successful payment requires both a verified callback and a success status.
  const isSuccess = verified && txn?.status === "success";
  const isPending = verified && txn?.status === "pending";

  const close = () => router.replace("/client/payment/");

  const view = (() => {
    if (isSuccess) {
      return {
        icon: <CheckCircle2 className="h-14 w-14 text-green-600" />,
        title: "Payment successful",
        description: `Your payment for "${txn?.projectName}" is complete and the project has been started.`,
      };
    }
    if (isPending) {
      return {
        icon: <Clock className="h-14 w-14 text-amber-500" />,
        title: "Payment pending",
        description:
          "Your payment is being processed. The project will activate automatically once the bank confirms it.",
      };
    }
    return {
      icon: <XCircle className="h-14 w-14 text-red-600" />,
      title: "Payment not completed",
      description:
        error ||
        "We couldn't confirm your payment. No project was activated. You can try again.",
    };
  })();

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          {loading ? (
            <Loader2 className="h-14 w-14 animate-spin text-muted-foreground" />
          ) : (
            view.icon
          )}
          <DialogHeader className="items-center">
            <DialogTitle className="text-xl">
              {loading ? "Confirming payment…" : view.title}
            </DialogTitle>
            <DialogDescription className="text-center">
              {loading
                ? "Please wait while we verify your transaction."
                : view.description}
            </DialogDescription>
          </DialogHeader>

          {!loading && txn && (
            <div className="w-full rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  ₹{txn.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">
                  {txn.mihpayid || txn.txnid}
                </span>
              </div>
            </div>
          )}
        </div>

        {!loading && (
          <DialogFooter className="sm:justify-center gap-2">
            {isSuccess && txn ? (
              <Button
                onClick={() =>
                  router.replace(`/client/projects/${txn.projectId}/`)
                }
              >
                View project
              </Button>
            ) : (
              !isPending && (
                <Button onClick={() => router.replace("/client/payment/")}>
                  Try again
                </Button>
              )
            )}
            <Button variant="outline" onClick={close}>
              Back to payments
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ResultInner />
    </Suspense>
  );
}
