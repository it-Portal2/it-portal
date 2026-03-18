"use client";

import { useState, useMemo } from "react";
import {
  Search,
  FileText,
  ShieldAlert,
  Scale,
  HardDrive,
  Terminal,
  Lock,
  UserCheck,
  Rocket,
  Gift,
  Info,
  ChevronUp,
  Activity,
  ShieldCheck,
  Database,
  Binary,
  Eye,
  Gavel,
} from "lucide-react";
import {
  calculateCyberCrimePrice,
  investigationLevelPrices,
  priorityPrices,
  LevelType,
  PriorityType,
  FeatureType,
  INVESTIGATION_LEVEL,
  INVESTIGATION_PRIORITY,
  INVESTIGATION_FEATURES
} from "../pricing/cyber-crime";
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


const featuresList = [
  { id: INVESTIGATION_FEATURES.DATA_RECOVERY, label: "Advanced Data Recovery", icon: Database },
  { id: INVESTIGATION_FEATURES.FORENSIC_REPORT, icon: FileText, label: "Court-Admissible Report" },
  { id: INVESTIGATION_FEATURES.EXPERT_WITNESS, icon: Scale, label: "Expert Witness Testimony" },
  { id: INVESTIGATION_FEATURES.MALWARE_ANALYSIS, icon: Binary, label: "Deep Malware Analysis" },
  { id: INVESTIGATION_FEATURES.DARK_WEB, icon: Eye, label: "Dark Web Surveillance" },
  { id: INVESTIGATION_FEATURES.LEGAL_COORD, icon: Gavel, label: "Legal & Law Enforcement Liaison" },
];

interface CyberCrimeDetailProps {
  onAdd: (cost: number, currency: string, freeBundleOption?: string) => void;
}

export function CyberCrimeDetail({ onAdd }: CyberCrimeDetailProps) {
  const [level, setLevel] = useState<LevelType>(INVESTIGATION_LEVEL.INITIAL);
  const [priority, setPriority] = useState<PriorityType>(INVESTIGATION_PRIORITY.NORMAL);
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureType[]>([]);
  const [currency, setCurrency] = useState<string>("INR");
  const [freeBundleOption, setFreeBundleOption] = useState<string | null>(null);
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);

  const securityBundles = useMemo(() => {
    return plans.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("secure") || name.includes("security");
    });
  }, []);

  const { totalCost, baseInrCost } = useMemo(() => {
    const total = calculateCyberCrimePrice(level, priority, selectedFeatures, currency);
    const baseInr = currency === "INR"
      ? total
      : calculateCyberCrimePrice(level, priority, selectedFeatures, "INR");

    return { totalCost: total, baseInrCost: baseInr };
  }, [level, priority, selectedFeatures, currency]);

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

          {/* Investigation Level */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-700" />
                Investigation Depth
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(investigationLevelPrices) as LevelType[]).map((key) => (
                  <div
                    key={key}
                    onClick={() => setLevel(key)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${level === key
                      ? "bg-slate-100 border-slate-700 shadow-sm"
                      : "bg-background border-muted hover:border-slate-400"
                      }`}
                  >
                    <div className="text-sm font-bold truncate">{investigationLevelPrices[key].label}</div>
                    <div className="text-xs text-muted-foreground mt-1">Starting from ₹{investigationLevelPrices[key].price.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Response Priority */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-slate-700" />
                Response Priority
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(priorityPrices) as PriorityType[]).map((key) => (
                  <div
                    key={key}
                    onClick={() => setPriority(key)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${priority === key
                      ? "bg-slate-100 border-slate-700 shadow-sm"
                      : "bg-background border-muted hover:border-slate-400"
                      }`}
                  >
                    <div className="text-sm font-bold truncate">{priorityPrices[key].label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{priorityPrices[key].price > 0 ? `+ ₹${priorityPrices[key].price.toLocaleString()}` : "Included"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Forensic Features */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Terminal className="w-5 h-5 text-slate-700" />
                Forensic Capabilities
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
                        ? "bg-slate-100 border-slate-700"
                        : "bg-background border-border"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleFeature(feature.id as FeatureType)}
                          className="data-[state=checked]:bg-slate-700 border-slate-700"
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
          <div className="sticky top-0 space-y-6">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="flex flex-col space-y-1.5 p-5 border-b">
                <div className="text-xl font-semibold leading-none tracking-tight">Estimated Investment</div>
                <div className="text-sm text-muted-foreground mt-1">Indicative Estimation</div>
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
                  <div className="text-4xl font-black text-foreground mb-2">
                    {currency === "INR" ? "₹" : "$"}
                    {totalCost.toLocaleString()}
                  </div>

                  {baseInrCost >= 600000 && (
                    <div className="mt-6 mb-4 p-4 rounded-xl border-2 border-dashed border-blue-600/30 bg-blue-600/5 animate-in fade-in zoom-in duration-500 max-h-[400px] overflow-y-auto font-sans">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-blue-100">
                          <Gift className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-bold text-sm text-blue-700">Unlock Free Security Bundle</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4 text-left">
                        Your estimation exceeds ₹6 Lakhs. Select **one** complimentary bundle as a gift:
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

                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 mb-1 text-left">Select a Security Bundle:</div>

                        {securityBundles.map((plan) => (
                          <div key={plan.name} className="space-y-2">
                            <div
                              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all relative ${freeBundleOption === plan.name
                                ? "bg-blue-600 border-blue-600 text-slate-100 shadow-md shadow-blue-500/20"
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
                                    Free Gift with Investigation
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
                                      <div className="w-1 h-1 rounded-full bg-blue-500"></div>
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

                  <Button
                    className={`w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-blue-500/20 transition-all ${baseInrCost >= 600000 && !freeBundleOption ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    onClick={() => {
                      if (baseInrCost >= 600000 && !freeBundleOption) return;
                      onAdd(totalCost, currency, freeBundleOption || undefined)
                    }}
                  >
                    {baseInrCost >= 600000 && !freeBundleOption ? "Select a Bundle first" : "Buy Service"}
                  </Button>
                  <div className="text-xs text-muted-foreground mt-4">
                    *Rough estimate. Final cost subject to exact requirements review.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border bg-card/50 text-sm text-muted-foreground">
              <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Why Choose Cehpoint?
              </h4>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                  Certified Forensic Investigators (CHFI)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0"></div>
                  Legal & Law Enforcement Collaboration
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></div>
                  Confidential & Evidence-Grade Reporting
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
