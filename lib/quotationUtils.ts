import { Bundle } from "./plan";
import { convertCurrency, parsePriceString } from "./pricing-utils";

// A function to get the current date in a formatted string (DD/MM/YYYY)
export const getFormattedDate = (): string => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Generate a formatted date string for display (YYYY-MM-DD)
const getDisplayDate = (): string => {
  const date = new Date();
  return date.toISOString().split("T")[0];
};

// Generate a due date 15 days from today
const getDueDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return date.toISOString().split("T")[0];
};

// Generate a unique invoice number
const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 900) + 100;
  return `INV-${year}-${random}`;
};

// QuotationData interface
export interface QuotationData {
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  projectName: string;
  projectOverview: string;
  developmentAreas: string[];
  seniorDevelopers: number;
  juniorDevelopers: number;
  uiUxDesigners: number;
  selectedBundles?: Bundle[];
  currency: "INR" | "USD";
  // Optional overrides
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
}

// Main HTML generator — A4 invoice, pixel-matching index.html design
export const generateQuotationHtml = (formData: QuotationData): string => {
  const exchangeRate = 83;
  const GST_RATE = 0.18;

  const baseRates = {
    seniorDevRate: 75000,
    juniorDevRate: 30000,
    uiUxRate: 8000,
    projectManagementCost: 50000,
  };

  const currencySymbol = formData.currency === "USD" ? "$" : "₹";
  const locale = formData.currency === "INR" ? "en-IN" : "en-US";

  const seniorDevRate =
    formData.currency === "INR"
      ? baseRates.seniorDevRate
      : Math.round((baseRates.seniorDevRate * 1.04) / exchangeRate);

  const juniorDevRate =
    formData.currency === "INR"
      ? baseRates.juniorDevRate
      : Math.round((baseRates.juniorDevRate * 1.04) / exchangeRate);

  const uiUxRate =
    formData.currency === "INR"
      ? baseRates.uiUxRate
      : Math.round((baseRates.uiUxRate * 1.04) / exchangeRate);

  const projectManagementCost =
    formData.currency === "INR"
      ? baseRates.projectManagementCost
      : Math.round((baseRates.projectManagementCost * 1.04) / exchangeRate);

  const hasBundles = formData.selectedBundles && formData.selectedBundles.length > 0;

  const seniorDevCost = hasBundles ? 0 : (formData.seniorDevelopers || 0) * seniorDevRate;
  const juniorDevCost = hasBundles ? 0 : (formData.juniorDevelopers || 0) * juniorDevRate;
  const uiUxCost = hasBundles ? 0 : (formData.uiUxDesigners || 0) * uiUxRate;
  const projectManagementCostFinal = hasBundles ? 0 : projectManagementCost;
  
  // Calculate selected bundles cost
  let bundlesCost = 0;
  if (hasBundles) {
    bundlesCost = formData.selectedBundles!.reduce((acc, bundle) => {
      const { amount, currency: bundleCurrency } = parsePriceString(bundle.price);
      
      // Calculate currency adjusted price
      const adjustedPrice = convertCurrency(
        amount, 
        formData.currency, 
        bundleCurrency, 
        bundleCurrency === "INR" // Apply markup only if converting from INR
      );
        
      return acc + adjustedPrice;
    }, 0);
  }

  const subtotal = seniorDevCost + juniorDevCost + uiUxCost + projectManagementCostFinal + bundlesCost;
  const gstAmount = formData.currency === "INR" ? Math.round(subtotal * GST_RATE) : 0;
  const totalCost = subtotal + gstAmount;

  const fmt = (amount: number) =>
    `${currencySymbol}${amount.toLocaleString(locale, { minimumFractionDigits: 2 })}`;

  const invoiceNumber = formData.invoiceNumber ?? generateInvoiceNumber();
  const issueDate = formData.issueDate ?? getDisplayDate();
  const dueDate = formData.dueDate ?? getDueDate();

  // Build dynamic line items matching index.html table row style
  const lineItemRows: string[] = [];

  if (!hasBundles) {
    if (formData.seniorDevelopers > 0) {
      lineItemRows.push(`
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 0; color: #1f2937; font-weight: 500; border: none !important; border-width: 0 !important;">Senior Developer &times; ${formData.seniorDevelopers}</td>
          <td style="padding: 12px 0; text-align: right; color: #111827; font-weight: 600; border: none !important; border-width: 0 !important;">${fmt(seniorDevCost)}</td>
        </tr>`);
    }
    if (formData.juniorDevelopers > 0) {
      lineItemRows.push(`
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 0; color: #1f2937; font-weight: 500; border: none !important; border-width: 0 !important;">Junior Developer &times; ${formData.juniorDevelopers}</td>
          <td style="padding: 12px 0; text-align: right; color: #111827; font-weight: 600; border: none !important; border-width: 0 !important;">${fmt(juniorDevCost)}</td>
        </tr>`);
    }
    if (formData.uiUxDesigners > 0) {
      lineItemRows.push(`
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 0; color: #1f2937; font-weight: 500; border: none !important; border-width: 0 !important;">UI/UX Designer &times; ${formData.uiUxDesigners}</td>
          <td style="padding: 12px 0; text-align: right; color: #111827; font-weight: 600; border: none !important; border-width: 0 !important;">${fmt(uiUxCost)}</td>
        </tr>`);
    }
    lineItemRows.push(`
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 0; color: #1f2937; font-weight: 500; border: none !important; border-width: 0 !important;">Project Management &amp; Delivery Oversight</td>
          <td style="padding: 12px 0; text-align: right; color: #111827; font-weight: 600; border: none !important; border-width: 0 !important;">${fmt(projectManagementCostFinal)}</td>
        </tr>`);
  }

  // Add selected bundles to line items
  if (hasBundles) {
    formData.selectedBundles!.forEach(bundle => {
      const { amount, currency: bundleCurrency } = parsePriceString(bundle.price);
      
      const priceValue = convertCurrency(
        amount, 
        formData.currency, 
        bundleCurrency, 
        bundleCurrency === "INR"
      );

      const displayPrice = priceValue === 0 
        ? `<span style="color: #10b981; font-weight: 700;">FREE</span>`
        : fmt(priceValue);

      lineItemRows.push(`
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 0; color: #1f2937; font-weight: 500; border: none !important; border-width: 0 !important;">
            ${bundle.name} <span style="font-size: 10px; color: #6b7280; font-weight: 400;">(${bundle.billing || 'Bundle'})</span>
          </td>
          <td style="padding: 12px 0; text-align: right; color: #111827; font-weight: 600; border: none !important; border-width: 0 !important;">${displayPrice}</td>
        </tr>`);
    });
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - Cehpoint</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #111827; }
    h1, h2, h3, h4, h5, h6 { font-weight: inherit; font-size: inherit; color: inherit; text-decoration: none; border: none; padding: 0; margin: 0; }
    a { color: inherit; text-decoration: none; }
    table { border-collapse: collapse; border-spacing: 0; }
    th, td { border: none; padding: 0; text-align: left; font-weight: inherit; }
    p { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <!-- A4 container -->
  <div style="width: 210mm; min-height: 297mm; background: #fff; display: flex; flex-direction: column; margin: 0 auto;">

    <!-- ── Header ── -->
    <div style="background-color: rgb(30, 58, 138); color: #fff; padding: 32px 40px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="font-size: 24pt; font-weight: 700; margin: 0; letter-spacing: -0.025em;">INVOICE</h1>
        <p style="color: #bfdbfe; font-size: 9pt; margin: 4px 0 0 0; letter-spacing: 0.025em;">#${invoiceNumber}</p>
      </div>
      <div style="text-align: right;">
        <h2 style="font-size: 14pt; font-weight: 700; margin: 0;">Cehpoint</h2>
        <p style="font-size: 10px; color: #bfdbfe; margin: 4px 0 0 0;">info@cehpoint.co.in</p>
        <p style="font-size: 10px; color: #bfdbfe; margin: 0;">cehpoint.co.in</p>
      </div>
    </div>

    <!-- ── Body ── -->
    <div style="padding: 32px 40px; flex-grow: 1; display: flex; flex-direction: column;">

      <!-- Bill To / Dates grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">

        <!-- Bill To -->
        <div>
          <h3 style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Bill To</h3>
          <p style="color: #111827; font-weight: 700; font-size: 16px; margin: 0;">${formData.clientName}</p>
          <p style="color: #4b5563; font-size: 12px; white-space: pre-line; margin: 4px 0 0 0;">${formData.clientEmail}<br>${formData.clientPhoneNumber}</p>
        </div>

        <!-- Dates + From -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <h3 style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Issue Date</h3>
            <p style="color: #111827; font-weight: 500; font-size: 14px; margin: 0;">${issueDate}</p>
          </div>
          <div>
            <h3 style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Due Date</h3>
            <p style="color: #111827; font-weight: 500; font-size: 14px; margin: 0;">${dueDate}</p>
          </div>

        </div>
      </div>

      <!-- Spacer below dates group to push content down -->
      <div style="margin-bottom: 35px;"></div>

      <!-- ── Line Items Table ── -->
      <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: none;">
        <thead>
          <tr style="border-bottom: 2px solid #dbeafe;">
            <th style="text-align: left; padding: 8px 0; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none !important; border-width: 0 !important;">Description</th>
            <th style="text-align: right; padding: 8px 0; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; width: 100px; border: none !important; border-width: 0 !important;">Amount</th>
          </tr>
        </thead>
        <tbody style="font-size: 12px;">
          ${lineItemRows.join("")}
        </tbody>
      </table>

      <!-- ── Totals ── -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
        <div style="width: 256px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; margin-bottom: 6px;">
            <span>Subtotal</span><span>${fmt(subtotal)}</span>
          </div>
          ${formData.currency === "INR" ? `
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; margin-bottom: 6px;">
            <span>GST (18%)</span><span>${fmt(gstAmount)}</span>
          </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #1e3a8a; padding-top: 8px; border-top: 2px solid #dbeafe;">
            <span>Grand Total</span><span>${fmt(totalCost)}</span>
          </div>
          <p style="font-size: 9px; color: #6b7280; text-align: right; margin: 4px 0 0 0; line-height: 1.2;">
            This investment covers development, deployment, and ongoing strategic consulting.
          </p>
        </div>
      </div>

      <!-- ── Footer ── -->
      <div style="margin-top: auto;">

        <!-- Payment Options -->
        <div style="font-size: 10px; color: #4b5563; margin-bottom: 24px; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
          <p style="font-weight: 700; color: #1f2937; margin: 0 0 4px 0;">Accepted Payment Methods</p>
          <p style="margin: 0; line-height: 1.5;">To make a payment via <strong style="color: #111827;">Bank Transfer, UPI, PayPal, or Cryptocurrency</strong>, please visit the <strong>Payment Page</strong> in your Client Portal.</p>
        </div>

        <!-- Terms & Conditions -->
        <div style="font-size: 10px; color: #6b7280; margin-bottom: 24px;">
          <p style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; margin: 0 0 4px 0;">Terms &amp; Conditions</p>
          <p style="margin: 0; line-height: 1.5;">Payment is due within 15 days of invoice date. Late payments may incur a 1.5%<br>monthly fee.</p>
        </div>

        <!-- Global Offices -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <h3 style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; color: #6b7280;">Global Offices</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 16px;">
            <div style="font-size: 7px; line-height: 1.4;">
              <p style="font-weight: 700; color: #1f2937; margin-bottom: 2px;"><span style="font-size: 9px;">🇮🇳</span> India</p>
              <p style="color: #6b7280; font-weight: 500;">Cehpoint, Labpur, Sandipan Patsala Para, Birbhum, Bolpur, West Bengal - 731303</p>
            </div>
            <div style="font-size: 7px; line-height: 1.4;">
              <p style="font-weight: 700; color: #1f2937; margin-bottom: 2px;"><span style="font-size: 9px;">🇺🇸</span> United States</p>
              <p style="color: #6b7280; font-weight: 500;">5 Penn Plaza, 14th Floor, New York, NY 10001, US</p>
            </div>
            <div style="font-size: 7px; line-height: 1.4;">
              <p style="font-weight: 700; color: #1f2937; margin-bottom: 2px;"><span style="font-size: 9px;">🇬🇧</span> United Kingdom</p>
              <p style="color: #6b7280; font-weight: 500;">12 Steward Street, The Steward Building, London, E1 6FQ, Great Britain</p>
            </div>
            <div style="font-size: 7px; line-height: 1.4;">
              <p style="font-weight: 700; color: #1f2937; margin-bottom: 2px;"><span style="font-size: 9px;">🇩🇪</span> Germany</p>
              <p style="color: #6b7280; font-weight: 500;">Banking Circle S.A. - German Branch, Maximilianstra&#223;e 54, 80538 M&#252;nchen</p>
            </div>
            <div style="font-size: 7px; line-height: 1.4;">
              <p style="font-weight: 700; color: #1f2937; margin-bottom: 2px;"><span style="font-size: 9px;">🇦🇺</span> Australia</p>
              <p style="color: #6b7280; font-weight: 500;">Level 11/10 Carrington St, Sydney NSW 2000, Australia</p>
            </div>
            <div style="font-size: 7px; line-height: 1.4;">
              <p style="font-weight: 700; color: #1f2937; margin-bottom: 2px;"><span style="font-size: 9px;">🇨🇦</span> Canada</p>
              <p style="color: #6b7280; font-weight: 500;">736 Meridian Road N.E, Calgary, Alberta, CA</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</body>
</html>`;
};
