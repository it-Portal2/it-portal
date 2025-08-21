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
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CircularProgress } from "@/components/ui-custom/CircularProgress";
import {
  Application,
  ApplicationStatus,
  CorrectnessScore,
  OriginalityScore,
} from "@/lib/types";
import {
  updateApplicationAIAnalysisAction,
  updateApplicationCorrectnessAction,
  updateApplicationOriginalityAction,
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
  // Loading states for each analysis step
  const [isOriginalityLoading, setOriginalityLoading] = useState(false);
  const [isCorrectnessLoading, setCorrectnessLoading] = useState(false);
  const [isHolisticLoading, setHolisticLoading] = useState(false);

  // Progress and result states
  const [progress, setProgress] = useState(0);
  const [originalityScores, setOriginalityScores] = useState<
    OriginalityScore[]
  >(applicationDetails?.aiAnalysis?.originalityScores || []);
  const [correctnessScores, setCorrectnessScores] = useState<
    CorrectnessScore[]
  >(applicationDetails?.aiAnalysis?.correctnessScores || []);
  const [analysisStatus, setAnalysisStatus] = useState<string>(
    applicationDetails?.aiAnalysisStatus ?? "not-analyzed"
  );
  const [refreshKey, setRefreshKey] = useState(0);

  if (error || !applicationDetails) {
    return (
      <div className="flex items-center justify-center">
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

  // Step booleans
  const originalityDone =
    analysisStatus === "originality-complete" || originalityScores.length > 0;
  const correctnessDone =
    analysisStatus === "correctness-complete" || correctnessScores.length > 0;
  const holisticDone = analysisStatus === "analyzed";

  // Dialog state logic
  const isDialogOpen =
    isOriginalityLoading || isCorrectnessLoading || isHolisticLoading;

  // Handlers
  const handleOriginalityAnalysis = async () => {
    setOriginalityLoading(true);
    setProgress(10);

    try {
      const interval = setInterval(
        () => setProgress((prev) => Math.min(prev + 18, 90)),
        800
      );
      const response = await axios.post("/api/admin/application-analysis", {
        applicationDetails,
        analysisType: "originality",
      });
      clearInterval(interval);
      setProgress(100);

      if (response.data.success) {
        setOriginalityScores(response.data.originalityScores);
        setAnalysisStatus("originality-complete");
        await updateApplicationOriginalityAction(
          applicationDetails.id,
          response.data.originalityScores
        );
        setRefreshKey((key) => key + 1);
        toast.success("Originality analysis completed!");
        setTimeout(() => {
          document
            .getElementById("originality-results")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 600);
      } else {
        throw new Error(response.data.message || "Originality analysis failed");
      }
    } catch (error: any) {
      toast.error("Originality analysis failed", {
        description: error?.message || "Unknown error",
        duration: 5000,
      });
    } finally {
      setOriginalityLoading(false);
      setProgress(0);
    }
  };

  const handleCorrectnessAnalysis = async () => {
    setCorrectnessLoading(true);
    setProgress(10);

    try {
      const interval = setInterval(
        () => setProgress((prev) => Math.min(prev + 18, 90)),
        800
      );
      const response = await axios.post("/api/admin/application-analysis", {
        applicationDetails,
        analysisType: "correctness",
      });
      clearInterval(interval);
      setProgress(100);

      if (response.data.success) {
        setCorrectnessScores(response.data.correctnessScores);
        setAnalysisStatus("correctness-complete");
        await updateApplicationCorrectnessAction(
          applicationDetails.id,
          response.data.correctnessScores
        );
        setRefreshKey((key) => key + 1);
        toast.success("Technical analysis completed!");
        setTimeout(() => {
          document
            .getElementById("correctness-results")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 600);
      } else {
        throw new Error(response.data.message || "Technical analysis failed");
      }
    } catch (error: any) {
      toast.error("Technical analysis failed", {
        description: error?.message || "Unknown error",
        duration: 5000,
      });
    } finally {
      setCorrectnessLoading(false);
      setProgress(0);
    }
  };

  const handleHolisticAssessment = async () => {
    setHolisticLoading(true);
    setProgress(10);
    try {
      const interval = setInterval(
        () => setProgress((prev) => Math.min(prev + 18, 90)),
        800
      );
      const response = await axios.post("/api/admin/application-analysis", {
        applicationDetails,
        analysisType: "holistic",
        originalityResults: originalityScores,
        correctnessResults: correctnessScores,
      });
      clearInterval(interval);
      setProgress(100);

      if (response.data.success) {
        await updateApplicationAIAnalysisAction(
          applicationDetails.id,
          response.data.overallVerdict,
          response.data.aiRecommendation,
          response.data.overallScore
        );
        setAnalysisStatus("analyzed");
        setRefreshKey((key) => key + 1);
        toast.success("Final AI assessment complete!");
        setTimeout(() => {
          document
            .getElementById("holistic-results")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 600);
      } else {
        throw new Error(response.data.message || "Holistic assessment failed");
      }
    } catch (error: any) {
      toast.error("Holistic assessment failed", {
        description: error?.message || "Unknown error",
        duration: 5000,
      });
    } finally {
      setHolisticLoading(false);
      setProgress(0);
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
    return new Date(timestamp);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-sm">
          <div className="p-8 text-center">
            <div className="relative mb-8">
              <CircularProgress value={progress} size={120} color="primary">
                <Brain className="h-8 w-8 text-violet-600 animate-pulse" />
              </CircularProgress>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">
              {isOriginalityLoading
                ? "Originality & Authenticity Analysis"
                : isCorrectnessLoading
                ? "Technical Accuracy Analysis"
                : isHolisticLoading
                ? "Holistic AI Assessment"
                : ""}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {isOriginalityLoading &&
                "Checking for plagiarism & authenticity..."}
              {isCorrectnessLoading && "Evaluating technical correctness..."}
              {isHolisticLoading &&
                "Performing comprehensive final assessment..."}
            </p>
            <div className="text-xs text-violet-600 font-medium mb-4">
              Progress: {progress}%
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
        <div className="flex flex-col gap-4">
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
            </div>
          </div>

          {/* Sequential AI Analysis Buttons */}
          {!holisticDone && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-4 rounded-xl border border-blue-200 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Brain className="h-5 w-5 text-violet-600" />
                Sequential AI Analysis
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleOriginalityAnalysis}
                  disabled={isOriginalityLoading || originalityDone}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex-1 rounded-sm"
                >
                  <Shield className="h-4 w-4" />
                  Originality Analysis
                </Button>
                <Button
                  onClick={handleCorrectnessAnalysis}
                  disabled={
                    !originalityDone || isCorrectnessLoading || correctnessDone
                  }
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex-1 rounded-sm"
                >
                  <Target className="h-4 w-4" />
                  Technical Analysis
                </Button>
                <Button
                  onClick={handleHolisticAssessment}
                  disabled={
                    !correctnessDone || isHolisticLoading || holisticDone
                  }
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg flex-1 rounded-sm"
                >
                  <BarChart3 className="h-4 w-4" />
                  Final Assessment
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          {applicationDetails?.aiAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 scroll-mt-4">
              {applicationDetails?.overallScore && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CircularProgress
                      value={
                        applicationDetails?.overallScore
                          ? applicationDetails?.overallScore * 10
                          : 0
                      }
                      size={80}
                      color="primary"
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {applicationDetails?.overallScore?.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">Overall</div>
                      </div>
                    </CircularProgress>
                    <p className="text-sm font-medium text-gray-700 mt-3">
                      Candidate Score
                    </p>
                  </CardContent>
                </Card>
              )}

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
              {applicationDetails?.aiAnalysis?.correctnessScores && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CircularProgress
                      value={
                        applicationDetails?.aiAnalysis?.correctnessScores
                          ?.length > 0
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
                          {applicationDetails?.aiAnalysis?.correctnessScores
                            ?.length > 0
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
              )}

              {applicationDetails?.aiAnalysis.overallVerdict && (
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
                      {safeDisplay(
                        applicationDetails?.aiAnalysis.overallVerdict
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      AI Recommendation
                    </p>
                  </CardContent>
                </Card>
              )}
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
              {/* Professional Background Analysis */}
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

              {/* Technical Interview Responses */}
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

              {/* AI Analysis Results */}
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
                    {/* Originality Results */}
                    <div id="originality-results">
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

                    {/* Correctness Results */}
                    {applicationDetails?.aiAnalysis?.correctnessScores && (
                      <div id="correctness-results">
                        <h4 className="font-bold text-lg mb-6 flex items-center gap-3 text-gray-900">
                          <Target className="h-5 w-5 text-blue-600" />
                          Technical Knowledge Assessment
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {applicationDetails?.aiAnalysis?.correctnessScores?.map(
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
                    )}

                    <Separator className="my-8" />

                    {/* Holistic / Final Recommendation */}
                    {applicationDetails?.aiAnalysis?.overallVerdict && (
                      <div id="holistic-results">
                        <h4 className="font-bold text-lg mb-6 flex items-center gap-3 text-gray-900">
                          <Award className="h-5 w-5 text-amber-600" />
                          Final AI Recommendation
                        </h4>
                        <div className="p-8 rounded-2xl bg-violet-50 border border-violet-200 shadow-sm">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-white rounded-full shadow-sm">
                              {applicationDetails?.aiAnalysis
                                ?.overallVerdict === "Highly Recommended" ? (
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
                    )}
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
