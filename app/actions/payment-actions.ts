"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/firebaseAdmin";
import {
  applyCoupon,
  createCoupon,
  createInternationalBankAccount,
  deleteCoupon,
  deleteInternationalBankAccount,
  deletePayuConfig,
  getActiveCoupon,
  getAllCoupons,
  getInternationalBankAccounts,
  getPayuConfigDoc,
  getPayuTransaction,
  savePayuConfig,
  seedInternationalBankAccounts,
  toggleCouponActive,
  toggleInternationalBankAccountActive,
  updateInternationalBankAccount,
} from "@/lib/firebase/payments";
import { updatePaymentMethodActive } from "@/lib/firebase/admin";
import {
  Coupon,
  CouponDiscountType,
  InternationalBankAccount,
  PayuConfig,
  Project,
} from "@/lib/types";

// Verifies the caller is an admin/subadmin from the httpOnly firebaseToken
// cookie. Used to gate actions that read or write gateway secrets.
async function requireAdmin(): Promise<boolean> {
  const token = (await cookies()).get("firebaseToken")?.value;
  if (!token) return false;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.role === "admin" || decoded.role === "subadmin") return true;
    const snap = await adminDb.collection("users").doc(decoded.uid).get();
    const role = snap.data()?.role;
    return role === "admin" || role === "subadmin";
  } catch {
    return false;
  }
}

// ---------- PayU config (admin) ----------

export async function fetchPayuConfigAction(): Promise<{
  success: boolean;
  data?: PayuConfig | null;
  error?: string;
}> {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  try {
    const data = await getPayuConfigDoc();
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching PayU config:", error);
    return { success: false, error: "Failed to fetch PayU config" };
  }
}

export async function savePayuConfigAction(patch: Partial<PayuConfig>) {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  const result = await savePayuConfig(patch);
  if (result.success) revalidatePath("/admin/settings");
  return result;
}

export async function deletePayuConfigAction() {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  const result = await deletePayuConfig();
  if (result.success) revalidatePath("/admin/settings");
  return result;
}

// Public status for the client Direct tab — exposes only whether PayU is usable,
// never the secrets.
export async function getPayuPublicStatusAction(): Promise<{
  isActive: boolean;
}> {
  try {
    const config = await getPayuConfigDoc();
    return {
      isActive: Boolean(
        config?.isActive && config.merchantKey && config.merchantSalt
      ),
    };
  } catch {
    return { isActive: false };
  }
}

// ---------- Payment method active toggle (admin) ----------

export async function updatePaymentMethodActiveAction(
  uid: string,
  method: "upi" | "paypal" | "bankDetails" | "crypto",
  isActive: boolean
) {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  const result = await updatePaymentMethodActive(uid, method, isActive);
  if (result.success) revalidatePath("/admin/settings");
  return result;
}

// ---------- International bank accounts (admin) ----------

export async function fetchAllInternationalBankAccountsAction(): Promise<{
  success: boolean;
  data?: InternationalBankAccount[];
  error?: string;
}> {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  try {
    const data = await getInternationalBankAccounts(false);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching international accounts:", error);
    return { success: false, error: "Failed to fetch accounts" };
  }
}

export async function createInternationalBankAccountAction(
  data: Omit<InternationalBankAccount, "id" | "createdAt" | "updatedAt">
) {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  const result = await createInternationalBankAccount(data);
  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath("/client/payment");
  }
  return result;
}

export async function updateInternationalBankAccountAction(
  id: string,
  patch: Partial<Omit<InternationalBankAccount, "id" | "createdAt">>
) {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  const result = await updateInternationalBankAccount(id, patch);
  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath("/client/payment");
  }
  return result;
}

export async function deleteInternationalBankAccountAction(id: string) {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  const result = await deleteInternationalBankAccount(id);
  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath("/client/payment");
  }
  return result;
}

export async function toggleInternationalBankAccountActiveAction(
  id: string,
  isActive: boolean
) {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  const result = await toggleInternationalBankAccountActive(id, isActive);
  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath("/client/payment");
  }
  return result;
}

export async function seedInternationalBankAccountsAction() {
  if (!(await requireAdmin()))
    return { success: false, seeded: 0, error: "Forbidden" };
  const result = await seedInternationalBankAccounts();
  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath("/client/payment");
  }
  return result;
}

// ---------- Client-facing reads ----------

export async function fetchActiveInternationalBankAccountsAction(): Promise<{
  success: boolean;
  data?: InternationalBankAccount[];
  error?: string;
}> {
  try {
    const data = await getInternationalBankAccounts(true);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching active international accounts:", error);
    return { success: false, error: "Failed to fetch accounts" };
  }
}

