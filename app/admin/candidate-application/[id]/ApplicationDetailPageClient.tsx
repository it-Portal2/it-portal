"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Brain,
  User,
  Mail,
  Phone,
  Linkedin,
  Calendar,
  Clock,
  GraduationCap,
  MessageSquare,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Target,
  TrendingUp,
  Award,
  Zap,
  RefreshCw,
  FileDown,
} from "lucide-react";
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CircularProgress } from "@/components/ui-custom/CircularProgress";
import { Application, ApplicationStatus } from "@/lib/types";
import {
  updateApplicationAIAnalysisAction,
  updateApplicationStatusAction,
} from "@/app/actions/admin-actions";
import axios from "axios";

const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const statusConfig = {
    Pending: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
      label: "Under Review",
    },
    Accepted: {
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Accepted",
    },
    Rejected: {
      color: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle,
      label: "Rejected",
    },
  };

  const config = statusConfig[status];
  const IconComponent = config?.icon || Clock;

  return (
    <Badge
      variant="outline"
      className={cn("flex items-center gap-1.5 px-3 py-1", config?.color)}
    >
      <IconComponent className="h-3.5 w-3.5" />
      {config?.label || status}
    </Badge>
  );
};

interface ApplicationDetailClientProps {
  applicationDetails: Application | null;
  error: string | null;
}

