import CandidatesApplicationsClient from "@/components/admin/intern-application/CandidatesApplicationsClient";

export const revalidate = 200;
const candidatesData = [
  {
    id: "1",
    fullName: "Tushar Bhowal",
    email: "tusharbhowal3211@gmail.com",
    phone: "+916290779683",
    linkedin: "https://www.linkedin.com/in/tushar-bhowal-32bb74205",
    applicationStatus: "Pending",
    createdAt: "2025-08-17T20:51:15+05:30",
    startDate: "within-week",
    stipendExpectation: "5000/month",
    weeklyCommitment: "26-35",
    trialAccepted: "yes",
    aiAnalysisStatus: "not-analyzed",
    overallScore: null,
    resumeAnalysis: {
      education:
        "B.Tech in Electrical Engineering, Academy of Technology, 2024",
      experience: "0 years, Fresher/Entry level",
      skills: ["React.js", "Next.js", "Node.js", "MongoDB", "TypeScript"],
      summary:
        "Results-driven Software Engineer with hands-on experience in full-stack development",
    },
  },
  {
    id: "2",
    fullName: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1234567890",
    linkedin: "https://www.linkedin.com/in/sarah-johnson",
    applicationStatus: "Accepted",
    createdAt: "2025-08-16T14:30:00+05:30",
    startDate: "within-month",
    stipendExpectation: "7000/month",
    weeklyCommitment: "35-40",
    trialAccepted: "yes",
    aiAnalysisStatus: "analyzed",
    overallScore: 8.5,
    resumeAnalysis: {
      education: "M.S. Computer Science, Stanford University, 2023",
      experience: "2 years, Mid-level",
      skills: ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
      summary:
        "Experienced full-stack developer with strong problem-solving skills",
    },
  },
  {
    id: "3",
    fullName: "Alex Chen",
    email: "alex.chen@email.com",
    phone: "+9876543210",
    linkedin: "https://www.linkedin.com/in/alex-chen",
    applicationStatus: "Rejected",
    createdAt: "2025-08-15T09:15:00+05:30",
    startDate: "flexible",
    stipendExpectation: "4000/month",
    weeklyCommitment: "20-25",
    trialAccepted: "no",
    aiAnalysisStatus: "analyzed",
    overallScore: 4.2,
    resumeAnalysis: {
      education: "B.S. Information Technology, Local College, 2024",
      experience: "0 years, Entry level",
      skills: ["HTML", "CSS", "JavaScript", "Basic React"],
      summary: "Recent graduate with basic web development knowledge",
    },
  },
  {
    id: "5",
    fullName: "David Kim",
    email: "david.kim@email.com",
    phone: "+8201234567",
    linkedin: "https://www.linkedin.com/in/david-kim",
    applicationStatus: "Pending",
    createdAt: "2025-08-13T11:20:00+05:30",
    startDate: "within-month",
    stipendExpectation: "8000/month",
    weeklyCommitment: "40+",
    trialAccepted: "yes",
    aiAnalysisStatus: "not-analyzed",
    overallScore: null,
    resumeAnalysis: {
      education: "Ph.D. Computer Science, MIT, 2022",
      experience: "3 years, Senior level",
      skills: [
        "Machine Learning",
        "Python",
        "TensorFlow",
        "Go",
        "Microservices",
      ],
      summary:
        "Research-oriented developer with expertise in AI and distributed systems",
    },
  },
];
export default async function CandidatesApplications() {
  //const response = await fetchAllApplications();
  return <CandidatesApplicationsClient candidatesData={candidatesData} />;
}