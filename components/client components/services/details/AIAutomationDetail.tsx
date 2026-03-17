"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  Brain,
  Bot,
  Zap,
  BarChart3,
  Workflow,
  Settings,
  Share2,
  Rocket,
  Gift,
  Info,
  ChevronUp,
  Activity
} from "lucide-react";
import {
  calculateAIAutomationPrice,
  solutionComplexityPrices,
  workflowPrices,
  featurePrices,
  ComplexityType,
  WorkflowType,
  FeatureType
} from "../pricing/ai-automation";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const featuresList = [
  { id: "chatbot", label: "AI Chatbot / Virtual Assistant", icon: MessageSquare },
  { id: "nlp", label: "Natural Language Processing", icon: Brain },
  { id: "ml-model", label: "Custom ML Model Training", icon: Bot },
  { id: "data-viz", label: "Data Analytics & Dashboard", icon: BarChart3 },
  { id: "auto-pilot", label: "Business Process Auto-pilot", icon: Zap },
  { id: "third-party", label: "3rd Party API Orchestration", icon: Share2 },
];

interface AIAutomationDetailProps {
  onAdd?: (cost: number, currency: string, freeBundleOption?: string) => void;
}

export function AIAutomationDetail({ onAdd }: AIAutomationDetailProps) {
  const [complexity, setComplexity] = useState<ComplexityType>("advanced");
  const [workflow, setWorkflow] = useState<WorkflowType>("fixed");
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureType[]>([]);
  const [currency, setCurrency] = useState<string>("INR");
  const [freeBundleOption, setFreeBundleOption] = useState<string | null>(null);
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);

  const aiBundles = useMemo(() => {
    return plans.filter(p => {
      const name = p.name.toLowerCase();
      return (name.includes("launch") || name.includes("essentials")) &&
        !name.includes("secure") &&
        !name.includes("security");
    });
  }, []);

  const { totalCost, baseInrCost } = useMemo(() => {
    const total = calculateAIAutomationPrice(complexity, workflow, selectedFeatures, currency);
    const baseInr = currency === "INR"
      ? total
      : calculateAIAutomationPrice(complexity, workflow, selectedFeatures, "INR");

    return { totalCost: total, baseInrCost: baseInr };
  }, [complexity, workflow, selectedFeatures, currency]);

  const toggleFeature = (featureId: FeatureType) => {
    setSelectedFeatures(current =>
      current.includes(featureId)
        ? current.filter(id => id !== featureId)
        : [...current, featureId]
    );
  };

  return (
    <div className="w-full relative z-10 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Left Column: Configuration Options */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">

          {/* Solution Complexity */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Solution Complexity
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(solutionComplexityPrices) as ComplexityType[]).map((key) => (
                  <div
                    key={key}
                    onClick={() => setComplexity(key)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${complexity === key
                        ? "bg-purple-50 border-purple-500 shadow-sm"
                        : "bg-background border-muted hover:border-purple-300"
                      }`}
                  >
                    <div className="text-sm font-bold truncate">{solutionComplexityPrices[key].label}</div>
                    <div className="text-xs text-muted-foreground mt-1">Starting from ₹{solutionComplexityPrices[key].price.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workflow Scale */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Workflow className="w-5 h-5 text-purple-600" />
                Workflow Scale
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(workflowPrices) as WorkflowType[]).map((key) => (
                  <div
                    key={key}
                    onClick={() => setWorkflow(key)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${workflow === key
                        ? "bg-purple-50 border-purple-500 shadow-sm"
                        : "bg-background border-muted hover:border-purple-300"
                      }`}
                  >
                    <div className="text-sm font-bold truncate">{workflowPrices[key].label}</div>
                    <div className="text-xs text-muted-foreground mt-1">+ ₹{workflowPrices[key].price.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Intelligent Features
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
                          ? "bg-purple-50 border-purple-500"
                          : "bg-background border-border"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleFeature(feature.id as FeatureType)}
                          className="data-[state=checked]:bg-purple-600 border-purple-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-semibold">{feature.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Summary */}
        <div className="md:col-span-5 lg:col-span-4">
          <div className="sticky top-24">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="flex flex-col space-y-1.5 p-5 border-b">
                <div className="text-xl font-semibold leading-none tracking-tight">Estimated Investment</div>
              </div>

              <div className="p-5 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full h-11 rounded-xl">
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
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600 mb-2">
                    {currency === "INR" ? "₹" : "$"}
                    {totalCost.toLocaleString()}
                  </div>

                  {baseInrCost >= 700000 && (
                    <div className="mt-6 mb-4 p-4 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 animate-in fade-in zoom-in duration-500 max-h-[400px] overflow-y-auto font-sans">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-purple-100">
                          <Gift className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-bold text-sm text-purple-700">Unlock Free AI Bundle</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4 text-left">
                        Your estimation exceeds ₹7 Lakhs. Select **one** complimentary bundle as a gift:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => setFreeBundleOption("saved")}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${freeBundleOption === "saved"
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20"
                              : "bg-background border-border hover:border-emerald-500/50"
                            }`}
                        >
                          <div className={`p-1.5 rounded-md ${freeBundleOption === "saved" ? "bg-white/20" : "bg-muted"}`}>
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold">Save for Later (Coupon)</div>
                            <div className={`text-[10px] ${freeBundleOption === "saved" ? "text-emerald-100" : "text-muted-foreground"}`}>Receive as a coupon code</div>
                          </div>
                        </button>

                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 mb-1 text-left">Select a Bundle:</div>

                        {aiBundles.map((plan) => (
                          <div key={plan.name} className="space-y-2">
                            <div
                              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all relative ${freeBundleOption === plan.name
                                  ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20"
                                  : "bg-background border-border hover:border-purple-500/50"
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
                                  <div className={`text-[10px] ${freeBundleOption === plan.name ? "text-purple-100" : "text-muted-foreground"}`}>
                                    Free Gift with AI Solution
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

                            {expandedBundle === plan.name && (
                              <div className="p-3 rounded-lg bg-white border border-border shadow-sm animate-in slide-in-from-top-2 duration-300 text-left">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">What's included:</div>
                                <ul className="space-y-1">
                                  {plan.includes.map((item, i) => (
                                    <li key={i} className="text-[10px] flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-2 pt-2 border-t border-border/50">
                                  <div className="text-[10px] italic text-muted-foreground">
                                    <span className="font-bold not-italic">Training:</span> {plan.training}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {onAdd && (
                    <Button
                      className={`w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-purple-500/20 transition-all ${baseInrCost >= 700000 && !freeBundleOption ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      onClick={() => {
                        if (baseInrCost >= 700000 && !freeBundleOption) return;
                        onAdd(totalCost, currency, freeBundleOption || undefined)
                      }}
                    >
                      {baseInrCost >= 700000 && !freeBundleOption ? "Select a Bundle first" : "Add Service"}
                    </Button>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
