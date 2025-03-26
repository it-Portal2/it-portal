import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

/**
 * Extracts text content from a PDF file
 * @param fileUrl - URL of the PDF file
 * @returns Extracted text from the PDF
 */
export async function extractTextFromPdf(fileUrl: string): Promise<string> {
  try {
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const loader = new PDFLoader(new Blob([arrayBuffer]));
    const docs = await loader.load();
    
    return docs.map(doc => doc.pageContent).join('\n');
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : "An unexpected error occurred"}`);
  }
}