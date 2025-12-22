import type { LucideIcon } from "lucide-react";
import { Shield, Zap, FileText, Rocket, TrendingUp, Users } from "lucide-react";

/**
 * Service highlight type for badge styling
 */
export type ServiceHighlightType = "success" | "info" | "premium" | "default";

/**
 * Cehpoint service definition
 */
export interface CehpointService {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  features: string[];
  highlight: string;
  highlightType: ServiceHighlightType;
  url: string;
}

/**
 * Cehpoint services data for the Explore Services page
 * Source: Collected from cehpoint.co.in websites
 */
export const CEHPOINT_SERVICES: CehpointService[] = [
  {
    id: "security-scheme",
    title: "Free Security Scheme",
    tagline: "Cyber Security is a Right, Not a Privilege",
    description:
      "Get a comprehensive cybersecurity audit completely FREE. Our CSR initiative protects MSMEs, startups, and small businesses with zero-cost security assessments.",
    icon: Shield,
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    features: [
      "Basic Vulnerability Scan",
      "Web Security Check",
      "Security Recommendations Report",
      "15-min Expert Consultation",
    ],
    highlight: "₹0 - Completely Free",
    highlightType: "success",
    url: "https://www.cehpoint.co.in/security-scheme",
  },
  {
    id: "demo-delivery",
    title: "24-Hour Demo Delivery",
    tagline: "From Concept to Prototype in Just 24 Hours",
    description:
      "Transform your ideas into working prototypes with our rapid development process. Get a functional demo of your product within 24 hours.",
    icon: Zap,
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-500",
    features: [
      "Functional Prototype",
      "Clean Source Code",
      "API Documentation",
      "Technical Architecture Docs",
    ],
    highlight: "98% On-time Delivery",
    highlightType: "info",
    url: "https://www.cehpoint.co.in/demo-delivery",
  },
  {
    id: "proposals",
    title: "AI Proposal Architect",
    tagline: "Generate Professional Proposals Instantly",
    description:
      "Our AI-powered proposal tool creates stunning, enterprise-grade project proposals tailored to your needs. Choose from 10+ strategic modules.",
    icon: FileText,
    bgColor: "bg-violet-500/10",
    iconColor: "text-violet-500",
    features: [
      "Web & Mobile Development",
      "Cybersecurity Operations",
      "AI & Data Science Solutions",
      "Cloud Infrastructure & DevOps",
    ],
    highlight: "AI-Powered Generation",
    highlightType: "premium",
    url: "https://proposals.cehpoint.co.in/",
  },
  {
    id: "incubation",
    title: "Startup Incubation",
    tagline: "Launch Your Revolutionary Idea",
    description:
      "Turn your innovative startup idea into reality. Get lifetime hosting, maintenance support, funding assistance, and expert mentorship.",
    icon: Rocket,
    bgColor: "bg-pink-500/10",
    iconColor: "text-pink-500",
    features: [
      "Lifetime Free Hosting",
      "Ongoing Maintenance Support",
      "Funding & Grant Assistance",
      "Expert Mentorship",
    ],
    highlight: "Lifetime Support",
    highlightType: "success",
    url: "https://www.cehpoint.co.in/incubation",
  },
  {
    id: "investor-connect",
    title: "Investor Connect",
    tagline: "Discover Your Next Unicorn",
    description:
      "Bridge the gap between visionary founders and strategic investors. Explore curated startup investment opportunities with projected profits.",
    icon: TrendingUp,
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-500",
    features: [
      "Curated Startup Marketplace",
      "Profit Projections",
      "Quick Time-to-Launch",
      "100% Ownership Options",
    ],
    highlight: "₹45L+/yr Profit Potential",
    highlightType: "info",
    url: "https://www.cehpoint.co.in/investor-connect",
  },
  {
    id: "leadership",
    title: "Leadership Search",
    tagline: "Find the Right Expert for Your Needs",
    description:
      "Access our global leadership directory. Connect with industry experts across cybersecurity, AI, engineering, and more across 6 countries.",
    icon: Users,
    bgColor: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
    features: [
      "Global Expert Network",
      "Filter by Department",
      "Direct Contact Access",
      "6 Country Offices",
    ],
    highlight: "50+ Leaders Available",
    highlightType: "default",
    url: "https://www.cehpoint.co.in/leadership-search",
  },
];

/**
 * Get highlight badge color based on type
 */
export function getHighlightColor(type: ServiceHighlightType): string {
  switch (type) {
    case "success":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "info":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "premium":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}
