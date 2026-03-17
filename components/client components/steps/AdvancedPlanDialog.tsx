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
import { X, ArrowRight, CircleCheck } from "lucide-react";
import { plans, services, ServiceOption } from "@/lib/plan";
import { ServiceDetailView } from "../services/ServiceDetailView";
import { useProjectFormStore } from "@/lib/store/projectSteps";

interface AdvancedPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan?: (plans: any[]) => void;
}

export function AdvancedPlanDialog({
  open,
  onOpenChange,
  onSelectPlan,
}: AdvancedPlanDialogProps) {
  const [activeTab, setActiveTab] = useState<"bundle" | "service">("service");
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const { formData } = useProjectFormStore();

  const selectedBundleNames = formData.selectedBundles?.map((b: any) => b.name) || [];

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
              const selectedPlans: any[] = [
                {
                  name: `${name} (Custom)`,
                  price: formattedPrice,
                  billing: "One Time",
                }
              ];

              if (freeBundleOption) {
                if (freeBundleOption === "saved") {
                  selectedPlans.push({
                    name: "🎁 Free Bundle Coupon",
                    price: currency === "INR" ? "₹0" : "$0",
                    billing: "Saved as Coupon",
                  });
                } else {
                  // Find the selected bundle in plans
                  const sourceBundle = plans.find(p => p.name === freeBundleOption);
                  if (sourceBundle) {
                    selectedPlans.push({
                      ...sourceBundle,
                      name: `🎁 Free ${sourceBundle.name}`,
                      price: currency === "INR" ? "₹0" : "$0",
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
                    <div
                      key={index}
                      className="bg-card text-card-foreground border rounded-2xl flex flex-col shadow-sm transition-all hover:scale-[1.01] hover:shadow-md duration-300 relative overflow-hidden group"
                    >
                      {/* Service Image */}
                      <div className="relative w-full aspect-video overflow-hidden">
                        <img 
                          src={service.image} 
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className={`absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-60`} />
                      </div>

                      <div className="relative z-10 flex flex-col flex-1 p-6 space-y-4">
                        {/* Title */}
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                            {service.name}
                          </h3>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {service.description}
                        </p>

                        {/* Includes */}
                        <div className="grow space-y-2.5">
                          {service.includes.map((item, idx) => (
                            <div key={idx} className="flex items-center font-medium text-[13px]">
                              <CircleCheck className="w-4 h-4 text-primary mr-2.5 shrink-0 opacity-80" />
                              <span className="text-foreground/80">{item}</span>
                            </div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t flex items-center justify-between mt-2">
                          <span className="text-xs font-bold tracking-tight text-primary uppercase">{service.stat}</span>
                          <button
                            onClick={() => {
                              setSelectedService(service);
                            }}
                            className="text-[14px] font-bold text-foreground hover:text-primary transition-all flex items-center gap-1 group/btn cursor-pointer"
                          >
                            Learn more <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                          if (!selectedBundleNames.includes(plan.name)) {
                            onSelectPlan?.([plan]);
                            onOpenChange(false);
                          }
                        }}
                        disabled={selectedBundleNames.includes(plan.name)}
                        className={`mt-5 w-full py-3 font-black text-sm rounded-xl transition-all ${selectedBundleNames.includes(plan.name)
                          ? "bg-white/30 text-white cursor-not-allowed border border-white/40"
                          : "bg-white text-black hover:bg-opacity-90 active:scale-[0.98]"
                          }`}
                      >
                        {selectedBundleNames.includes(plan.name) ? "ALREADY SELECTED" : "CHOOSE BUNDLE"}
                      </button>
                    </div>
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
