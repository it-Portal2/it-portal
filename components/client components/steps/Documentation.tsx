"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  FileUp,
  FileText,
  RefreshCw,
  Wand2,
  Upload,
  AlertCircle,
  CheckCircle,
  BookOpen,
  BrainCircuit,
  FileDigit,
  Sparkles,
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
import axios from "axios";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { cn } from "@/lib/utils";

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

  // Enhanced retry state management
  const [generationAttempts, setGenerationAttempts] = useState(0);
  const [maxGenerationAttempts] = useState(3);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);

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
          const errorMessage = validation.error || "Invalid file format or size";
          setFileError(errorMessage);
          toast.error("File validation failed", { 
            description: errorMessage,
            duration: 5000 
          });
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

        toast.success("File ready for processing", {
          description: `${file.name} is ready to be improved with AI`,
          duration: 3000
        });
      } catch (error) {
        console.error("Error processing file:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process file";
        setFileError(errorMessage);
        toast.error("File processing error", { 
          description: errorMessage,
          duration: 5000 
        });
      }
    },
    [updateFormData]
  );

  // Generate documentation with enhanced error handling and retry logic
  const improveDocumentation = useCallback(async () => {
    if (!formData.documentationFile || isImproving || hasImproved) return;

    setIsImproving(true);
    hasUploadedToCloudinary.current = false;
    hasStoredInFirebase.current = false;

    try {
      toast.info("Starting AI document improvement", {
        description: "Uploading and processing your PDF...",
        duration: 3000
      });

      const pdfUrl = await uploadToCloudinaryForTextExtraction(
        formData.documentationFile
      );

      if (!pdfUrl) {
        throw new Error("PDF upload failed - please try again");
      }

      toast.info("PDF uploaded successfully", {
        description: "AI is now enhancing your documentation...",
        duration: 3000
      });

      const generatedImprovedDocumentation =
        await generateDeveloperDocumentationFromPdf(pdfUrl);

      if (!generatedImprovedDocumentation) {
        throw new Error("AI enhancement failed - please retry");
      }

      const improved = generatedImprovedDocumentation.data?.improvedDocumentation;
      updateFormData({
        improvedDocumentation: improved,
      });

      // Set hasImproved to true after successful response
      setHasImproved(true);

      toast.success("Documentation improved successfully!", {
        description: "Your document has been enhanced with AI insights",
        duration: 4000
      });
    } catch (error) {
      console.error("Error improving documentation:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Document improvement failed - please try again";

      setFileError(errorMessage);
      toast.error("AI improvement failed", { 
        description: errorMessage,
        duration: 6000
      });
    } finally {
      setIsImproving(false);
    }
  }, [formData.documentationFile, isImproving, hasImproved, updateFormData]);

  // Enhanced generateDocumentation with retry logic
  const generateDocumentation = useCallback(
    async (isRetry: boolean = false) => {
      if (isGenerating) return;

      if (!isRetry) {
        setGenerationAttempts(1);
      }

      setIsGenerating(true);
      hasUploadedToCloudinary.current = false;
      hasStoredInFirebase.current = false;

      try {
        if (!formData.projectName || !formData.projectOverview) {
          throw new Error("Project name and overview are required for generation");
        }

        console.info(`[CLIENT] Starting documentation generation attempt ${generationAttempts}/${maxGenerationAttempts}`);

        toast.info("Generating documentation", {
          description: `AI is creating your project documentation... (Attempt ${generationAttempts}/${maxGenerationAttempts})`,
          duration: 3000
        });

        // Call the API route with enhanced timeout and error handling
        const response = await axios.post(
          "/api/client/create-project", 
          {
            projectName: formData.projectName,
            projectOverview: formData.projectOverview,
            developmentAreas: formData.developmentAreas || [],
          },
          {
            timeout: 25000, // 25 seconds client timeout
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || "Documentation generation failed");
        }

        const generatedDoc = response.data.documentation;

        updateFormData({
          generatedDocumentation: generatedDoc,
          cloudinaryDocumentationUrl: null,
        });

        toast.success("Documentation generated successfully!", {
          description: `Your project documentation is ready in ${response.data.processingTime || "unknown"}ms`,
          duration: 4000
        });

        // Reset attempt counter on success
        setGenerationAttempts(0);
        
      } catch (error) {
        console.error(`[CLIENT] Documentation generation attempt ${generationAttempts} failed:`, error);

        // Enhanced error classification for documentation generation
        let errorType = 'unknown';
        let errorMessage = 'Generation failed';
        let shouldRetry = generationAttempts < maxGenerationAttempts;
        let userFriendlyMessage = '';
        let retryDelay = 2000;

        if (axios.isAxiosError(error)) {
          const response = error.response;
          const data = response?.data;

          if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
            errorType = 'timeout';
            errorMessage = 'Request timed out';
            userFriendlyMessage = `Generation timed out (attempt ${generationAttempts}/${maxGenerationAttempts})`;
            retryDelay = 3000;
          } else if (response?.status === 408) {
            errorType = 'server_timeout';
            errorMessage = 'Server timeout';
            userFriendlyMessage = `Server timeout (attempt ${generationAttempts}/${maxGenerationAttempts})`;
            retryDelay = 2000;
          } else if (response?.status === 503) {
            errorType = 'service_unavailable';
            errorMessage = data?.message || 'AI service temporarily unavailable';
            userFriendlyMessage = `AI service overloaded (attempt ${generationAttempts}/${maxGenerationAttempts})`;
            retryDelay = 4000;
          } else if (response?.status === 400) {
            errorType = 'validation_error';
            errorMessage = data?.message || 'Invalid project details';
            userFriendlyMessage = errorMessage;
            shouldRetry = false; // Don't retry validation errors
          } else if (data?.message) {
            if (data.message.includes("**")) {
              errorType = 'service_configuration';
              errorMessage = data.message;
              userFriendlyMessage = data.message;
              shouldRetry = false; // Configuration errors need manual intervention
            } else {
              errorType = 'api_error';
              errorMessage = data.message;
              userFriendlyMessage = `${data.message} (attempt ${generationAttempts}/${maxGenerationAttempts})`;
            }
          }
        } else if (error instanceof Error) {
          if (error.message.includes('required')) {
            errorType = 'validation_error';
            errorMessage = error.message;
            userFriendlyMessage = error.message;
            shouldRetry = false;
          } else {
            errorType = 'unexpected_error';
            errorMessage = error.message;
            userFriendlyMessage = `Unexpected error: ${error.message}`;
          }
        }

        // Auto-retry logic for recoverable errors
        const autoRetryTypes = ['timeout', 'server_timeout', 'service_unavailable'];
        const shouldAutoRetry = shouldRetry && autoRetryTypes.includes(errorType);

        if (shouldAutoRetry) {
          setIsAutoRetrying(true);
          
          toast.error(`Generation attempt ${generationAttempts} failed`, {
            description: `${userFriendlyMessage}. Retrying automatically...`,
            duration: 3000,
          });

          setGenerationAttempts((prev) => prev + 1);

          setTimeout(() => {
            setIsAutoRetrying(false);
            generateDocumentation(true);
          }, retryDelay);

          return;
        }

        // Final failure or manual retry needed
        if (shouldRetry && !shouldAutoRetry) {
          toast.error("Documentation generation failed", {
            description: userFriendlyMessage,
            duration: 8000,
            action: {
              label: `Retry (${generationAttempts}/${maxGenerationAttempts})`,
              onClick: () => {
                setGenerationAttempts((prev) => prev + 1);
                generateDocumentation(true);
              },
            },
          });
        } else if (errorType === 'service_configuration' || errorType === 'validation_error') {
          toast.error("Configuration error", {
            description: userFriendlyMessage,
            duration: 10000,
          });
        } else {
          // All attempts exhausted
          toast.error("Generation failed - All attempts exhausted", {
            description: `${userFriendlyMessage}. Please check your project details and try again.`,
            duration: 12000,
            action: {
              label: "Reset & Try Again",
              onClick: () => {
                setGenerationAttempts(0);
                // Allow user to try again from beginning
              },
            },
          });
        }
      } finally {
        if (!isAutoRetrying) {
          setIsGenerating(false);
        }
      }
    },
    [
      formData.projectName,
      formData.projectOverview,
      formData.developmentAreas,
      isGenerating,
      updateFormData,
      generationAttempts,
      maxGenerationAttempts,
      isAutoRetrying
    ]
  );

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

  // Store project data in Firebase with enhanced error handling
  const storeInFirebase = useCallback(
    async (DocumentationUrl: string | null, QuotationUrl: string | null) => {
      if (hasStoredInFirebase.current) return true;

      setIsStoringInFirebase(true);
      const storeToastId = toast.loading("Saving project data...", {
        description: "Storing your project in our secure database"
      });

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
          hasExistingDesign: formData.hasExistingDesign,
          designLink: formData.designLink || "",
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
        toast.success("Project saved successfully!", {
          description: "Your project has been securely stored and is ready for review",
          duration: 4000
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
        toast.error("Save failed", { 
          description: errorMessage,
          duration: 6000
        });
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

  // Handle submission with enhanced error handling
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
        toast.info("Uploading documentation", {
          description: "Securely storing your files...",
          duration: 3000
        });

        // Prepare PDF for upload
        const pdfToUpload = await preparePdfForUpload();

        if (!pdfToUpload) {
          throw new Error(
            "No documentation available. Please upload a PDF or generate documentation first."
          );
        }

        // Upload the PDF to Cloudinary with progress tracking
        uploadUrl = await uploadToCloudinary(pdfToUpload, (progress) => {
          setUploadProgress(Math.round(progress));
          // Update progress for major milestones
          if (progress === 25 || progress === 50 || progress === 75) {
            toast.info(`Upload progress: ${Math.round(progress)}%`, {
              description: "Please wait while we upload your files",
              duration: 2000
            });
          }
        });

        if (!uploadUrl) {
          throw new Error("File upload failed - please try again");
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
              toast.success("Files uploaded successfully", {
                description: "Documentation and quotation uploaded",
                duration: 3000
              });
            }
          } catch (quotationError) {
            console.error("Error uploading quotation PDF:", quotationError);
            toast.warning("Quotation upload failed", {
              description: "Documentation uploaded successfully, but quotation failed",
              duration: 4000
            });
          }
        } else {
          toast.success("Documentation uploaded", {
            description: "Your files have been uploaded successfully",
            duration: 3000
          });
        }
      }

      // Firebase storage step - if not already done
      if (!hasStoredInFirebase.current) {
        const firebaseSuccess = await storeInFirebase(uploadUrl, quotationUrl);
        if (!firebaseSuccess) {
          throw new Error("Failed to store project data - please try again");
        }
      }

      // Move to the next step
      nextStep();
    } catch (error) {
      console.error("Error handling submission:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Submission failed - please try again";
      toast.error("Submission failed", { 
        description: errorMessage,
        duration: 8000
      });
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
  }, [generateQuotation, formData.quotationPdf]);

  console.log("documentation", formData);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Step 3/4</p>
        <h2 className="sm:text-2xl font-bold text-foreground">
          Upload existing documentation or generate new developer guides with AI
          assistance
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-1 sm:grid-cols-2 w-full h-auto p-1 bg-gradient-to-r from-indigo-100 to-pink-100 dark:from-indigo-950/40 dark:to-pink-950/40 rounded-lg">
          <TabsTrigger
            value="upload"
            className={cn(
              "flex items-center gap-2 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-300 rounded-md",
              activeTab === "upload" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <FileUp className="h-5 w-5" />
              <span className="font-medium">Upload Document</span>
            </motion.div>
          </TabsTrigger>
          <TabsTrigger
            value="generate"
            className={cn(
              "flex items-center gap-2 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-300 rounded-md",
              activeTab === "generate"
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <Wand2 className="h-5 w-5" />
              <span className="font-medium">Generate Document</span>
            </motion.div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6 pt-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="border-2 flex flex-col items-center justify-center border-dashed border-primary/20 hover:border-primary/40 transition-colors rounded-lg p-8 text-center bg-gradient-to-r from-violet-50/50 to-pink-50/50 dark:from-violet-950/20 dark:to-pink-950/20">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-16 h-16 flex items-center justify-center rounded-full bg-purple-100 mb-4 group-hover:bg-primary/20 transition-colors"
              >
                <FileUp className="h-8 w-8 text-purple-500" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">
                {fileName ? "Document Ready!" : "Upload Your Documentation"}
              </h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {fileName
                  ? "Your document is ready. You can now improve it with AI or submit directly."
                  : "Click to browse and upload your PDF file. We'll help enhance it with AI."}
              </p>

              <div className="flex justify-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white px-6 py-3 rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <FileUp className="h-5 w-5" />
                    {fileName ? fileName : "Select PDF File"}
                  </Label>
                </motion.div>
              </div>

              {fileError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-destructive mt-4 justify-center"
                >
                  <AlertCircle className="h-4 w-4" />
                  <p>{fileError}</p>
                </motion.div>
              )}
            </div>

            {formData.documentationFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6 mt-6"
              >
                <div className="flex flex-col md:flex-row items-center gap-3 md:gap-0 justify-between p-4 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="font-medium">{fileName}</span>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-md"
                      onClick={improveDocumentation}
                      disabled={isImproving || hasImproved}
                    >
                      {isImproving ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          Improving with AI...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-5 w-5" />
                          {hasImproved
                            ? "Improved with AI ✓"
                            : "Improve with AI"}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>

                {formData.improvedDocumentation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg flex items-center gap-2">
                        <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                          AI-Improved Documentation
                        </span>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </h3>
                    </div>

                    <div className="border rounded-md h-80 overflow-y-auto bg-muted/20 shadow-inner">
                      <Editor
                        value={formData.improvedDocumentation}
                        onChange={handleImprovedEditorChange}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4 pt-4">
          {!formData.generatedDocumentation && !isGenerating && (
            <div className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors rounded-lg p-8 text-center bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative p-0 rounded-xl overflow-hidden"
              >
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-purple-100 mb-4 group-hover:bg-primary/20 transition-colors"
                  >
                    <BrainCircuit className="h-8 w-8 text-purple-500" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">
                    Generate Developer Documentation
                  </h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Let our AI create comprehensive documentation based on your
                    project details. Perfect for technical specifications, API
                    docs, and development guidelines.
                  </p>

                  <div className="space-y-4 w-full max-w-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-xl border border-purple-500 transition-all duration-300 hover:shadow-md hover:border-purple-400 cursor-pointer">
                        <FileDigit className="h-6 w-6 text-purple-500 mb-2" />
                        <h4 className="font-medium text-purple-500">
                          Technical Specs
                        </h4>
                        <p className="text-xs">
                          Complete API and code documentation
                        </p>
                      </div>
                      <div className="p-6 rounded-xl border border-purple-500 transition-all duration-300 hover:shadow-md hover:border-purple-400 cursor-pointer">
                        <BookOpen className="h-6 w-6 text-purple-500 mb-2" />
                        <h4 className="font-medium text-purple-500">
                          Save Time
                        </h4>
                        <p className="text-xs ">
                          Generate in seconds instead of hours
                        </p>
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => generateDocumentation(false)}
                        className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-6 rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={isGenerating}
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        <span className="font-medium">
                          Generate Documentation
                        </span>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {isGenerating && (
            <div className="border rounded-lg p-8 text-center">
              <RefreshCw className="mx-auto h-10 w-10 text-primary mb-4 animate-spin" />
              <h3 className="font-medium">
                {isAutoRetrying 
                  ? `Retrying generation... (Attempt ${generationAttempts}/${maxGenerationAttempts})`
                  : "Generating Documentation..."
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                {isAutoRetrying
                  ? "Previous attempt failed, trying with backup systems..."
                  : "AI is creating comprehensive documentation for your project"
                }
              </p>
            </div>
          )}

          {formData.generatedDocumentation && !isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  Generated Documentation
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </h3>
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

      {/* Submit button with enhanced status display */}
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
