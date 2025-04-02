import { create } from "zustand";
import { persist } from "zustand/middleware"; // Add this import
import { z } from "zod";
import { useAuthStore } from "./userStore";
import { generateQuotationHtml, QuotationData } from "../quotationUtils";

export interface ProjectFormData {
  projectName: string;
  projectOverview: string;
  developmentAreas: string[];
  seniorDevelopers: number;
  juniorDevelopers: number;
  uiUxDesigners: number;
  documentationFile: File | null;
  documentationFileContent: string | null;
  documentationFileText: string | null;
  generatedDocumentation: string | null | any;
  improvedDocumentation: string | null;
  quotationPdf: string | null;
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  // Cloudinary URLs
  cloudinaryDocumentationUrl: string | null;
  cloudinaryQuotationUrl: string | null;
  // Add currency field
  currency: "INR" | "USD";
  projectBudget: number;
}

// Define validation schemas for each step
const projectDetailsSchema = z.object({
  projectName: z
    .string()
    .min(10, "Project name must be at least 10 characters"),
  projectOverview: z
    .string()
    .min(100, "Project overview must be at least 100 characters"),
  clientName: z.string().min(3, "Client name must be at least 3 characters"),
  clientEmail: z.string().email("Please enter a valid email address"),
  clientPhoneNumber: z.string().min(10, "Please enter a valid phone number"),
});

const developmentPreferencesSchema = z
  .object({
    developmentAreas: z
      .array(z.string())
      .min(1, "At least one development area is required"),
    seniorDevelopers: z.number(),
    juniorDevelopers: z.number(),
    uiUxDesigners: z.number(),
  })
  .refine(
    (data) =>
      data.seniorDevelopers + data.juniorDevelopers + data.uiUxDesigners > 0,
    {
      message: "At least one team member is required",
      path: ["teamMembers"],
    }
  );

const documentationSchema = z
  .object({
    documentationFile: z.any().optional(),
    documentationFileContent: z.string().nullable(),
    documentationFileText: z.string().nullable(),
    generatedDocumentation: z.string().optional(),
    improvedDocumentation: z.string().nullable(),
    cloudinaryDocumentationUrl: z.string().nullable().optional(),
  })
  .refine(
    (data) =>
      data.documentationFile !== null ||
      data.generatedDocumentation !== "" ||
      data.improvedDocumentation !== null ||
      data.cloudinaryDocumentationUrl !== null,
    {
      message: "Either upload a file or generate documentation",
      path: ["documentation"],
    }
  );

// Define the store type
interface ProjectFormStore {
  // State
  step: number;
  formData: ProjectFormData;
  validationErrors: Record<string, string>;

  // Actions
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<ProjectFormData>) => void;
  validateCurrentStep: () => Promise<boolean>;
  generateQuotation: () => void;
  resetForm: () => void;
  syncUserData: () => void;
  clearValidationErrors: () => void; // New function to clear validation errors
  setStep: (step: number) => void; // New function to directly set the step
}

// Default form data without user info
const defaultFormData: ProjectFormData = {
  projectName: "",
  projectOverview: "",
  developmentAreas: [],
  seniorDevelopers: 0,
  juniorDevelopers: 0,
  uiUxDesigners: 0,
  documentationFile: null,
  documentationFileContent: null,
  documentationFileText: null,
  generatedDocumentation: "",
  improvedDocumentation: null,
  quotationPdf: null,
  clientName: "",
  clientEmail: "",
  clientPhoneNumber: "",
  cloudinaryDocumentationUrl: null,
  cloudinaryQuotationUrl: null,
  currency: "INR",
  projectBudget: 0,
};

