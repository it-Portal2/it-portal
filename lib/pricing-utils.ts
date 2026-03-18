import { EXCHANGE_RATE_INR_TO_USD, MARKUP_PERCENTAGE, CURRENCY, CurrencyType } from "./pricing-config";

/**
 * Converts an INR amount to a target currency (currently supports USD).
 * Applies a markup percentage for international conversions.
 * 
 * @param amountInInr The base cost in Indian Rupees.
 * @param targetCurrency The currency to convert to.
 * @returns The rounded converted amount.
 */
export const convertCurrency = (
    amount: number,
    to: string = "USD",
    from: string = "INR",
    applyMarkup: boolean = true
): number => {
    if (from === to) return amount;

    let result = amount;

    if (from === "INR" && to === "USD") {
        const markup = applyMarkup ? MARKUP_PERCENTAGE * amount : 0;
        result = (amount + markup) / EXCHANGE_RATE_INR_TO_USD;
    } else if (from === "USD" && to === "INR") {
        // Reverse conversion if needed
        result = amount * EXCHANGE_RATE_INR_TO_USD;
    }

    return Math.round(result);
};

export const parsePriceString = (priceStr: string): { amount: number; currency: "INR" | "USD" } => {
    const amount = Number.parseInt(priceStr.replace(/[^\d]/g, ""));
    const currency: "INR" | "USD" = priceStr.includes("$") ? "USD" : "INR";
    return { amount, currency };
};

/**
 * Generic helper to calculate total cost by adding feature prices to a base cost.
 * 
 * @param basePrice The starting price of the service.
 * @param features Selected feature keys.
 * @param featurePrices Map of feature keys to their price objects.
 * @returns The total cost in base currency.
 */
export function calculateTotalWithFeatures<T extends string>(
  basePrice: number,
  selectedFeatures: T[],
  featurePriceMap: Record<T, { price: number }>
): number {
  return selectedFeatures.reduce((total, featureKey) => {
    const feature = featurePriceMap[featureKey];
    return total + (feature ? feature.price : 0);
  }, basePrice);
}
