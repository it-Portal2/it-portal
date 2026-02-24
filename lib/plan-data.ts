export interface PlanBundle {
    name: string;
    price: string;
    billing: string;
    includes: string[];
    training: string;
    bgColor: string;
    textColor: string;
}

export const plans: PlanBundle[] = [
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
