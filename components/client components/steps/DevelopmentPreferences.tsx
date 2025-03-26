"use client";

import type React from "react";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus, X, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProjectFormStore } from "@/lib/store/projectSteps";

interface DeveloperTypeSelectorProps {
  title: string;
  cost: string;
  tooltip: string;
  value: number;
  onChange: (value: number) => void;
  currency: string;
}

// Update the DeveloperTypeSelector to show correct currency values
function DeveloperTypeSelector({
  title,
  cost,
  tooltip,
  value,
  onChange,
  currency,
}: DeveloperTypeSelectorProps) {
  // Get cost display based on currency
  const displayCost =
    currency === "INR"
      ? cost
      : cost.replace("₹", "$").replace(/\d+,\d+/g, (match) => {
          // Convert the INR value to USD using the formula:
          // (Base INR + 4% of Base INR) / 83
          const inrValue = Number.parseInt(match.replace(",", ""));
          const usdValue = Math.round((inrValue + 0.04 * inrValue) / 83);
          return usdValue.toLocaleString();
        });

  return (
    <div className="flex items-center justify-between p-3 border rounded-md">
      <div className="flex items-center">
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{displayCost}</p>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="ml-2">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

// In the DevelopmentPreferences component, update the cost displays
export function DevelopmentPreferences() {
  const { formData, updateFormData, validationErrors } = useProjectFormStore();
  const [newArea, setNewArea] = useState("");

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

  // Pass currency to each DeveloperTypeSelector with updated cost displays
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Step 2/4</p>
        <h2 className="text-2xl font-bold text-foreground">
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
              className={
                validationErrors.developmentAreas ? "border-destructive" : ""
              }
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
        </div>

        <div className="space-y-4">
          <Label>Number of developers required</Label>

          <div className="space-y-3">
            <DeveloperTypeSelector
              title="Senior Developer"
              cost={
                formData.currency === "INR"
                  ? "(₹70,000-80,000)"
                  : "($940-1000)"
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
            />
          </div>

          {validationErrors.teamMembers && (
            <p className="text-sm text-destructive">
              {validationErrors.teamMembers}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
