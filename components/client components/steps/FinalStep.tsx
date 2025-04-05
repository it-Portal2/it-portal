"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Link as LINK } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useProjectFormStore } from "@/lib/store/projectSteps";
import { PdfViewer } from "../PdfViewer";
import Link from "next/link";
import {
  htmlToPdfBlob,
  htmlToPdfBlobForQuotation,
} from "@/lib/htmlToPdfConvertion";
import { toast } from "sonner";
// Adjust import path as needed

export function FinalStep() {
  const { formData } = useProjectFormStore();
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [showQuotationPreview, setShowQuotationPreview] = useState(false);
  // console.log(formData);
  // Determine which documentation URL to use
  const documentationUrl = formData.cloudinaryDocumentationUrl;
  const quotationUrl = formData.cloudinaryQuotationUrl;

  const downloadFromUrl = async (url: string, fileName: string) => {
    try {
      // Fetch the file as a blob
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch file: ${response.status} ${response.statusText}`
        );
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const blobUrl = URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);

      // Trigger the download
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(
        `Failed to download file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Function to handle documentation download and view
  const handleDocumentationDownloadAndView = async () => {
    // First show the preview dialog
    setShowDocPreview(true);

    // Then handle the download
    try {
      // First priority: Use Cloudinary URL if available
      if (documentationUrl) {
        const fileName = `${
          formData.projectName || "project"
        }_documentation.pdf`;
        await downloadFromUrl(documentationUrl, fileName);
        return;
      }

      // Second priority: Generate PDF from HTML content
      let content = "";

      if (formData.improvedDocumentation) {
        content = formData.improvedDocumentation;
      } else if (formData.generatedDocumentation) {
        content = formData.generatedDocumentation;
      } else {
        toast.error("No documentation content available to download");
        return;
      }

      // Convert HTML to PDF blob
      const pdfBlob = await htmlToPdfBlob(content);

      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${formData.projectName || "project"}_documentation.pdf`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading documentation:", error);
      toast.error("Failed to download documentation");
    }
  };

  // Function to handle quotation download and view
  const handleQuotationDownloadAndView = async () => {
    // First show the preview dialog
    setShowQuotationPreview(true);

    // Then handle the download
    try {
      // First priority: Use Cloudinary URL if available
      if (quotationUrl) {
        const fileName = `${formData.projectName || "project"}_quotation.pdf`;
        await downloadFromUrl(quotationUrl, fileName);
        return;
      }

      // Second priority: Generate PDF from HTML content
      if (!formData.quotationPdf) {
        toast.error("No quotation content available to download");
        return;
      }

      // Convert HTML to PDF blob using the quotation-specific function
      const pdfBlob = await htmlToPdfBlobForQuotation(formData.quotationPdf);

      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${formData.projectName || "project"}_quotation.pdf`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading quotation:", error);
      toast.error("Failed to download quotation");
    }
  };

  return (
    <div className="space-y-8 text-center py-8">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Thank You for Your Submission!
        </h2>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
          We appreciate and have received your project details and requirements.
          Our team will review your submission and get back to you shortly.
        </p>
      </div>
      <Link href={"/client"}>
        <Button>Go to Dashboard</Button>
      </Link>

      <div className="space-y-4 pt-4">
        <h3 className="font-medium">Project Summary</h3>

        <div className="border rounded-md p-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Project Name</p>
              <p className="font-medium">{formData.projectName}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Development Areas</p>
              <p className="font-medium">
                {formData.developmentAreas.join(", ")}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Team Composition</p>
              <p className="font-medium">
                {formData.seniorDevelopers > 0 &&
                  `${formData.seniorDevelopers} Senior Developer${
                    formData.seniorDevelopers > 1 ? "s" : ""
                  }`}
                {formData.juniorDevelopers > 0 &&
                  `${formData.seniorDevelopers > 0 ? ", " : ""}${
                    formData.juniorDevelopers
                  } Junior Developer${
                    formData.juniorDevelopers > 1 ? "s" : ""
                  }`}
                {formData.uiUxDesigners > 0 &&
                  `${
                    formData.seniorDevelopers > 0 ||
                    formData.juniorDevelopers > 0
                      ? ", "
                      : ""
                  }${formData.uiUxDesigners} UI/UX Designer${
                    formData.uiUxDesigners > 1 ? "s" : ""
                  }`}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Documentation</p>
              <p className="font-medium">
                {formData.documentationFile
                  ? formData.improvedDocumentation
                    ? "AI-Improved Documentation"
                    : "Uploaded File"
                  : "Generated Documentation"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Project Overview</p>
            <p className="text-sm mt-1">{formData.projectOverview}</p>
          </div>
        </div>
      </div>
 
      <div className="flex flex-wrap justify-center gap-4 pt-4">
      {formData.hasExistingDesign && formData.designLink && (
        <div className="flex items-center">
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(formData.designLink || "", "_blank")}
          >
         <LINK className="w-5 h-5 text-blue-500 mr-2 " />   View Design
          </Button>
        </div>
      )}
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleQuotationDownloadAndView}
        >
          <Download className="w-5 h-5 text-blue-500" />
          Download Quotation
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleDocumentationDownloadAndView}
        >
          <Download className="w-5 h-5 text-blue-500" />
          Download Documentation
        </Button>
      </div>

      {/* Documentation Preview Dialog */}
      <Dialog open={showDocPreview} onOpenChange={setShowDocPreview}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Documentation Preview</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-full p-4 border rounded-md">
            {formData.documentationFile &&
            formData.documentationFileContent &&
            !formData.improvedDocumentation ? (
              <PdfViewer
                fileUrl={formData.documentationFileContent}
                fileName={formData.documentationFile.name}
              />
            ) : formData.improvedDocumentation ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: formData.improvedDocumentation,
                }}
              />
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: formData.generatedDocumentation,
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quotation Preview Dialog */}
      <Dialog
        open={showQuotationPreview}
        onOpenChange={setShowQuotationPreview}
      >
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Quotation Preview</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto h-full p-4 border rounded-md">
            {formData.quotationPdf ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: formData.quotationPdf,
                }}
              />
            ) : (
              <div className="text-center p-8">
                <p>No quotation available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
