export const userBasePrices: Record<string, number> = {
  "< 1,000 Users": 100000,
  "1,000 - 10,000 Users": 250000,
  "10,000 - 50,000 Users": 500000,
  "50,000+ Users": 900000,
};

export const featurePrices: Record<string, number> = {
  "LMS Core (Courses, Quizzes)": 50000,
  "Live Classroom Integration": 40000,
  "AI Proctoring System": 80000,
  "Gamification & Leaderboards": 35000,
  "Parent/Admin Portals": 45000,
  "Certification Engine": 30000,
};

export interface EdutechState {
  userBase: string;
  features: string[];
}

export function calculateEdutechPrice(state: EdutechState, currency: string = "INR") {
  let total = 0;

  // 1. User Base Scale
  if (state.userBase && userBasePrices[state.userBase]) {
    total += userBasePrices[state.userBase];
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
