export interface PlanBundle {
    name: string;
    price: string;
    billing: string;
    description: string;
    includes: string[];
}

export const plans: PlanBundle[] = [
    {
        name: "Tech Launch Bundle",
        price: "₹1,245,000",
        billing: "/Year",
        description: "Scale your startup with a dedicated technical team for end-to-end development.",
        includes: [
            "2 Full-Stack Developers",
            "1 UX/UI Designer",
            "1 Product Manager",
            "1 Technical Lead",
            "1 QA Engineer"
        ]
    },
    {
        name: "Secure Tech Bundle",
        price: "₹1,411,000",
        billing: "/Year",
        description: "Build secure-by-design applications with integrated security expertise.",
        includes: [
            "2 Full-Stack Developers",
            "1 Security Specialist",
            "1 Security Operations Analyst",
            "1 Technical Lead",
            "1 QA Engineer"
        ]
    },
    {
        name: "Sales & Growth Bundle",
        price: "₹1,091,244",
        billing: "/Year",
        description: "Accelerate your revenue growth with a dedicated sales and marketing powerhouse.",
        includes: [
            "1 Sales Manager",
            "2 Sales Executives",
            "1 Digital Marketing Specialist",
            "1 Business Development Manager"
        ]
    },
    {
        name: "Security & Growth Bundle",
        price: "₹1,343,070",
        billing: "/Year",
        description: "Scale safely with a team that balances aggressive growth with robust security.",
        includes: [
            "1 Sales Manager",
            "1 Digital Marketing Specialist",
            "1 Business Development Manager",
            "1 Security Operations Specialist",
            "1 Cybersecurity Analyst"
        ]
    },
    {
        name: "Operations & Management Bundle",
        price: "₹1,175,186",
        billing: "/Year",
        description: "Streamline your business operations with expert leadership and coordination.",
        includes: [
            "1 Operations Manager",
            "1 HR Manager",
            "1 Finance Manager",
            "1 Project Coordinator",
            "1 Customer Success Manager"
        ]
    },
    {
        name: "Comprehensive Security Bundle",
        price: "₹1,594,896",
        billing: "/Year",
        description: "Total protection for your enterprise assets with a complete security team.",
        includes: [
            "1 Security Manager",
            "1 Network Security Engineer",
            "1 Information Security Analyst",
            "1 Cybersecurity Specialist",
            "1 Compliance Officer"
        ]
    },
    {
        name: "Security & Tech Bundle",
        price: "₹1,510,954",
        billing: "/Year",
        description: "A hybrid team focused on building and securing critical technical infrastructure.",
        includes: [
            "2 Full-Stack Developers",
            "1 Security Specialist",
            "1 Network Engineer",
            "1 Technical Lead"
        ]
    },
    {
        name: "Creative & Content Bundle",
        price: "₹1,007,302",
        billing: "/Year",
        description: "Tell your brand story with a dedicated creative team for content and design.",
        includes: [
            "1 Content Strategist",
            "1 Graphic Designer",
            "1 Social Media Manager",
            "1 SEO Specialist",
            "1 Copywriter"
        ]
    },
    {
        name: "Executive Leadership Bundle",
        price: "₹1,846,722",
        billing: "/Year",
        description: "Fractional leadership to guide your company through critical growth phases.",
        includes: [
            "1 CEO/COO (interim)",
            "1 CFO",
            "1 CMO",
            "1 CTO",
            "1 COO"
        ]
    },
    {
        name: "Startup Essentials Bundle",
        price: "₹1,385,041",
        billing: "/Year",
        description: "The core team needed to launch and run a modern startup effectively.",
        includes: [
            "1 Full-Stack Developer",
            "1 Sales Executive",
            "1 Marketing Specialist",
            "1 Security Specialist",
            "1 Operations Manager"
        ]
    }
];