// Create the Zustand store with persistence
export const useProjectFormStore = create<ProjectFormStore>()(
  persist(
    (set, get) => ({
      // Initial state
      step: 1,
      formData: { ...defaultFormData },
      validationErrors: {},

      // Actions
      nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),

      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
      
      // Directly set step
      setStep: (step) => set({ step }),

      // Clear validation errors
      clearValidationErrors: () => set({ validationErrors: {} }),

      updateFormData: (data) =>
        set((state) => {
          const newFormData = { ...state.formData, ...data };

          // Automatically assign developers based on development areas count
          if (data.developmentAreas) {
            const count = data.developmentAreas.length;
            const cycle = Math.floor(count / 3); // Complete cycles of 3
            const remainder = count % 3; // Remaining areas after complete cycles

            // Base values from complete cycles
            const baseSenior = cycle;
            const baseJunior = cycle;
            const baseDesigner = cycle;

            // Add remaining based on position in cycle
            let senior = baseSenior;
            let junior = baseJunior;
            let designer = baseDesigner;

            if (remainder === 1) {
              senior += 1;
            } else if (remainder === 2) {
              senior += 1;
              junior += 1;
            }

            // Only update if these values are greater than current manual selections
            newFormData.seniorDevelopers = Math.max(
              state.formData.seniorDevelopers,
              senior
            );
            newFormData.juniorDevelopers = Math.max(
              state.formData.juniorDevelopers,
              junior
            );
            newFormData.uiUxDesigners = Math.max(
              state.formData.uiUxDesigners,
              designer
            );
          }

          // Clear validationErrors for the fields being updated
          const clearedErrors = { ...state.validationErrors };
          Object.keys(data).forEach((key) => {
            delete clearedErrors[key];
          });

          return {
            formData: newFormData,
            validationErrors: clearedErrors,
          };
        }),

      syncUserData: () => {
        const authState = useAuthStore.getState();
        const profile = authState.profile;

        if (profile) {
          set((state) => ({
            formData: {
              ...state.formData,
              clientName: profile.name || "",
              clientEmail: profile.email || "",
              clientPhoneNumber: profile.phone || "",
            },
          }));
        }
      },

      validateCurrentStep: async () => {
        const { step, formData } = get();
        
        try {
          if (step === 1) {
            await projectDetailsSchema.parseAsync({
              projectName: formData.projectName,
              projectOverview: formData.projectOverview,
              clientName: formData.clientName,
              clientEmail: formData.clientEmail,
              clientPhoneNumber: formData.clientPhoneNumber,
            });
          } else if (step === 2) {
            await developmentPreferencesSchema.parseAsync({
              developmentAreas: formData.developmentAreas,
              seniorDevelopers: formData.seniorDevelopers,
              juniorDevelopers: formData.juniorDevelopers,
              uiUxDesigners: formData.uiUxDesigners,
            });
          } else if (step === 3) {
            await documentationSchema.parseAsync({
              documentationFile: formData.documentationFile,
              documentationFileContent: formData.documentationFileContent,
              documentationFileText: formData.documentationFileText,
              generatedDocumentation: formData.generatedDocumentation,
              improvedDocumentation: formData.improvedDocumentation,
              cloudinaryDocumentationUrl: formData.cloudinaryDocumentationUrl,
            });
          }

          set({ validationErrors: {} });
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            error.errors.forEach((err) => {
              if (err.path) {
                errors[err.path.join(".")] = err.message;
              }
            });
            set({ validationErrors: errors });
          }
          return false;
        }
      },

      generateQuotation: () => {
        const { formData } = get();

        // Calculate rates based on selected currency
        const exchangeRate = 83; // 1 USD = ₹83

        // For INR, use base rates
        // For USD, add 4% to base INR value and then divide by exchange rate
        const seniorDevRate =
          formData.currency === "INR"
            ? 75000
            : Math.round((75000 + 0.04 * 75000) / exchangeRate); // ≈ $940

        const juniorDevRate =
          formData.currency === "INR"
            ? 30000
            : Math.round((30000 + 0.04 * 30000) / exchangeRate); // ≈ $376

        const uiUxRate =
          formData.currency === "INR"
            ? 8000
            : Math.round((8000 + 0.04 * 8000) / exchangeRate); // ≈ $100

        const projectManagementCost =
          formData.currency === "INR"
            ? 50000
            : Math.round((50000 + 0.04 * 50000) / exchangeRate); // ≈ $627

        // Calculate cost based on team composition with correct rates
        const seniorDevCost = formData.seniorDevelopers * seniorDevRate;
        const juniorDevCost = formData.juniorDevelopers * juniorDevRate;
        const uiUxCost = formData.uiUxDesigners * uiUxRate;
        const totalCost =
          seniorDevCost + juniorDevCost + uiUxCost + projectManagementCost;

        // Set the projectBudget value to totalCost
        get().updateFormData({ projectBudget: totalCost });

        // Create quotation data object
        const quotationData: QuotationData = {
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhoneNumber: formData.clientPhoneNumber,
          projectName: formData.projectName,
          projectOverview: formData.projectOverview,
          developmentAreas: formData.developmentAreas,
          seniorDevelopers: formData.seniorDevelopers,
          juniorDevelopers: formData.juniorDevelopers,
          uiUxDesigners: formData.uiUxDesigners,
          currency: formData.currency,
        };

        // Generate HTML for the quotation using our utility function
        const quotationHtml = generateQuotationHtml(quotationData);

        // Update the form data with the generated HTML
        get().updateFormData({ quotationPdf: quotationHtml });
      },

      resetForm: () =>
        set({
          step: 1,
          formData: { ...defaultFormData },
          validationErrors: {},
        }),
    }),
    {
      name: "project-form-storage", // unique name for localStorage
      partialize: (state) => {
        // Don't persist the file object as it can't be serialized properly
        const { formData, step, validationErrors } = state;
        const { documentationFile, ...restFormData } = formData;
        return { 
          formData: restFormData, 
          step, 
          validationErrors 
        };
      },
    }
  )
);