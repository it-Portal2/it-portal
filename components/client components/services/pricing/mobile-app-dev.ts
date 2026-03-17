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

export interface MobileVars {
  type: "custom" | "pwa";
  platform: "single" | "both";
}

export function calculateMobilePrice(
  vars: MobileVars,
  features: FeatureType[],
  currency: string = "INR"
): number {
  let total = 0;

  if (vars.type === "pwa") {
    total = mobilePrices.pwa;
  } else {
    total = vars.platform === "both" ? mobilePrices.both : mobilePrices.single;
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
