"use client";
import type React from "react";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus, X, Info, Star, Sparkles, ArrowRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { plans, PlanBundle } from "@/lib/plan-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useProjectFormStore } from "@/lib/store/projectSteps";
import { useRouter } from "next/navigation";

interface DeveloperTypeSelectorProps {
  title: string;
  cost: string;
  tooltip: string;
  value: number;
  onChange: (value: number) => void;
  currency: string;
  showLeadDesignerBadge?: boolean;
  designerProfileLink?: string;
}

// Updated DeveloperTypeSelector component with lead designer badge
function DeveloperTypeSelector({
  title,
  cost,
  tooltip,
  value,
  onChange,
  currency,
  showLeadDesignerBadge = false,
  designerProfileLink = "#",
}: DeveloperTypeSelectorProps) {
  const displayCost =
    currency === "INR"
      ? cost
      : cost.replace("₹", "$").replace(/\d+,\d+/g, (match) => {
        const inrValue = Number.parseInt(match.replace(",", ""));
        const usdValue = Math.round((inrValue + 0.04 * inrValue) / 83);
        return usdValue.toLocaleString();
      });

  const handleLeadDesignerClick = () => {
    window.open(designerProfileLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-md">
      <div className="flex flex-col md:flex-row md:items-center">
        {/* Title + Cost */}
        <div>
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{displayCost}</p>
        </div>

        {/* Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="ml-0 mt-1 md:mt-0 md:ml-2">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Lead Designer Glowing Badge */}
        {showLeadDesignerBadge && (
          <div className="mt-2 md:mt-0 md:ml-3">
            <button
              onClick={handleLeadDesignerClick}
              className="invert hover:rotate-2 brightness-150 dark:brightness-100 group hover:shadow-lg hover:shadow-yellow-700/60 transition ease-in-out hover:scale-105 p-1 rounded-lg bg-gradient-to-br from-yellow-800 via-yellow-600 to-yellow-800 hover:from-yellow-700 hover:via-yellow-800 hover:to-yellow-600"
            >
              <div className="px-3 py-[2px] backdrop-blur-xl bg-black/80 rounded-sm font-medium text-xs w-full h-full">
                <div className="group-hover:scale-100 flex group-hover:text-yellow-500 text-yellow-600 gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                    className="w-4 h-4 stroke-yellow-600 group-hover:stroke-yellow-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                    />
                  </svg>
                  <span className="hidden sm:flex">Meet Our</span>Lead Designer
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="w-5 text-center">{value}</span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => onChange(value + 1)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function DevelopmentPreferences() {
  const { formData, updateFormData, validationErrors } = useProjectFormStore();
  const [newArea, setNewArea] = useState("");
  const [showDesignLinkDialog, setShowDesignLinkDialog] = useState(false);
  const isIndividualSelected =
    formData.seniorDevelopers > 0 ||
    formData.juniorDevelopers > 0 ||
    formData.uiUxDesigners > 0;
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [designLink, setDesignLink] = useState(formData.designLink || "");
  const [linkError, setLinkError] = useState("");
  const router = useRouter();

  const LEAD_DESIGNER_PROFILE_URL = "https://tithi-ui-ux-design.vercel.app";

  const addDevelopmentArea = () => {
    if (newArea.trim() && !formData.developmentAreas.includes(newArea.trim())) {
      updateFormData({
        developmentAreas: [...formData.developmentAreas, newArea.trim()],
      });
      setNewArea("");
    }
  };

  const removeDevelopmentArea = (area: string) => {
    updateFormData({
      developmentAreas: formData.developmentAreas.filter((a) => a !== area),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addDevelopmentArea();
    }
  };

  const handleDesignLinkSubmit = () => {
    if (!designLink.trim()) {
      setLinkError("Please provide a valid design link");
      return;
    }
    // Simple URL validation
    try {
      new URL(designLink);
      updateFormData({
        hasExistingDesign: true,
        designLink: designLink.trim(),
        uiUxDesigners: 0,
      });
      setShowDesignLinkDialog(false);
    } catch (e) {
      setLinkError("Please enter a valid URL including http:// or https://");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Step 2/4</p>
        <h2 className="sm:text-2xl font-bold text-foreground">
          Development Preferences and Team Size Selection
        </h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="developmentAreas">
            Development Areas
            <span className="ml-1 text-xs text-muted-foreground">
              (e.g., Web App, Mobile App, Dashboard, Landing Page)
            </span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="developmentAreas"
              placeholder="Add development area"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`placeholder:text-xs ${validationErrors.projectName ? "border-destructive" : ""
                }`}
            />
            <Button type="button" onClick={addDevelopmentArea} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {validationErrors.developmentAreas && (
            <p className="text-sm text-destructive">
              {validationErrors.developmentAreas}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.developmentAreas.map((area) => (
              <Badge key={area} variant="secondary" className="px-3 py-1">
                {area}
                <button
                  type="button"
                  onClick={() => removeDevelopmentArea(area)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Advanced Plan Visibility Toggle */}
          <div className="pt-2">
            {!formData.selectedBundle ? (
              <div className="space-y-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={isIndividualSelected}
                        onClick={() => setShowPlans(!showPlans)}
                        className={`group relative flex w-full items-center justify-between px-3 py-4  transition-all duration-300 border rounded-sm ${isIndividualSelected
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none  border-gray-200 "
                          : " to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white  hover:scale-[1.01] active:scale-95"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* <Sparkles className={`w-5 h-5 ${isIndividualSelected ? "" : "animate-pulse"}`} /> */}
                          <span className="text-[15px] text-black ">Advanced Plan</span>
                        </div>
                        {!isIndividualSelected && (
                          <div className="flex items-center gap-2">
                            {/* <span className="text-xs font-medium opacity-80">{showPlans ? "Hide Plans" : "View All Plans"}</span> */}
                            {/* {showPlans ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />} */}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    {isIndividualSelected && (
                      <TooltipContent side="top" sideOffset={10} align="start" className="max-w-[300px] p-3 bg-black border-grays-200 shadow-xl">
                        <div className="space-y-2">
                          <p className="font-bold text-white text-sm">Action Required</p>
                          <p className="text-xs text-white leading-relaxed">
                            To select an <span className="font-bold">Advanced Plan</span>, the following must be zero:
                          </p>
                          <ul className="text-[10px] text-white list-disc pl-4 space-y-1">
                            <li>Senior Developer (₹70,000-80,000)</li>
                            <li>Junior Developer (₹20,000-40,000)</li>
                            <li>UI/UX Designer (₹8,000)</li>
                          </ul>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {/* Bundle Details List (Toggleable) */}
                {showPlans && !isIndividualSelected && (
                  <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    {plans.map((plan) => {
                      const isExpanded = expandedBundle === plan.name;
                      return (
                        <div
                          key={plan.name}
                          className={`overflow-hidden transition-all duration-300 border rounded-xl ${isExpanded ? "border-violet-200 shadow-md ring-1 ring-violet-100" : "border-gray-100 hover:border-violet-200 hover:shadow-sm"
                            }`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedBundle(isExpanded ? null : plan.name)}
                            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isExpanded ? "bg-violet-50/50" : "bg-white hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${isExpanded ? plan.bgColor.replace("bg-", "text-") : "text-gray-900"}`}>
                                {plan.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                {plan.price}{plan.billing}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-violet-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </button>

                          <div
                            className={`transition-all duration-500 ease-in-out ${isExpanded ? "max-h-[500px] opacity-100 py-4 px-5" : "max-h-0 opacity-0"
                              } ${plan.bgColor} ${plan.textColor}`}
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-start border-b border-white/20 pb-3">
                                <div>
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Total Package Price</h4>
                                  <p className="text-2xl font-black">{plan.price}<span className="text-xs font-bold opacity-75">{plan.billing}</span></p>
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-white text-black hover:bg-white/90 font-black px-6 py-2 h-10 rounded-xl text-sm shadow-lg shadow-black/10 transition-transform active:scale-95"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const numericPrice = parseInt(plan.price.replace(/[^\d]/g, ""));
                                    updateFormData({
                                      selectedBundle: {
                                        name: plan.name,
                                        price: numericPrice,
                                      }
                                    });
                                    setShowPlans(false);
                                  }}
                                >
                                  CHOOSE THIS BUNDLE
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Team Includes</h4>
                                  <ul className="text-[10px] text-white list-disc pl-4 space-y-1">
                                    {plan.includes.map((item, idx) => (
                                      <li key={idx} className="font-semibold text-[11px]">{item}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Free Training</h4>
                                  <p className="text-[11px] font-bold leading-relaxed">{plan.training}</p>
                                  <p className="text-[9px] font-medium opacity-70 italic mt-3">*(Salaries of the Team included)</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border border-gray-200 rounded-xl gap-4">
                <div className="flex items-center gap-3">
                  {/* <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <Sparkles className="w-5 h-5" />
                  </div> */}
                  <div>
                    {/* <p className="text-xs  text-black tracking-wider">Selected Bundle</p> */}
                    <h3 className="text-lg font-bold text-gray-900">{formData.selectedBundle.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateFormData({ selectedBundle: null })}
                    className="bg-white border-black text-black hover:bg-blue-50 font-bold"
                  >
                    Change Plan
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => updateFormData({ selectedBundle: null })}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Cancel Plan"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {!formData.selectedBundle && (
          <div className="space-y-4">
            <div className="space-y-3">
              <DeveloperTypeSelector
                title="Senior Developer"
                cost={
                  formData.currency === "INR" ? "(₹70,000-80,000)" : "($940-1000)"
                }
                tooltip="Senior developers are seasoned professionals in software development, providing technical leadership and expertise. They ensure high-quality code, troubleshoot complex issues, mentor junior developers, and contribute to project management."
                value={formData.seniorDevelopers}
                onChange={(value) => updateFormData({ seniorDevelopers: value })}
                currency={formData.currency}
              />

              <DeveloperTypeSelector
                title="Junior Developer"
                cost={
                  formData.currency === "INR" ? "(₹20,000-40,000)" : "($376-500)"
                }
                tooltip="Junior developers are entry-level professionals learning and contributing to software projects. They write code, assist in testing, and benefit from mentorship to build skills. They adapt to team dynamics, participate in documentation, and focus on continuous learning."
                value={formData.juniorDevelopers}
                onChange={(value) => updateFormData({ juniorDevelopers: value })}
                currency={formData.currency}
              />

              <DeveloperTypeSelector
                title="UI/UX Designer (optional)"
                cost={formData.currency === "INR" ? "(₹8,000)" : "($100)"}
                tooltip="UI/UX designers craft user-friendly interfaces, creating wireframes and prototypes while prioritizing user needs. They integrate feedback, collaborate with developers, and maintain brand consistency. Proficient in design tools, they stay updated on trends."
                value={formData.uiUxDesigners}
                onChange={(value) => updateFormData({ uiUxDesigners: value })}
                currency={formData.currency}
                showLeadDesignerBadge={true}
                designerProfileLink={LEAD_DESIGNER_PROFILE_URL}
              />
            </div>
            {validationErrors.teamMembers && (
              <p className="text-sm text-destructive">
                {validationErrors.teamMembers}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Design Link Dialog */}
      <Dialog
        open={showDesignLinkDialog}
        onOpenChange={setShowDesignLinkDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Design Link</DialogTitle>
            <DialogDescription>
              Please provide a link to your existing UI/UX designs. This could
              be a Figma, Adobe XD, or similar design file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="designLink">Design Link</Label>
              <Input
                id="designLink"
                placeholder="https://..."
                value={designLink}
                onChange={(e) => setDesignLink(e.target.value)}
              />
              {linkError && (
                <p className="text-sm text-destructive">{linkError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDesignLinkDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDesignLinkSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
