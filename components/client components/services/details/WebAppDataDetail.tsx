"use client";

import { useState, useMemo } from "react";
import {
  Monitor,
  Smartphone,
  Cpu,
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
  MonitorSmartphone,
  Zap,
  Layout,
  MousePointer2
} from "lucide-react";
import {
  calculateWebAppDevPrice,
  projectComplexityPrices,
  featurePrices,
  ProjectComplexity,
  FeatureType,
  WebVars,
  MobileVars
} from "../pricing/web-app-dev";
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

interface WebAppDataDetailProps {
  onAdd?: (cost: number, currency: string, freeBundleOption?: string) => void;
}

export function WebAppDataDetail({ onAdd }: WebAppDataDetailProps) {
  const [complexity, setComplexity] = useState<ProjectComplexity>("advanced");
  const [webVars, setWebVars] = useState<WebVars>({ enabled: true, pages: 5, seo: true });
  const [mobileVars, setMobileVars] = useState<MobileVars>({ enabled: false, screens: 8, platform: "single" });
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureType[]>([]);
  const [currency, setCurrency] = useState<string>("INR");
  const [freeBundleOption, setFreeBundleOption] = useState<string | null>(null);
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);

  const webAppBundles = useMemo(() => {
    return plans.filter(p => {
      const name = p.name.toLowerCase();
      return (name.includes("launch") || name.includes("essentials")) &&
        !name.includes("secure") &&
        !name.includes("security");
    });
  }, []);

  const { totalCost, baseInrCost } = useMemo(() => {
    const total = calculateWebAppDevPrice(complexity, webVars, mobileVars, selectedFeatures, currency);
    const baseInr = currency === "INR"
      ? total
      : calculateWebAppDevPrice(complexity, webVars, mobileVars, selectedFeatures, "INR");

    return { totalCost: total, baseInrCost: baseInr };
  }, [complexity, webVars, mobileVars, selectedFeatures, currency]);

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

          {/* Solution Profile */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Layout className="w-5 h-5 text-blue-600" />
                Solution Profile
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Define the complexity and core nature of your application
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(projectComplexityPrices) as ProjectComplexity[]).map((key) => (
                  <div
                    key={key}
                    onClick={() => setComplexity(key)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${complexity === key
                        ? "bg-blue-50 border-blue-600 shadow-sm"
                        : "bg-background border-muted hover:border-blue-400"
                      }`}
                  >
                    <div className="text-sm font-bold truncate">{projectComplexityPrices[key].label}</div>
                    <div className="text-xs text-muted-foreground mt-1">Base: ₹{projectComplexityPrices[key].price.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Development Assets */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <MonitorSmartphone className="w-24 h-24" />
            </div>
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <MonitorSmartphone className="w-5 h-5 text-blue-600" />
                Target Assets
              </div>
               <div className="text-sm text-muted-foreground mt-1">
                Select and configure the platforms you want to build for
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {/* Website Asset */}
                <div className={`p-4 rounded-xl border transition-all duration-300 w-full ${webVars.enabled ? "bg-primary/5 border-primary/50" : "bg-background border-border"}`}>
                   <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-background/50 text-blue-600 shadow-sm border border-blue-100`}>
                          <Globe className="w-5 h-5" />
                        </div>
                        <label
                          className="text-sm leading-none font-bold cursor-pointer"
                          onClick={() => setWebVars(prev => ({...prev, enabled: !prev.enabled}))}
                        >
                          Website Development
                        </label>
                      </div>
                      <Checkbox
                        checked={webVars.enabled}
                        onCheckedChange={() => setWebVars(prev => ({...prev, enabled: !prev.enabled}))}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>

                    {webVars.enabled && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2 space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] mb-2">
                            <span className="text-muted-foreground font-medium uppercase tracking-wider">Estimated Pages</span>
                            <span className="font-bold text-blue-600">{webVars.pages}</span>
                          </div>
                          <Slider
                            value={[webVars.pages]}
                            min={1}
                            max={50}
                            step={1}
                            onValueChange={(v) => setWebVars(prev => ({ ...prev, pages: v[0] }))}
                            className="**:data-[slot=slider-track]:bg-muted-foreground/30"
                          />
                        </div>

                        <div className="pt-2 border-t flex items-center justify-between">
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setWebVars(prev => ({...prev, seo: !prev.seo}))}>
                             <Checkbox
                              checked={webVars.seo}
                              onCheckedChange={() => setWebVars(prev => ({...prev, seo: !prev.seo}))}
                              className="data-[state=checked]:bg-blue-600 w-4 h-4"
                            />
                            <span className="text-xs font-semibold">Advanced SEO Setup</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">+₹15,000</span>
                        </div>
                      </div>
                    )}
                </div>

                {/* Mobile Asset */}
                <div className={`p-4 rounded-xl border transition-all duration-300 w-full ${mobileVars.enabled ? "bg-primary/5 border-primary/50" : "bg-background border-border"}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-background/50 text-indigo-600 shadow-sm border border-indigo-100`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <label
                        className="text-sm leading-none font-bold cursor-pointer"
                        onClick={() => setMobileVars(prev => ({...prev, enabled: !prev.enabled}))}
                      >
                        Mobile App Development
                      </label>
                    </div>
                    <Checkbox
                      checked={mobileVars.enabled}
                      onCheckedChange={() => setMobileVars(prev => ({...prev, enabled: !prev.enabled}))}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  {mobileVars.enabled && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] mb-2">
                          <span className="text-muted-foreground font-medium uppercase tracking-wider">Estimated Screens</span>
                          <span className="font-bold text-blue-600">{mobileVars.screens}</span>
                        </div>
                        <Slider
                          value={[mobileVars.screens]}
                          min={5}
                          max={80}
                          step={1}
                          onValueChange={(v) => setMobileVars(prev => ({ ...prev, screens: v[0] }))}
                          className="**:data-[slot=slider-track]:bg-muted-foreground/30"
                        />
                      </div>

                      <div className="pt-2 border-t space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Platform</label>
                        <Select value={mobileVars.platform} onValueChange={(v: "single" | "both") => setMobileVars(prev => ({ ...prev, platform: v }))}>
                          <SelectTrigger className="w-full h-8 text-[11px]">
                            <SelectValue placeholder="Platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single (iOS or Android)</SelectItem>
                            <SelectItem value="both">Both (Cross-Platform / Hybrid)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {webVars.enabled && mobileVars.enabled && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Rocket className="w-4 h-4" />
                    <span className="text-xs font-bold">Bundle Discount Applied!</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600">15% OFF SAVINGS</span>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
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

        {/* Right Column: Pricing Summary */}
        <div className="md:col-span-5 lg:col-span-4 lg:pl-4">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-xl border bg-card text-card-foreground shadow-md ring-1 ring-blue-500/10 relative overflow-hidden">
               <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
              <div className="flex flex-col space-y-1.5 p-5 border-b bg-background/50">
                <div className="text-xl font-semibold leading-none tracking-tight">Estimated Investment</div>
                 <div className="text-sm text-muted-foreground mt-1">Indicative Estimation</div>
              </div>

              <div className="p-5 space-y-6 relative z-10 bg-background/50">
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
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600 mb-2">
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

                        {webAppBundles.map((plan) => (
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
                                    Free with Web \u0026 App
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

            {/* Why Choose Cehpoint Panel */}
            <div className="p-5 rounded-xl border bg-card/50 text-sm text-muted-foreground">
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
                  High-Performance Modern Tech Stack (Next.js/Flutter)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></div>
                  Cloud Native \u0026 Infinite Scalability
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0"></div>
                  Dedicated PM \u0026 24/7 Quality Assurance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
