"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  ShoppingCart,
  Zap,
  Store,
  ChartColumn,
  Globe,
  Smartphone,
  Box,
  CreditCard,
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
import {
  platformPrices,
  inventoryPrices,
  featurePrices,
  calculateEcommercePrice,
  PlatformType,
  InventoryType,
  FeatureType,
} from "../pricing/ecommerce";

export function ECommerceDetail() {
  const [platform, setPlatform] = useState<PlatformType>("mobile");
  const [inventory, setInventory] = useState<InventoryType>("enterprise");
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureType[]>([]);
  const [currency, setCurrency] = useState("INR");

  const totalCost = useMemo(
    () => calculateEcommercePrice(platform, inventory, selectedFeatures, currency),
    [platform, inventory, selectedFeatures, currency]
  );

  const toggleFeature = (feature: FeatureType) => {
    setSelectedFeatures((current) =>
      current.includes(feature)
        ? current.filter((f) => f !== feature)
        : [...current, feature]
    );
  };

  const featureIcons: Record<FeatureType, React.ReactNode> = {
    "multi-vendor": <Store className="w-4 h-4 text-muted-foreground" />,
    "ai-search": <Zap className="w-4 h-4 text-muted-foreground" />,
    crm: <ChartColumn className="w-4 h-4 text-muted-foreground" />,
    "multi-currency": <Globe className="w-4 h-4 text-muted-foreground" />,
    pwa: <Smartphone className="w-4 h-4 text-muted-foreground" />,
    inventory: <Box className="w-4 h-4 text-muted-foreground" />,
    loyalty: <CreditCard className="w-4 h-4 text-muted-foreground" />,
  };

  return (
    <div className="w-full relative z-10 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          {/* Core Platform Details */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Core Platform Details
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Platform Type
                  </label>
                  <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformType)}>
                    <SelectTrigger className="w-full bg-background border-input">
                      <SelectValue placeholder="Select platform type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(platformPrices).map(([key, data]) => (
                        <SelectItem key={key} value={key} className="cursor-pointer">
                          {data.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Inventory Scale (SKUs)
                  </label>
                  <Select value={inventory} onValueChange={(v) => setInventory(v as InventoryType)}>
                    <SelectTrigger className="w-full bg-background border-input">
                      <SelectValue placeholder="Select inventory scale" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(inventoryPrices).map(([key, data]) => (
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

          {/* Advanced Features */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-5 border-b">
              <div className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Advanced Features
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries(featurePrices) as [FeatureType, { label: string; price: number }][]).map(([key, data]) => (
                  <div
                    key={key}
                    onClick={() => toggleFeature(key)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                      selectedFeatures.includes(key)
                        ? "bg-muted/50 border-primary"
                        : "bg-background border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedFeatures.includes(key)} 
                        onCheckedChange={() => toggleFeature(key)} 
                        className="data-[state=checked]:bg-primary"
                        onClick={(e) => e.stopPropagation()} 
                      />
                      <div className="flex items-center gap-2">
                        {featureIcons[key]}
                        <span className="font-medium text-sm text-foreground/90">{data.label}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Estimated Investment */}
        <div className="md:col-span-5 lg:col-span-4">
          <div className="sticky top-0">
            <div className="rounded-xl border bg-card text-card-foreground shadow-md ring-1 ring-primary/10">
              <div className="flex flex-col space-y-1.5 p-5 border-b">
                <div className="text-xl font-semibold leading-none tracking-tight">
                  Estimated Investment
                </div>
              </div>
              <div className="p-5 space-y-6">
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
                  <div className="text-3xl font-black text-primary">
                    {currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
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
