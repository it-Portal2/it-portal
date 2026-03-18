import { convertCurrency, calculateTotalWithFeatures } from "../../../../lib/pricing-utils";

export const INVESTIGATION_LEVEL = {
  INITIAL: "initial",
  STANDARD: "standard",
  DEEP: "deep",
} as const;
export type LevelType = typeof INVESTIGATION_LEVEL[keyof typeof INVESTIGATION_LEVEL];

export const INVESTIGATION_PRIORITY = {
  NORMAL: "normal",
  URGENT: "urgent",
} as const;
export type PriorityType = typeof INVESTIGATION_PRIORITY[keyof typeof INVESTIGATION_PRIORITY];

export const INVESTIGATION_FEATURES = {
  DATA_RECOVERY: "data-recovery",
  FORENSIC_REPORT: "forensic-report",
  EXPERT_WITNESS: "expert-witness",
  MALWARE_ANALYSIS: "malware-analysis",
  DARK_WEB: "dark-web",
  LEGAL_COORD: "legal-coord",
} as const;
export type FeatureType = typeof INVESTIGATION_FEATURES[keyof typeof INVESTIGATION_FEATURES];

export const investigationLevelPrices: Record<LevelType, { label: string; price: number }> = {
  [INVESTIGATION_LEVEL.INITIAL]: { label: "Initial Assessment", price: 50000 },
  [INVESTIGATION_LEVEL.STANDARD]: { label: "Standard Investigation", price: 180000 },
  [INVESTIGATION_LEVEL.DEEP]: { label: "Deep Digital Forensics", price: 450000 },
};

export const priorityPrices: Record<PriorityType, { label: string; price: number }> = {
  [INVESTIGATION_PRIORITY.NORMAL]: { label: "Standard Response", price: 0 },
  [INVESTIGATION_PRIORITY.URGENT]: { label: "Urgent (24/7 Response)", price: 100000 },
};

export const featurePrices = {
  [INVESTIGATION_FEATURES.DATA_RECOVERY]: { label: "Advanced Data Recovery", price: 60000 },
  [INVESTIGATION_FEATURES.FORENSIC_REPORT]: { label: "Court-Admissible Report", price: 40000 },
  [INVESTIGATION_FEATURES.EXPERT_WITNESS]: { label: "Expert Witness Testimony", price: 80000 },
  [INVESTIGATION_FEATURES.MALWARE_ANALYSIS]: { label: "Deep Malware Analysis", price: 70000 },
  [INVESTIGATION_FEATURES.DARK_WEB]: { label: "Dark Web Surveillance", price: 50000 },
  [INVESTIGATION_FEATURES.LEGAL_COORD]: { label: "Legal & Law Enforcement Liaison", price: 30000 },
};

export function calculateCyberCrimePrice(
  level: LevelType,
  priority: PriorityType,
  features: FeatureType[],
  currency: string = "INR"
): number {
  let total = investigationLevelPrices[level].price;
  total += priorityPrices[priority].price;

  total = calculateTotalWithFeatures(total, features, featurePrices);

  return convertCurrency(total, currency);
}
