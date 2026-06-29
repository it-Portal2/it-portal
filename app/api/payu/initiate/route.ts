import { adminAuth, adminDb } from "@/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import { Project } from "@/lib/types";
import {
  buildRequestHash,
  generateTxnid,
  getPayuConfig,
  sanitizeProductInfo,
} from "@/lib/payu";
import {
  applyCoupon,
  createPayuTransaction,
  getActiveCoupon,
} from "@/lib/firebase/payments";

export const runtime = "nodejs";

async function getCaller(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const token = bearer || req.cookies.get("firebaseToken")?.value || null;
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const projectId = body?.projectId;
    const couponCode =
      typeof body?.couponCode === "string" ? body.couponCode.trim() : "";
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Valid projectId is required" },
        { status: 400 }
      );
    }

    const projectSnap = await adminDb
      .collection("Projects")
      .doc(projectId)
      .get();
    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const project = { id: projectSnap.id, ...projectSnap.data() } as Project;

    // Authorization: a client may only pay for their own project.
    const isAdmin =
      caller.role === "admin" || caller.role === "subadmin";
    if (project.clientEmail !== caller.email && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // INR-only — PayU India settles in INR.
    if (project.currency && project.currency !== "INR") {
      return NextResponse.json(
        { error: "Online payment supports INR projects only" },
        { status: 400 }
      );
    }

    // Payable online = admin-accepted (in-progress) projects with a quoted
    // finalCost. Paying transitions them to "started".
    if (project.status !== "in-progress") {
      return NextResponse.json(
        { error: "This project is not awaiting payment" },
        { status: 409 }
      );
    }

    // Amount is computed server-side and never trusted from the client.
    // `||` (not `??`) so a stray finalCost of 0 falls back to the budget.
    const originalAmount = project.finalCost || project.projectBudget;
    if (!originalAmount || originalAmount <= 0) {
      return NextResponse.json(
        { error: "Project has no payable amount set" },
        { status: 400 }
      );
    }

    // Apply a coupon server-side if one was supplied — the discounted amount is
    // what we hash and charge, so a tampered client price has no effect.
    let amountValue = originalAmount;
    let appliedCouponCode: string | undefined;
    if (couponCode) {
      const coupon = await getActiveCoupon(couponCode);
      if (!coupon) {
        return NextResponse.json(
          { error: "Invalid or inactive coupon" },
          { status: 400 }
        );
      }
      amountValue = applyCoupon(originalAmount, coupon);
      appliedCouponCode = coupon.code;
    }

    let config;
    try {
      config = await getPayuConfig();
    } catch {
      return NextResponse.json(
        { error: "Online payment is currently unavailable" },
        { status: 503 }
      );
    }

    const origin = config.appBaseUrl?.trim() || new URL(req.url).origin;
    const surl = `${origin}/api/payu/callback`;
    const furl = surl;

    const txnid = generateTxnid();
    const amount = amountValue.toFixed(2);
    const productinfo = sanitizeProductInfo(project.projectName);
    const firstname = caller.name || project.clientName || "Customer";
    const email = caller.email || project.clientEmail;
    const phone = project.clientPhoneNumber || "";

    const hash = buildRequestHash({
      key: config.merchantKey,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      salt: config.merchantSalt,
    });

    const now = new Date().toISOString();
    const created = await createPayuTransaction({
      txnid,
      projectId: project.id,
      projectName: project.projectName,
      clientUid: caller.uid,
      clientEmail: project.clientEmail,
      clientName: firstname,
      clientPhone: phone,
      amount: amountValue,
      productinfo,
      status: "initiated",
      mode: config.mode,
      projectActivated: false,
      ...(appliedCouponCode
        ? { couponCode: appliedCouponCode, originalAmount }
        : {}),
      createdAt: now,
      updatedAt: now,
    });
    if (!created.success) {
      return NextResponse.json(
        { error: "Could not start payment" },
        { status: 500 }
      );
    }

    // The salt never leaves the server — only the computed hash + public fields.
    return NextResponse.json({
      action: config.endpoint,
      params: {
        key: config.merchantKey,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash,
      },
    });
  } catch (error) {
    console.error("PayU initiate error:", error);
    return NextResponse.json(
      { error: "Could not start payment" },
      { status: 500 }
    );
  }
}
