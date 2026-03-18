import { convertCurrency, calculateTotalWithFeatures } from "../../../../lib/pricing-utils";

export const AI_COMPLEXITY = {
  BASIC: "basic",
  ADVANCED: "advanced",
  ENTERPRISE: "enterprise",
} as const;
export type ComplexityType = typeof AI_COMPLEXITY[keyof typeof AI_COMPLEXITY];

export const AI_WORKFLOW = {
  FIXED: "fixed",
  SCALABLE: "scalable",
} as const;
export type WorkflowType = typeof AI_WORKFLOW[keyof typeof AI_WORKFLOW];

export const AI_FEATURES = {
  CHATBOT: "chatbot",
  NLP: "nlp",
  ML_MODEL: "ml-model",
  DATA_VIZ: "data-viz",
  AUTO_PILOT: "auto-pilot",
  THIRD_PARTY: "third-party",
} as const;
export type FeatureType = typeof AI_FEATURES[keyof typeof AI_FEATURES];

export const solutionComplexityPrices: Record<ComplexityType, { label: string; price: number }> = {
  [AI_COMPLEXITY.BASIC]: { label: "Basic Automation", price: 120000 },
  [AI_COMPLEXITY.ADVANCED]: { label: "Advanced AI Solution", price: 350000 },
  [AI_COMPLEXITY.ENTERPRISE]: { label: "Enterprise AI Infrastructure", price: 800000 },
};

export const workflowPrices: Record<WorkflowType, { label: string; price: number }> = {
  [AI_WORKFLOW.FIXED]: { label: "Up to 5 Workflows", price: 40000 },
  [AI_WORKFLOW.SCALABLE]: { label: "Unlimited Workflows", price: 150000 },
};

export const featurePrices = {
  [AI_FEATURES.CHATBOT]: { label: "AI Chatbot / Virtual Assistant", price: 60000 },
  [AI_FEATURES.NLP]: { label: "Natural Language Processing", price: 80000 },
  [AI_FEATURES.ML_MODEL]: { label: "Custom ML Model Training", price: 150000 },
  [AI_FEATURES.DATA_VIZ]: { label: "Data Analytics & Dashboard", price: 50000 },
  [AI_FEATURES.AUTO_PILOT]: { label: "Business Process Auto-pilot", price: 100000 },
  [AI_FEATURES.THIRD_PARTY]: { label: "3rd Party API Orchestration", price: 45000 },
};

export function calculateAIAutomationPrice(
  complexity: ComplexityType,
  workflow: WorkflowType,
  features: FeatureType[],
  currency: string = "INR"
): number {
  let total = solutionComplexityPrices[complexity].price;
  total += workflowPrices[workflow].price;

  total = calculateTotalWithFeatures(total, features, featurePrices);

  return convertCurrency(total, currency);
}
