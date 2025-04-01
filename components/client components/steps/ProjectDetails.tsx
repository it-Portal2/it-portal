"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjectFormStore } from "@/lib/store/projectSteps";
import { useEffect } from "react";
import { DollarSign, IndianRupee } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
export function ProjectDetails() {
  const { formData, updateFormData, validationErrors, syncUserData } =
    useProjectFormStore();
  useEffect(() => {
    syncUserData();
  }, [syncUserData]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Step 1/4</p>
        <h2 className="sm:text-2xl font-bold text-foreground">
          Tell Us About Your Project
        </h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            suppressHydrationWarning={true}
            placeholder="Enter your project name (at least 10 characters)"
            value={formData.projectName}
            onChange={(e) => updateFormData({ projectName: e.target.value })}
            className={`placeholder:text-xs ${
              validationErrors.projectName ? "border-destructive" : ""
            }`}
          />

          {validationErrors.projectName && (
            <p className="text-sm text-destructive">
              {validationErrors.projectName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectOverview">
            Project Overview
            <span className="ml-1 text-xs text-muted-foreground">
              (minimum 100 characters)
            </span>
          </Label>
          <Textarea
            id="projectOverview"
            placeholder="Tell us about your project in detail. What are your goals? What problems are you trying to solve? What features do you need?"
            value={formData.projectOverview}
            onChange={(e) =>
              updateFormData({ projectOverview: e.target.value })
            }
            className={`min-h-[150px] placeholder:text-xs ${
              validationErrors.projectOverview ? "border-destructive" : ""
            }`}
          />
          {validationErrors.projectOverview && (
            <p className="text-sm text-destructive">
              {validationErrors.projectOverview}
            </p>
          )}
          <div className="flex justify-end">
            <p className="text-xs text-muted-foreground">
              {formData.projectOverview.length}/100 characters
            </p>
          </div>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label>Preferred Currency</Label>
          <RadioGroup
            value={formData.currency}
            onValueChange={(value) =>
              updateFormData({ currency: value as "INR" | "USD" })
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="INR" id="currency-inr" />
              <Label
                htmlFor="currency-inr"
                className="flex items-center gap-1 cursor-pointer"
              >
                <IndianRupee className="h-4 w-4" />
                <span>Indian Rupee (₹)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="USD" id="currency-usd" />
              <Label
                htmlFor="currency-usd"
                className="flex items-center gap-1 cursor-pointer"
              >
                <DollarSign className="h-4 w-4" />
                <span>US Dollar ($)</span>
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            The selected currency will be used for all pricing in your
            quotation.
          </p>
        </div>
      </div>
    </div>
  );
}
