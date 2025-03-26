// A function to get the current date in a formatted string
export const getFormattedDate = (): string => {
  const date = new Date()
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

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
  clientName: string
  clientEmail: string
  clientPhoneNumber: string
  projectName: string
  projectOverview: string
  developmentAreas: string[]
  seniorDevelopers: number
  juniorDevelopers: number
  uiUxDesigners: number
  currency: "INR" | "USD"
}

// Update the generateQuotationHtml function to use the correct conversion formula
// and make the quotation more compact
export const generateQuotationHtml = (formData: QuotationData): string => {
  // Define base rates in INR
  const exchangeRate = 83 // 1 USD = ₹83

  // Define base rates in INR
  const baseRates = {
    seniorDevRate: 75000,
    juniorDevRate: 30000,
    uiUxRate: 8000,
    projectManagementCost: 50000,
  }

  // Apply conversion if USD is selected
  const currencySymbol = formData.currency === "USD" ? "$" : "₹"

  // Calculate rates with conversion
  const seniorDevRate =
    formData.currency === "INR"
      ? baseRates.seniorDevRate
      : Math.round((baseRates.seniorDevRate + 0.04 * baseRates.seniorDevRate) / exchangeRate)

  const juniorDevRate =
    formData.currency === "INR"
      ? baseRates.juniorDevRate
      : Math.round((baseRates.juniorDevRate + 0.04 * baseRates.juniorDevRate) / exchangeRate)

  const uiUxRate =
    formData.currency === "INR"
      ? baseRates.uiUxRate
      : Math.round((baseRates.uiUxRate + 0.04 * baseRates.uiUxRate) / exchangeRate)

  const projectManagementCost =
    formData.currency === "INR"
      ? baseRates.projectManagementCost
      : Math.round((baseRates.projectManagementCost + 0.04 * baseRates.projectManagementCost) / exchangeRate)

  // Calculate costs
  const seniorDevCost = formData.seniorDevelopers * seniorDevRate
  const juniorDevCost = formData.juniorDevelopers * juniorDevRate
  const uiUxCost = formData.uiUxDesigners * uiUxRate
  const totalCost = seniorDevCost + juniorDevCost + uiUxCost + projectManagementCost

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString(formData.currency === "INR" ? "en-IN" : "en-US")}`
  }

  const currentDate = getFormattedDate()

  // Updated HTML with A4-specific styling
  const quotationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Project Quotation - CEHPOINT</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    :root {
      --quotation-dark: #1A1F2C;
      --quotation-yellow: #FFD700;
      --quotation-gray-light: #F5F5F7;
      --quotation-gray-medium: #E5E5E7;
      --quotation-dark-light: #4A5568;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.2;
      color: var(--quotation-dark);
      background-color: #F9FAFB;
      margin: 0;
      padding: 0;
      font-size: 9pt;
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
    }
    
    .quotation-container {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }
    
    .quotation-header {
      background: var(--quotation-dark);
      color: white;
      padding: 10px;
      flex-shrink: 0;
    }
    
    .quotation-tag {
      display: inline-block;
      background-color: var(--quotation-yellow);
      color: var(--quotation-dark);
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8pt;
      letter-spacing: 0.5px;
    }
    
    .company-contact-details {
      margin-top: 4px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 7pt;
      line-height: 1.2;
    }
    
    .quotation-section-title {
      font-size: 10pt;
      font-weight: 600;
      color: var(--quotation-dark);
      position: relative;
      padding-left: 6px;
      margin: 6px 0;
    }
    
    .quotation-section-title:before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 2px;
      background-color: var(--quotation-yellow);
      border-radius: 2px;
    }
    
    .info-item {
      display: flex;
      margin-bottom: 6px;
    }
    
    .info-label {
      color: var(--quotation-dark-light);
      font-size: 7pt;
      margin-bottom: 1px;
    }
    
    .info-value {
      font-weight: 500;
      font-size: 8pt;
    }
    
    .quotation-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 8pt;
    }
    
    .quotation-table th {
      background-color: var(--quotation-yellow);
      color: var(--quotation-dark);
      padding: 6px 8px;
      font-weight: 600;
      text-align: left;
    }
    
    .quotation-table th:first-child {
      border-top-left-radius: 6px;
    }
    
    .quotation-table th:last-child {
      border-top-right-radius: 6px;
    }
    
    .quotation-table td {
      padding: 5px 8px;
      border-bottom: 1px solid var(--quotation-gray-medium);
    }
    
    .quotation-table tr:last-child td {
      border-bottom: none;
    }
    
    .total-row {
      background-color: var(--quotation-gray-light);
      font-weight: 600;
    }
    
    .total-row td {
      padding: 6px 8px !important;
    }
    
    .service-icon {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: rgba(255, 215, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 6px;
      flex-shrink: 0;
    }
    
    .client-project-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      flex-grow: 0;
    }
    
    .info-box {
      background-color: rgba(245, 245, 247, 0.5);
      border-radius: 6px;
      padding: 8px;
    }
    
    .footer {
      padding: 8px;
      background-color: var(--quotation-dark);
      color: rgba(255, 255, 255, 0.9);
      font-size: 7pt;
      flex-shrink: 0;
    }
    
    .service-description {
      display: flex;
      align-items: center;
    }
    
    .service-text {
      display: flex;
      flex-direction: column;
    }
    
    .service-title {
      font-weight: 500;
      margin: 0;
    }
    
    .service-subtitle {
      font-size: 6pt;
      color: var(--quotation-dark-light);
      margin: 1px 0 0 0;
    }
    
    .main-content {
      flex-grow: 1;
      background-color: white;
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="quotation-container">
    <!-- Header Section -->
    <div class="quotation-header">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h1 style="font-size: 14pt; font-weight: 700; letter-spacing: -0.5px; margin: 4px 0;">CEHPOINT</h1>
          <div class="company-contact-details" style="line-height: 1.2;">
            <div>● services.cehpoint.co.in | ● info@cehpoint.co.in</div>
            <div>● Corporate number (IVR): +91 33 6902 9331</div>
          </div>
        </div>
        <div style="text-align: right;">
          <p style="opacity: 0.8; margin: 0; font-size: 8pt;">Date: ${currentDate}</p>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Client & Project Info -->
      <div class="client-project-grid">
        <!-- Client Information Section -->
        <div>
          <h3 class="quotation-section-title">Client Information</h3>
          <div class="info-box">
            <div class="info-item">
              <span style="margin-right: 4px; color: var(--quotation-dark-light);">●</span>
              <div>
                <span class="info-label">Name</span>
                <p class="info-value" style="margin: 0;">${formData.clientName}</p>
              </div>
            </div>
            <div class="info-item">
              <span style="margin-right: 4px; color: var(--quotation-dark-light);">●</span>
              <div>
                <span class="info-label">Email</span>
                <p class="info-value" style="margin: 0;">${formData.clientEmail}</p>
              </div>
            </div>
            <div class="info-item">
              <span style="margin-right: 4px; color: var(--quotation-dark-light);">●</span>
              <div>
                <span class="info-label">Phone</span>
                <p class="info-value" style="margin: 0;">${formData.clientPhoneNumber}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Project Information Section -->
        <div>
          <h3 class="quotation-section-title">Project Details</h3>
          <div class="info-box">
            <div class="info-item">
              <span style="margin-right: 4px; color: var(--quotation-dark-light);">●</span>
              <div>
                <span class="info-label">Project Name</span>
                <p class="info-value" style="margin: 0;">${formData.projectName}</p>
              </div>
            </div>
            <div class="info-item">
              <span style="margin-right: 4px; color: var(--quotation-dark-light);">●</span>
              <div>
                <span class="info-label">Overview</span>
                <p class="info-value" style="margin: 0; font-size: 7pt;">${
                  formData.projectOverview.split(" ").slice(0, 100).join(" ") +
                  (formData.projectOverview.split(" ").length > 15 ? "..." : "")
                }</p>
              </div>
            </div>
            <div class="info-item">
              <span style="margin-right: 4px; color: var(--quotation-dark-light);">●</span>
              <div>
                <span class="info-label">Development</span>
                <div style="display: flex; flex-wrap: wrap; gap: 3px; margin-top: 2px;">
                  ${formData.developmentAreas
                    .map(
                      (area) => `
                    <span style="background-color: var(--quotation-yellow); color: var(--quotation-dark); padding: 1px 3px; border-radius: 3px; font-size: 6pt; font-weight: 500;">${area}</span>
                  `,
                    )
                    .join("")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Service Details & Pricing -->
      <div style="flex-grow: 1; display: flex; flex-direction: column;">
        <h3 class="quotation-section-title">Service & Pricing</h3>
        <div style="overflow: hidden; border-radius: 6px; border: 1px solid var(--quotation-gray-medium); flex-grow: 1;">
          <table class="quotation-table">
            <thead>
              <tr>
                <th style="width: 50%;">Service Description</th>
                <th style="text-align: center; width: 15%;">Qty</th>
                <th style="text-align: right; width: 15%;">Rate</th>
                <th style="text-align: right; width: 20%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                formData.seniorDevelopers > 0
                  ? `
              <tr>
                <td>
                  <div class="service-description">
                    <div class="service-icon">
                      <span style="color: var(--quotation-dark); font-size: 6pt;">●</span>
                    </div>
                    <div class="service-text">
                      <p class="service-title">Senior Developer</p>
                      <p class="service-subtitle">Experienced developer for complex tasks</p>
                    </div>
                  </div>
                </td>
                <td style="text-align: center;">${formData.seniorDevelopers}</td>
                <td style="text-align: right;">${formatCurrency(seniorDevRate)}</td>
                <td style="text-align: right; font-weight: 500;">${formatCurrency(seniorDevCost)}</td>
              </tr>
              `
                  : ""
              }
              
              ${
                formData.juniorDevelopers > 0
                  ? `
              <tr>
                <td>
                  <div class="service-description">
                    <div class="service-icon">
                      <span style="color: var(--quotation-dark); font-size: 6pt;">●</span>
                    </div>
                    <div class="service-text">
                      <p class="service-title">Junior Developer</p>
                      <p class="service-subtitle">Support implementation and coding</p>
                    </div>
                  </div>
                </td>
                <td style="text-align: center;">${formData.juniorDevelopers}</td>
                <td style="text-align: right;">${formatCurrency(juniorDevRate)}</td>
                <td style="text-align: right; font-weight: 500;">${formatCurrency(juniorDevCost)}</td>
              </tr>
              `
                  : ""
              }
              
              ${
                formData.uiUxDesigners > 0
                  ? `
              <tr>
                <td>
                  <div class="service-description">
                    <div class="service-icon">
                      <span style="color: var(--quotation-dark); font-size: 6pt;">●</span>
                    </div>
                    <div class="service-text">
                      <p class="service-title">UI/UX Designer</p>
                      <p class="service-subtitle">Design interface and user experience</p>
                    </div>
                  </div>
                </td>
                <td style="text-align: center;">${formData.uiUxDesigners}</td>
                <td style="text-align: right;">${formatCurrency(uiUxRate)}</td>
                <td style="text-align: right; font-weight: 500;">${formatCurrency(uiUxCost)}</td>
              </tr>
              `
                  : ""
              }
              
              <tr>
                <td>
                  <div class="service-description">
                    <div class="service-icon">
                      <span style="color: var(--quotation-dark); font-size: 6pt;">●</span>
                    </div>
                    <div class="service-text">
                      <p class="service-title">Project Management</p>
                      <p class="service-subtitle">Coordination and delivery oversight</p>
                    </div>
                  </div>
                </td>
                <td style="text-align: center;">1</td>
                <td style="text-align: right;">${formatCurrency(projectManagementCost)}</td>
                <td style="text-align: right; font-weight: 500;">${formatCurrency(projectManagementCost)}</td>
              </tr>
              
              <tr class="total-row">
                <td colspan="2">
                  <p style="font-weight: 700; font-size: 10pt; margin: 0;">Grand Total</p>
                </td>
                <td colspan="2" style="text-align: right;">
                  <p style="font-weight: 700; font-size: 10pt; margin: 0;">${formatCurrency(totalCost)}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Footer Section -->
    <div class="footer">
      <p style="margin: 0;">This quotation is valid for 30 days from the issue date. All prices are subject to applicable taxes and may be adjusted based on project scope changes.</p>
    </div>
  </div>
</body>
</html>
  `

  return quotationHtml
}
