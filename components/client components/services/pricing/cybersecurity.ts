export type TechComplexityType = "basic" | "dynamic" | "complex";
export type HostingEnvType = "shared" | "vps" | "cloud" | "onprem";
export type VaptFeatureType = "web" | "mobile" | "network" | "cloud" | "api";
export type ComplianceType = "none" | "iso27001" | "soc2" | "gdpr" | "hipaa" | "pci";

export const complexityPrices: Record<TechComplexityType, { label: string; price: number }> = {
  basic: { label: "Static/Basic Application", price: 10000 },
  dynamic: { label: "Dynamic Web App", price: 25000 },
  complex: { label: "Complex/Microservices", price: 50000 },
};

export const hostingPrices: Record<HostingEnvType, { label: string; price: number }> = {
  shared: { label: "Shared Hosting", price: 0 },
  vps: { label: "VPS/Dedicated Server", price: 10000 },
  cloud: { label: "Cloud (AWS/Azure/GCP)", price: 20000 },
  onprem: { label: "On-Premises Infrastructure", price: 35000 },
};

export const vaptPrices: Record<VaptFeatureType, { label: string; price: number; description?: string }> = {
  web: { label: "Web Application", price: 30000 }, // BASE PRICE, dynamically scales with qty & subdomains
  mobile: { label: "Mobile App", price: 45000 },
  network: { label: "Network/Server", price: 20000 },
  cloud: { label: "Cloud Infrastructure", price: 35000 },
  api: { label: "API Endpoints", price: 25000 },
};

export const compliancePrices: Record<ComplianceType, { label: string; price: number }> = {
  none: { label: "No Compliance Needed", price: 0 },
  iso27001: { label: "ISO 27001 Readiness", price: 80000 },
  soc2: { label: "SOC 2 Type II Prep", price: 100000 },
  gdpr: { label: "GDPR Compliance Check", price: 50000 },
  hipaa: { label: "HIPAA Assessment", price: 75000 },
  pci: { label: "PCI-DSS Certification Prep", price: 120000 },
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
    if (vapt === "web") {
      // Base web price + (qty-1)*extra_price + subdomains*subdomain_price
      let webTotal = vaptPrices.web.price;
      if (webVars.quantity > 1) {
        webTotal += (webVars.quantity - 1) * VAPT_WEB_QTY_PRICE;
      }
      webTotal += webVars.subdomains * VAPT_WEB_SUBDOMAIN_PRICE;
      total += webTotal;
    } else if (vapt === "mobile") {
       // Base mobile price + (qty-1)*extra_price + (platforms-1)*platform_price
       let mobileTotal = vaptPrices.mobile.price;
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

  if (currency === "USD") {
    // Exact match for DevelopmentPreferences.tsx manual USD mapping
    return Math.round((total + 0.04 * total) / 83);
  }

  return total;
}
