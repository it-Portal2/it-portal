import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { PayuConfig } from "./types";
import { getPayuConfigDoc } from "./firebase/payments";

// Server-only: imported solely from route handlers / server actions. Reads the
// gateway credentials from Firestore (repo convention: secrets live in the DB,
// not env) and never exposes the salt to the client.

// Production only — the gateway always hits the live endpoint.
const PAYU_ENDPOINT = "https://secure.payu.in/_payment";

export interface ResolvedPayuConfig extends PayuConfig {
  endpoint: string;
}

export async function getPayuConfig(): Promise<ResolvedPayuConfig> {
  const config = await getPayuConfigDoc();
  if (!config) {
    throw new Error("PayU is not configured");
  }
  if (!config.isActive) {
    throw new Error("PayU is not active");
  }
  if (!config.merchantKey || !config.merchantSalt) {
    throw new Error("PayU credentials are incomplete");
  }
  return { ...config, endpoint: PAYU_ENDPOINT };
}

interface RequestHashInput {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  salt: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

// sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
export function buildRequestHash(input: RequestHashInput): string {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    salt,
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
  } = input;
  const sequence = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  return createHash("sha512").update(sequence).digest("hex");
}

// PayU echoes the request fields back (reverse order) plus status. Recompute and
// constant-time compare before trusting the reported status.
// sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
export function verifyResponseHash(
  params: Record<string, string>,
  salt: string
): boolean {
  const {
    status = "",
    txnid = "",
    amount = "",
    productinfo = "",
    firstname = "",
    email = "",
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
    key = "",
    hash = "",
  } = params;

  if (!hash) return false;

  // If PayU applied additional charges, they prefix the response hash sequence.
  const additionalCharges = params.additionalCharges;
  const base = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const sequence = additionalCharges
    ? `${additionalCharges}|${base}`
    : base;

  const expected = createHash("sha512").update(sequence).digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(hash.toLowerCase(), "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

// Compact, unique, alphanumeric transaction id (well under PayU's length limit).
export function generateTxnid(): string {
  return `txn${Date.now().toString(36)}${randomBytes(5).toString("hex")}`;
}

// PayU rejects several special characters in productinfo; keep it simple.
export function sanitizeProductInfo(value: string): string {
  return (value || "Project payment")
    .replace(/[^a-zA-Z0-9 _-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100) || "Project payment";
}