// Reads a PayU transaction for the result page. Authorizes that the caller owns
// the transaction (its email matches the logged-in user) before returning it.
export async function fetchPayuTransactionAction(txnid: string): Promise<{
  success: boolean;
  data?: {
    txnid: string;
    status: string;
    amount: number;
    projectId: string;
    projectName: string;
    mihpayid?: string;
  };
  error?: string;
}> {
  if (!txnid) return { success: false, error: "Missing transaction id" };
  const token = (await cookies()).get("firebaseToken")?.value;
  if (!token) return { success: false, error: "Unauthorized" };
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const txn = await getPayuTransaction(txnid);
    if (!txn) return { success: false, error: "Transaction not found" };

    const isOwner =
      txn.clientUid === decoded.uid || txn.clientEmail === decoded.email;
    const isAdmin = decoded.role === "admin" || decoded.role === "subadmin";
    if (!isOwner && !isAdmin) {
      return { success: false, error: "Forbidden" };
    }

    return {
      success: true,
      data: {
        txnid: txn.txnid,
        status: txn.status,
        amount: txn.amount,
        projectId: txn.projectId,
        projectName: txn.projectName,
        mihpayid: txn.mihpayid,
      },
    };
  } catch (error) {
    console.error("Error fetching PayU transaction:", error);
    return { success: false, error: "Failed to fetch transaction" };
  }
}

// ---------- Coupons (admin) ----------

export async function fetchAllCouponsAction(): Promise<{
  success: boolean;
  data?: Coupon[];
  error?: string;
}> {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  try {
    const data = await getAllCoupons();
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return { success: false, error: "Failed to fetch coupons" };
  }
}

export async function createCouponAction(input: {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  isActive: boolean;
}) {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };

  const code = input.code?.trim();
  if (!code) return { success: false, error: "Coupon code is required" };
  if (input.discountType !== "flat" && input.discountType !== "percentage") {
    return { success: false, error: "Invalid discount type" };
  }
  if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
    return { success: false, error: "Discount value must be greater than 0" };
  }
  if (input.discountType === "percentage" && input.discountValue > 100) {
    return { success: false, error: "Percentage discount cannot exceed 100" };
  }

  const result = await createCoupon(input);
  if (result.success) revalidatePath("/admin/settings");
  return result;
}

export async function toggleCouponActiveAction(code: string, isActive: boolean) {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  const result = await toggleCouponActive(code, isActive);
  if (result.success) revalidatePath("/admin/settings");
  return result;
}

export async function deleteCouponAction(code: string) {
  if (!(await requireAdmin())) return { success: false, error: "Forbidden" };
  const result = await deleteCoupon(code);
  if (result.success) revalidatePath("/admin/settings");
  return result;
}

// ---------- Coupon validation (client preview) ----------

// Computes the discounted price for display. The amount is recomputed
// authoritatively in /api/payu/initiate at pay time — this is preview-only, but
// still authorizes the caller against the project to avoid leaking prices.
export async function validateCouponAction(
  code: string,
  projectId: string
): Promise<{
  success: boolean;
  originalAmount?: number;
  discountedAmount?: number;
  discountLabel?: string;
  error?: string;
}> {
  if (!code?.trim()) return { success: false, error: "Enter a coupon code" };
  const token = (await cookies()).get("firebaseToken")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection("Projects").doc(projectId).get();
    if (!snap.exists) return { success: false, error: "Project not found" };
    const project = { id: snap.id, ...snap.data() } as Project;

    const isAdmin = decoded.role === "admin" || decoded.role === "subadmin";
    // Fail closed: a malformed project with a blank clientEmail must not match a
    // caller, even one whose token email is somehow empty.
    const isOwner = Boolean(
      project.clientEmail && project.clientEmail === decoded.email
    );
    if (!isOwner && !isAdmin) {
      return { success: false, error: "Forbidden" };
    }

    const original = project.finalCost || project.projectBudget;
    if (!original || original <= 0) {
      return { success: false, error: "Project has no payable amount" };
    }

    const coupon = await getActiveCoupon(code);
    if (!coupon) {
      return { success: false, error: "Invalid or inactive coupon" };
    }

    const discounted = applyCoupon(original, coupon);
    const discountLabel =
      coupon.discountType === "percentage"
        ? `${coupon.discountValue}% off`
        : `₹${coupon.discountValue.toLocaleString("en-IN")} off`;

    return {
      success: true,
      originalAmount: original,
      discountedAmount: discounted,
      discountLabel,
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { success: false, error: "Failed to validate coupon" };
  }
}
