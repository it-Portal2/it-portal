"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useProjectFormStore } from "@/lib/store/projectSteps";
import { useRouter } from "next/navigation";

import { plans } from "@/lib/plan-data";

export default function PlansPage() {
    const { updateFormData } = useProjectFormStore();
    const router = useRouter();

    const handleChooseBundle = (plan: typeof plans[0]) => {
        // Parse the price string back to a number
        const numericPrice = parseInt(plan.price.replace(/[^\d]/g, ""));

        updateFormData({
            selectedBundle: {
                name: plan.name,
                price: numericPrice,
            }
        });

        router.push("/client/create-project");
    };

    return (
        <div className="min-h-screen bg-background py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col gap-6 mb-16">
                    <Link
                        href="/client/create-project"
                        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-all group w-fit"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Project Flow
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-5xl  font-black tracking-tight text-foreground">
                            Select Your <span className="text-primary underline">Bundle</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-medium">
                            Comprehensive team solutions tailored for your business success.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`${plan.bgColor} ${plan.textColor} rounded-[32px] p-8 flex flex-col justify-between shadow-xl transition-all hover:scale-[1.02] hover:shadow-black/10 duration-300 min-h-[420px]`}
                        >
                            <div>
                                <h2 className="text-3xl font-black mb-6 leading-tight tracking-tight">
                                    {plan.name}
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Includes:</h3>
                                        <ul className="space-y-2">
                                            {plan.includes.map((item, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-lg font-bold">
                                                    <span className="w-1.5 h-1.5 bg-white rounded-full opacity-60"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Price:</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black">{plan.price}</span>
                                            <span className="text-lg font-bold opacity-80">{plan.billing}</span>
                                        </div>
                                        <p className="text-[10px] font-medium opacity-70 italic mt-0.5">*(Salaries of the Team included)</p>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Free Training:</h3>
                                        <p className="text-lg font-bold leading-snug">{plan.training}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleChooseBundle(plan)}
                                className="mt-8 w-full py-4 bg-white text-black font-black text-lg rounded-xl hover:bg-opacity-90 transition-all active:scale-[0.98]"
                            >
                                CHOOSE BUNDLE
                            </button>
                        </div>
                    ))}
                </div>


            </div>
        </div>
    );
}
