"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { plans, services, ServiceOption, Bundle } from "@/lib/plan";
import { ServiceDetailView } from "../services/ServiceDetailView";
import { useProjectFormStore } from "@/lib/store/projectSteps";
import { ServiceCard } from "./ServiceCard";
import { BundleCard } from "./BundleCard";

interface AdvancedPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan?: (plans: Bundle[]) => void;
}

export function AdvancedPlanDialog({
  open,
  onOpenChange,
  onSelectPlan,
}: AdvancedPlanDialogProps) {
  const [activeTab, setActiveTab] = useState<"bundle" | "service">("service");
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const { formData } = useProjectFormStore();
  const selectedBundleNames = formData.selectedBundles?.map((b: Bundle) => b.name) || [];

  // Reset state when dialog opens to ensure it starts at the Service selection view
  useEffect(() => {
    if (open) {
      setActiveTab("service");
      setSelectedService(null);
    }
  }, [open]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-5xl w-full h-[92vh] p-0 gap-0 overflow-hidden rounded-2xl flex flex-col">
        {selectedService ? (
          <ServiceDetailView
            service={selectedService}
            onBack={() => setSelectedService(null)}
            onClose={() => onOpenChange(false)}
            onAddService={(name, cost, currency, freeBundleOption) => {
              const formattedPrice = currency === "INR" ? `₹${cost.toLocaleString()}` : `$${cost.toLocaleString()}`;
              const selectedPlans: Bundle[] = [
                {
                  name: `${name} (Custom)`,
                  price: formattedPrice,
                  currency: currency as "INR" | "USD",
                  billing: "One Time",
                  includes: [],
                  training: "N/A",
                  bgColor: "bg-primary/10",
                  textColor: "text-foreground"
                }
              ];

              if (freeBundleOption) {
                if (freeBundleOption === "saved") {
                  selectedPlans.push({
                    name: "🎁 Free Bundle Coupon",
                    price: currency === "INR" ? "₹0" : "$0",
                    currency: currency as "INR" | "USD",
                    billing: "Saved as Coupon",
                    includes: [],
                    training: "N/A",
                    bgColor: "bg-emerald-500/10",
                    textColor: "text-foreground"
                  });
                } else {
                  // Find the selected bundle in plans
                  const sourceBundle = plans.find(p => p.name === freeBundleOption);
                  if (sourceBundle) {
                    selectedPlans.push({
                      ...sourceBundle,
                      name: `🎁 Free ${sourceBundle.name}`,
                      price: currency === "INR" ? "₹0" : "$0",
                      currency: currency as "INR" | "USD",
                      billing: "Claimed (Free)",
                    });
                  }
                }
              }

              onSelectPlan?.(selectedPlans);
              onOpenChange(false);
            }}
          />
        ) : (
          <>
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

            {/* Scrollable content container filling remaining height */}
            <div className="flex-1 overflow-y-auto px-8 py-7">
              {activeTab === "service" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service, index) => (
                    <ServiceCard
                      key={index}
                      service={service}
                      onSelect={(s) => setSelectedService(s)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {plans.map((plan, index) => (
                    <BundleCard
                      key={index}
                      plan={plan}
                      isSelected={selectedBundleNames.includes(plan.name)}
                      onSelect={(p) => {
                        onSelectPlan?.([p]);
                        onOpenChange(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
