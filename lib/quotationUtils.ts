// A function to get the current date in a formatted string
export const getFormattedDate = (): string => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// // Generate a unique quotation number
// export const generateQuotationNumber = (): string => {
//   const date = new Date();
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   const random = Math.floor(Math.random() * 1000)
//     .toString()
//     .padStart(3, "0");

//   return `Q-${year}${month}${day}-${random}`;
// };

// Add currency to the QuotationData interface
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
  currency: "INR" | "USD";
  selectedBundle?: {
    name: string;
    price: number;
  } | null;
}

// Update the generateQuotationHtml function to use the correct conversion formula
// and make the quotation more compact
export const generateQuotationHtml = (formData: QuotationData): string => {
  // Define base rates in INR
  const exchangeRate = 83; // 1 USD = ₹83

  // Define base rates in INR
  const baseRates = {
    seniorDevRate: 75000,
    juniorDevRate: 30000,
    uiUxRate: 8000,
    projectManagementCost: 50000,
  };

  // Apply conversion if USD is selected
  const currencySymbol = formData.currency === "USD" ? "$" : "₹";

  // Calculate rates with conversion
  const seniorDevRate =
    formData.currency === "INR"
      ? baseRates.seniorDevRate
      : Math.round(
        (baseRates.seniorDevRate + 0.04 * baseRates.seniorDevRate) /
        exchangeRate
      );

  const juniorDevRate =
    formData.currency === "INR"
      ? baseRates.juniorDevRate
      : Math.round(
        (baseRates.juniorDevRate + 0.04 * baseRates.juniorDevRate) /
        exchangeRate
      );

  const uiUxRate =
    formData.currency === "INR"
      ? baseRates.uiUxRate
      : Math.round(
        (baseRates.uiUxRate + 0.04 * baseRates.uiUxRate) / exchangeRate
      );

  const projectManagementCost =
    formData.currency === "INR"
      ? baseRates.projectManagementCost
      : Math.round(
        (baseRates.projectManagementCost +
          0.04 * baseRates.projectManagementCost) /
        exchangeRate
      );

  // Calculate costs
  const seniorDevCost = formData.seniorDevelopers * seniorDevRate;
  const juniorDevCost = formData.juniorDevelopers * juniorDevRate;
  const uiUxCost = formData.uiUxDesigners * uiUxRate;

  let totalCost = 0;
  if (formData.selectedBundle) {
    totalCost = formData.selectedBundle.price;
  } else {
    totalCost = seniorDevCost + juniorDevCost + uiUxCost + projectManagementCost;
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString(
      formData.currency === "INR" ? "en-IN" : "en-US"
    )}`;
  };

  const currentDate = getFormattedDate();

  // Dynamic Payment URL logic
  const paymentBaseUrl = typeof window !== "undefined"
    ? (process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_VITE_DEV_URL || "http://localhost:5173"
      : process.env.NEXT_PUBLIC_VITE_PROD_URL || "https://intern-assessment-pi.vercel.app")
    : "";

  const paymentUrl = `${paymentBaseUrl}/client/payment/`;

  // Updated HTML with Premium A4-specific styling
  const quotationHtml = `
  <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Project Quotation - CEHPOINT</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    :root {
      --primary: #FFD700;
      --primary-dark: #ccac00;
      --dark: #1A1F2C;
      --dark-muted: #2D3343;
      --text-gray: #64748b;
      --bg-gray: #F8FAFC;
      --border-gray: #E2E8F0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      line-height: 1.5;
      color: var(--dark);
      background-color: var(--bg-gray);
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
    }
    
    .quotation-container {
      width: 210mm;
      min-height: 297mm;
      margin: 0;
      padding: 15mm;
      background-color: white;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12mm;
      border-bottom: 2px solid var(--border-gray);
      padding-bottom: 8mm;
    }
    
    .brand {
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }
    
    .logo-container {
      background: var(--dark);
      color: var(--primary);
      width: 14mm;
      height: 14mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16pt;
      border-radius: 3mm;
      margin-bottom: 2mm;
    }
    
    .company-name {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      color: var(--dark);
    }
    
    .company-info {
      font-size: 8pt;
      color: var(--text-gray);
      line-height: 1.4;
    }
    
    .document-badge {
      background: var(--primary);
      color: var(--dark);
      padding: 4mm 6mm;
      border-radius: 2mm;
      font-weight: 700;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .top-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10mm;
      margin-bottom: 10mm;
    }
    
    .meta-card {
      background: var(--bg-gray);
      padding: 6mm;
      border-radius: 4mm;
      border: 1px solid var(--border-gray);
    }
    
    .meta-title {
      font-size: 7pt;
      font-weight: 700;
      color: var(--text-gray);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3mm;
      display: block;
    }
    
    .client-name {
      font-size: 14pt;
      font-weight: 700;
      color: var(--dark);
      margin: 0 0 1mm 0;
    }
    
    .client-detail {
      font-size: 8.5pt;
      color: var(--text-gray);
      margin: 0;
    }
    
    .quote-info-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2mm 5mm;
    }
    
    .quote-label {
      font-size: 8.5pt;
      font-weight: 600;
      color: var(--text-gray);
    }
    
    .quote-value {
      font-size: 8.5pt;
      font-weight: 700;
      color: var(--dark);
      text-align: right;
    }
    
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      margin-bottom: 4mm;
      color: var(--dark);
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    
    .section-title::before {
      content: "";
      width: 1mm;
      height: 5mm;
      background: var(--primary);
      border-radius: 1mm;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8mm;
    }
    
    th {
      background: var(--dark);
      color: white;
      text-align: left;
      padding: 4mm 5mm;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    td {
      padding: 4mm 5mm;
      border-bottom: 1px solid var(--border-gray);
      font-size: 9pt;
      vertical-align: top;
    }
    
    .service-name {
      font-weight: 700;
      color: var(--dark);
      display: block;
      margin-bottom: 0.5mm;
    }
    
    .service-desc {
      font-size: 7.5pt;
      color: var(--text-gray);
    }
    
    .col-qty { text-align: center; width: 20mm; }
    .col-rate { text-align: right; width: 35mm; }
    .col-amount { text-align: right; width: 40mm; font-weight: 700; }
    
    .totals-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 5mm;
    }
    
    .payment-notice {
      width: 90mm;
      background: var(--bg-gray);
      border: 1px dashed var(--border-gray);
      padding: 4mm;
      border-radius: 3mm;
    }
    
    .notice-title {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--text-gray);
      margin-bottom: 2mm;
      display: block;
    }
    
    .notice-text {
      font-size: 8pt;
      color: var(--dark-muted);
      line-height: 1.4;
    }
    
    .totals-box {
      width: 80mm;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 2mm 0;
      font-size: 9pt;
    }
    
    .total-row.grand {
      background: var(--dark);
      color: var(--primary);
      padding: 4mm 5mm;
      border-radius: 2mm;
      margin-top: 3mm;
      font-size: 13pt;
      font-weight: 800;
    }
    
    .payment-cta {
      margin-top: 10mm;
      text-align: center;
      padding: 6mm;
      background: var(--dark);
      border-radius: 4mm;
      color: white;
    }
    
    .pay-button {
      background: var(--primary);
      color: var(--dark);
      text-decoration: none;
      padding: 3mm 10mm;
      border-radius: 2mm;
      font-weight: 800;
      font-size: 11pt;
      display: inline-block;
      margin-bottom: 3mm;
      transition: background 0.2s;
      padding-bottom: 2px;
    }
    
    .crypto-info {
      font-size: 7.5pt;
      color: rgba(255,255,255,0.7);
    }
    
    .sidebar-hint {
      font-size: 8pt;
      color: rgba(255,255,255,0.9);
      margin-top: 2mm;
      font-weight: 500;
    }
    
    .footer {
      margin-top: auto;
      padding-top: 8mm;
      border-top: 1px solid var(--border-gray);
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: var(--text-gray);
    }
  </style>
