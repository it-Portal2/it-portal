/**
 * Pricing configuration constants for the IT Portal.
 * Centralizing these values ensures consistency across all service calculators.
 */

// Current fixed exchange rate. 
// TODO: Integrate with a real-time currency API in the future.
export const EXCHANGE_RATE_INR_TO_USD = 83;

// Default markup percentage for international transactions (e.g., payment gateway fees, buffer).
export const MARKUP_PERCENTAGE = 0.04;

export const CURRENCY = {
  INR: "INR",
  USD: "USD",
} as const;

export type CurrencyType = typeof CURRENCY[keyof typeof CURRENCY];
