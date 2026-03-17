export const investigationLevelPrices = {
  initial: { label: "Initial Assessment", price: 50000 },
  standard: { label: "Standard Investigation", price: 180000 },
  deep: { label: "Deep Digital Forensics", price: 450000 },
};

export const priorityPrices = {
  normal: { label: "Standard Response", price: 0 },
  urgent: { label: "Urgent (24/7 Response)", price: 100000 },
};

export const featurePrices = {
  "data-recovery": { label: "Advanced Data Recovery", price: 60000 },
  "forensic-report": { label: "Court-Admissible Report", price: 40000 },
  "expert-witness": { label: "Expert Witness Testimony", price: 80000 },
  "malware-analysis": { label: "Deep Malware Analysis", price: 70000 },
  "dark-web": { label: "Dark Web Surveillance", price: 50000 },
  "legal-coord": { label: "Legal & Law Enforcement Liaison", price: 30000 },
};

export type LevelType = keyof typeof investigationLevelPrices;
export type PriorityType = keyof typeof priorityPrices;
export type FeatureType = keyof typeof featurePrices;

export function calculateCyberCrimePrice(
  level: LevelType,
  priority: PriorityType,
  features: FeatureType[],
  currency: string = "INR"
): number {
  let total = 0;
  total += investigationLevelPrices[level].price;
  total += priorityPrices[priority].price;

  features.forEach((feature) => {
    if (featurePrices[feature]) {
      total += featurePrices[feature].price;
    }
  });

  if (currency === "USD") {
    return Math.round((total + 0.04 * total) / 83);
  }

  return total;
}