</head>
<body>
  <div class="quotation-container">
    <div class="header">
      <div class="brand">
        <h1 class="company-name">CEHPOINT</h1>
        <div class="company-info">
          Innovation & Security Solutions<br>
          ● services.cehpoint.co.in | ● info@cehpoint.co.in<br>
          ● Corporate number (IVR): +91 33 6902 9331
        </div>
      </div>
      <div class="document-badge">Quotation</div>
    </div>
    
    <div class="top-meta">
      <div class="meta-card">
        <span class="meta-title">Prepared For</span>
        <p class="client-name">${formData.clientName}</p>
        <p class="client-detail">${formData.clientEmail}</p>
        <p class="client-detail">${formData.clientPhoneNumber}</p>
      </div>
      <div class="meta-card">
        <span class="meta-title">Quote Details</span>
        <div class="quote-info-grid">
          <span class="quote-label">Date:</span>
          <span class="quote-value">${currentDate}</span>
          <span class="quote-label">Quote #:</span>
          <span class="quote-value">QTN-${Math.floor(Math.random() * 90000) + 10000}</span>
          <span class="quote-label">Project:</span>
          <span class="quote-value">${formData.projectName}</span>
          <span class="quote-label">Currency:</span>
          <span class="quote-value">${formData.currency}</span>
        </div>
      </div>
    </div>
    
    <div class="section-title">Investment Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Service Description</th>
          <th class="col-qty">Quantity</th>
          <th class="col-rate">Unit Rate</th>
          <th class="col-amount">Total</th>
        </tr>
      </thead>
      <tbody>
        ${formData.selectedBundle
      ? `
        <tr>
          <td>
            <span class="service-name">${formData.selectedBundle.name}</span>
            <span class="service-desc">Comprehensive project development solution bundle</span>
          </td>
          <td class="col-qty">1</td>
          <td class="col-rate">${formatCurrency(formData.selectedBundle.price)}</td>
          <td class="col-amount">${formatCurrency(formData.selectedBundle.price)}</td>
        </tr>
        `
      : `
        ${formData.seniorDevelopers > 0 ? `
        <tr>
          <td>
            <span class="service-name">Senior Software Architect/Developer</span>
            <span class="service-desc">Strategic development and core systems implementation</span>
          </td>
          <td class="col-qty">${formData.seniorDevelopers}</td>
          <td class="col-rate">${formatCurrency(seniorDevRate)}</td>
          <td class="col-amount">${formatCurrency(seniorDevCost)}</td>
        </tr>
        ` : ""}
        ${formData.juniorDevelopers > 0 ? `
        <tr>
          <td>
            <span class="service-name">Full-Stack Developer</span>
            <span class="service-desc">Feature development and interface implementation</span>
          </td>
          <td class="col-qty">${formData.juniorDevelopers}</td>
          <td class="col-rate">${formatCurrency(juniorDevRate)}</td>
          <td class="col-amount">${formatCurrency(juniorDevCost)}</td>
        </tr>
        ` : ""}
        ${formData.uiUxDesigners > 0 ? `
        <tr>
          <td>
            <span class="service-name">UI/UX Interface Designer</span>
            <span class="service-desc">Visual design, prototyping and user journey optimization</span>
          </td>
          <td class="col-qty">${formData.uiUxDesigners}</td>
          <td class="col-rate">${formatCurrency(uiUxRate)}</td>
          <td class="col-amount">${formatCurrency(uiUxCost)}</td>
        </tr>
        ` : ""}
        <tr>
          <td>
            <span class="service-name">Project Management & QA</span>
            <span class="service-desc">Coordination, quality assurance, and delivery management</span>
          </td>
          <td class="col-qty">1</td>
          <td class="col-rate">${formatCurrency(projectManagementCost)}</td>
          <td class="col-amount">${formatCurrency(projectManagementCost)}</td>
        </tr>
        `
    }
      </tbody>
    </table>
    
    <div class="totals-wrapper">
      <div class="payment-notice">
        <span class="notice-title">Payment Terms</span>
        <div class="notice-text">
          • 50% advance payment required for project kickoff.<br>
          • 30% upon milestone 1 delivery.<br>
          • 20% upon final delivery and handoff.<br>
          • Validity: 15 Days from the date of issue.
        </div>
      </div>
      <div class="totals-box">
        <div class="total-row">
          <span class="quote-label" style="text-transform: uppercase; font-size: 7pt;">Subtotal</span>
          <span class="quote-value" style="font-size: 10pt;">${formatCurrency(totalCost)}</span>
        </div>
        <div class="total-row">
          <span class="quote-label" style="text-transform: uppercase; font-size: 7pt;">Tax (0%)</span>
          <span class="quote-value" style="font-size: 10pt;">${formatCurrency(0)}</span>
        </div>
        <div class="total-row grand">
          <span>Total Investment</span>
          <span>${formatCurrency(totalCost)}</span>
        </div>
      </div>
    </div>
    
    <div class="payment-cta">
      <a href="${paymentUrl}" class="pay-button">Secure Payment Now</a>
      <div class="sidebar-hint">
        You can make a payment by selecting the "Payment" option on the sidebar dashboard.
      </div>
      <div class="crypto-info">
        We also accept payments in Cryptocurrency (USDT / BTC / ETH). Contact support for wallet addresses.
      </div>
    </div>
    
    <div class="footer">
      <div>CEHPOINT © 2026 | All Rights Reserved</div>
      <div>Thank you for choosing CEHPOINT for your innovation journey.</div>
    </div>
  </div>
</body>
</html>
  `;

  return quotationHtml;
};

