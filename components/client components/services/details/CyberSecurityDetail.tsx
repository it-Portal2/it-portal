import { useState, useMemo } from "react";
import {
  Server,
  ShieldCheck,
  Globe,
  Smartphone,
  Wifi,
  Cloud,
  Code,
  Activity,
  FileCheck,
  MessageCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  complexityPrices,
  hostingPrices,
  vaptPrices,
  compliancePrices,
  calculateCybersecurityPrice,
  TechComplexityType,
  HostingEnvType,
  VaptFeatureType,
  ComplianceType,
} from "../pricing/cybersecurity";

export function CyberSecurityDetail() {
  const [complexity, setComplexity] = useState<TechComplexityType>("dynamic");
  const [hosting, setHosting] = useState<HostingEnvType>("cloud");
  const [vaptSelected, setVaptSelected] = useState<VaptFeatureType[]>(["web"]);
  const [webVars, setWebVars] = useState({ quantity: 1, subdomains: 0 });
  const [mobileVars, setMobileVars] = useState({ quantity: 1, platforms: 1 });
  const [socEndpoints, setSocEndpoints] = useState(0);
  const [compliance, setCompliance] = useState<ComplianceType>("none");
  const [currency, setCurrency] = useState("INR");

  const totalCost = useMemo(
    () =>
      calculateCybersecurityPrice(
        complexity,
        hosting,
        vaptSelected,
        webVars,
        mobileVars,
        socEndpoints,
        compliance,
        currency
      ),
    [complexity, hosting, vaptSelected, webVars, mobileVars, socEndpoints, compliance, currency]
  );

  const toggleVapt = (feature: VaptFeatureType) => {
    setVaptSelected((current) =>
      current.includes(feature)
        ? current.filter((f) => f !== feature)
        : [...current, feature]
    );
  };

  const vaptIcons: Record<VaptFeatureType, React.ReactNode> = {
    web: <Globe className="w-5 h-5" />,
    mobile: <Smartphone className="w-5 h-5" />,
    network: <Wifi className="w-5 h-5" />,
    cloud: <Cloud className="w-5 h-5" />,
    api: <Code className="w-5 h-5" />,
  };
  
  const vaptColors: Record<VaptFeatureType, string> = {
    web: "text-blue-400 bg-blue-500/10 border-blue-500/50",
    mobile: "text-purple-400 bg-purple-500/10 border-purple-500/50",
    network: "text-emerald-400 bg-emerald-500/10 border-emerald-500/50",
    cloud: "text-amber-400 bg-amber-500/10 border-amber-500/50",
    api: "text-rose-400 bg-rose-500/10 border-rose-500/50",
  };

  return (
    <div className="w-full relative z-10 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          
          {/* Infrastructure Profile */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400" />
                Infrastructure Profile
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Define your technology stack for accurate estimation
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Technology Complexity
                  </label>
                  <Select value={complexity} onValueChange={(v) => setComplexity(v as TechComplexityType)}>
                    <SelectTrigger className="w-full bg-background border-input">
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(complexityPrices).map(([key, data]) => (
                        <SelectItem key={key} value={key} className="cursor-pointer">
                          {data.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Hosting Environment
                  </label>
                  <Select value={hosting} onValueChange={(v) => setHosting(v as HostingEnvType)}>
                    <SelectTrigger className="w-full bg-background border-input">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(hostingPrices).map(([key, data]) => (
                        <SelectItem key={key} value={key} className="cursor-pointer">
                          {data.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* VAPT */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                Vulnerability Assessment (VAPT)
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Select all asset types you need to secure
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {(Object.entries(vaptPrices) as [VaptFeatureType, { label: string; price: number }][]).map(([key, data]) => {
                  const isSelected = vaptSelected.includes(key);
                  const isWebObj = key === "web";
                  const isMobileObj = key === "mobile";
                  const hasSliders = isWebObj || isMobileObj;
                  
                  return (
                    <div
                      key={key}
                      onClick={() => !hasSliders && toggleVapt(key)}
                      className={`p-4 rounded-xl border transition-all duration-300 w-full ${hasSliders ? "" : "cursor-pointer hover:bg-muted/50"} ${
                        isSelected
                          ? "bg-primary/5 border-primary/50"
                          : "bg-background border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-background/50 ${vaptColors[key].split(" ")[0]} pointer-events-none`}>
                            {vaptIcons[key]}
                          </div>
                          <label
                            className="text-sm leading-none font-medium cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); toggleVapt(key); }}
                          >
                            {data.label}
                          </label>
                        </div>
                        <Checkbox 
                          checked={isSelected} 
                          onCheckedChange={() => toggleVapt(key)} 
                          className="data-[state=checked]:bg-primary"
                          onClick={(e) => e.stopPropagation()} 
                        />
                      </div>

                      {/* Web App dynamic sliders */}
                      {isWebObj && isSelected && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2 space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground">Quantity</span>
                              <span className="font-bold text-primary">{webVars.quantity}</span>
                            </div>
                            <Slider
                              value={[webVars.quantity]}
                              min={1}
                              max={50}
                              step={1}
                              onValueChange={(v) => setWebVars(prev => ({ ...prev, quantity: v[0] }))}
                              className="**:data-[slot=slider-track]:bg-muted-foreground/30"
                            />
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground">Subdomains</span>
                              <span className="font-bold text-primary">{webVars.subdomains}</span>
                            </div>
                            <Slider
                              value={[webVars.subdomains]}
                              min={0}
                              max={20}
                              step={1}
                              onValueChange={(v) => setWebVars(prev => ({ ...prev, subdomains: v[0] }))}
                              className="**:data-[slot=slider-track]:bg-muted-foreground/30"
                            />
                          </div>
                        </div>
                      )}

                      {/* Mobile App dynamic sliders */}
                      {isMobileObj && isSelected && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2 space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground">Quantity</span>
                              <span className="font-bold text-primary">{mobileVars.quantity}</span>
                            </div>
                            <Slider
                              value={[mobileVars.quantity]}
                              min={1}
                              max={50}
                              step={1}
                              onValueChange={(v) => setMobileVars(prev => ({ ...prev, quantity: v[0] }))}
                              className="**:data-[slot=slider-track]:bg-muted-foreground/30"
                            />
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground">Target Platforms (iOS/Android)</span>
                              <span className="font-bold text-primary">{mobileVars.platforms}</span>
                            </div>
                            <Slider
                              value={[mobileVars.platforms]}
                              min={1}
                              max={10}
                              step={1}
                              onValueChange={(v) => setMobileVars(prev => ({ ...prev, platforms: v[0] }))}
                              className="**:data-[slot=slider-track]:bg-muted-foreground/30"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SOC Monitoring */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Activity className="w-24 h-24" />
            </div>
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                SOC Monitoring
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                24/7 Threat monitoring and incident response
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="font-medium block">Number of Endpoints</span>
                    <span className="text-xs text-muted-foreground">Workstations, Servers, Devices</span>
                  </div>
                  <span className="text-emerald-500 font-bold text-xl">{socEndpoints}</span>
                </div>
                <div className="py-2">
                  <Slider
                    value={[socEndpoints]}
                    min={0}
                    max={500}
                    step={10}
                    onValueChange={(v) => setSocEndpoints(v[0])}
                    className="**:data-[slot=slider-track]:bg-muted-foreground/30"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right mt-2">
                  *Set to 0 if not required
                </p>
              </div>
            </div>
          </div>

          {/* Compliance & Audit */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <FileCheck className="w-24 h-24" />
            </div>
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-400" />
                Compliance &amp; Audit
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Regulatory compliance certification support
              </div>
            </div>
            <div className="p-5">
              <Select value={compliance} onValueChange={(v) => setCompliance(v as ComplianceType)}>
                <SelectTrigger className="w-full bg-background border-input text-base h-12">
                  <SelectValue placeholder="Select compliance standard" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(compliancePrices).map(([key, data]) => (
                    <SelectItem key={key} value={key} className="cursor-pointer">
                      {data.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>

        {/* Estimated Investment */}
        <div className="md:col-span-5 lg:col-span-4">
          <div className="sticky top-0 space-y-6">
            <div className="rounded-xl border bg-card text-card-foreground shadow-md ring-1 ring-blue-500/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
              <div className="flex flex-col space-y-1.5 p-5 border-b bg-background/50">
                <div className="text-xl font-semibold leading-none tracking-tight">
                  Estimated Investment
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Indicative Estimation
                </div>
              </div>
              <div className="p-5 space-y-6 relative z-10 bg-background/50">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Currency
                  </label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full bg-background border-input">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR" className="cursor-pointer">INR (₹)</SelectItem>
                      <SelectItem value="USD" className="cursor-pointer">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-5 border-t text-center">
                  <div className="text-sm text-muted-foreground mb-1 font-medium">Total Estimated Cost</div>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-purple-500 mb-2">
                    {currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
                    {totalCost.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    *Rough estimate based on selected parameters. Need a detailed proposal?
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Cehpoint Panel */}
            <div className="p-5 rounded-xl border bg-card/50 text-sm text-muted-foreground">
              <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Why Choose Cehpoint?
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                  CERT-In Empanelled Partners
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0"></div>
                  Certified Security Experts (OSCP/CISSP)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                  Detailed Reporting &amp; verification
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                  0% False Positives Guarantee
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
