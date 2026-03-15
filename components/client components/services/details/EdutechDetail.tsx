"use client";

import { useState, useMemo } from "react";
import { Check, ChevronDown, GraduationCap, LayoutTemplate, Video, Brain, Award, Users, Shield, MessageCircle } from "lucide-react";
import { 
  calculateEdutechPrice, 
  userBasePrices, 
  featurePrices 
} from "../pricing/edutech";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const featuresList = [
  {
    id: "LMS Core (Courses, Quizzes)",
    label: "LMS Core (Courses, Quizzes)",
    icon: LayoutTemplate,
  },
  {
    id: "Live Classroom Integration",
    label: "Live Classroom Integration",
    icon: Video,
  },
  {
    id: "AI Proctoring System",
    label: "AI Proctoring System",
    icon: Brain,
  },
  {
    id: "Gamification & Leaderboards",
    label: "Gamification & Leaderboards",
    icon: Award,
  },
  {
    id: "Parent/Admin Portals",
    label: "Parent/Admin Portals",
    icon: Users,
  },
  {
    id: "Certification Engine",
    label: "Certification Engine",
    icon: Shield,
  },
];

export function EdutechDetail() {
  const [userBase, setUserBase] = useState<string>("< 1,000 Users");
  const [features, setFeatures] = useState<string[]>(["LMS Core (Courses, Quizzes)"]);
  const [currency, setCurrency] = useState("INR");

  const totalCost = useMemo(() => {
    return calculateEdutechPrice({
      userBase,
      features,
    }, currency);
  }, [userBase, features, currency]);

  const toggleFeature = (featureId: string) => {
    setFeatures(current => 
      current.includes(featureId) 
        ? current.filter(id => id !== featureId)
        : [...current, featureId]
    );
  };

  return (
    <div className="w-full relative z-10 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Configuration Options */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          
          {/* Platform Scale */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-500" />
                Platform Scale
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Projected User Base (Monthly Active Users)
                  </label>
                  <Select value={userBase} onValueChange={setUserBase}>
                    <SelectTrigger className="w-full bg-background border-input">
                      <SelectValue placeholder="Select User Base" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(userBasePrices).map((key) => (
                        <SelectItem key={key} value={key} className="cursor-pointer">{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Features */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Brain className="w-5 h-5 text-pink-500" />
                Platform Features
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featuresList.map((feature) => {
                  const isChecked = features.includes(feature.id);
                  const Icon = feature.icon;
                  
                  return (
                    <div 
                      key={feature.id}
                      onClick={() => toggleFeature(feature.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                        isChecked 
                          ? "bg-muted/50 border-primary" 
                          : "bg-background border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={isChecked}
                          onCheckedChange={() => toggleFeature(feature.id)}
                          className="data-[state=checked]:bg-primary"
                          onClick={(e) => e.stopPropagation()} 
                        />
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm text-foreground/90">
                            {feature.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Estimated Investment (Sticky) */}
        <div className="md:col-span-5 lg:col-span-4">
          <div className="sticky top-0">
            <div className="rounded-xl border bg-card text-card-foreground shadow-md ring-1 ring-primary/10">
              <div className="flex flex-col space-y-1.5 p-5 border-b">
                <div className="text-xl font-semibold leading-none tracking-tight">Estimated Investment</div>
              </div>
              
              <div className="p-5 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full bg-background border-input">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR" className="cursor-pointer">INR (₹)</SelectItem>
                      <SelectItem value="USD" className="cursor-pointer">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-5 border-t text-center">
                  <div className="text-sm text-muted-foreground mb-1 font-medium">Total Estimated Cost</div>
                  <div className="text-3xl font-black text-primary">
                    {currency === "INR" ? "₹" : "$"}
                    {totalCost.toLocaleString()}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
