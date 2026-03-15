export const platformPrices = {
  web: { label: "Web App Only", price: 150000 },
  mobile: { label: "Mobile App Only", price: 200000 },
  both: { label: "Web + Mobile App", price: 300000 },
};

export const inventoryPrices = {
  starter: { label: "Starter (0-500 SKUs)", price: 20000 },
  growth: { label: "Growth (500-5000 SKUs)", price: 60000 },
  enterprise: { label: "Enterprise (10,000+ SKUs)", price: 120000 },
};

export const featurePrices = {
  "multi-vendor": { label: "Multi-vendor Marketplace", price: 80000 },
  "ai-search": { label: "AI Recommendations & Search", price: 50000 },
  crm: { label: "Integrated CRM/ERP", price: 40000 },
  "multi-currency": { label: "Multi-currency/Global Support", price: 30000 },
  pwa: { label: "Progressive Web App (PWA)", price: 25000 },
  inventory: { label: "Advanced Inventory Tracking", price: 35000 },
  loyalty: { label: "Loyalty & Rewards System", price: 30000 },
};

export type PlatformType = keyof typeof platformPrices;
export type InventoryType = keyof typeof inventoryPrices;
export type FeatureType = keyof typeof featurePrices;

export function calculateEcommercePrice(
  platform: PlatformType,
  inventory: InventoryType,
  features: FeatureType[],
  currency: string = "INR"
): number {
  let total = 0;
  total += platformPrices[platform].price;
  total += inventoryPrices[inventory].price;

  features.forEach((feature) => {
    if (featurePrices[feature]) {
      total += featurePrices[feature].price;
    }
  });

  if (currency === "USD") {
    // Exact match for DevelopmentPreferences.tsx manual USD mapping
    return Math.round((total + 0.04 * total) / 83);
  }

  return total;
}
