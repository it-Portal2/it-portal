export const projectComplexityPrices = {
  basic: { label: "Basic (Static/MVP)", price: 40000 },
  advanced: { label: "Advanced (Dynamic/SaaS)", price: 150000 },
  enterprise: { label: "Enterprise (Scale/High-Perf)", price: 450000 },
};

export const webAssetPrices = {
  base: 25000,
  perPage: 5000,
  seo: 15000,
};

export const mobileAssetPrices = {
  base: 45000,
  perScreen: 8000,
  crossPlatform: 60000, // Additional for Both instead of single
};

export const featurePrices = {
  "auth-system": { label: "Advanced Auth & Security", price: 30000 },
  "payment-gate": { label: "Payment Gateway Integration", price: 25000 },
  "api-dev": { label: "REST/GraphQL API Development", price: 50000 },
  "cloud-infra": { label: "Cloud Infrastructure Setup", price: 45000 },
  "push-notif": { label: "Push Notification System", price: 20000 },
  "real-time": { label: "Real-time Messaging/Sockets", price: 35000 },
};

export type ProjectComplexity = keyof typeof projectComplexityPrices;
export type FeatureType = keyof typeof featurePrices;

export interface WebVars {
  enabled: boolean;
  pages: number;
  seo: boolean;
}

export interface MobileVars {
  enabled: boolean;
  screens: number;
  platform: "single" | "both";
}

export function calculateWebAppDevPrice(
  complexity: ProjectComplexity,
  web: WebVars,
  mobile: MobileVars,
  features: FeatureType[],
  currency: string = "INR"
): number {
  let total = 0;
  total += projectComplexityPrices[complexity].price;

  if (web.enabled) {
    total += webAssetPrices.base;
    total += web.pages * webAssetPrices.perPage;
    if (web.seo) total += webAssetPrices.seo;
  }

  if (mobile.enabled) {
    total += mobileAssetPrices.base;
    total += mobile.screens * mobileAssetPrices.perScreen;
    if (mobile.platform === "both") total += mobileAssetPrices.crossPlatform;
  }

  // Bundle Discount: If both are enabled, 15% discount on asset costs
  if (web.enabled && mobile.enabled) {
    const assetCosts = (webAssetPrices.base + web.pages * webAssetPrices.perPage + (web.seo ? webAssetPrices.seo : 0)) +
                      (mobileAssetPrices.base + mobile.screens * mobileAssetPrices.perScreen + (mobile.platform === "both" ? mobileAssetPrices.crossPlatform : 0));
    total -= assetCosts * 0.15;
  }

  features.forEach((feature) => {
    if (featurePrices[feature]) {
      total += featurePrices[feature].price;
    }
  });

  if (currency === "USD") {
    return Math.round((total + 0.04 * total) / 83);
  }

  return Math.round(total);
}
