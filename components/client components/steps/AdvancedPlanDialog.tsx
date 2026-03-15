"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { plans } from "@/lib/plan";

interface AdvancedPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan?: (plan: (typeof plans)[0]) => void;
}

export function AdvancedPlanDialog({
  open,
  onOpenChange,
  onSelectPlan,
}: AdvancedPlanDialogProps) {
  const [activeTab, setActiveTab] = useState<"bundle" | "service">("service");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-5xl w-full p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Sticky header */}
        <div className="px-8 pt-7 pb-5 border-b bg-background sticky top-0 z-10 flex justify-between items-start">
          <div className="flex-1">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Services & Bundles
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground font-medium">
                Cehpoint Empowers Startups with Expert Team Plans for Growth and Security
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "bundle" | "service")}
            >
              <TabsList className="h-10">
                <TabsTrigger value="service" className="text-sm px-7 font-semibold">
                  Service
                </TabsTrigger>
                <TabsTrigger value="bundle" className="text-sm px-7 font-semibold">
                  Bundle
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 hover:bg-muted/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto h-[75vh] px-8 py-7">
          {activeTab === "service" ? (
            <div className="h-full" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`${plan.bgColor} ${plan.textColor} rounded-2xl p-6 flex flex-col justify-between shadow-lg transition-all hover:scale-[1.02] hover:shadow-black/20 duration-300`}
              >
                {/* Card top content */}
                <div className="space-y-4">
                  <h2 className="text-xl font-black leading-tight tracking-tight">
                    {plan.name}
                  </h2>

                  {/* Includes */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-75 mb-1">
                      Includes:
                    </p>
                    <ul className="space-y-0.5">
                      {plan.includes.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm font-semibold"
                        >
                          <span className="w-1 h-1 bg-white rounded-full shrink-0 opacity-70" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-75 mb-0.5">
                      Price:
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black">{plan.price}</span>
                      <span className="text-sm font-bold opacity-80">
                        {plan.billing}
                      </span>
                    </div>
                    <p className="text-[9px] font-medium opacity-65 italic mt-0.5">
                      *(Salaries of the Team included)
                    </p>
                  </div>

                  {/* Training */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-75 mb-0.5">
                      Free Training:
                    </p>
                    <p className="text-sm font-semibold leading-snug opacity-90">
                      {plan.training}
                    </p>
                  </div>
                </div>

                {/* Choose button */}
                <button
                  onClick={() => {
                    onSelectPlan?.(plan);
                    onOpenChange(false);
                  }}
                  className="mt-5 w-full py-3 bg-white text-black font-black text-sm rounded-xl hover:bg-opacity-90 active:scale-[0.98] transition-all"
                >
                  CHOOSE BUNDLE
                </button>
              </div>
            ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
