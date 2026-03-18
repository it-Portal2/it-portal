"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Cloud,
  Database,
  Rocket,
  Gift,
  Info,
  ChevronUp,
  Activity,
  Zap,
  MousePointer2,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  CircleCheck
} from "lucide-react";
import {
  calculateMobilePrice,
  FeatureType,
  MobileVars,
  MOBILE_TYPE,
  PLATFORM_OPTION,
} from "../pricing/mobile-app-dev";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { plans } from "@/lib/plan";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const featuresList = [
  { id: "auth-system", label: "Advanced Auth & Security", icon: ShieldCheck },
  { id: "payment-gate", label: "Payment Gateway Integration", icon: CreditCard },
  { id: "api-dev", label: "REST/GraphQL API Development", icon: Database },
  { id: "cloud-infra", label: "Cloud Infrastructure Setup", icon: Cloud },
  { id: "push-notif", label: "Push Notification System", icon: Zap },
  { id: "real-time", label: "Real-time Messaging/Sockets", icon: Activity },
];

interface MobileAppDataDetailProps {
  onAdd: (cost: number, currency: string, freeBundleOption?: string) => void;
}

export function MobileAppDataDetail({ onAdd }: MobileAppDataDetailProps) {
  const [appCategory, setAppCategory] = useState<"custom" | "prebuilt">("custom");
  const [vars, setVars] = useState<MobileVars>({ type: MOBILE_TYPE.CUSTOM, platform: PLATFORM_OPTION.SINGLE });
  const [platformOption, setPlatformOption] = useState<"android" | "ios" | "both">("android");
  const [budgetSatisfied, setBudgetSatisfied] = useState<boolean | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureType[]>([]);
  const [currency, setCurrency] = useState<string>("INR");
  const [freeBundleOption, setFreeBundleOption] = useState<string | null>(null);
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);

  // Update vars based on satisfaction and platform option
  useEffect(() => {
    if (budgetSatisfied === false) {
      setVars({ type: MOBILE_TYPE.PWA, platform: PLATFORM_OPTION.SINGLE });
    } else {
      setVars({ type: MOBILE_TYPE.CUSTOM, platform: platformOption === "both" ? PLATFORM_OPTION.BOTH : PLATFORM_OPTION.SINGLE });
    }
  }, [budgetSatisfied, platformOption]);

  const mobileBundles = useMemo(() => {
    return plans.filter(p => {
      const name = p.name.toLowerCase();
      return (name.includes("launch") || name.includes("essentials")) &&
        !name.includes("secure") &&
        !name.includes("security");
    });
  }, []);

  const { totalCost, baseInrCost } = useMemo(() => {
    const total = calculateMobilePrice(vars, selectedFeatures, currency);
    const baseInr = currency === "INR"
      ? total
      : calculateMobilePrice(vars, selectedFeatures, "INR");

    return { totalCost: total, baseInrCost: baseInr };
  }, [vars, selectedFeatures, currency]);

  const toggleFeature = (featureId: FeatureType) => {
    setSelectedFeatures(current =>
      current.includes(featureId)
        ? current.filter(id => id !== featureId)
        : [...current, featureId]
    );
  };

  const getTechLabel = () => {
    if (vars.type === "pwa") return "Progressive Web App (Web Tech)";
    if (platformOption === "android") return "Kotlin (Native Android)";
    if (platformOption === "ios") return "Swift (Native iOS)";
    return "Flutter / React Native (Cross-Platform)";
  };

  return (
    <div className="w-full relative z-10 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 lg:col-span-8 space-y-6">

          {/* Main Category Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setAppCategory("custom");
                setBudgetSatisfied(null);
                setSelectedFeatures([]);
              }}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${appCategory === "custom" ? "bg-blue-600/5 border-blue-600 shadow-md" : "bg-card border-border hover:border-blue-400/50"}`}
            >
              <Smartphone className={`w-6 h-6 ${appCategory === "custom" ? "text-blue-600" : "text-muted-foreground"}`} />
              <div className="text-center">
                <div className="font-bold text-sm">Custom App</div>
                <div className="text-xs text-muted-foreground">Built from scratch</div>
              </div>
            </button>
            <button
              onClick={() => {
                setAppCategory("prebuilt");
                setBudgetSatisfied(null);
                setSelectedFeatures([]);
              }}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${appCategory === "prebuilt" ? "bg-indigo-600/5 border-indigo-600 shadow-md" : "bg-card border-border hover:border-indigo-400/50"}`}
            >
              <Rocket className={`w-6 h-6 ${appCategory === "prebuilt" ? "text-indigo-600" : "text-muted-foreground"}`} />
              <div className="text-center">
                <div className="font-bold text-sm">Pre-built App</div>
                <div className="text-xs text-muted-foreground">Industry Solutions</div>
              </div>
            </button>
          </div>

          {appCategory === "prebuilt" ? (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-4 rounded-full bg-indigo-100/50">
                <Rocket className="w-12 h-12 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Explore Our Business App Catalog</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Choose from our optimized industry solutions to get your business online faster and at a fraction of the cost.
                </p>
              </div>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl font-bold gap-2">
                <a href="https://www.cehpoint.co.in/services/business-app-catalog" target="_blank" rel="noopener noreferrer">
                  View Catalog <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Platform Selection */}
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between">
                  <div className="text-lg font-bold flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    Select App Platform
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {getTechLabel()}
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "android", label: "Android", sub: "Kotlin" },
                      { id: "ios", label: "iOS", sub: "Swift" },
                      { id: "both", label: "Both Platforms", sub: "Flutter / React Native" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setPlatformOption(opt.id as any);
                          setBudgetSatisfied(null);
                          setSelectedFeatures([]);
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all relative ${platformOption === opt.id ? "bg-blue-600 border-blue-600 text-white" : "bg-background border-border hover:border-blue-400"}`}
                      >
                        <div className="font-bold text-sm">{opt.label}</div>
                        <div className={`text-[10px] ${platformOption === opt.id ? "text-blue-100" : "text-muted-foreground"}`}>{opt.sub}</div>
                        {platformOption === opt.id && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Budget Check */}
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="p-6 space-y-4">
                  <div className="text-center font-bold text-base">Does this budget align with your project goals?</div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setBudgetSatisfied(true)}
                      className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm transition-all ${budgetSatisfied === true ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-background border-border hover:border-blue-500"}`}
                    >
                      Yes, proceed
                    </button>
                    <button
                      onClick={() => setBudgetSatisfied(false)}
                      className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm transition-all ${budgetSatisfied === false ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-background border-border hover:border-blue-500"}`}
                    >
                      No, show options
                    </button>
                  </div>
                </div>
              </div>

              {budgetSatisfied === false && (
                <div className="rounded-xl border-2 border-dashed border-blue-600/30 bg-blue-600/5 p-6 space-y-4 animate-in zoom-in duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                    <Zap className="w-16 h-16 text-blue-600" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Special Offer</span>
                      <h3 className="font-black text-xl text-blue-700">Congratulations! Get a PWA App for just ₹15,000</h3>
                    </div>
                    <p className="text-sm text-blue-900/70 font-medium mb-4 flex items-center gap-2">
                      Perfect for quick market entry with full mobile capabilities.
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-1 hover:bg-blue-200/50 rounded-full transition-colors cursor-help">
                              <HelpCircle className="w-4 h-4 text-blue-600" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-3">
                            <p className="text-xs font-bold mb-1">What is a PWA?</p>
                            <p className="text-[10px] leading-relaxed">
                              Progressive Web Apps work like regular apps but run on web tech. They are installable, work offline, and support push notifications, but cost fraction of native development.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-blue-800">
                      <span className="flex items-center gap-1"><CircleCheck className="w-4 h-4" /> Installable</span>
                      <span className="flex items-center gap-1"><CircleCheck className="w-4 h-4" /> Push Notifications</span>
                      <span className="flex items-center gap-1"><CircleCheck className="w-4 h-4" /> Lightning Fast</span>
                    </div>
                  </div>
                </div>
              )}

              {budgetSatisfied === true && (
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm animate-in fade-in slide-in-from-top-4">
                  <div className="flex flex-col space-y-1.5 p-5 border-b">
                    <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                      <MousePointer2 className="w-5 h-5 text-blue-600" />
                      Additional Modules
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {featuresList.map((feature) => {
                        const isChecked = selectedFeatures.includes(feature.id as FeatureType);
                        const Icon = feature.icon;

                        return (
                          <div
                            key={feature.id}
                            onClick={() => toggleFeature(feature.id as FeatureType)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${isChecked
                              ? "bg-muted/50 border-blue-600"
                              : "bg-background border-border"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleFeature(feature.id as FeatureType)}
                                className="data-[state=checked]:bg-blue-600"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-bold">{feature.label}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-5 lg:col-span-4 lg:pl-4">
          <div className="sticky top-0 space-y-6">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="flex flex-col space-y-1.5 p-5 border-b">
                <div className="text-xl font-semibold leading-none tracking-tight">Estimated Investment</div>
                <div className="text-sm text-muted-foreground mt-1">Indicative Estimation</div>
              </div>

              <div className="p-5 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full bg-background border-input">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-5 border-t text-center">
                  <div className="text-sm text-muted-foreground mb-1 font-medium">Total Estimated Cost</div>
                  <div className="text-4xl font-black text-foreground mb-2">
                    {currency === "INR" ? "₹" : "$"}
                    {totalCost.toLocaleString()}
                  </div>

                  {baseInrCost >= 500000 && (
                    <div className="mt-6 mb-4 p-4 rounded-xl border-2 border-dashed border-blue-600/30 bg-blue-600/5 animate-in fade-in zoom-in duration-500 max-h-[400px] overflow-y-auto font-sans">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-blue-600/20">
                          <Gift className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-bold text-sm text-blue-700">Unlock Free Bundle</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4 text-left">
                        High-value selection unlocks a complimentary gift:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {mobileBundles.map((plan) => (
                          <div key={plan.name} className="space-y-2">
                            <div
                              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all relative ${freeBundleOption === plan.name
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                : "bg-background border-border hover:border-blue-500/50"
                                }`}
                            >
                              <div
                                onClick={() => setFreeBundleOption(plan.name)}
                                className="flex-1 flex items-center gap-3 cursor-pointer"
                              >
                                <div className={`p-1.5 rounded-md ${freeBundleOption === plan.name ? "bg-white/20" : "bg-muted"}`}>
                                  <Rocket className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold">{plan.name}</div>
                                  <div className={`text-[10px] ${freeBundleOption === plan.name ? "text-blue-100" : "text-muted-foreground"}`}>
                                    Free Gift
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => setExpandedBundle(expandedBundle === plan.name ? null : plan.name)}
                                className={`p-2 rounded-md transition-colors ${freeBundleOption === plan.name
                                  ? "hover:bg-white/10 text-white"
                                  : "hover:bg-muted text-muted-foreground"
                                  }`}
                                title="View Details"
                              >
                                {expandedBundle === plan.name ? <ChevronUp className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {appCategory === "custom" && (
                    <Button
                      className={`w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-blue-500/20 transition-all ${baseInrCost >= 600000 && !freeBundleOption ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      onClick={() => {
                        if (baseInrCost >= 600000 && !freeBundleOption) return;
                        onAdd(totalCost, currency, freeBundleOption || undefined);
                      }}
                    >
                      {baseInrCost >= 600000 && !freeBundleOption ? "Select a Bundle first" : "Buy Service"}
                    </Button>
                  )}
                  {appCategory === "prebuilt" && (
                    <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-sm font-medium text-indigo-700">
                      Choose your idea and View Catalog to purchase pre-built solutions.
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-4">
                    *Rough estimate. Final cost subject to exact requirements review.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border bg-card/50 text-sm text-muted-foreground text-left">
              <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Why Build with Cehpoint?
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                  Security-First Architecture by Default
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0"></div>
                  Modern Tech: Kotlin, Swift, Flutter
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></div>
                  Expert Deployment & Maintenance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
