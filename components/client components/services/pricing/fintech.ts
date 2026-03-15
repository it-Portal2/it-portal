export const volumePrices: Record<string, number> = {
  "< 10k Txns": 480000,
  "10k - 50k Txns": 750000,
  "50k - 200k Txns": 1200000,
  "200k+ Txns": 2000000,
};

export const featurePrices: Record<string, number> = {
  "e-KYC / AML Integration": 120000,
  "Multi-Payment Gateway Hub": 180000,
  "Core Banking / Ledger System": 500000,
  "AI Fraud Detection": 250000,
  "Regulatory Compliance Suite (RBI/SEBI/GDPR)": 200000,
};

export interface FintechState {
  volume: string;
  features: string[];
}

export function calculateFintechPrice(state: FintechState, currency: string = "INR") {
  let total = 0;

  // 1. Transaction Volume Scale
  if (state.volume && volumePrices[state.volume]) {
    total += volumePrices[state.volume];
  }

  // 2. Features
  state.features.forEach((feature) => {
    if (featurePrices[feature]) {
      total += featurePrices[feature];
    }
  });

  // Currency Conversion (using the same fixed rates as other calculators)
  if (currency === "USD") {
    // Math.round((total + 0.04 * total) / 83)
    return Math.round((total * 1.04) / 83);
  }

  return total;
}
