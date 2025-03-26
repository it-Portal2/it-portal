"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectFormStore } from "@/lib/store/projectSteps";
import { StepsProgress } from "./steps/StepsProgress";
import { ProjectDetails } from "./steps/ProjectDetails";
import { DevelopmentPreferences } from "./steps/DevelopmentPreferences";
import { Suggestions } from "./steps/Suggestions";
import { Documentation } from "./steps/Documentation";
import { FinalStep } from "./steps/FinalStep";
import { toast } from "sonner";

export function ProjectSubmissionForm() {
  return <ProjectFormContent />;
}

function ProjectFormContent() {
  const { step, nextStep, prevStep, formData, validateCurrentStep } =
    useProjectFormStore();
  // const { toast } = useToast();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleNext = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      toast.error("Validation Error", {
        description: "Please check the form for errors and try again.",
      });
      return;
    }

    // Check if we're on the documentation step and need to submit first
    if (step === 3) {
      // Check if documentation has been uploaded to Cloudinary
      if (!formData.cloudinaryDocumentationUrl) {
        toast.error("Upload Required", {
          description:
            "Please click the Submit button to upload your documentation before proceeding.",
        });
        return;
      }
    }

    // Show suggestions after step 2 if needed
    if (step === 2) {
      const needsUiUx =
        formData.developmentAreas.some(
          (area) =>
            area.toLowerCase().includes("web") ||
            area.toLowerCase().includes("mobile") ||
            area.toLowerCase().includes("app")
        ) && formData.uiUxDesigners === 0;

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
