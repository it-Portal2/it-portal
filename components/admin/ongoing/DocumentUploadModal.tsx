// components/modals/DocumentUploadModal.tsx
"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, FileText, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";

import { DocumentType, ProjectDocument } from "@/lib/types";
import { addProjectDocumentsAction } from "@/app/actions/admin-actions";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  documentType: DocumentType;
  onDocumentsAdded: () => void;
}

interface PendingDocument {
  file: File;
  fileName: string;
  uploadProgress: number;
  cloudinaryUrl?: string;
  isUploading: boolean;
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  projectId,
  documentType,
  onDocumentsAdded,
}: DocumentUploadModalProps) {
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newDocuments: PendingDocument[] = Array.from(files).map((file) => ({
      file,
      fileName: file.name,
      uploadProgress: 0,
      isUploading: false,
    }));

    setPendingDocuments((prev) => [...prev, ...newDocuments]);
    event.target.value = ""; // Reset input
  };

  const removeDocument = (index: number) => {
    setPendingDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileName = (index: number, newName: string) => {
    setPendingDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, fileName: newName } : doc))
    );
  };

  const uploadDocument = async (index: number) => {
    const document = pendingDocuments[index];
    if (!document || document.isUploading) return;

    try {
      setPendingDocuments((prev) =>
        prev.map((doc, i) => (i === index ? { ...doc, isUploading: true } : doc))
      );

      const cloudinaryUrl = await uploadToCloudinary(
        document.file,
        (progress) => {
          setPendingDocuments((prev) =>
            prev.map((doc, i) =>
              i === index ? { ...doc, uploadProgress: progress } : doc
            )
          );
        }
      );

      setPendingDocuments((prev) =>
        prev.map((doc, i) =>
          i === index
            ? { ...doc, cloudinaryUrl, isUploading: false, uploadProgress: 100 }
            : doc
        )
      );

      toast.success(`${document.fileName} uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${document.fileName}`);
      setPendingDocuments((prev) =>
        prev.map((doc, i) => (i === index ? { ...doc, isUploading: false } : doc))
      );
    }
  };

  const uploadAllDocuments = async () => {
    const documentsToUpload = pendingDocuments.filter(
      (doc) => !doc.cloudinaryUrl && !doc.isUploading
    );

    const uploadPromises = documentsToUpload.map((_, index) => {
      const actualIndex = pendingDocuments.findIndex(
        (doc) => !doc.cloudinaryUrl && !doc.isUploading
      );
      return uploadDocument(actualIndex);
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // First, upload any remaining documents
      await uploadAllDocuments();

      // Wait a moment for state to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get updated documents
      const documentsToAdd = pendingDocuments
        .filter((doc) => doc.cloudinaryUrl)
        .map((doc) => ({
          fileName: doc.fileName,
          cloudinaryUrl: doc.cloudinaryUrl!,
        }));

      if (documentsToAdd.length === 0) {
        toast.error("Please upload at least one document");
        return;
      }

      const result = await addProjectDocumentsAction(
        projectId,
        documentType,
        documentsToAdd
      );

      if (result.success) {
        toast.success(
          `Successfully added ${documentsToAdd.length} ${documentType} document(s)`
        );
        setPendingDocuments([]);
        onDocumentsAdded();
        onClose();
      } else {
        toast.error(result.error || "Failed to add documents");
      }
    } catch (error) {
      console.error("Error submitting documents:", error);
      toast.error("Failed to add documents");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = pendingDocuments.some((doc) => doc.cloudinaryUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Add {documentType === "quotation" ? "Quotation" : "Developer"} Documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <div>
            <Label htmlFor="document-upload" className="text-sm font-medium">
              Select Documents (PDF, DOC, DOCX, etc.)
            </Label>
            <div className="mt-2">
              <Input
                id="document-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          </div>

          {/* Pending Documents List */}
          {pendingDocuments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Documents to Upload</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={uploadAllDocuments}
                  disabled={pendingDocuments.every((doc) => doc.cloudinaryUrl)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload All
                </Button>
              </div>

              <div className="space-y-3">
                {pendingDocuments.map((document, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <Input
                          value={document.fileName}
                          onChange={(e) => updateFileName(index, e.target.value)}
                          className="flex-1"
                          disabled={document.isUploading}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {!document.cloudinaryUrl && !document.isUploading && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => uploadDocument(index)}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          disabled={document.isUploading}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {document.isUploading && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{document.uploadProgress}%</span>
                        </div>
                        <Progress value={document.uploadProgress} className="h-2" />
                      </div>
                    )}

                    {/* Upload Status */}
                    {document.cloudinaryUrl && (
                      <div className="text-sm text-green-600 font-medium">
                        ✓ Uploaded successfully
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Adding Documents..." : "Add Documents"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
