// Suggestions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useProjectFormStore } from "@/lib/store/projectSteps";
import {
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Info,
  AlertCircle,
  ThumbsUp,
  Edit,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SuggestionsProps {
  onContinue: () => void;
}

export function Suggestions({ onContinue }: SuggestionsProps) {
  const { formData, updateFormData } = useProjectFormStore();
  const [showDesignLinkDialog, setShowDesignLinkDialog] = useState(false);
  const [designLink, setDesignLink] = useState(formData.designLink || "");
  const [linkError, setLinkError] = useState("");

  const needsSeniorDev = formData.seniorDevelopers === 0;
  const needsJuniorDev = formData.juniorDevelopers === 0;
  const needsUiUx = formData.uiUxDesigners === 0 && !formData.hasExistingDesign;

  const canProceed =
    (formData.seniorDevelopers >= 1 && formData.juniorDevelopers >= 1) ||
    (formData.seniorDevelopers >= 1 && formData.uiUxDesigners >= 1) ||
    (formData.juniorDevelopers >= 1 && formData.uiUxDesigners >= 1) ||
    (formData.seniorDevelopers >= 1 && formData.designLink !== null) ||
    (formData.juniorDevelopers >= 1 && formData.designLink !== null);

  const acceptSuggestion = (type: "uiUx" | "senior" | "junior") => {
    if (type === "uiUx") {
      updateFormData({
        uiUxDesigners: formData.uiUxDesigners + 1,
        hasExistingDesign: false,
        designLink: null,
      });
    } else if (type === "senior") {
      updateFormData({ seniorDevelopers: formData.seniorDevelopers + 1 });
    } else if (type === "junior") {
      updateFormData({ juniorDevelopers: formData.juniorDevelopers + 1 });
    }
  };

  const openDesignLinkDialog = () => {
    setDesignLink(formData.designLink || "");
    setLinkError("");
    setShowDesignLinkDialog(true);
  };

  const handleDesignLinkSubmit = () => {
    if (!designLink.trim()) {
      setLinkError("Please provide a valid design link");
      return;
    }

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

  // const handleNextClick = () => {
  //   if (!canProceed) {
  //     let message =
  //       "To proceed, you need at least one of these combinations:\n";

  //     if (
  //       formData.seniorDevelopers === 0 &&
  //       formData.juniorDevelopers === 0 &&
  //       formData.uiUxDesigners === 0 &&
  //       !formData.designLink
  //     ) {
  //       message +=
  //         "• 1 Senior Developer and 1 Junior Developer\n" +
  //         "• 1 Senior Developer and 1 UI/UX Designer\n" +
  //         "• 1 Junior Developer and 1 UI/UX Designer\n" +
  //         "• 1 Senior Developer and a Design Link\n" +
  //         "• 1 Junior Developer and a Design Link";
  //     } else if (formData.seniorDevelopers >= 1) {
  //       message +=
  //         "• 1 Junior Developer\n" + "• 1 UI/UX Designer\n" + "• A Design Link";
  //     } else if (formData.juniorDevelopers >= 1) {
  //       message +=
  //         "• 1 Senior Developer\n" + "• 1 UI/UX Designer\n" + "• A Design Link";
  //     } else if (formData.uiUxDesigners >= 1) {
  //       message += "• 1 Senior Developer\n" + "• 1 Junior Developer";
  //     } else if (formData.designLink) {
  //       message += "• 1 Senior Developer\n" + "• 1 Junior Developer";
  //     }

  //     toast.error("Cannot Proceed", {
  //       description: message,
  //       duration: 5000,
  //     });
  //     return;
  //   }
  //   onContinue();
  // };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <Badge
            variant="outline"
            className="w-fit mb-2 bg-primary/10 text-primary border-primary/20"
          >
            Expert Recommendations
          </Badge>
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
            Our Professional Recommendations
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm sm:text-md">
            Based on our analysis of your project requirements, we've prepared
            these tailored recommendations to ensure exceptional project
            delivery and maximum value.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="sm:text-lg font-semibold flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-primary" />
              Project Success Assessment
            </h3>
            <p className="mt-2 text-sm">
              Your project focuses on{" "}
              <span className="font-medium text-primary">
                {formData.developmentAreas.length}
              </span>{" "}
              development areas:{" "}
              <span className="font-medium">
                {formData.developmentAreas.join(", ")}
              </span>
              . We've identified key optimizations to maximize your project's
              success rate and ROI.
            </p>
          </div>

          <div className="space-y-4">
            {needsUiUx && !formData.designLink && (
              <SuggestionCard
                title="Add a UI/UX Designer"
                description="Professional UX design can increase user engagement by up to 200% and reduce development rework by 50%. Our expert designers will create intuitive interfaces that delight users and drive conversion."
                benefits={[
                  "Higher user satisfaction and retention rates",
                  "Reduced development time by preventing design-related rework",
                  "Professional, polished user experience that builds trust",
                ]}
                icon="design"
                onAccept={() => acceptSuggestion("uiUx")}
                onReject={openDesignLinkDialog}
                rejectText="I already have designs"
              />
            )}

            {formData.designLink && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-purple-600" />
                    Connected Design
                  </CardTitle>
                  <CardDescription>
                    Your design is linked and ready for development
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex gap-2">
                  <Button
                    asChild
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <a
                      href={formData.designLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Design <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button variant="outline" onClick={openDesignLinkDialog}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Link
                  </Button>
                </CardFooter>
              </Card>
            )}

            {needsSeniorDev && (
              <SuggestionCard
                title="Add a Senior Developer"
                description="A Senior Developer deliver 10x more business value through architectural expertise and technical leadership, ensure code quality, and help deliver a more robust solution. This is especially important for complex projects."
                benefits={[
                  "Professional architecture that scales with your business",
                  "Faster development through expert problem-solving",
                  "Reduced technical debt and maintenance costs",
                ]}
                icon="senior"
                onAccept={() => acceptSuggestion("senior")}
              />
            )}

            {needsJuniorDev && (
              <SuggestionCard
                title="Add a Junior Developer"
                description="Junior developers optimize your budget while allowing senior talent to focus on complex tasks. This balanced team approach increases development velocity by up to 30% while maintaining cost efficiency."
                benefits={[
                  "Improved cost efficiency without compromising quality",
                  "Faster implementation of standard features",
                  "Better resource allocation across your project",
                ]}
                icon="junior"
                onAccept={() => acceptSuggestion("junior")}
              />
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={onContinue}
            //  disabled={!canProceed}
            className="ml-auto"
          >
            Go to Step 3 <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog
        open={showDesignLinkDialog}
        onOpenChange={setShowDesignLinkDialog}
      >
        <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6 rounded-lg max-h-[85vh] sm:max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {formData.designLink
                ? "Edit Design Link"
                : "Connect Your Design Assets"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Link your existing designs to integrate them into our workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Card className="border border-blue-100 bg-blue-50/50">
              <CardHeader className="px-3 sm:px-4">
                <CardTitle className="text-sm sm:text-md font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  How to Share Your Designs
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-4">
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex items-start gap-2 text-blue-800">
                    <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p>
                      Open your design in Figma, Adobe XD, or your preferred
                      design tool
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-blue-800">
                    <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p>
                      Click the "Share" button (usually in the top-right corner)
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-blue-800">
                    <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p>Set permission to "Anyone with the link can view"</p>
                  </div>
                  <div className="flex items-start gap-2 text-blue-800">
                    <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <p>Copy the link and paste it below</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <Label htmlFor="designLink" className="text-sm sm:text-md">
                  Design URL
                </Label>
                {linkError && (
                  <p className="text-destructive text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {linkError}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="designLink"
                  value={designLink}
                  onChange={(e) => setDesignLink(e.target.value)}
                  placeholder="https://www.figma.com/file/..."
                  className={`${
                    linkError ? "border-destructive" : ""
                  } flex-1 text-sm`}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  type="button"
                  onClick={() =>
                    window.navigator.clipboard
                      .readText()
                      .then((text) => setDesignLink(text))
                  }
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Alert
              variant="default"
              className="bg-amber-50 border-amber-200 text-amber-800"
            >
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-xs sm:text-sm text-amber-700">
                Why link your designs?
              </AlertTitle>
              <AlertDescription className="text-xs text-amber-700 mt-1">
                Connecting your designs helps our developers maintain your exact
                vision and speeds up development by up to 40%.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDesignLinkDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDesignLinkSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              {formData.designLink ? "Update Design" : "Connect Design"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SuggestionCardProps {
  title: string;
  description: string;
  benefits: string[];
  icon: "design" | "senior" | "junior";
  onAccept: () => void;
  onReject?: () => void;
  rejectText?: string;
}

function SuggestionCard({
  title,
  description,
  benefits,
  icon,
  onAccept,
  onReject,
  rejectText,
}: SuggestionCardProps) {
  const iconComponent = () => {
    switch (icon) {
      case "design":
        return (
          <div className="p-2 rounded-full bg-purple-100 text-purple-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 9a3 3 0 0 1 0-6h10a3 3 0 0 1 0 6H2Zm18-3h2" />
              <path d="M22 15h-5a3 3 0 0 0 0 6h5" />
              <path d="M2 15h10a3 3 0 0 1 0 6H5a3 3 0 0 1-3-3v-3Z" />
            </svg>
          </div>
        );
      case "senior":
        return (
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
        );
      case "junior":
        return (
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 16h6" />
              <path d="M19 13v6" />
              <circle cx="9" cy="9" r="5" />
              <path d="M14 19c-1.26 0-2.5-.34-3.57-1-2.62 1.58-5.94 1.34-8.27-.63-2.4-2-2.62-5.5-.57-7.8L12.18 20" />
            </svg>
          </div>
        );
    }
  };

  const cardBg = {
    design: "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100",
    senior: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100",
    junior: "bg-gradient-to-r from-green-50 to-teal-50 border-green-100",
  };

  const buttonBg = {
    design: "bg-purple-600 hover:bg-purple-700 text-white",
    senior: "bg-blue-600 hover:bg-blue-700 text-white",
    junior: "bg-green-600 hover:bg-green-700 text-white",
  };
  const handleLeadDesignerClick = () => {
    window.open(
      "https://tithi-ui-ux-design.vercel.app",
      "_blank",
      "noopener,noreferrer"
    );
  };
  return (
    <Card className={`${cardBg[icon]} shadow-sm border`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-0 justify-between items-start">
          <div className="flex items-center gap-3">
            {iconComponent()}
            <CardTitle className="font-medium text-lg">{title}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-white/80">
            Recommended
          </Badge>
        </div>
        <CardDescription className="text-sm mt-2">
          {description}
        </CardDescription>

        {icon === "design" && (
          <div className="mt-3">
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
      </CardHeader>
      <CardContent className="pt-0">
        <div className="my-2">
          <p className="text-xs font-medium mb-2">Key Benefits:</p>
          <ul className="space-y-1">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-0">
        <Button
          size="sm"
          className={`gap-2 ${buttonBg[icon]} shadow-sm`}
          onClick={onAccept}
        >
          <ThumbsUp className="w-4 h-4" />
          Add to Project Team
        </Button>

        {onReject && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-gray-200"
            onClick={onReject}
          >
            <ExternalLink className="w-4 h-4" />
            {rejectText || "Reject"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
