export const solutionComplexityPrices = {
  basic: { label: "Basic Automation", price: 120000 },
  advanced: { label: "Advanced AI Solution", price: 350000 },
  enterprise: { label: "Enterprise AI Infrastructure", price: 800000 },
};

export const workflowPrices = {
  fixed: { label: "Up to 5 Workflows", price: 40000 },
  scalable: { label: "Unlimited Workflows", price: 150000 },
};

export const featurePrices = {
  "chatbot": { label: "AI Chatbot / Virtual Assistant", price: 60000 },
  "nlp": { label: "Natural Language Processing", price: 80000 },
  "ml-model": { label: "Custom ML Model Training", price: 150000 },
  "data-viz": { label: "Data Analytics & Dashboard", price: 50000 },
  "auto-pilot": { label: "Business Process Auto-pilot", price: 100000 },
  "third-party": { label: "3rd Party API Orchestration", price: 45000 },
};

export type ComplexityType = keyof typeof solutionComplexityPrices;
export type WorkflowType = keyof typeof workflowPrices;
export type FeatureType = keyof typeof featurePrices;

export function calculateAIAutomationPrice(
  complexity: ComplexityType,
  workflow: WorkflowType,
  features: FeatureType[],
  currency: string = "INR"
): number {
  let total = 0;
  total += solutionComplexityPrices[complexity].price;
  total += workflowPrices[workflow].price;

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
