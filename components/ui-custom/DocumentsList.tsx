// components/project/DocumentsList.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Trash2, Plus } from "lucide-react";
import { ProjectDocument, DocumentType } from "@/lib/types";
import { toast } from "sonner";
import { removeProjectDocumentAction } from "@/app/actions/admin-actions";
import { useAuthStore } from "@/lib/store/userStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DocumentsListProps {
  documents: ProjectDocument[];
  documentType: DocumentType;
  projectId: string;
  onDocumentRemoved: () => void;
  onAddDocuments: () => void;
}

export default function DocumentsList({
  documents,
  documentType,
  projectId,
  onDocumentRemoved,
  onAddDocuments,
}: DocumentsListProps) {
  const { profile } = useAuthStore();
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    documentId: string;
    fileName: string;
  }>({
    isOpen: false,
    documentId: "",
    fileName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user has admin privileges
  const canManageDocuments = profile?.role === "admin" || profile?.role === "subadmin";

  const handleDeleteClick = (documentId: string, fileName: string) => {
    setDeleteModal({
      isOpen: true,
      documentId,
      fileName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.documentId) return;

    try {
      setIsDeleting(true);
      const result = await removeProjectDocumentAction(
        projectId,
        documentType,
        deleteModal.documentId
      );

      if (result.success) {
        toast.success(`Removed "${deleteModal.fileName}" successfully`);
        onDocumentRemoved();
        setDeleteModal({ isOpen: false, documentId: "", fileName: "" });
      } else {
        toast.error(result.error || "Failed to remove document");
      }
    } catch (error) {
      console.error("Error removing document:", error);
      toast.error("Failed to remove document");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, documentId: "", fileName: "" });
    }
  };

  const title = documentType === "quotation" ? "Quotation Documents" : "Developer Documents";

  return (
    <>
      <Card className="glassmorphism shadow-sm border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            {canManageDocuments && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddDocuments}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Documents
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{document.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {document.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={document.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>
                    </Button>
                    {canManageDocuments && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(document.id, document.fileName)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                No {documentType} documents uploaded yet
              </p>

            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        fileName={deleteModal.fileName}
        isDeleting={isDeleting}
      />
    </>
  );
}


interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-left">Delete Document</DialogTitle>
              <DialogDescription className="text-left">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently remove{" "}
            <span className="font-semibold text-foreground">"{fileName}"</span>?
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}