import { NextRequest, NextResponse } from "next/server";
import { PayuTransactionStatus } from "@/lib/types";
import { verifyResponseHash } from "@/lib/payu";
import {
  finalizePayuTransaction,
  getPayuConfigDoc,
  getPayuTransaction,
} from "@/lib/firebase/payments";

export const runtime = "nodejs";

// PayU posts the payment result here (both success surl and failure furl point
// to this route). Trust comes from the SHA-512 response hash, not from any user
// session — PayU's server makes this call.
export async function POST(req: NextRequest) {
  const config = await getPayuConfigDoc().catch(() => null);
  const base = config?.appBaseUrl?.trim() || req.nextUrl.origin;

  const resultUrl = (txnid: string, verified: boolean) =>
    new URL(
      `/client/payment/result/?txnid=${encodeURIComponent(txnid)}${
        verified ? "" : "&v=0"
      }`,
      base
    );

  try {
    const form = await req.formData();
    const params: Record<string, string> = {};
    form.forEach((value, key) => {
      params[key] = typeof value === "string" ? value : "";
    });

    const txnid = params.txnid || "";
    if (!txnid) {
      return NextResponse.redirect(new URL("/client/payment/", base), 303);
    }

    const salt = config?.merchantSalt;
    // Without the salt we can't trust the response — fail closed, change nothing.
    if (!salt || !verifyResponseHash(params, salt)) {
      return NextResponse.redirect(resultUrl(txnid, false), 303);
    }

    const txn = await getPayuTransaction(txnid);
    if (!txn) {
      return NextResponse.redirect(resultUrl(txnid, false), 303);
    }

    // Amount tamper check — the hash already covers amount, this is defence in depth.
    const reportedAmount = parseFloat(params.amount || "0");
    const amountMatches = Math.abs(reportedAmount - txn.amount) < 0.01;

    let status: PayuTransactionStatus;
    if (params.status === "success" && amountMatches) {
      status = "success";
    } else if (params.status === "pending") {
      status = "pending";
    } else {
      status = "failure";
    }

    const result = await finalizePayuTransaction(txnid, {
      status,
      mihpayid: params.mihpayid,
      payuMode: params.mode,
      payuResponse: params,
    });

    // If recording the outcome failed (e.g. Firestore contention), don't tell
    // the user the payment is confirmed — the result page reads the persisted
    // status, which is still authoritative.
    return NextResponse.redirect(resultUrl(txnid, result.ok), 303);
  } catch (error) {
    console.error("PayU callback error:", error);
    return NextResponse.redirect(new URL("/client/payment/", base), 303);
  }
}
