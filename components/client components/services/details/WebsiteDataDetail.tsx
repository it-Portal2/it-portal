"use client";

import { useState, useMemo } from "react";
import {
  ShieldCheck,
  CreditCard,
  Globe,
  Cloud,
  Database,
  Rocket,
  Gift,
  Info,
  ChevronUp,
  Activity,
  Zap,
  MousePointer2
} from "lucide-react";
import {
  calculateWebsitePrice,
  FeatureType,
  WebsiteVars
} from "../pricing/website-dev";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { plans } from "@/lib/plan";

const featuresList = [
  { id: "auth-system", label: "Advanced Auth & Security", icon: ShieldCheck },
  { id: "payment-gate", label: "Payment Gateway Integration", icon: CreditCard },
  { id: "api-dev", label: "REST/GraphQL API Development", icon: Database },
  { id: "cloud-infra", label: "Cloud Infrastructure Setup", icon: Cloud },
  { id: "push-notif", label: "Push Notification System", icon: Zap },
  { id: "real-time", label: "Real-time Messaging/Sockets", icon: Activity },
];

interface WebsiteDataDetailProps {
  onAdd?: (cost: number, currency: string, freeBundleOption?: string) => void;
}

export function WebsiteDataDetail({ onAdd }: WebsiteDataDetailProps) {
  const [vars, setVars] = useState<WebsiteVars>({ pages: 5, seo: true });
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureType[]>([]);
  const [currency, setCurrency] = useState<string>("INR");
  const [freeBundleOption, setFreeBundleOption] = useState<string | null>(null);
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);

  const websiteBundles = useMemo(() => {
    return plans.filter(p => {
      const name = p.name.toLowerCase();
      return (name.includes("launch") || name.includes("essentials")) &&
        !name.includes("secure") &&
        !name.includes("security");
    });
  }, []);

  const { totalCost, baseInrCost } = useMemo(() => {
    const total = calculateWebsitePrice(vars, selectedFeatures, currency);
    const baseInr = currency === "INR"
      ? total
      : calculateWebsitePrice(vars, selectedFeatures, "INR");

    return { totalCost: total, baseInrCost: baseInr };
  }, [vars, selectedFeatures, currency]);

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
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Globe className="w-24 h-24" />
            </div>
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Website Configuration
              </div>
            </div>
            <div className="p-5">
              <div className="p-4 rounded-xl border bg-primary/5 border-primary/50">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] mb-2">
                      <span className="text-muted-foreground font-medium uppercase tracking-wider">Estimated Pages</span>
                      <span className="font-bold text-blue-600">{vars.pages}</span>
                    </div>
                    <Slider
                      value={[vars.pages]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={(v) => setVars(prev => ({ ...prev, pages: v[0] }))}
                      className="**:data-[slot=slider-track]:bg-muted-foreground/30"
                    />
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setVars(prev => ({ ...prev, seo: !prev.seo }))}>
                      <Checkbox
                        checked={vars.seo}
                        onCheckedChange={() => setVars(prev => ({ ...prev, seo: !prev.seo }))}
                        className="data-[state=checked]:bg-blue-600 w-4 h-4"
                      />
                      <span className="text-xs font-semibold">Advanced SEO Setup</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">+₹15,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
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
                        <span className="font-bold text-sm text-blue-700">Unlock Free Dev Bundle</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4 text-left">
                        Selection above ₹5 Lakhs unlocks a complimentary bundle gift:
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
                            <div className={`text-[10px] ${freeBundleOption === "saved" ? "text-emerald-100" : "text-muted-foreground"}`}>Use for future maintenance</div>
                          </div>
                        </button>

                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 mb-1 text-left">Select a Bundle:</div>

                        {websiteBundles.map((plan) => (
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
                                    Free with Website Dev
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
                                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Included:</div>
                                <ul className="space-y-1">
                                  {plan.includes.map((item, i) => (
                                    <li key={i} className="text-[10px] flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-2 pt-2 border-t border-border/50">
                                  <div className="text-[10px] italic text-muted-foreground text-center">
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
                      className={`w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-blue-500/20 transition-all ${baseInrCost >= 500000 && !freeBundleOption ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      onClick={() => {
                        if (baseInrCost >= 500000 && !freeBundleOption) return;
                        onAdd(totalCost, currency, freeBundleOption || undefined)
                      }}
                    >
                      Buy Service
                    </Button>
                  )}
                  <div className="text-xs text-muted-foreground mt-4">
                    *Rough estimate. Final cost subject to exact requirements review.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border bg-card/50 text-sm text-muted-foreground">
              <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Why Build with Cehpoint?
              </h4>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                  Security-First Architecture by Default
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0"></div>
                  High-Performance Modern Tech Stack
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></div>
                  Cloud Native & Infinite Scalability
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
