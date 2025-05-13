"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectFormStore } from "@/lib/store/projectSteps";
import { StepsProgress } from "./steps/StepsProgress";
import { ProjectDetails } from "./steps/ProjectDetails";
import { DevelopmentPreferences } from "./steps/DevelopmentPreferences";
import { Suggestions } from "./steps/Suggestions";
import { Documentation } from "./steps/Documentation";
import { FinalStep } from "./steps/FinalStep";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProjectSubmissionForm() {
  return <ProjectFormContent />;
}

function ProjectFormContent() {
  const { step, nextStep, prevStep, formData, validateCurrentStep, resetForm } =
    useProjectFormStore();
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Reset form when reaching step 4 and refreshing/navigating away
  useEffect(() => {
    if (step === 4) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        resetForm();
        e.preventDefault();
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [step, resetForm]);

  // Reset form when navigating away from the page
  useEffect(() => {
    return () => {
      if (step === 4) resetForm();
    };
  }, [step, resetForm]);

  // Updated handleNext function for ProjectFormContent component
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    const { validationErrors, formData, step } = useProjectFormStore.getState();

    if (!isValid) {
      // Create a more descriptive error message based on the current step and validation errors
      if (step === 1) {
        if (validationErrors.projectName) {
          toast.error("Project Name Error", {
            description: validationErrors.projectName,
          });
        } else if (validationErrors.projectOverview) {
          toast.error("Project Overview Error", {
            description: validationErrors.projectOverview,
          });
        } else if (validationErrors.clientName) {
          toast.error("Client Name Error", {
            description:
              "This client name isn't valid. Please update your profile details in Dashboard → Settings to ensure we have your correct information.",
          });
        } else if (validationErrors.clientEmail) {
          toast.error("Email Address Error", {
            description: validationErrors.clientEmail,
          });
        } else if (validationErrors.clientPhoneNumber) {
          toast.error("Phone Number Error", {
            description:
              "The phone number you provided isn't valid. Please go to Dashboard → Settings and update your profile with a valid phone number.",
          });
        } else {
          toast.error("Project Details Error", {
            description:
              "Please complete all required fields in the project details form.",
          });
        }
      } else if (step === 2) {
        if (validationErrors["developmentAreas"]) {
          toast.error("Development Areas Error", {
            description:
              "Please select at least one development area for your project.",
          });
        } else if (validationErrors["teamMembers"]) {
          toast.error("Team Composition Error", {
            description:
              "Your project needs at least one team member. Please add either developers or designers.",
          });
        } else if (validationErrors["designLink"]) {
          toast.error("Design Link Error", {
            description:
              "You indicated having an existing design but didn't provide a link. Please add a link to your design.",
          });
        } else {
          toast.error("Development Preferences Error", {
            description:
              "Please review your development preferences and ensure all required fields are completed.",
          });
        }
      } else if (step === 3) {
        if (validationErrors["documentation"]) {
          toast.error("Documentation Error", {
            description:
              "Please either upload a documentation file or generate documentation for your project.",
          });
        } else {
          toast.error("Documentation Error", {
            description:
              "There was an issue with your project documentation. Please review and try again.",
          });
        }
      }
      return;
    }

    if (step === 3) {
      if (!formData.cloudinaryDocumentationUrl) {
        toast.error("Upload Required", {
          description:
            "Please click the Submit button to upload your documentation before proceeding.",
        });
        return;
      }
    }

    if (step === 2) {
      const needsUiUx =
        formData.uiUxDesigners === 0 && !formData.hasExistingDesign;
      const needsSeniorDev = formData.seniorDevelopers === 0;
      const needsJuniorDev = formData.juniorDevelopers === 0;

      if (needsUiUx || needsSeniorDev || needsJuniorDev) {
        setShowSuggestions(true);
        return;
      }
    }

    nextStep();
    setShowSuggestions(false);
  };
  return (
    <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="w-full p-8">
          <StepsProgress currentStep={step} />

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectDetails />
              </motion.div>
            )}

            {step === 2 && !showSuggestions && (
              <motion.div
                key="step2"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DevelopmentPreferences />
              </motion.div>
            )}

            {step === 2 && showSuggestions && (
              <motion.div
                key="suggestions"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Suggestions
                  onContinue={() => {
                    nextStep();
                    setShowSuggestions(false);
                  }}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Documentation />
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <FinalStep />
              </motion.div>
            )}
          </AnimatePresence>

          {step < 4 && (
            <div className="flex justify-end gap-4 mt-8">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                suppressHydrationWarning={true}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
              >
                {"Next Step"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