export default function ApplicationDetailPageClient({
  applicationDetails,
  error,
}: ApplicationDetailClientProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(
    applicationDetails?.aiAnalysisStatus === "analyzed"
  );
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [maxAttempts] = useState(3);
  const [analysisPhase, setAnalysisPhase] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  // Error state handling
  if (error || !applicationDetails) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="border-0 shadow-none w-full max-w-lg">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Error Loading Application
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/admin/candidate-application">
              <Button variant="outline">Back to Applications</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApplicationStatusChange = async (
    status: "Accepted" | "Rejected"
  ) => {
    try {
      const response = await updateApplicationStatusAction(
        applicationDetails?.id,
        status
      );

      if (response.success) {
        toast.success(
          status === "Accepted"
            ? "Application accepted successfully!"
            : "Application rejected successfully!"
        );
      } else {
        toast.error(`Error: ${response.error}`);
      }
    } catch (error) {
      console.error(`Error updating application status to ${status}:`, error);
      toast.error(
        status === "Accepted"
          ? "Failed to accept application"
          : "Failed to reject application"
      );
    }
  };

  // Enhanced AI Analysis with robust error handling and toast messages
  const handleAIAnalysis = useCallback(
    async (isRetry: boolean = false) => {
      if (
        !applicationDetails?.aiQuestions ||
        applicationDetails.aiQuestions.length === 0
      ) {
        toast.error("No interview questions available for analysis", {
          description:
            "Please ensure the candidate has completed the technical interview.",
          duration: 5000,
        });
        return;
      }

      if (!isRetry) {
        setCurrentAttempt(1);
      }

      setIsAnalyzing(true);
      setAnalysisProgress(5);
      setAnalysisPhase("Initializing AI analysis systems...");

      // Enhanced progress simulation with realistic phases
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev < 15) {
            setAnalysisPhase("Validating candidate data...");
            return prev + 2;
          } else if (prev < 35) {
            setAnalysisPhase("Processing technical responses...");
            return prev + 3;
          } else if (prev < 55) {
            setAnalysisPhase("Analyzing response authenticity...");
            return prev + 2;
          } else if (prev < 75) {
            setAnalysisPhase("Computing technical accuracy scores...");
            return prev + 2;
          } else if (prev < 90) {
            setAnalysisPhase("Generating final recommendations...");
            return prev + 1;
          }
          return prev;
        });
      }, 1000);

      try {
        // console.info(`[CLIENT] Starting AI analysis attempt ${currentAttempt}/${maxAttempts}`, {
        //   candidateName: applicationDetails?.fullName || 'Unknown',
        //   questionsCount: applicationDetails?.aiQuestions?.length || 0,
        //   attempt: currentAttempt
        // });

        // Create axios request with appropriate timeout
        const analysisPromise = axios.post(
          "/api/admin/application-analysis",
          { applicationDetails: applicationDetails },
          {
            timeout: 50000, // 50 seconds client timeout (less than server 55s)
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const response = await analysisPromise;

        clearInterval(progressInterval);
        setAnalysisProgress(100);
        setAnalysisPhase("Analysis completed successfully!");

        if (response.data.success) {
          // Update application with AI analysis results
          const updateResponse = await updateApplicationAIAnalysisAction(
            applicationDetails.id,
            response.data.aiAnalysis,
            response.data.overallScore
          );

          if (updateResponse.success) {
            setHasAnalyzed(true);

            toast.success("AI Analysis Completed Successfully!", {
              description: `Comprehensive analysis completed in ${
                response.data.processingTime || "unknown"
              }ms. Overall score: ${
                response.data.overallScore?.toFixed(1) || "N/A"
              }/10`,
              duration: 6000,
            });

            // Auto-scroll to results section
            setTimeout(() => {
              const aiResultsSection = document.getElementById(
                "ai-analysis-results"
              );
              if (aiResultsSection) {
                aiResultsSection.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                  inline: "nearest",
                });
              }
            }, 500);
          } else {
            throw new Error(
              updateResponse.error || "Failed to save analysis results"
            );
          }
        } else {
          throw new Error(response.data.message || "Analysis request failed");
        }
      } catch (error) {
        clearInterval(progressInterval);
        setAnalysisProgress(0);
        setAnalysisPhase("");

        //  console.error(`[CLIENT] Analysis attempt ${currentAttempt} failed:`, error);

        // Enhanced error classification and handling
        let errorType = "unknown";
        let errorMessage = "Analysis failed";
        let shouldRetry = currentAttempt < maxAttempts;
        let userFriendlyMessage = "";
        let retryDelay = 2000; // Default 2 second delay

        if (axios.isAxiosError(error)) {
          const response = error.response;
          const data = response?.data;

          // Handle specific error types from our enhanced API routes
          if (
            error.code === "ECONNABORTED" ||
            error.message.includes("timeout")
          ) {
            errorType = "timeout";
            errorMessage = `Request timed out after ${
              error.config?.timeout || 50000
            }ms`;
            userFriendlyMessage = `Analysis timed out on attempt ${currentAttempt}/${maxAttempts}. The AI service may be experiencing high load.`;
            retryDelay = 3000; // Longer delay for timeouts
          } else if (response?.status === 408) {
            errorType = "server_timeout";
            errorMessage = "Server processing timeout";
            userFriendlyMessage = `Server timeout on attempt ${currentAttempt}/${maxAttempts}. Trying with backup systems...`;
            retryDelay = 2000;
          } else if (response?.status === 503) {
            errorType = "service_unavailable";
            errorMessage =
              data?.message || "AI service temporarily unavailable";
            userFriendlyMessage = `AI service temporarily overloaded (attempt ${currentAttempt}/${maxAttempts}). Retrying with different endpoints...`;
            retryDelay = 4000; // Longer delay for service issues
          } else if (response?.status === 422) {
            errorType = "parsing_error";
            errorMessage = data?.message || "AI response parsing failed";
            userFriendlyMessage = `Response processing failed (attempt ${currentAttempt}/${maxAttempts}). Retrying with enhanced parsing...`;
            retryDelay = 1500;
          } else if (response?.status === 400) {
            errorType = "validation_error";
            errorMessage = data?.message || "Request validation failed";
            userFriendlyMessage = errorMessage;
            shouldRetry = false; // Don't retry validation errors
          } else if (data?.message) {
            // Handle user-friendly messages from our API (containing **)
            if (data.message.includes("**")) {
              errorType = "service_configuration";
              errorMessage = data.message;
              userFriendlyMessage = data.message;
              shouldRetry = false; // Configuration errors need manual intervention
            } else {
              errorType = "api_error";
              errorMessage = data.message;
              userFriendlyMessage = `${data.message} (attempt ${currentAttempt}/${maxAttempts})`;
            }
          } else {
            errorType = "network_error";
            errorMessage = error.message || "Network request failed";
            userFriendlyMessage = `Network error on attempt ${currentAttempt}/${maxAttempts}. Checking connection...`;
          }
        } else if (error instanceof Error) {
          if (error.message.toLowerCase().includes("validation")) {
            errorType = "client_validation";
            errorMessage = error.message;
            userFriendlyMessage = error.message;
            shouldRetry = false;
          } else {
            errorType = "unexpected_error";
            errorMessage = error.message;
            userFriendlyMessage = `Unexpected error: ${error.message}`;
          }
        }

        // Auto-retry logic for recoverable errors
        const autoRetryTypes = [
          "timeout",
          "server_timeout",
          "service_unavailable",
          "parsing_error",
          "network_error",
        ];
        const shouldAutoRetry =
          shouldRetry && autoRetryTypes.includes(errorType);

        if (shouldAutoRetry) {
          toast.error(
            `Attempt ${currentAttempt}/${maxAttempts} Failed - Auto Retrying`,
            {
              description: userFriendlyMessage,
              duration: 3000,
            }
          );

          setCurrentAttempt((prev) => prev + 1);

          // Wait before retry with progressive backoff
          setTimeout(() => {
            handleAIAnalysis(true);
          }, retryDelay);

          return;
        }

        // Final failure - show comprehensive error with manual retry option
        if (shouldRetry && !shouldAutoRetry) {
          // Manual retry option for certain error types
          toast.error("AI Analysis Failed", {
            description: userFriendlyMessage,
            duration: 10000,
            action: {
              label: `Manual Retry (${currentAttempt}/${maxAttempts})`,
              onClick: () => {
                setCurrentAttempt((prev) => prev + 1);
                handleAIAnalysis(true);
              },
            },
          });
        } else if (
          errorType === "service_configuration" ||
          errorType === "client_validation"
        ) {
          // Configuration/validation errors - no retry
          toast.error("Configuration Error", {
            description: userFriendlyMessage,
            duration: 12000,
          });
        } else {
          // All attempts exhausted
          toast.error("Analysis Failed - All Attempts Exhausted", {
            description: `${userFriendlyMessage}\n\nPlease try again later or contact technical support if this issue persists.`,
            duration: 15000,
            action: {
              label: "Reset & Try Again",
              onClick: () => {
                setCurrentAttempt(1);
                setAnalysisProgress(0);
                setAnalysisPhase("");
                // Allow user to try again from beginning
              },
            },
          });
        }

        // console.error(`[CLIENT] Final error classification:`, {
        //   errorType,
        //   errorMessage,
        //   shouldRetry,
        //   shouldAutoRetry,
        //   currentAttempt,
        //   maxAttempts
        // });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [applicationDetails, currentAttempt, maxAttempts]
  );

