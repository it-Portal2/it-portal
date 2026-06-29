import { adminDb } from "@/firebaseAdmin";
import {
  Coupon,
  InternationalBankAccount,
  PayuConfig,
  PayuTransaction,
  PayuTransactionStatus,
} from "../types";

const PAYU_CONFIG_DOC = adminDb.collection("paymentConfig").doc("payu");
const INTL_COLLECTION = adminDb.collection("internationalBankAccounts");
const TXN_COLLECTION = adminDb.collection("payuTransactions");
const COUPON_COLLECTION = adminDb.collection("coupons");

// Minimum chargeable amount — PayU rejects ₹0/negative, so a discount that meets
// or exceeds the price is clamped here.
export const MIN_PAYABLE_AMOUNT = 1;

// Pure, shared discount math — used by both the client-facing preview and the
// authoritative server-side recompute in /api/payu/initiate, so they never drift.
export function applyCoupon(price: number, coupon: Coupon): number {
  const discounted =
    coupon.discountType === "percentage"
      ? price * (1 - coupon.discountValue / 100)
      : price - coupon.discountValue;
  return Math.max(MIN_PAYABLE_AMOUNT, Math.round(discounted * 100) / 100);
}

// ---------- PayU gateway config ----------

// Full config including secrets — callers must be admin-gated. Used to prefill
// the admin form. Server-side only (lives in a non-"use client" module).
export async function getPayuConfigDoc(): Promise<PayuConfig | null> {
  const snap = await PAYU_CONFIG_DOC.get();
  return snap.exists ? (snap.data() as PayuConfig) : null;
}

export async function savePayuConfig(
  patch: Partial<PayuConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const existing = await PAYU_CONFIG_DOC.get();
    await PAYU_CONFIG_DOC.set(
      {
        ...patch,
        createdAt: existing.exists
          ? (existing.data() as PayuConfig).createdAt
          : now,
        updatedAt: now,
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Error saving PayU config:", error);
    return { success: false, error: "Failed to save PayU config" };
  }
}

export async function deletePayuConfig(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await PAYU_CONFIG_DOC.delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting PayU config:", error);
    return { success: false, error: "Failed to delete PayU config" };
  }
}

// ---------- International bank accounts (admin-managed, dynamic) ----------

export async function getInternationalBankAccounts(
  activeOnly = false
): Promise<InternationalBankAccount[]> {
  try {
    const snapshot = await INTL_COLLECTION.get();
    const accounts: InternationalBankAccount[] = [];
    snapshot.forEach((doc) => {
      accounts.push({ id: doc.id, ...doc.data() } as InternationalBankAccount);
    });
    const filtered = activeOnly
      ? accounts.filter((a) => a.isActive)
      : accounts;
    // Sort in memory to avoid requiring a composite index.
    return filtered.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  } catch (error) {
    console.error("Error fetching international bank accounts:", error);
    return [];
  }
}

export async function createInternationalBankAccount(
  data: Omit<InternationalBankAccount, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const now = new Date().toISOString();
    const docRef = await INTL_COLLECTION.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating international bank account:", error);
    return { success: false, error: "Failed to create account" };
  }
}

