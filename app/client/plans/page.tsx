"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useProjectFormStore } from "@/lib/store/projectSteps";
import { useRouter } from "next/navigation";

const plans = [
    {
        name: "Tech Launch Bundle",
        price: "₹1,245,000",
        billing: "/Year",
        includes: [
            "2 Full-Stack Developers",
            "1 UX/UI Designer",
            "1 Product Manager",
            "1 Technical Lead",
            "1 QA Engineer"
        ],
        training: "5 days/month on product management and agile development.",
        bgColor: "bg-[#086a6e]", // Dark Teal
        textColor: "text-white"
    },
    {
        name: "Secure Tech Bundle",
        price: "₹1,411,000",
        billing: "/Year",
        includes: [
            "2 Full-Stack Developers",
            "1 Security Specialist",
            "1 Security Operations Analyst",
            "1 Technical Lead",
            "1 QA Engineer"
        ],
        training: "5 days/month on cybersecurity best practices.",
        bgColor: "bg-[#91719b]", // Muted Purple
        textColor: "text-white"
    },
    {
        name: "Sales & Growth Bundle",
        price: "₹1,091,244",
        billing: "/Year",
        includes: [
            "1 Sales Manager",
            "2 Sales Executives",
            "1 Digital Marketing Specialist",
            "1 Business Development Manager"
        ],
        training: "5 days/month on sales techniques and growth hacking.",
        bgColor: "bg-[#c0847e]", // Rose/Terracotta
        textColor: "text-white"
    },
    {
        name: "Security & Growth Bundle",
        price: "₹1,343,070",
        billing: "/Year",
        includes: [
            "1 Sales Manager",
            "1 Digital Marketing Specialist",
            "1 Business Development Manager",
            "1 Security Operations Specialist",
            "1 Cybersecurity Analyst"
        ],
        training: "5 days/month on both sales and cybersecurity strategies.",
        bgColor: "bg-[#f1b17a]", // Soft Orange/Peach
        textColor: "text-white"
    },
    {
        name: "Operations & Management Bundle",
        price: "₹1,175,186",
        billing: "/Year",
        includes: [
            "1 Operations Manager",
            "1 HR Manager",
            "1 Finance Manager",
            "1 Project Coordinator",
            "1 Customer Success Manager"
        ],
        training: "5 days/month on operational efficiency and leadership.",
        bgColor: "bg-[#4a6d8c]", // Muted Blue
        textColor: "text-white"
    },
    {
        name: "Comprehensive Security Bundle",
        price: "₹1,594,896",
        billing: "/Year",
        includes: [
            "1 Security Manager",
            "1 Network Security Engineer",
            "1 Information Security Analyst",
            "1 Cybersecurity Specialist",
            "1 Compliance Officer"
        ],
        training: "5 days/month on regulatory compliance and security protocols.",
        bgColor: "bg-[#5c4d7d]", // Deep Violet
        textColor: "text-white"
    },
    {
        name: "Security & Tech Bundle",
        price: "₹1,510,954",
        billing: "/Year",
        includes: [
            "2 Full-Stack Developers",
            "1 Security Specialist",
            "1 Network Engineer",
            "1 Technical Lead"
        ],
        training: "5 days/month on network security and infrastructure.",
        bgColor: "bg-[#2d4a53]", // Dark Slate Green
        textColor: "text-white"
    },
    {
        name: "Creative & Content Bundle",
        price: "₹1,007,302",
        billing: "/Year",
        includes: [
            "1 Content Strategist",
            "1 Graphic Designer",
            "1 Social Media Manager",
            "1 SEO Specialist",
            "1 Copywriter"
        ],
        training: "5 days/month on content creation and brand building.",
        bgColor: "bg-[#d97d54]", // Burnt Orange
        textColor: "text-white"
    },
    {
        name: "Executive Leadership Bundle",
        price: "₹1,846,722",
        billing: "/Year",
        includes: [
            "1 CEO/COO (interim)",
            "1 CFO",
            "1 CMO",
            "1 CTO",
            "1 COO"
        ],
        training: "5 days/month on leadership and executive decision-making.",
        bgColor: "bg-[#1d3557]", // Deep Navy
        textColor: "text-white"
    },
    {
        name: "Startup Essentials Bundle",
        price: "₹1,385,041",
        billing: "/Year",
        includes: [
            "1 Full-Stack Developer",
            "1 Sales Executive",
            "1 Marketing Specialist",
            "1 Security Specialist",
            "1 Operations Manager"
        ],
        training: "5 days/month on startup growth strategies and security.",
        bgColor: "bg-[#6d6875]", // Grey-Purple
        textColor: "text-white"
    }
];

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
