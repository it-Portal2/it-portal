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
        bgColor: "bg-[#086a6e]",
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
        bgColor: "bg-[#91719b]",
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
        bgColor: "bg-[#c0847e]",
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
        bgColor: "bg-[#f1b17a]",
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
        bgColor: "bg-[#4a6d8c]",
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
        bgColor: "bg-[#5c4d7d]",
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
        bgColor: "bg-[#2d4a53]",
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
        bgColor: "bg-[#d97d54]",
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
        bgColor: "bg-[#1d3557]",
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
        bgColor: "bg-[#6d6875]",
        textColor: "text-white"
    }
];

export interface ServiceOption {
    id: string;
    name: string;
    description: string;
    includes: string[];
    stat: string;
    gradientFrom: string;
    gradientTo: string;
    image: string;
}

export const services: ServiceOption[] = [
    {
        id: "website-dev",
        name: "Website Development",
        description: "High-performance, SEO-optimized websites built with modern frameworks to establish your professional online presence.",
        includes: [
            "Custom UI/UX Design",
            "Responsive Web Development",
            "SEO Strategy & Implementation",
            "CMS Integration"
        ],
        stat: "100+ Sites Launched",
        gradientFrom: "from-blue-600",
        gradientTo: "to-cyan-500",
        image: "/website_development_service.png"
    },
    {
        id: "mobile-app-dev",
        name: "Mobile App Development",
        description: "Advanced native cross-platform mobile applications for iOS and Android with intuitive UI/UX and rich functionalities.",
        includes: [
            "iOS & Android Development",
            "Cross-Platform Solutions (Flutter/React Native)",
            "API Development",
            "Cloud Backend Services"
        ],
        stat: "50+ Apps Published",
        gradientFrom: "from-indigo-600",
        gradientTo: "to-purple-500",
        image: "/mobile_app_development_service.png"
    },
    {
        id: "ai-automation",
        name: "AI & Process Automation",
        description: "Smart AI-powered systems that automate workflows, enhance productivity, and enable intelligent decisions.",
        includes: [
            "AI Chatbots & Virtual Assistants",
            "Workflow Automation",
            "Machine Learning Solutions",
            "Data Analytics & Insights"
        ],
        stat: "40+ AI Solutions",
        gradientFrom: "from-purple-600",
        gradientTo: "to-pink-500",
        image: "/ai_automation_service_new.png"
    },
    {
        id: "cyber-security",
        name: "Cyber Security",
        description: "Comprehensive security audits, penetration testing, and threat protection strategies.",
        includes: ["Security Audits", "Pentesting", "Compliance", "Threat Monitoring"],
        stat: "150+ Audits",
        gradientFrom: "from-blue-500",
        gradientTo: "to-cyan-500",
        image: "/cyber_security_service_new.png"
    },
    {
        id: "cyber-crime",
        name: "Cyber Crime Investigation",
        description: "Professional digital forensics and cyber investigation services to resolve incidents.",
        includes: [
            "Digital Forensics",
            "Incident Investigation",
            "Evidence Recovery",
            "Cyber Law Support"
        ],
        stat: "90+ Investigations",
        gradientFrom: "from-slate-700",
        gradientTo: "to-slate-900",
        image: "/cyber_crime_investigation_service_new.png"
    }
];