export async function updateInternationalBankAccount(
  id: string,
  patch: Partial<Omit<InternationalBankAccount, "id" | "createdAt">>
): Promise<{ success: boolean; error?: string }> {
  try {
    await INTL_COLLECTION.doc(id).update({
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating international bank account:", error);
    return { success: false, error: "Failed to update account" };
  }
}

export async function deleteInternationalBankAccount(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await INTL_COLLECTION.doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting international bank account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}

export async function toggleInternationalBankAccountActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateInternationalBankAccount(id, { isActive });
}

// One-time population of the previously-hardcoded international accounts.
// Idempotent: only seeds when the collection is empty, so it never duplicates
// or overwrites admin edits.
export async function seedInternationalBankAccounts(): Promise<{
  success: boolean;
  seeded: number;
  error?: string;
}> {
  try {
    const existing = await INTL_COLLECTION.limit(1).get();
    if (!existing.empty) {
      return { success: true, seeded: 0 };
    }

    const now = new Date().toISOString();
    const seed: Omit<InternationalBankAccount, "id" | "createdAt" | "updatedAt">[] =
      [
        {
          country: "United States",
          bankName: "Community Federal Savings Bank",
          accountHolderName: "CEHPOINT",
          paymentMethod: "ACH",
          accountType: "Business checking account",
          beneficiaryAddress: "5 Penn Plaza, 14th Floor, New York, NY 10001, US",
          isActive: true,
          priority: 1,
          fields: [
            { label: "Routing Number (ACH)", value: "026073150" },
            { label: "Account Number", value: "8335166394" },
          ],
        },
        {
          country: "United States",
          bankName: "JPMorgan Chase & Co.",
          accountHolderName: "CEHPOINT",
          paymentMethod: "ACH / Fedwire / SWIFT",
          accountType: "Business Checking",
          beneficiaryAddress: "383 Madison Ave, New York, NY 10179, USA",
          isActive: true,
          priority: 2,
          fields: [
            { label: "Account Number", value: "20000045876362" },
            { label: "Routing Number (ACH)", value: "028000024" },
            { label: "Fedwire Routing Number", value: "021000021" },
            { label: "BIC/SWIFT Code", value: "CHASUS33XXX" },
          ],
        },
        {
          country: "United Kingdom",
          bankName: "The Currency Cloud Limited",
          accountHolderName: "CEHPOINT",
          paymentMethod: "SWIFT (International wire)",
          accountType: "Business checking account",
          beneficiaryAddress:
            "12 Steward Street, The Steward Building, London, E1 6FQ, Great Britain",
          isActive: true,
          priority: 3,
          fields: [
            { label: "IBAN", value: "GB60TCCL04140475392256" },
            { label: "BIC/SWIFT Code", value: "TCCLGB3L" },
            { label: "Beneficiary Bank Country", value: "United Kingdom" },
          ],
        },
        {
          country: "Germany",
          bankName: "Banking Circle",
          accountHolderName: "CEHPOINT",
          paymentMethod: "SEPA / SEPA Instant",
          accountType: "Business checking account",
          beneficiaryAddress:
            "Banking Circle S.A. - German Branch, Maximilianstraße 54, 80538 München",
          isActive: true,
          priority: 4,
          fields: [
            { label: "IBAN", value: "DE72202208000056418342" },
            { label: "BIC/SWIFT Code", value: "SXPYDEHH" },
          ],
        },
        {
          country: "Australia",
          bankName: "BC Payments",
          accountHolderName: "CEHPOINT",
          paymentMethod: "BECS / NPP / Osko",
          accountType: "Business checking account",
          beneficiaryAddress:
            "Level 11/10 Carrington St, Sydney NSW 2000, Australia",
          isActive: true,
          priority: 5,
          fields: [
            { label: "Account Number", value: "056418342" },
            { label: "BSB Number", value: "252000" },
          ],
        },
        {
          country: "Canada",
          bankName: "Digital Commerce Bank",
          accountHolderName: "CEHPOINT",
          paymentMethod: "EFT",
          accountType: "Business checking account",
          beneficiaryAddress: "736 Meridian Road N.E, Calgary, Alberta, CA",
          isActive: true,
          priority: 6,
          fields: [
            { label: "Account Number", value: "951160480" },
            { label: "Routing Number (ACH)", value: "035210009" },
            { label: "Institution Number", value: "352" },
            { label: "Transit Number", value: "10009" },
          ],
        },
        {
          country: "United Arab Emirates",
          bankName: "Zand Bank PJSC",
          accountHolderName: "CEHPOINT",
          paymentMethod: "IPP / FTS",
          accountType: "Business checking account",
          beneficiaryAddress:
            "1st Floor, Emaar Square, Building 6, Dubai, United Arab Emirates",
          isActive: true,
          priority: 7,
          fields: [
            { label: "IBAN", value: "AE550960000691060007781" },
            { label: "BIC/SWIFT Code", value: "ZANDAEAAXXX" },
          ],
        },
      ];

    const batch = adminDb.batch();
    seed.forEach((account) => {
      const ref = INTL_COLLECTION.doc();
      batch.set(ref, { ...account, createdAt: now, updatedAt: now });
    });
    await batch.commit();

    return { success: true, seeded: seed.length };
  } catch (error) {
    console.error("Error seeding international bank accounts:", error);
    return { success: false, seeded: 0, error: "Failed to seed accounts" };
  }
}

// ---------- PayU transactions ----------

// Creates the transaction doc keyed by txnid. `create()` fails if the id already
// exists, guaranteeing txnid uniqueness.
export async function createPayuTransaction(
  txn: PayuTransaction
): Promise<{ success: boolean; error?: string }> {
  try {
    await TXN_COLLECTION.doc(txn.txnid).create(txn);
    return { success: true };
  } catch (error) {
    console.error("Error creating PayU transaction:", error);
    return { success: false, error: "Failed to create transaction" };
  }
}

export async function getPayuTransaction(
  txnid: string
): Promise<PayuTransaction | null> {
  const snap = await TXN_COLLECTION.doc(txnid).get();
  return snap.exists ? (snap.data() as PayuTransaction) : null;
}

export async function getPayuTransactionsByProjectId(
  projectId: string
): Promise<PayuTransaction[]> {
  try {
    const snapshot = await TXN_COLLECTION.where(
      "projectId",
      "==",
      projectId
    ).get();
    const txns: PayuTransaction[] = [];
    snapshot.forEach((doc) => txns.push(doc.data() as PayuTransaction));
    return txns;
  } catch (error) {
    console.error("Error fetching PayU transactions by project:", error);
    return [];
  }
}

// Atomically applies the verified PayU result. Idempotent: a transaction that is
// already terminal (success/failure) is a no-op, so duplicate PayU posts or a
// browser back/refresh can't double-activate a project or double-log a payment.
// Project activation only happens on the first success and only while the
// project is still pending. Returns firstSuccess=true exactly once.
export async function finalizePayuTransaction(
  txnid: string,
  result: {
    status: PayuTransactionStatus;
    mihpayid?: string;
    payuMode?: string;
    payuResponse?: Record<string, string>;
  }
): Promise<{
  ok: boolean;
  firstSuccess: boolean;
  txn?: PayuTransaction;
  error?: string;
}> {
  const txnRef = TXN_COLLECTION.doc(txnid);
  try {
    const outcome = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(txnRef);
      if (!snap.exists) {
        return { missing: true as const };
      }
      const txn = snap.data() as PayuTransaction;

      // Already settled -> idempotent no-op.
      if (txn.status === "success" || txn.status === "failure") {
        return { firstSuccess: false, txn };
      }

      const isSuccess = result.status === "success";
      const willMarkActivated = isSuccess && !txn.projectActivated;

      // Reads must precede writes inside a Firestore transaction.
      const projectRef = adminDb.collection("Projects").doc(txn.projectId);
      const projectSnap = willMarkActivated ? await tx.get(projectRef) : null;
      // Only the payment that flips the project from in-progress → started is
      // the "first success" — this is what gets mirrored to the unified log,
      // so a second payment on an already-started project can't double-log.
      const didActivate =
        willMarkActivated && projectSnap?.data()?.status === "in-progress";

      const now = new Date().toISOString();
      const updatedTxn: PayuTransaction = {
        ...txn,
        status: result.status,
        mihpayid: result.mihpayid ?? txn.mihpayid,
        payuMode: result.payuMode ?? txn.payuMode,
        payuResponse: result.payuResponse ?? txn.payuResponse,
        projectActivated: txn.projectActivated || willMarkActivated,
        updatedAt: now,
      };

      tx.update(txnRef, {
        status: updatedTxn.status,
        mihpayid: updatedTxn.mihpayid ?? null,
        payuMode: updatedTxn.payuMode ?? null,
        payuResponse: updatedTxn.payuResponse ?? null,
        projectActivated: updatedTxn.projectActivated,
        updatedAt: now,
      });

      if (didActivate) {
        tx.update(projectRef, { status: "started", startDate: now });
      }

      return { firstSuccess: didActivate, txn: updatedTxn };
    });

    if ("missing" in outcome) {
      return { ok: false, firstSuccess: false, error: "Transaction not found" };
    }

    // Mirror the confirmed payment into the unified log once. The project is
    // already activated and the txn already recorded at this point, so a mirror
    // failure must not be reported as a finalize failure — log and move on.
    if (outcome.firstSuccess && outcome.txn) {
      try {
        await mirrorPayuToClientPaymentLog(outcome.txn);
      } catch (mirrorError) {
        console.error(
          "PayU mirror write failed (payment already recorded):",
          mirrorError
        );
      }
    }

    return { ok: true, firstSuccess: outcome.firstSuccess, txn: outcome.txn };
  } catch (error) {
    console.error("Error finalizing PayU transaction:", error);
    return { ok: false, firstSuccess: false, error: "Failed to finalize" };
  }
}

