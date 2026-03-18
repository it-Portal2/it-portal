import { ServiceOption } from "@/lib/plan";
import { ArrowLeft, X } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CyberSecurityDetail } from "./details/CyberSecurityDetail";
import { WebsiteDataDetail } from "./details/WebsiteDataDetail";
import { MobileAppDataDetail } from "./details/MobileAppDataDetail";
import { AIAutomationDetail } from "./details/AIAutomationDetail";
import { CyberCrimeDetail } from "./details/CyberCrimeDetail";

interface ServiceDetailViewProps {
  service: ServiceOption;
  onBack: () => void;
  onClose: () => void;
  onAddService: (serviceName: string, cost: number, currency: string, freeBundleOption?: string) => void;
}

export function ServiceDetailView({ service, onBack, onClose, onAddService }: ServiceDetailViewProps) {
  const handleAdd = (cost: number, currency: string, freeBundleOption?: string) => {
    onAddService(service.name, cost, currency, freeBundleOption);
  };
  const renderDetailContent = () => {
    switch (service.id) {
      case "cyber-security":
        return <CyberSecurityDetail onAdd={handleAdd} />;
      case "website-dev":
        return <WebsiteDataDetail onAdd={handleAdd} />;
      case "mobile-app-dev":
        return <MobileAppDataDetail onAdd={handleAdd} />;
      case "ai-automation":
        return <AIAutomationDetail onAdd={handleAdd} />;
      case "cyber-crime":
        return <CyberCrimeDetail onAdd={handleAdd} />;
      default:
        return (
          <div className="p-8 border-2 border-dashed rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground">
            Detail content for {service.name} is coming soon...
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky header */}
      <div className="px-8 pt-7 pb-5 border-b bg-background sticky top-0 z-10 flex justify-between items-start">
        <div className="flex-1 space-y-4">
          <button
            onClick={onBack}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
            Back to Services
          </button>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {service.name}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground font-medium mt-1">
              {service.description}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Scrollable content container filling remaining height */}
      <div className="flex-1 overflow-y-auto px-8 py-7">
        {renderDetailContent()}
      </div>
    </div>
  );
}
