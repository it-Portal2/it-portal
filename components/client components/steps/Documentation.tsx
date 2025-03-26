"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileUp,
  FileText,
  RefreshCw,
  Wand2,
  Upload,
  Currency,
} from "lucide-react";
import { toast } from "sonner";
import { validatePdfFile } from "@/lib/PdfValidation";
import {
  uploadToCloudinary,
  uploadToCloudinaryForTextExtraction,
} from "@/lib/cloudinary";
import { Editor } from "../Editor";
import { useProjectFormStore } from "@/lib/store/projectSteps";
import { generateDeveloperDocumentationFromPdf } from "@/app/actions/upload-actions";
import {
  htmlToPdfBlob,
  htmlToPdfBlobForQuotation,
} from "@/lib/htmlToPdfConvertion";
import { generateDocumentationFromGeminiAI } from "@/lib/gemini";
// Import Firebase functions
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

export function Documentation() {
  const { formData, updateFormData, generateQuotation, nextStep } =
    useProjectFormStore();

  const [activeTab, setActiveTab] = useState("upload");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasImproved, setHasImproved] = useState(false);
  const [isStoringInFirebase, setIsStoringInFirebase] = useState(false);
  // Ref to track if we've already uploaded to Cloudinary
  const hasUploadedToCloudinary = useRef(false);
  // Ref to track if we've already stored in Firebase
  const hasStoredInFirebase = useRef(false);

  // Handle file change with proper validation
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0]) {
        return;
      }

      const file = e.target.files[0];

      try {
        // Validate the file using Zod schema
        const validation = validatePdfFile(file);
        if (!validation.success) {
          const errorMessage =
            validation.error || "Invalid file format or size";
          setFileError(errorMessage);
          toast.error("File Validation Failed", { description: errorMessage });
          return;
        }
        setFileError(null);
        setFileName(validation.data?.file.name || "");
        hasUploadedToCloudinary.current = false;
        hasStoredInFirebase.current = false;

        // Reset related form fields
        updateFormData({
          documentationFile: validation.data?.file,
          documentationFileContent: null,
          documentationFileText: null,
          improvedDocumentation: null,
          cloudinaryDocumentationUrl: null,
        });
      } catch (error) {
        console.error("Error processing file:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process file";
        setFileError(errorMessage);
        toast.error("File Processing Error", { description: errorMessage });
      }
    },
    [updateFormData]
  );

  // Generate documentation with proper error handling
  const improveDocumentation = useCallback(async () => {
    if (!formData.documentationFile || isImproving || hasImproved) return;

    setIsImproving(true);
    hasUploadedToCloudinary.current = false;
    hasStoredInFirebase.current = false;

    try {
      toast.info("Starting to improve your documentation...", {
        description: "Please wait while we process your PDF.",
      });

      const pdfUrl = await uploadToCloudinaryForTextExtraction(
        formData.documentationFile
      );

      if (!pdfUrl) {
        throw new Error("Failed to upload PDF to Cloudinary");
      }

      toast.info("PDF Uploaded Successfully", {
        description: "Your document is being enhanced with AI. Almost ready!",
      });

      const generatedImprovedDocumentation =
        await generateDeveloperDocumentationFromPdf(pdfUrl);

      if (!generatedImprovedDocumentation) {
        throw new Error("Failed to generate improved documentation");
      }

      const improved =
        generatedImprovedDocumentation.data?.improvedDocumentation;
      updateFormData({
        improvedDocumentation: improved,
      });

      // Set hasImproved to true after successful response
      setHasImproved(true);

      toast.success("Documentation Improved", {
        description: "Your documentation has been enhanced with AI.",
      });
    } catch (error) {
      console.error("Error improving documentation:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to improve documentation";

      setFileError(errorMessage);
      toast.error("Improvement Failed", { description: errorMessage });
    } finally {
      setIsImproving(false);
    }
  }, [formData.documentationFile, isImproving, hasImproved, updateFormData]);

  const generateDocumentation = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    hasUploadedToCloudinary.current = false;
    hasStoredInFirebase.current = false;

    try {
      if (!formData.projectName || !formData.projectOverview) {
        throw new Error("Project name and overview are required");
      }

      toast.info("Starting to generate your documentation...", {
        description: "Please wait while we process your project details.",
      });

      const generatedDoc = await generateDocumentationFromGeminiAI(
        formData.projectName,
        formData.projectOverview,
        formData.developmentAreas || []
      );

      updateFormData({
        generatedDocumentation: generatedDoc,
        cloudinaryDocumentationUrl: null,
      });

      toast.success("Documentation Generated", {
        description: "Your documentation has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating documentation:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate documentation";
      toast.error("Generation Failed", { description: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  }, [
    formData.projectName,
    formData.projectOverview,
    formData.developmentAreas,
    isGenerating,
    updateFormData,
  ]);

  // Handle editor content changes
  const handleEditorChange = useCallback(
    (value: string) => {
      updateFormData({ generatedDocumentation: value });
      hasUploadedToCloudinary.current = false;
      hasStoredInFirebase.current = false;
    },
    [updateFormData]
  );

  const handleImprovedEditorChange = useCallback(
    (value: string) => {
      updateFormData({ improvedDocumentation: value });
      hasUploadedToCloudinary.current = false;
      hasStoredInFirebase.current = false;
    },
    [updateFormData]
  );

  // Prepare PDF for upload based on available content
  const preparePdfForUpload = useCallback(async () => {
    if (formData.improvedDocumentation) {
      const pdfBlob = await htmlToPdfBlob(formData.improvedDocumentation);
      const pdfFileName = `${
        formData.projectName || "document"
      }-improved-documentation.pdf`;
      return new File([pdfBlob], pdfFileName, { type: "application/pdf" });
    }

    if (formData.generatedDocumentation) {
      const pdfBlob = await htmlToPdfBlob(formData.generatedDocumentation);
      const pdfFileName = `${
        formData.projectName || "document"
      }-documentation.pdf`;
      return new File([pdfBlob], pdfFileName, { type: "application/pdf" });
    }

    if (formData.documentationFile) {
      return formData.documentationFile;
    }

    return null;
  }, [
    formData.improvedDocumentation,
    formData.generatedDocumentation,
    formData.documentationFile,
    formData.projectName,
  ]);

  // Store project data in Firebase
  const storeInFirebase = useCallback(
    async (DocumentationUrl: string | null, QuotationUrl: string | null) => {
      if (hasStoredInFirebase.current) return true;

      setIsStoringInFirebase(true);
      const storeToastId = toast.loading("Saving project data...");

      try {
        const currentTimestamp = new Date().toISOString();
        // Prepare project data for storage
        const projectData = {
          projectName: formData.projectName || "",
          projectOverview: formData.projectOverview || "",
          clientName: formData.clientName || "",
          clientEmail: formData.clientEmail || "",
          clientPhoneNumber: formData.clientPhoneNumber || "",
          cloudinaryDocumentationUrl: DocumentationUrl || "",
          cloudinaryQuotationUrl: QuotationUrl || "",
          projectBudget: formData.projectBudget || 0,
          currency: formData.currency || "",
          startDate: "",
          endDate: "",
          rejectedDate: "",
          deadline: "",
          finalCost: 0,
          rejectionReason: "",
          status: "pending",
          progress: 0,
          submittedAt: currentTimestamp,
          progressType: null, // Initially null until user chooses
          isCompleted: false,
        };

        // Add document to 'projects' collection
        const docRef = await addDoc(collection(db, "Projects"), projectData);

        toast.dismiss(storeToastId);
        toast.success("Project Saved", {
          description:
            "Your project has been successfully saved to our system!",
        });

        hasStoredInFirebase.current = true;
        return true;
      } catch (error) {
        console.error("Error storing project in Firebase:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to save project data";

        toast.dismiss(storeToastId);
        toast.error("Save Failed", { description: errorMessage });
        return false;
      } finally {
        setIsStoringInFirebase(false);
      }
    },
    [
      formData.projectName,
      formData.projectOverview,
      formData.clientName,
      formData.clientEmail,
      formData.clientPhoneNumber,
      formData.cloudinaryDocumentationUrl,
      formData.cloudinaryQuotationUrl,
      formData.projectBudget,
    ]
  );

  // Handle submission with proper error handling
  const handleSubmit = useCallback(async () => {
    // Check if we've already processed everything
    if (hasUploadedToCloudinary.current && hasStoredInFirebase.current) {
      nextStep();
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload step - if not already done
      let uploadUrl = null;
      let quotationUrl = null;
      if (!hasUploadedToCloudinary.current) {
        // toast.loading("Uploading documentation...", {
        //   description: "Please wait while we securely store your files.",
        // });

        // Prepare PDF for upload
        const pdfToUpload = await preparePdfForUpload();

        if (!pdfToUpload) {
          throw new Error(
            "No documentation to upload. Please upload a PDF or generate documentation first."
          );
        }

        // Upload the PDF to Cloudinary with progress tracking
        uploadUrl = await uploadToCloudinary(pdfToUpload, (progress) => {
          setUploadProgress(Math.round(progress));
          // Update progress toast for major milestones
          if (progress === 25 || progress === 50 || progress === 75) {
            toast.info(`Upload Progress: ${Math.round(progress)}%`, {
              description:
                "Please wait while we continue uploading your files.",
            });
          }
        });

        if (!uploadUrl) {
          throw new Error("Upload to Cloudinary failed");
        }

        // Update form data with Cloudinary URL
        updateFormData({ cloudinaryDocumentationUrl: uploadUrl });
        hasUploadedToCloudinary.current = true;

        // Upload quotation PDF if it exists
        if (formData.quotationPdf) {
          try {
            const quotationBlob = await htmlToPdfBlobForQuotation(
              formData.quotationPdf
            );
            const quotationFile = new File(
              [quotationBlob],
              `${formData.projectName || "project"}-quotation.pdf`,
              { type: "application/pdf" }
            );

            quotationUrl = await uploadToCloudinary(quotationFile);

            if (quotationUrl) {
              updateFormData({ cloudinaryQuotationUrl: quotationUrl });
            }
          } catch (quotationError) {
            console.error("Error uploading quotation PDF:", quotationError);
            // Continue with main flow even if quotation upload fails
            toast.warning("Quotation Upload Warning", {
              description:
                "Quotation upload failed, but documentation was uploaded successfully.",
            });
          }
        }

        toast.success("Files Uploaded", {
          description: "Your documentation has been uploaded successfully.",
        });
      }

      // Firebase storage step - if not already done
      if (!hasStoredInFirebase.current) {
        const firebaseSuccess = await storeInFirebase(uploadUrl, quotationUrl);
        if (!firebaseSuccess) {
          throw new Error("Failed to store project data in database");
        }
      }

      // Move to the next step
      nextStep();
    } catch (error) {
      console.error("Error handling submission:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.";
      toast.error("Submission Failed", { description: errorMessage });
    } finally {
      setIsUploading(false);
    }
  }, [
    nextStep,
    preparePdfForUpload,
    updateFormData,
    formData.quotationPdf,
    formData.projectName,
    storeInFirebase,
  ]);

  // Determine if the submit button should be disabled
  const isSubmitDisabled =
    isUploading ||
    isStoringInFirebase ||
    (!formData.documentationFile &&
      !formData.generatedDocumentation &&
      !formData.improvedDocumentation);

  // Get the appropriate submit button text
  const getSubmitButtonText = () => {
    if (isUploading) {
      return `Uploading... ${uploadProgress}%`;
    }
    if (isStoringInFirebase) {
      return "Saving project...";
    }
    return hasUploadedToCloudinary.current && hasStoredInFirebase.current
      ? "Proceed to Next Step"
      : "Submit Project";
  };

  // Generate quotation when reaching this step
  useEffect(() => {
    // Generate quotation only once when component mounts
    if (!formData.quotationPdf) {
      generateQuotation();
    }
  }, [generateQuotation, formData.quotationPdf]); // Added proper dependencies
  console.log("documentation", formData);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Step 3/4</p>
        <h2 className="sm:text-2xl font-bold text-foreground">
          Share Your Documentation
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-col sm:grid sm:grid-cols-2 w-full h-[20]">
          <TabsTrigger value="upload" className="flex-1">
            Upload Document
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex-1">
            Generate Document
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 pt-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileUp className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium">Upload your requirements document</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Only PDF files are supported (up to 10MB)
            </p>

            <div className="flex justify-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <Label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                <FileUp className="h-4 w-4" />
                {fileName ? fileName : "Select PDF File"}
              </Label>
            </div>

            {fileError && (
              <p className="text-sm text-destructive mt-2">{fileError}</p>
            )}
          </div>

          {formData.documentationFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{fileName}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={improveDocumentation}
                    disabled={isImproving || hasImproved} // Disable if improving or already improved
                  >
                    {isImproving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Improving...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        {hasImproved ? "Improved with AI" : "Improve with AI"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {formData.improvedDocumentation && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">AI-Improved Documentation</h3>
                  </div>

                  <div className="border rounded-md h-64 overflow-y-auto">
                    <Editor
                      value={formData.improvedDocumentation}
                      onChange={handleImprovedEditorChange}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4 pt-4">
          {!formData.generatedDocumentation && !isGenerating && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-medium">Generate Developer Documentation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We'll create detailed documentation based on your project
                details
              </p>

              <Button onClick={generateDocumentation}>Generate Now</Button>
            </div>
          )}

          {isGenerating && (
            <div className="border rounded-lg p-8 text-center">
              <RefreshCw className="mx-auto h-10 w-10 text-primary mb-4 animate-spin" />
              <h3 className="font-medium">Generating Documentation...</h3>
              <p className="text-sm text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          )}

          {formData.generatedDocumentation && !isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Generated Documentation</h3>
              </div>

              <div className="border rounded-md h-64 overflow-y-auto">
                <Editor
                  value={formData.generatedDocumentation}
                  onChange={handleEditorChange}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit button with upload status */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              {getSubmitButtonText()}
            </>
          ) : isStoringInFirebase ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              {getSubmitButtonText()}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {getSubmitButtonText()}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
