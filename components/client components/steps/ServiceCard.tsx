"use client";

import { CircleCheck, ArrowRight } from "lucide-react";
import { ServiceOption } from "@/lib/plan";

interface ServiceCardProps {
  service: ServiceOption;
  onSelect: (service: ServiceOption) => void;
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <div className="bg-card text-card-foreground border rounded-2xl flex flex-col shadow-sm transition-all hover:scale-[1.01] hover:shadow-md duration-300 relative overflow-hidden group">
      {/* Service Image */}
      <div className="relative w-full aspect-video overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-60" />
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
          <span className="text-xs font-bold tracking-tight text-primary uppercase">
            {service.stat}
          </span>
          <button
            onClick={() => onSelect(service)}
            className="text-[14px] font-bold text-foreground hover:text-primary transition-all flex items-center gap-1 group/btn cursor-pointer"
          >
            Learn more{" "}
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
