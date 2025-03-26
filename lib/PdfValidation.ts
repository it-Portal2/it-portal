import { z } from "zod";
import { toast } from "sonner";

// Convert 10MB to bytes for size validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Zod schema for PDF file validation
export const pdfFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.type === "application/pdf", {
      message: "Only PDF files are supported",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "File size must be less than 10MB",
    }),
});

// Enhanced validation function with toast notifications
export const validatePdfFile = (file: File) => {
  try {
    const result = pdfFileSchema.parse({ file });
    toast.success("File validated successfully", {
      description: `"${file.name}" is ready to be uploaded`,
      duration: 3000,
    });
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0].message;
      toast.error("File validation failed", {
        description: errorMessage,
        duration: 4000,
      });
      return { success: false, error: errorMessage };
    }
    toast.error("Validation Error", {
      description: "An unknown error occurred while validating the file",
      duration: 4000,
    });
    return { success: false, error: "An unknown error occurred" };
  }
};