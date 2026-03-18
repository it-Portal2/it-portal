import { convertCurrency, calculateTotalWithFeatures } from "../../../../lib/pricing-utils";

export const websitePrices = {
  base: 25000,
  perPage: 5000,
  seo: 15000,
};

export const WEBSITE_FEATURES = {
  AUTH_SYSTEM: "auth-system",
  PAYMENT_GATEWAY: "payment-gate",
  API_DEV: "api-dev",
  CLOUD_INFRA: "cloud-infra",
  PUSH_NOTIF: "push-notif",
  REAL_TIME: "real-time",
} as const;

export const featurePrices = {
  [WEBSITE_FEATURES.AUTH_SYSTEM]: { label: "Advanced Auth & Security", price: 30000 },
  [WEBSITE_FEATURES.PAYMENT_GATEWAY]: { label: "Payment Gateway Integration", price: 25000 },
  [WEBSITE_FEATURES.API_DEV]: { label: "REST/GraphQL API Development", price: 50000 },
  [WEBSITE_FEATURES.CLOUD_INFRA]: { label: "Cloud Infrastructure Setup", price: 45000 },
  [WEBSITE_FEATURES.PUSH_NOTIF]: { label: "Push Notification System", price: 20000 },
  [WEBSITE_FEATURES.REAL_TIME]: { label: "Real-time Messaging/Sockets", price: 35000 },
};

export type FeatureType = keyof typeof featurePrices;

export interface WebsiteVars {
  pages: number;
  seo: boolean;
}

export function calculateWebsitePrice(
  vars: WebsiteVars,
  features: FeatureType[],
  currency: string = "INR"
): number {
  let total = websitePrices.base;
  total += vars.pages * websitePrices.perPage;
  if (vars.seo) total += websitePrices.seo;

  total = calculateTotalWithFeatures(total, features, featurePrices);

  return convertCurrency(total, currency);
}
