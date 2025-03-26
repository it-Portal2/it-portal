"use client"

import { Button } from "@/components/ui/button"
import { useProjectFormStore } from "@/lib/store/projectSteps"
import { ArrowRight, CheckCircle } from "lucide-react"

interface SuggestionsProps {
  onContinue: () => void
}

export function Suggestions({ onContinue }: SuggestionsProps) {
  const { formData, updateFormData } = useProjectFormStore()
  console.log(formData);
  const needsUiUx =
    formData.developmentAreas.some(
      (area) =>
        area.toLowerCase().includes("web") ||
        area.toLowerCase().includes("mobile") ||
        area.toLowerCase().includes("app"),
    ) && formData.uiUxDesigners === 0

  const needsSeniorDev = formData.seniorDevelopers === 0
  const needsJuniorDev = formData.juniorDevelopers === 0

  const acceptSuggestion = (type: "uiUx" | "senior" | "junior") => {
    if (type === "uiUx") {
      updateFormData({ uiUxDesigners: formData.uiUxDesigners + 1 })
    } else if (type === "senior") {
      updateFormData({ seniorDevelopers: formData.seniorDevelopers + 1 })
    } else if (type === "junior") {
      updateFormData({ juniorDevelopers: formData.juniorDevelopers + 1 })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Our Suggestions</h2>
        <p className="text-muted-foreground text-sm sm:text-md mt-2">
          Based on your project requirements, we have some recommendations to help deliver a high-quality solution.
        </p>
      </div>

      <div className="space-y-4 bg-muted/50 p-6 rounded-lg">
        <h3 className="sm:text-lg font-semibold">
          Dear Client, we have received your development preferences and team selection.
        </h3>

        <div className="mt-4">
          <h4 className="font-medium text-primary underline">Our Suggestions and Advice</h4>

          <p className="mt-2 text-sm">
            You mentioned {formData.developmentAreas.length} development areas for your project:{" "}
            <span className="font-medium">{formData.developmentAreas.join(", ")}</span>
          </p>

          <div className="space-y-4 mt-4">
            {needsUiUx && (
              <SuggestionCard
                title="Add a UI/UX Designer"
                description="We noticed that your development areas include web or app development. Adding a UI/UX designer will significantly enhance user satisfaction and overall project success."
                onAccept={() => acceptSuggestion("uiUx")}
              />
            )}

            {needsSeniorDev && (
              <SuggestionCard
                title="Add a Senior Developer"
                description="A Senior Developer will provide technical leadership, ensure code quality, and help deliver a more robust solution. This is especially important for complex projects."
                onAccept={() => acceptSuggestion("senior")}
              />
            )}

            {needsJuniorDev && (
              <SuggestionCard
                title="Add a Junior Developer"
                description="Adding a Junior Developer to your team will help with implementation tasks and allow your Senior Developers to focus on architecture and complex features."
                onAccept={() => acceptSuggestion("junior")}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onContinue} className="gap-2">
          Continue to Next Step
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

interface SuggestionCardProps {
  title: string
  description: string
  onAccept: () => void
}

function SuggestionCard({ title, description, onAccept }: SuggestionCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-background">
      <h5 className="font-medium sm:text-lg">{title}</h5>
      <p className="text-muted-foreground text-sm sm:text-md mt-1">{description}</p>
      <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onAccept}>
        <CheckCircle className="w-4 h-4" />
        Accept Suggestion
      </Button>
    </div>
  )
}