const generatePdf = useCallback(async () => {
  try {
    setIsGeneratingPdf(true);
    
    const element = document.getElementById('report-capture-section');
    if (!element) {
      toast.error('Report section not found');
      return;
    }

    // Hide action buttons during capture
    const actionButtons = document.getElementById('action-buttons-section');
    if (actionButtons) {
      actionButtons.style.visibility = 'hidden';
    }

    // Device-optimized settings
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Generate high-quality canvas using html2canvas-pro (supports oklch)
    const canvas = await html2canvas(element, {
      scale: isMobile ? 2 : 3, // HD quality with device optimization
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0
    });

    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    // Create PDF with jsPDF
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    // Get PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions for PDF
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add additional pages for large content
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Generate filename and save
    const filename = `${applicationDetails?.fullName?.replace(/\s+/g, '_') || 'Candidate'}_Report_${new Date().toISOString().slice(0,10)}.pdf`;
    pdf.save(filename);

    // Show buttons again
    if (actionButtons) {
      actionButtons.style.visibility = 'visible';
    }

    toast.success('📄 Multi-page PDF Downloaded Successfully!', {
      description: 'High-quality PDF with all content captured'
    });

  } catch (error) {
    console.error('PDF generation failed:', error);
    
    // Restore buttons on error
    const actionButtons = document.getElementById('action-buttons-section');
    if (actionButtons) {
      actionButtons.style.visibility = 'visible';
    }
    
    toast.error('Failed to generate PDF', {
      description: 'Please try again or contact support'
    });
  } finally {
    setIsGeneratingPdf(false);
  }
}, [applicationDetails?.fullName]);

  const safeDisplay = (value: any, fallback = "N/A") => {
    return value && value !== "" ? value : fallback;
  };

  const convertFirebaseTimestamp = (timestamp: any) => {
    if (timestamp && timestamp.seconds) {
      return new Date(
        timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
      );
    }
    return new Date(timestamp);
  };

  // Calculate average scores safely
  const calculateAverageOriginality = () => {
    if (!applicationDetails?.aiAnalysis?.originalityScores?.length) return 0;
    return Math.round(
      applicationDetails.aiAnalysis.originalityScores.reduce(
        (acc, curr) => acc + curr.score,
        0
      ) / applicationDetails.aiAnalysis.originalityScores.length
    );
  };

  const calculateAverageCorrectness = (): string => {
    if (!applicationDetails?.aiAnalysis?.correctnessScores?.length)
      return "0.0";
    return (
      applicationDetails.aiAnalysis.correctnessScores.reduce(
        (acc, curr) => acc + curr.score,
        0
      ) / applicationDetails.aiAnalysis.correctnessScores.length
    ).toFixed(1);
  };

  return (
    <>
      {/* Enhanced Analysis Progress Dialog */}
      <Dialog open={isAnalyzing} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-sm">
          <div className="p-8 text-center">
            <div className="relative mb-8">
              <CircularProgress
                value={analysisProgress}
                size={120}
                color="primary"
              >
                <Brain className="h-8 w-8 text-violet-600 animate-pulse" />
              </CircularProgress>
            </div>

            <h3 className="text-xl font-bold mb-3 text-gray-900">
              🚀 AI Analysis in Progress
            </h3>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                {analysisPhase ||
                  "Comprehensive authenticity detection and technical assessment..."}
              </p>

              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="text-violet-600 font-medium">
                  Progress: {analysisProgress}%
                </div>
                <div className="text-gray-500">
                  Attempt: {currentAttempt}/{maxAttempts}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-6">
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>

            {currentAttempt > 1 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700">
                  Retrying with backup systems...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Back Button */}
      <div className="mb-4">
        <Link href="/admin/candidate-application">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-white/60">
            <ArrowLeft className="h-4 w-4" />
            Back to Applications
          </Button>
        </Link>
      </div>

      <div id="report-capture-section" className="space-y-6">
        {/* Name + Status/Score + Action Buttons */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Candidate Info */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {safeDisplay(applicationDetails?.fullName)}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <StatusBadge status={applicationDetails?.applicationStatus} />
              {applicationDetails?.overallScore && (
                <Badge
                  variant="outline"
                  className="font-mono bg-violet-50 text-violet-700 border-violet-200"
                >
                  Overall Score: {applicationDetails.overallScore.toFixed(1)}
                  /10
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            id="action-buttons-section"
            className="flex items-center gap-3 flex-wrap"
          >
            <Button
              onClick={() => handleApplicationStatusChange("Accepted")}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
              disabled={applicationDetails?.applicationStatus === "Accepted"}
            >
              <CheckCircle className="h-4 w-4" />
              Accept Candidate
            </Button>
            <Button
              onClick={() => handleApplicationStatusChange("Rejected")}
              variant="destructive"
              className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg"
              disabled={applicationDetails?.applicationStatus === "Rejected"}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>

            {/* Enhanced AI Analysis Button */}
            <Button
              onClick={() => handleAIAnalysis(false)}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg relative"
              disabled={isAnalyzing || hasAnalyzed}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing... ({currentAttempt}/{maxAttempts})
                </>
              ) : hasAnalyzed ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Analysis Completed
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />⚡ Start AI Analysis
                </>
              )}
            </Button>
            {/* Generate Report Button */}
            <Button
              onClick={generatePdf}
              variant="outline"
              className="gap-2 bg-yellow-300 border-blue-200 text-black hover:bg-yellow-300/80 "
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>

            {/* Manual Retry Button (shown after failed attempts) */}
            {!isAnalyzing && !hasAnalyzed && currentAttempt > 1 && (
              <Button
                onClick={() => handleAIAnalysis(true)}
                variant="outline"
                className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Analysis
              </Button>
            )}
          </div>
        </div>

        {/* AI Analysis Results Summary Cards */}
        {applicationDetails?.aiAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 scroll-mt-4">
            <Card>
              <CardContent className="p-6 text-center">
                <CircularProgress
                  value={applicationDetails?.overallScore! * 10}
                  size={80}
                  color="primary"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {applicationDetails?.overallScore!.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Overall</div>
                  </div>
                </CircularProgress>
                <p className="text-sm font-medium text-gray-700 mt-3">
                  Candidate Score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <CircularProgress
                  value={calculateAverageOriginality()}
                  size={80}
                  color="success"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-700">
                      {calculateAverageOriginality()}%
                    </div>
                    <div className="text-xs text-emerald-600">Avg</div>
                  </div>
                </CircularProgress>
                <p className="text-sm font-medium text-gray-700 mt-3">
                  Authenticity Score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <CircularProgress
                  value={parseFloat(calculateAverageCorrectness()) * 10}
                  size={80}
                  color="primary"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {calculateAverageCorrectness()}
                    </div>
                    <div className="text-xs text-blue-600">/10</div>
                  </div>
                </CircularProgress>

                <p className="text-sm font-medium text-gray-700 mt-3">
                  Technical Accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  {applicationDetails?.aiAnalysis.overallVerdict ===
                  "Highly Recommended" ? (
                    <Award className="h-12 w-12 text-amber-500" />
                  ) : applicationDetails?.aiAnalysis.overallVerdict ===
                    "Recommended" ? (
                    <ThumbsUp className="h-12 w-12 text-green-500" />
                  ) : applicationDetails?.aiAnalysis.overallVerdict ===
                    "Not Recommended" ? (
                    <ThumbsDown className="h-12 w-12 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-12 w-12 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {safeDisplay(applicationDetails?.aiAnalysis.overallVerdict)}
                </p>
                <p className="text-xs text-gray-500 mt-1">AI Recommendation</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Candidate Profile */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <User className="h-5 w-5 text-violet-600" />
                  </div>
                  Candidate Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {safeDisplay(applicationDetails?.email)}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {safeDisplay(applicationDetails?.phone)}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Linkedin className="h-4 w-4 text-gray-500" />
                  {applicationDetails?.linkedin ? (
                    <a
                      href={applicationDetails.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-gray-400">
                      N/A
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  Application Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Applied Date
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {applicationDetails?.createdAt
                        ? convertFirebaseTimestamp(
                            applicationDetails.createdAt
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Start Date
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">
                      {safeDisplay(
                        applicationDetails?.startDate?.replace("-", " ")
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Expected Stipend
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      ₹{safeDisplay(applicationDetails?.stipendExpectation)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Weekly Hours
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {safeDisplay(applicationDetails?.weeklyCommitment)}{" "}
                      hrs/week
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Trial Period
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">
                    {safeDisplay(applicationDetails?.trialAccepted)}
                  </p>
                </div>

                {applicationDetails?.additionalComments && (
                  <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                    <span className="text-xs font-medium text-violet-600 uppercase tracking-wide">
                      Additional Comments
                    </span>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      {applicationDetails?.additionalComments}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Technical Assessment */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                  </div>
                  Professional Background Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-sm text-blue-800 mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Educational Background
                    </h4>
                    <p className="text-sm text-gray-700">
                      {safeDisplay(
                        applicationDetails?.resumeAnalysis?.education
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-sm text-purple-800 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Professional Experience
                    </h4>
                    <p className="text-sm text-gray-700">
                      {safeDisplay(
                        applicationDetails?.resumeAnalysis?.experience
                      )}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-sm text-green-800 mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Technical Skills Portfolio
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {applicationDetails?.resumeAnalysis?.skills?.length ? (
                      applicationDetails.resumeAnalysis.skills.map(
                        (skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-white/80 text-gray-700 border border-gray-200"
                          >
                            {skill}
                          </Badge>
                        )
                      )
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Professional Summary
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {safeDisplay(applicationDetails?.resumeAnalysis?.summary)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  Technical Interview Responses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {applicationDetails?.aiQuestions?.length ? (
                  applicationDetails.aiQuestions.map((qa, index) => {
                    return (
                      <div key={index} className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className="font-semibold text-sm text-indigo-900">
                                {qa.question}
                              </h4>
                            </div>
                          </div>
                        </div>
                        <div className="ml-9 p-4 bg-white rounded-lg border-2 border-gray-100">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words">
                            {safeDisplay(qa.answer)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No interview responses available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* AI Analysis Results Section */}
            {applicationDetails?.aiAnalysis && (
              <Card id="ai-analysis-results">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <Brain className="h-5 w-5 text-violet-600" />
                    </div>
                    ⚡ AI Assessment Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Response Authenticity Analysis */}
                  <div>
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-3 text-gray-900">
                      <Shield className="h-5 w-5 text-emerald-600" />
                      Response Authenticity Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {applicationDetails?.aiAnalysis?.originalityScores.map(
                        (score, index) => (
                          <div
                            key={index}
                            className="p-6 bg-white rounded-xl border border-emerald-200 shadow-sm"
                          >
                            <div className="text-center mb-4">
                              <CircularProgress
                                value={score.score}
                                size={100}
                                color="success"
                              >
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-emerald-700">
                                    {score.score}%
                                  </div>
                                  <div className="text-xs text-emerald-600">
                                    Authentic
                                  </div>
                                </div>
                              </CircularProgress>
                            </div>
                            <h5 className="font-semibold text-sm text-center mb-3 text-gray-900">
                              Question {score.question} Analysis
                            </h5>
                            <p className="text-xs text-gray-600 leading-relaxed text-center">
                              {safeDisplay(score.reasoning)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Technical Knowledge Assessment */}
                  <div>
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-3 text-gray-900">
                      <Target className="h-5 w-5 text-blue-600" />
                      Technical Knowledge Assessment
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {applicationDetails?.aiAnalysis?.correctnessScores.map(
                        (score, index) => (
                          <div
                            key={index}
                            className="p-6 bg-white rounded-xl border border-blue-200 shadow-sm"
                          >
                            <div className="text-center mb-4">
                              <CircularProgress
                                value={score.score * 10}
                                size={100}
                                color="primary"
                              >
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-700">
                                    {score.score.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    /10
                                  </div>
                                </div>
                              </CircularProgress>
                            </div>
                            <h5 className="font-semibold text-sm text-center mb-3 text-gray-900">
                              Question {index + 1} Accuracy
                            </h5>
                            <p className="text-xs text-gray-600 leading-relaxed text-center">
                              {safeDisplay(score.reasoning)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Final AI Recommendation */}
                  <div>
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-3 text-gray-900">
                      <Award className="h-5 w-5 text-amber-600" />
                      Final AI Recommendation
                    </h4>
                    <div className="p-8 rounded-2xl bg-violet-50 border border-violet-200 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-white rounded-full shadow-sm">
                          {applicationDetails?.aiAnalysis?.overallVerdict ===
                          "Highly Recommended" ? (
                            <Award className="h-8 w-8 text-amber-500" />
                          ) : applicationDetails?.aiAnalysis?.overallVerdict ===
                            "Recommended" ? (
                            <ThumbsUp className="h-8 w-8 text-green-500" />
                          ) : applicationDetails?.aiAnalysis?.overallVerdict ===
                            "Not Recommended" ? (
                            <ThumbsDown className="h-8 w-8 text-red-500" />
                          ) : (
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-2xl font-bold text-gray-900 mb-1">
                            {safeDisplay(
                              applicationDetails?.aiAnalysis?.overallVerdict
                            )}
                          </h5>
                          <p className="text-sm text-violet-600 font-medium">
                            AI Assessment Verdict
                          </p>
                        </div>
                      </div>
                      <div className="p-6 bg-white/80 rounded-xl border border-white/50">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {safeDisplay(
                            applicationDetails?.aiAnalysis?.aiRecommendation
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
