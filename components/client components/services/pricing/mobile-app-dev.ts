import { convertCurrency, calculateTotalWithFeatures } from "../../../../lib/pricing-utils";

export const mobilePrices = {
  single: 100000,
  both: 150000,
  pwa: 15000,
};

export const featurePrices = {
  "auth-system": { label: "Advanced Auth & Security", price: 30000 },
  "payment-gate": { label: "Payment Gateway Integration", price: 25000 },
  "api-dev": { label: "REST/GraphQL API Development", price: 50000 },
  "cloud-infra": { label: "Cloud Infrastructure Setup", price: 45000 },
  "push-notif": { label: "Push Notification System", price: 20000 },
  "real-time": { label: "Real-time Messaging/Sockets", price: 35000 },
};

export type FeatureType = keyof typeof featurePrices;

export const MOBILE_TYPE = {
  CUSTOM: "custom",
  PWA: "pwa",
} as const;
export type MobileType = typeof MOBILE_TYPE[keyof typeof MOBILE_TYPE];

export const PLATFORM_OPTION = {
  SINGLE: "single",
  BOTH: "both",
} as const;
export type PlatformOption = typeof PLATFORM_OPTION[keyof typeof PLATFORM_OPTION];

export interface MobileVars {
  type: MobileType;
  platform: PlatformOption;
}

export function calculateMobilePrice(
  vars: MobileVars,
  features: FeatureType[],
  currency: string = "INR"
): number {
  let total = 0;

  if (vars.type === MOBILE_TYPE.PWA) {
    total = mobilePrices.pwa;
  } else {
    total = vars.platform === PLATFORM_OPTION.BOTH ? mobilePrices.both : mobilePrices.single;
  }

  total = calculateTotalWithFeatures(total, features, featurePrices);

  return convertCurrency(total, currency);
}
