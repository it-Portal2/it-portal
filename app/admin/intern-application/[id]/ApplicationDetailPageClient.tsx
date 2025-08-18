"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
import { AIVerdict, Application, ApplicationStatus } from "@/lib/types";

const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const statusConfig = {
    pending: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
      label: "Under Review",
    },
    accepted: {
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Accepted",
    },
    rejected: {
      color: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle,
      label: "Rejected",
    },
    "ai-verdict": {
      color: "bg-violet-50 text-violet-700 border-violet-200",
      icon: Brain,
      label: "AI Analyzed",
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
  applicationDetails: Application;
  error: string | null;
}

export default function ApplicationDetailPageClient({
  applicationDetails,
  error,
}: ApplicationDetailClientProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [application, setApplication] =
    useState<Application>(applicationDetails);

  const handleAccept = () => {
    setApplication((prev) => ({ ...prev, applicationStatus: "accepted" }));
  };

  const handleReject = () => {
    setApplication((prev) => ({ ...prev, applicationStatus: "rejected" }));
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setApplication((prev) => ({
        ...prev,
        aiAnalysisStatus: "analyzed",
        overallScore: 8.7,
        aiAnalysis: {
          originalityScores: [
            {
              question: 1,
              score: 85,
              reasoning:
                "Demonstrates authentic personal experience with specific technical implementations and real-world project examples. Shows genuine understanding beyond textbook knowledge.",
            },
            {
              question: 2,
              score: 92,
              reasoning:
                "Presents a comprehensive and methodical debugging approach with practical tool usage. Indicates systematic thinking and professional development practices.",
            },
            {
              question: 3,
              score: 78,
              reasoning:
                "Solid technical foundation with practical implementation details, though some phrasing follows common industry patterns. Shows real hands-on experience.",
            },
          ],
          correctnessScores: [
            {
              question: 1,
              score: 8.8,
              reasoning:
                "Excellent grasp of React concepts including hooks, context API, and performance optimization. Mentions advanced topics like WebSocket integration and React.memo usage correctly.",
            },
            {
              question: 2,
              score: 9.2,
              reasoning:
                "Comprehensive debugging methodology covering all major aspects from reproduction to testing. Demonstrates professional-level problem-solving approach with proper tooling knowledge.",
            },
            {
              question: 3,
              score: 8.3,
              reasoning:
                "Strong understanding of REST principles, HTTP methods, and API implementation. Covers security aspects with JWT and proper error handling practices.",
            },
          ],
          overallVerdict: "Highly Recommended" as AIVerdict,
          aiRecommendation:
            "Exceptional candidate demonstrating both theoretical knowledge and practical experience. Responses show genuine understanding, systematic thinking, and professional development practices. Strong technical foundation with evidence of real-world application. Minor improvement areas in API security best practices, but overall demonstrates excellent problem-solving capabilities and growth potential. Recommend immediate progression to technical interview.",
        },
      }));
      setIsAnalyzing(false);
    }, 3000);
  };

  const safeDisplay = (value: any, fallback = "N/A") => {
    return value && value !== "" ? value : fallback;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/50 flex items-center justify-center">
        <Card className="max-w-md w-full">
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

  return (
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
              {safeDisplay(application.fullName)}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <StatusBadge status={application.applicationStatus} />
              {application.overallScore && (
                <Badge
                  variant="outline"
                  className="font-mono bg-violet-50 text-violet-700 border-violet-200"
                >
                  Overall Score: {application.overallScore.toFixed(1)}/10
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleAccept}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
              disabled={application.applicationStatus === "accepted"}
            >
              <CheckCircle className="h-4 w-4" />
              Accept Candidate
            </Button>

            <Button
              onClick={handleReject}
              variant="destructive"
              className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg"
              disabled={application.applicationStatus === "rejected"}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>

            <Button
              onClick={handleAIAnalysis}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg"
              disabled={
                isAnalyzing || application.aiAnalysisStatus === "analyzed"
              }
            >
              <Brain className="h-4 w-4" />
              {isAnalyzing ? "Analyzing..." : "AI Deep Analysis"}
            </Button>
          </div>
        </div>
      </div>

      <div>
        {application.aiAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <CircularProgress
                  value={application.overallScore! * 10}
                  size={80}
                  color="primary"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {application.overallScore!.toFixed(1)}
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
                    application.aiAnalysis.originalityScores.reduce(
                      (acc, curr) => acc + curr.score,
                      0
                    ) / 3
                  }
                  size={80}
                  color="success"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-700">
                      {Math.round(
                        application.aiAnalysis.originalityScores.reduce(
                          (acc, curr) => acc + curr.score,
                          0
                        ) / 3
                      )}
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
                    (application.aiAnalysis.correctnessScores.reduce(
                      (acc, curr) => acc + curr.score,
                      0
                    ) /
                      3) *
                    10
                  }
                  size={80}
                  color="primary"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {(
                        application.aiAnalysis.correctnessScores.reduce(
                          (acc, curr) => acc + curr.score,
                          0
                        ) / 3
                      ).toFixed(1)}
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
                  {application.aiAnalysis.overallVerdict ===
                  "Highly Recommended" ? (
                    <Award className="h-12 w-12 text-amber-500" />
                  ) : application.aiAnalysis.overallVerdict ===
                    "Recommended" ? (
                    <ThumbsUp className="h-12 w-12 text-green-500" />
                  ) : application.aiAnalysis.overallVerdict ===
                    "Not Recommended" ? (
                    <ThumbsDown className="h-12 w-12 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-12 w-12 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {safeDisplay(application.aiAnalysis.overallVerdict)}
                </p>
                <p className="text-xs text-gray-500 mt-1">AI Recommendation</p>
              </CardContent>
            </Card>
          </div>
        )}

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
                    {safeDisplay(application.email)}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {safeDisplay(application.phone)}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Linkedin className="h-4 w-4 text-gray-500" />
                  {application.linkedin ? (
                    <a
                      href={application.linkedin}
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
                      {application.createdAt
                        ? new Date(application.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Start Date
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">
                      {safeDisplay(application.startDate?.replace("-", " "))}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Expected Stipend
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      ₹{safeDisplay(application.stipendExpectation)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Weekly Hours
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {safeDisplay(application.weeklyCommitment)} hrs/week
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Trial Period
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">
                    {safeDisplay(application.trialAccepted)}
                  </p>
                </div>

                {application.additionalComments && (
                  <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                    <span className="text-xs font-medium text-violet-600 uppercase tracking-wide">
                      Additional Comments
                    </span>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      {application.additionalComments}
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
                      {safeDisplay(application.resumeAnalysis?.education)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-sm text-purple-800 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Professional Experience
                    </h4>
                    <p className="text-sm text-gray-700">
                      {safeDisplay(application.resumeAnalysis?.experience)}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-sm text-green-800 mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Technical Skills Portfolio
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {application.resumeAnalysis?.skills?.length ? (
                      application.resumeAnalysis.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-white/80 text-gray-700 border border-gray-200"
                        >
                          {skill}
                        </Badge>
                      ))
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
                    {safeDisplay(application.resumeAnalysis?.summary)}
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
                {application.questionsAndAnswers?.length ? (
                  application.questionsAndAnswers.map((qa, index) => (
                    <div
                      key={index}
                      className=""
                    >
                      <h4 className="font-semibold text-sm mb-4 text-indigo-900 flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        {qa.question}
                      </h4>
                      <div className="ml-9 p-4 bg-white rounded-lg border-2 border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed">
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

            {application.aiAnalysis && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <Brain className="h-5 w-5 text-violet-600" />
                    </div>
                    AI-Powered Assessment Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-3 text-gray-900">
                      <Shield className="h-5 w-5 text-emerald-600" />
                      Response Authenticity Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {application.aiAnalysis.originalityScores.map(
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
                      {application.aiAnalysis.correctnessScores.map(
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
                          {application.aiAnalysis.overallVerdict ===
                          "Highly Recommended" ? (
                            <Award className="h-8 w-8 text-amber-500" />
                          ) : application.aiAnalysis.overallVerdict ===
                            "Recommended" ? (
                            <ThumbsUp className="h-8 w-8 text-green-500" />
                          ) : application.aiAnalysis.overallVerdict ===
                            "Not Recommended" ? (
                            <ThumbsDown className="h-8 w-8 text-red-500" />
                          ) : (
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-2xl font-bold text-gray-900 mb-1">
                            {safeDisplay(application.aiAnalysis.overallVerdict)}
                          </h5>
                          <p className="text-sm text-violet-600 font-medium">
                            AI Assessment Verdict
                          </p>
                        </div>
                      </div>
                      <div className="p-6 bg-white/80 rounded-xl border border-white/50">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {safeDisplay(application.aiAnalysis.aiRecommendation)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAnalyzing && (
              <Card >
                <CardContent className="p-12 text-center">
                  <div className="relative mb-8">
                    <CircularProgress value={66} size={120} color="primary">
                      <Brain className="h-8 w-8 text-violet-600 animate-pulse" />
                    </CircularProgress>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    AI Deep Analysis in Progress
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                    Our advanced AI is analyzing response authenticity,
                    technical accuracy, and overall candidate fit using
                    sophisticated natural language processing...
                  </p>
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