// ---------- Coupons ----------

const normalizeCode = (code: string) => code.trim().toUpperCase();

export async function createCoupon(
  data: Pick<Coupon, "code" | "discountType" | "discountValue" | "isActive">
): Promise<{ success: boolean; error?: string }> {
  try {
    const code = normalizeCode(data.code);
    if (!code) return { success: false, error: "Coupon code is required" };
    const now = new Date().toISOString();
    await COUPON_COLLECTION.doc(code).create({
      code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      isActive: data.isActive,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true };
  } catch (error: any) {
    if (error?.code === 6 || String(error).includes("ALREADY_EXISTS")) {
      return { success: false, error: "A coupon with this code already exists" };
    }
    console.error("Error creating coupon:", error);
    return { success: false, error: "Failed to create coupon" };
  }
}

export async function getAllCoupons(): Promise<Coupon[]> {
  try {
    const snapshot = await COUPON_COLLECTION.get();
    const coupons: Coupon[] = [];
    snapshot.forEach((doc) => coupons.push(doc.data() as Coupon));
    return coupons.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
}

// Returns the coupon only if it exists AND is active — the gatekeeper for both
// preview and charge.
export async function getActiveCoupon(code: string): Promise<Coupon | null> {
  const snap = await COUPON_COLLECTION.doc(normalizeCode(code)).get();
  if (!snap.exists) return null;
  const coupon = snap.data() as Coupon;
  return coupon.isActive ? coupon : null;
}

export async function toggleCouponActive(
  code: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await COUPON_COLLECTION.doc(normalizeCode(code)).update({
      isActive,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error toggling coupon:", error);
    return { success: false, error: "Failed to update coupon" };
  }
}

export async function deleteCoupon(
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await COUPON_COLLECTION.doc(normalizeCode(code)).delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return { success: false, error: "Failed to delete coupon" };
  }
}

async function mirrorPayuToClientPaymentLog(txn: PayuTransaction) {
  await adminDb.collection("ClientPaymentDetails").add({
    clientName: txn.clientName,
    clientEmail: txn.clientEmail,
    projectName: txn.projectName,
    projectId: txn.projectId,
    modeOfPayment: "PayU (Online)",
    paidAmount: txn.amount,
    currency: "INR",
    receiptUrl: "",
    status: "verified",
    createdAt: new Date().toISOString(),
    paymentType: "full",
    // Links the log entry back to the gateway transaction for audit.
    txnid: txn.txnid,
    mihpayid: txn.mihpayid ?? "",
    // Record the coupon + pre-discount price so the log reconciles for
    // discounted payments (paidAmount is the discounted amount actually charged).
    ...(txn.couponCode
      ? { couponCode: txn.couponCode, originalAmount: txn.originalAmount }
      : {}),
  });
}
