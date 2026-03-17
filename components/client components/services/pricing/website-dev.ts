export const websitePrices = {
  base: 25000,
  perPage: 5000,
  seo: 15000,
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
