// Function to convert HTML to PDF blob
export async function htmlToPdfBlobForQuotation(htmlContent: string): Promise<Blob> {
  // Create a temporary div to render the HTML
  const element = document.createElement("div");
  element.innerHTML = htmlContent;
  element.style.position = "absolute";
  element.style.left = "-9999px";
  element.style.top = "-9999px";
  document.body.appendChild(element);

  try {
    const { jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    // Render HTML to canvas with high quality
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: null, // Preserve transparency if any
      windowWidth: 794, // A4 width in pixels at 96 DPI (210mm)
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0); // Full quality JPEG
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true, // Enable compression for smaller file size
    });

    // A4 dimensions in mm
    const imgWidth = 210; // A4 width
    const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio

    // Ensure the image fits within A4 height (297mm)
    if (imgHeight > 297) {
      // If the content exceeds A4 height, scale it down to fit
      const scaleFactor = 297 / imgHeight;
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        imgWidth * scaleFactor,
        imgHeight * scaleFactor,
        undefined,
        "FAST" // Faster compression
      );
    } else {
      // Add image as-is if it fits
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );
    }

    // Generate initial blob
    let pdfBlob = pdf.output("blob");

    // Check file size and optimize if necessary (e.g., > 500KB)
    if (pdfBlob.size > 500000) {
      // Re-render with lower quality
      const canvasLowQuality = await html2canvas(element, {
        scale: 1.5, // Slightly lower scale
        useCORS: true,
        logging: false,
        backgroundColor: null,
        windowWidth: 794,
      });

      const imgDataLowQuality = canvasLowQuality.toDataURL("image/jpeg", 0.8); // Reduced quality
      const pdfLowQuality = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgHeightLowQuality = (canvasLowQuality.height * imgWidth) / canvasLowQuality.width;

      if (imgHeightLowQuality > 297) {
        const scaleFactor = 297 / imgHeightLowQuality;
        pdfLowQuality.addImage(
          imgDataLowQuality,
          "JPEG",
          0,
          0,
          imgWidth * scaleFactor,
          imgHeightLowQuality * scaleFactor,
          undefined,
          "FAST"
        );
      } else {
        pdfLowQuality.addImage(
          imgDataLowQuality,
          "JPEG",
          0,
          0,
          imgWidth,
          imgHeightLowQuality,
          undefined,
          "FAST"
        );
      }

      pdfBlob = pdfLowQuality.output("blob");
    }

    return pdfBlob;
  } catch (error) {
    console.error("Error generating PDF blob:", error);
    throw new Error("Failed to generate PDF blob");
  } finally {
    // Clean up
    document.body.removeChild(element);
  }
}
  
  // Updated htmlToPdfBlob function with proper TypeScript support
 export async function htmlToPdfBlob(htmlContent: string): Promise<Blob> {
    try {
      // Import pdfmake
      const pdfMakeModule = await import("pdfmake/build/pdfmake");
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
  
      // Import vfs_fonts properly - this is the key fix
      const vfs = await import("pdfmake/build/vfs_fonts");
  
      // Set fonts directly
      pdfMake.vfs = vfs.vfs;
  
      // Import html-to-pdfmake
      const htmlToPdfMakeModule = await import("html-to-pdfmake");
      const htmlToPdfMake = htmlToPdfMakeModule.default || htmlToPdfMakeModule;
  
      // Pre-process HTML content to handle emojis and styles
      let processedHtml = htmlContent;
  
      // Simple emoji mapping
      const emojiMap = {
        "📌": " ",
        "✅": " ",
        "🔷": " ",
        "🔹": " ",
        "1️⃣": " ",
        "2️⃣": " ",
        "3️⃣": " ",
        // Add more emoji mappings as needed
      };
  
  
      // Replace emojis with text representations
      Object.entries(emojiMap).forEach(([emoji, text]) => {
        processedHtml = processedHtml.replace(new RegExp(emoji, "g"), text);
      });
  
      // Remove style tags but keep their selectors for manual styling later
      processedHtml = processedHtml.replace(/<style>[\s\S]*?<\/style>/gi, "");
      // Create a temporary div to parse the HTML
      const element = document.createElement("div");
      element.innerHTML = processedHtml;
      try {
        // Convert HTML to pdfmake compatible format
        const pdfContent = htmlToPdfMake(element.innerHTML, {
          tableAutoSize: true,
          imagesByReference: false,
        });
  
        // Generate the PDF document definition
        const docDefinition = {
          content: pdfContent,
          defaultStyle: {
            fontSize: 11,
          },
          styles: {
            h1: {
              fontSize: 18,
              bold: true,
              margin: [0, 10, 0, 5] as [number, number, number, number],
            },
            h2: {
              fontSize: 16,
              bold: true,
              margin: [0, 10, 0, 5] as [number, number, number, number],
            },
            h3: {
              fontSize: 14,
              bold: true,
              margin: [0, 10, 0, 5] as [number, number, number, number],
            },
            p: { margin: [0, 5, 0, 5] as [number, number, number, number] },
            ul: { margin: [0, 5, 0, 15] as [number, number, number, number] },
          },
        };
  
        // Create and return the PDF blob
        return new Promise((resolve, reject) => {
          try {
            const pdfDocGenerator = pdfMake.createPdf(docDefinition);
            pdfDocGenerator.getBlob((blob: Blob) => {
              resolve(blob);
            });
          } catch (error) {
            reject(error);
          }
        });
      } finally {
        // No need to remove from DOM since we didn't append
      }
    } catch (error) {
      console.error("Error generating PDF blob:", error);
      throw new Error(
        error instanceof Error
          ? `Failed to generate PDF: ${error.message}`
          : "Failed to generate PDF blob"
      );
    }
  }