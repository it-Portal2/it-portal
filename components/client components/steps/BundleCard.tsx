"use client";

import { Bundle } from "@/lib/plan";

interface BundleCardProps {
  plan: Bundle;
  isSelected: boolean;
  onSelect: (plan: Bundle) => void;
}

export function BundleCard({ plan, isSelected, onSelect }: BundleCardProps) {
  return (
    <div
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
              <li key={idx} className="flex items-center gap-2 text-sm font-semibold">
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
            <span className="text-sm font-bold opacity-80">{plan.billing}</span>
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
          if (!isSelected) {
            onSelect(plan);
          }
        }}
        disabled={isSelected}
        className={`mt-5 w-full py-3 font-black text-sm rounded-xl transition-all ${isSelected
          ? "bg-white/30 text-white cursor-not-allowed border border-white/40"
          : "bg-white text-black hover:bg-opacity-90 active:scale-[0.98]"
          }`}
      >
        {isSelected ? "ALREADY SELECTED" : "CHOOSE BUNDLE"}
      </button>
    </div>
  );
}
