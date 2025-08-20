"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CircularProgress } from "@/components/ui-custom/CircularProgress";
import { Application, ApplicationStatus } from "@/lib/types";
import {
  updateApplicationAIAnalysisAction,
  updateApplicationStatusAction,
} from "@/app/actions/admin-actions";
import { analyzeCompleteApplicationOptimized } from "@/lib/gemini";
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
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  if (error || !applicationDetails) {
    return (
      <div className=" flex items-center justify-center">
        <Card className="border-0 shadow-none w-full">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Error Loading Application
            </h2>
            <p className="text-gray-600">{error}</p>
            <Link href="/candidates-applications" className="mt-4 inline-block">
              <Button variant="outline">Back to Applications</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  //  Single function with status parameter
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
            ? "✅ Application accepted successfully!"
            : "❌ Application rejected successfully!"
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

  // Single AI Analysis Function Call
  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => Math.min(prev + 15, 85));
      }, 800);

      // Make API call with correct payload structure
      const response = await axios.post("/api/admin/application-analysis", {
        applicationDetails: applicationDetails, // Make sure this matches the destructuring in API route
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      // Check if the API call was successful
      if (response.data.success) {
        // Use the returned data from the API
        const updateResponse = await updateApplicationAIAnalysisAction(
          applicationDetails.id,
          response.data.aiAnalysis,
          response.data.overallScore
        );

        if (updateResponse.success) {
          setHasAnalyzed(true);

          toast.success("🤖 AI analysis completed successfully!", {
            duration: 3000,
          });

          // Auto-scroll to results
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
            updateResponse.error || "Failed to update application"
          );
        }
      } else {
        throw new Error(response.data.message || "API call failed");
      }
    } catch (error) {
      console.error("Error performing AI analysis:", error);

      // Enhanced error handling
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("JSON")) {
          errorMessage = "AI response parsing failed. Please try again.";
        } else if (
          error.message.includes("API") ||
          error.message.includes("timeout")
        ) {
          errorMessage =
            "AI service temporarily unavailable. Please try again.";
        } else {
          errorMessage = error.message;
        }
      } else if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          errorMessage =
            "Request timeout. The analysis is taking longer than expected.";
        } else if (error.response?.status === 500) {
          errorMessage =
            "Server error occurred during analysis. Please try again.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      toast.error("AI analysis failed", {
        description: errorMessage,
        duration: 6000,
        action: {
          label: "Retry",
          onClick: () => handleAIAnalysis(),
        },
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const safeDisplay = (value: any, fallback = "N/A") => {
    return value && value !== "" ? value : fallback;
  };
  const convertFirebaseTimestamp = (timestamp: any) => {
    if (timestamp && timestamp.seconds) {
      return new Date(
        timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
      );
    }
    // Fallback for regular date strings
    return new Date(timestamp);
  };
  return (
    <>
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
              🚀 Optimized AI Analysis
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
              Single-pass comprehensive analysis: authenticity detection,
              technical accuracy assessment, and holistic evaluation in
              progress...
            </p>
            <div className="text-xs text-violet-600 font-medium mb-4">
              Progress: {analysisProgress}%
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
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
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex flex-col gap-6">
          {/* Back Button */}
          <div>
            <Link href="/admin/intern-application">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-white/60"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Applications
              </Button>
            </Link>
          </div>

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

            <div className="flex items-center gap-3 flex-wrap">
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

              <Button
                onClick={handleAIAnalysis}
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg"
                disabled={
                  isAnalyzing ||
                  hasAnalyzed ||
                  applicationDetails.aiAnalysisStatus === "analyzed"
                }
              >
                <Brain className="h-4 w-4" />
                {isAnalyzing
                  ? "Analyzing..."
                  : hasAnalyzed
                  ? "Analysis Completed"
                  : "⚡ Fast AI Analysis"}
              </Button>
            </div>
          </div>
        </div>

        <div>
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
                    value={
                      applicationDetails?.aiAnalysis.originalityScores.length >
                      0
                        ? applicationDetails.aiAnalysis.originalityScores.reduce(
                            (acc, curr) => acc + curr.score,
                            0
                          ) /
                          applicationDetails.aiAnalysis.originalityScores.length
                        : 0
                    }
                    size={80}
                    color="success"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-700">
                        {applicationDetails?.aiAnalysis.originalityScores
                          .length > 0
                          ? Math.round(
                              applicationDetails.aiAnalysis.originalityScores.reduce(
                                (acc, curr) => acc + curr.score,
                                0
                              ) /
                                applicationDetails.aiAnalysis.originalityScores
                                  .length
                            )
                          : 0}
                        %
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
                    value={
                      applicationDetails?.aiAnalysis.correctnessScores.length >
                      0
                        ? (applicationDetails.aiAnalysis.correctnessScores.reduce(
                            (acc, curr) => acc + curr.score,
                            0
                          ) /
                            applicationDetails.aiAnalysis.correctnessScores
                              .length) *
                          10
                        : 0
                    }
                    size={80}
                    color="primary"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {applicationDetails?.aiAnalysis.correctnessScores
                          .length > 0
                          ? (
                              applicationDetails.aiAnalysis.correctnessScores.reduce(
                                (acc, curr) => acc + curr.score,
                                0
                              ) /
                              applicationDetails.aiAnalysis.correctnessScores
                                .length
                            ).toFixed(1)
                          : "0.0"}
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
                  <p className="text-xs text-gray-500 mt-1">
                    AI Recommendation
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rest of your existing content remains the same */}
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
                    applicationDetails.aiQuestions.map((qa, index) => (
                      <div key={index} className="">
                        <h4 className="font-semibold text-sm mb-4 text-indigo-900 flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          {qa.question}
                        </h4>
                        <div className="ml-9 p-4 bg-white rounded-lg border-2 border-gray-100">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words">
                            {safeDisplay(qa.answer)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No interview responses available
                    </p>
                  )}
                </CardContent>
              </Card>

              {applicationDetails?.aiAnalysis && (
                <Card id="ai-analysis-results">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-violet-100 rounded-lg">
                        <Brain className="h-5 w-5 text-violet-600" />
                      </div>
                      ⚡ Optimized AI Assessment Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
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
                            ) : applicationDetails?.aiAnalysis
                                ?.overallVerdict === "Recommended" ? (
                              <ThumbsUp className="h-8 w-8 text-green-500" />
                            ) : applicationDetails?.aiAnalysis
                                ?.overallVerdict === "Not Recommended" ? (
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
      </div>
    </>
  );
}
