import { Check } from "lucide-react";

interface StepsProgressProps {
  currentStep: number;
}

export function StepsProgress({ currentStep }: StepsProgressProps) {
  const steps = [
    { id: 1, name: "Project Details" },
    { id: 2, name: "Development Preferences" },
    { id: 3, name: "Documentation" },
    { id: 4, name: "Finish" },
  ];

  const getStepStatus = (stepId: number) => {
    if (currentStep > stepId) return "completed";
    if (currentStep === stepId) return "in-progress";
    return "pending";
  };

  return (
    <div className="mb-8 sm:ml-12 md:ml-20 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 shrink-0 transition-colors ${
                  status === "completed"
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : status === "in-progress"
                    ? "bg-white border-blue-500 text-blue-500"
                    : "bg-sky-200 border-sky-200 text-white"
                }`}
              >
                {status === "completed" ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ) : status === "in-progress" ? (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full bg-blue-500" />
                ) : (
                  <span className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" />
                )}
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 mx-1 sm:mx-2">
                  <div className="h-1 flex">
                    <div
                      className={`flex-1 ${
                        status === "completed" ? "bg-emerald-500" : "bg-sky-100"
                      }`}
                    />
                    <div
                      className={`flex-1 ${
                        status === "completed" &&
                        getStepStatus(step.id + 1) === "in-progress"
                          ? "bg-blue-500"
                          : status === "completed" &&
                            getStepStatus(step.id + 1) === "completed"
                          ? "bg-emerald-500"
                          : "bg-sky-100"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2 sm:mt-3 text-sm">
        {steps.map((step) => {
          const status = getStepStatus(step.id);

          return (
            <div key={`label-${step.id}`} className="w-full px-1">
              <div className="text-gray-500 text-[1.4vw] sm:text-xs mb-1">
                STEP {step.id}
              </div>
              <div className="font-medium text-gray-800 line-clamp-2 text-[2vw] sm:text-sm uppercase">
                {step.name}
              </div>
              <div
                className={`text-[1.6vw] sm:text-xs ${
                  status === "completed"
                    ? "text-emerald-500"
                    : status === "in-progress"
                    ? "text-blue-500"
                    : "text-gray-400"
                }`}
              >
                {status === "completed"
                  ? "Completed"
                  : status === "in-progress"
                  ? "In Progress"
                  : "Pending"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
