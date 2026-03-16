// src/stores/projectFormStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"; // Add persist middleware
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
  selectedBundles: any[]; // Changed from empty array to array of any
  designLink: string | null; // Added design link field
  hasExistingDesign: boolean; // Added flag to track if user has existing design
  documentationFile: File | null;
  documentationFileContent: string | null;
  documentationFileText: string | null;
  generatedDocumentation: string | null | any;
  improvedDocumentation: string | null;
  quotationPdf: string | null;
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  cloudinaryDocumentationUrl: string | null;
  cloudinaryQuotationUrl: string | null;
  currency: "INR" | "USD";
  projectBudget: number;
}

// Validation schemas remain the same
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
    developmentAreas: z.array(z.string()),
    seniorDevelopers: z.number(),
    juniorDevelopers: z.number(),
    uiUxDesigners: z.number(),
    selectedBundles: z.array(z.any()).optional(),
    hasExistingDesign: z.boolean().optional(),
    designLink: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      const hasBundles = data.selectedBundles && data.selectedBundles.length > 0;
      if (hasBundles) return true;
      return data.developmentAreas.length > 0;
    },
    {
      message: "At least one development area is required",
      path: ["developmentAreas"],
    }
  )
  .refine(
    (data) => {
      const hasBundles = data.selectedBundles && data.selectedBundles.length > 0;
      if (hasBundles) return true;
      return data.seniorDevelopers + data.juniorDevelopers + data.uiUxDesigners > 0;
    },
    {
      message: "At least one team member is required",
      path: ["teamMembers"],
    }
  )
  .refine(
    (data) => {
      // If user claims to have existing design but didn't provide a link
      if (data.hasExistingDesign && !data.designLink) {
        return false;
      }
      return true;
    },
    {
      message: "Please provide a design link",
      path: ["designLink"],
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

interface ProjectFormStore {
  step: number;
  formData: ProjectFormData;
  validationErrors: Record<string, string>;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<ProjectFormData>) => void;
  validateCurrentStep: () => Promise<boolean>;
  generateQuotation: () => void;
  resetForm: () => void;
  syncUserData: () => void;
  resetCurrentStepData: () => void; // New action to reset current step data
}

const defaultFormData: ProjectFormData = {
  projectName: "",
  projectOverview: "",
  developmentAreas: [],
  seniorDevelopers: 0,
  juniorDevelopers: 0,
  uiUxDesigners: 0,
  selectedBundles: [],
  designLink: null, // Added default value
  hasExistingDesign: false, // Added default value
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

export const useProjectFormStore = create<ProjectFormStore>()(
  persist(
    (set, get) => ({
      step: 1,
      formData: { ...defaultFormData },
      validationErrors: {},

      nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),

      prevStep: () => {
        const currentStep = get().step;
        get().resetCurrentStepData(); // Reset current step data before going back
        set((state) => ({ step: Math.max(state.step - 1, 1) }));
      },

      updateFormData: (data) =>
        set((state) => {
          const newFormData = { ...state.formData, ...data };
          if (data.developmentAreas) {
            const count = data.developmentAreas.length;
            const cycle = Math.floor(count / 3);
            const remainder = count % 3;
            let senior = cycle;
            let junior = cycle;
            let designer = cycle;
            if (remainder === 1) senior += 1;
            else if (remainder === 2) {
              senior += 1;
              junior += 1;
            }
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

          // If user adds UI/UX designer, reset hasExistingDesign flag
          if (data.uiUxDesigners && data.uiUxDesigners > 0) {
            newFormData.hasExistingDesign = false;
            newFormData.designLink = null;
          }

          // If user sets hasExistingDesign to false, clear design link
          if (data.hasExistingDesign === false) {
            newFormData.designLink = null;
          }

          // Invalidate quotation if pricing related fields change
          const pricingFields = ['developmentAreas', 'seniorDevelopers', 'juniorDevelopers', 'uiUxDesigners', 'selectedBundles', 'currency'];
          if (pricingFields.some(field => field in data)) {
            newFormData.quotationPdf = null;
          }

          return { formData: newFormData };
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
          if (step === 1) await projectDetailsSchema.parseAsync(formData);
          else if (step === 2)
            await developmentPreferencesSchema.parseAsync(formData);
          else if (step === 3) await documentationSchema.parseAsync(formData);
          set({ validationErrors: {} });
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            error.errors.forEach((err) => {
              if (err.path) errors[err.path.join(".")] = err.message;
            });
            set({ validationErrors: errors });
          }
          return false;
        }
      },

      generateQuotation: () => {
        const { formData } = get();

        // ─── Single source of truth: same rates as quotationUtils.ts ───
        const exchangeRate = 83;
        const GST_RATE = 0.18;
        const toRate = (inr: number) =>
          formData.currency === "INR"
            ? inr
            : Math.round((inr * 1.04) / exchangeRate);

        const seniorDevRate = toRate(75000);
        const juniorDevRate = toRate(30000);
        const uiUxRate = toRate(8000);
        const pmCost = toRate(50000);

        const hasBundles = formData.selectedBundles && formData.selectedBundles.length > 0;
        
        const seniorDevCost = hasBundles ? 0 : formData.seniorDevelopers * seniorDevRate;
        const juniorDevCost = hasBundles ? 0 : formData.juniorDevelopers * juniorDevRate;
        const uiUxCost = hasBundles ? 0 : formData.uiUxDesigners * uiUxRate;
        const pmCostFinal = hasBundles ? 0 : pmCost;

        // Calculate selected bundles cost
        let bundlesCost = 0;
        if (formData.selectedBundles && formData.selectedBundles.length > 0) {
          bundlesCost = formData.selectedBundles.reduce((acc, bundle) => {
            const numericPrice = Number(bundle.price.replace(/[^0-9.-]+/g, ""));
            return acc + (isNaN(numericPrice) ? 0 : numericPrice);
          }, 0);
        }

        const subtotal = seniorDevCost + juniorDevCost + uiUxCost + pmCostFinal + bundlesCost;
        const totalCost = subtotal + (formData.currency === "INR" ? Math.round(subtotal * GST_RATE) : 0);

        // Update budget first so downstream reads are correct
        get().updateFormData({ projectBudget: totalCost });

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
          selectedBundles: formData.selectedBundles,
          currency: formData.currency,
        };

        const quotationHtml = generateQuotationHtml(quotationData);
        get().updateFormData({ quotationPdf: quotationHtml });
      },

      resetForm: () =>
        set({
          step: 1,
          formData: { ...defaultFormData },
          validationErrors: {},
        }),

      resetCurrentStepData: () => {
        const { step, formData } = get();
        let newFormData = { ...formData };
        if (step === 1) {
          newFormData = {
            ...newFormData,
            projectName: "",
            projectOverview: "",
            currency: "INR",
          };
        } else if (step === 2) {
          newFormData = {
            ...newFormData,
            developmentAreas: [],
            seniorDevelopers: 0,
            juniorDevelopers: 0,
            uiUxDesigners: 0,
            selectedBundles: [],
            designLink: null,
            hasExistingDesign: false,
          };
        } else if (step === 3) {
          newFormData = {
            ...newFormData,
            documentationFile: null,
            documentationFileContent: null,
            documentationFileText: null,
            generatedDocumentation: "",
            improvedDocumentation: null,
            cloudinaryDocumentationUrl: null,
          };
        } else if (step === 4) {
          newFormData = {
            ...newFormData,
            quotationPdf: null,
            cloudinaryQuotationUrl: null,
          };
        }
        set({ formData: newFormData });
      },
    }),
    {
      name: "project-form-storage", // Key for sessionStorage
      storage: createJSONStorage(() => sessionStorage), // Changed from localStorage to sessionStorage
      partialize: (state) => ({
        step: state.step,
        formData: state.formData,
        validationErrors: state.validationErrors,
      }), // Persist only these fields
    }
  )
);