import { convertCurrency } from "../../../../lib/pricing-utils";

export const TECH_COMPLEXITY = {
  BASIC: "basic",
  DYNAMIC: "dynamic",
  COMPLEX: "complex",
} as const;
export type TechComplexityType = typeof TECH_COMPLEXITY[keyof typeof TECH_COMPLEXITY];

export const HOSTING_ENV = {
  SHARED: "shared",
  VPS: "vps",
  CLOUD: "cloud",
  ONPREM: "onprem",
} as const;
export type HostingEnvType = typeof HOSTING_ENV[keyof typeof HOSTING_ENV];

export const VAPT_FEATURE = {
  WEB: "web",
  MOBILE: "mobile",
  NETWORK: "network",
  CLOUD: "cloud",
  API: "api",
} as const;
export type VaptFeatureType = typeof VAPT_FEATURE[keyof typeof VAPT_FEATURE];

export const COMPLIANCE = {
  NONE: "none",
  ISO27001: "iso27001",
  SOC2: "soc2",
  GDPR: "gdpr",
  HIPAA: "hipaa",
  PCI: "pci",
} as const;
export type ComplianceType = typeof COMPLIANCE[keyof typeof COMPLIANCE];

export const complexityPrices: Record<TechComplexityType, { label: string; price: number }> = {
  [TECH_COMPLEXITY.BASIC]: { label: "Static/Basic Application", price: 10000 },
  [TECH_COMPLEXITY.DYNAMIC]: { label: "Dynamic Web App", price: 25000 },
  [TECH_COMPLEXITY.COMPLEX]: { label: "Complex/Microservices", price: 50000 },
};

export const hostingPrices: Record<HostingEnvType, { label: string; price: number }> = {
  [HOSTING_ENV.SHARED]: { label: "Shared Hosting", price: 0 },
  [HOSTING_ENV.VPS]: { label: "VPS/Dedicated Server", price: 10000 },
  [HOSTING_ENV.CLOUD]: { label: "Cloud (AWS/Azure/GCP)", price: 20000 },
  [HOSTING_ENV.ONPREM]: { label: "On-Premises Infrastructure", price: 35000 },
};

export const vaptPrices: Record<VaptFeatureType, { label: string; price: number; description?: string }> = {
  [VAPT_FEATURE.WEB]: { label: "Web Application", price: 30000 },
  [VAPT_FEATURE.MOBILE]: { label: "Mobile App", price: 45000 },
  [VAPT_FEATURE.NETWORK]: { label: "Network/Server", price: 20000 },
  [VAPT_FEATURE.CLOUD]: { label: "Cloud Infrastructure", price: 35000 },
  [VAPT_FEATURE.API]: { label: "API Endpoints", price: 25000 },
};

export const compliancePrices: Record<ComplianceType, { label: string; price: number }> = {
  [COMPLIANCE.NONE]: { label: "No Compliance Needed", price: 0 },
  [COMPLIANCE.ISO27001]: { label: "ISO 27001 Readiness", price: 80000 },
  [COMPLIANCE.SOC2]: { label: "SOC 2 Type II Prep", price: 100000 },
  [COMPLIANCE.GDPR]: { label: "GDPR Compliance Check", price: 50000 },
  [COMPLIANCE.HIPAA]: { label: "HIPAA Assessment", price: 75000 },
  [COMPLIANCE.PCI]: { label: "PCI-DSS Certification Prep", price: 120000 },
};

export const SOC_PER_ENDPOINT_PRICE = 500;
export const VAPT_WEB_QTY_PRICE = 15000;
export const VAPT_WEB_SUBDOMAIN_PRICE = 5000;
export const VAPT_MOBILE_QTY_PRICE = 15000;
export const VAPT_MOBILE_PLATFORM_PRICE = 10000;

export function calculateCybersecurityPrice(
  complexity: TechComplexityType,
  hosting: HostingEnvType,
  vaptSelected: VaptFeatureType[],
  webVars: { quantity: number; subdomains: number },
  mobileVars: { quantity: number; platforms: number },
  socEndpoints: number,
  compliance: ComplianceType,
  currency: string = "INR"
): number {
  let total = 0;

  // 1. Profile Costs
  total += complexityPrices[complexity].price;
  total += hostingPrices[hosting].price;

  // 2. VAPT Costs
  vaptSelected.forEach((vapt) => {
    if (vapt === VAPT_FEATURE.WEB) {
      // Base web price + (qty-1)*extra_price + subdomains*subdomain_price
      let webTotal = vaptPrices[VAPT_FEATURE.WEB].price;
      if (webVars.quantity > 1) {
        webTotal += (webVars.quantity - 1) * VAPT_WEB_QTY_PRICE;
      }
      webTotal += webVars.subdomains * VAPT_WEB_SUBDOMAIN_PRICE;
      total += webTotal;
    } else if (vapt === VAPT_FEATURE.MOBILE) {
       // Base mobile price + (qty-1)*extra_price + (platforms-1)*platform_price
       let mobileTotal = vaptPrices[VAPT_FEATURE.MOBILE].price;
       if (mobileVars.quantity > 1) {
         mobileTotal += (mobileVars.quantity - 1) * VAPT_MOBILE_QTY_PRICE;
       }
       if (mobileVars.platforms > 1) {
         mobileTotal += (mobileVars.platforms - 1) * VAPT_MOBILE_PLATFORM_PRICE;
       }
       total += mobileTotal;
    } else {
      total += vaptPrices[vapt].price;
    }
  });

  // 3. SOC Costs
  total += socEndpoints * SOC_PER_ENDPOINT_PRICE;

  // 4. Compliance Costs
  total += compliancePrices[compliance].price;

  return convertCurrency(total, currency);
}
