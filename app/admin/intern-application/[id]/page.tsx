import { Application } from "@/lib/types";
import ApplicationDetailPageClient from "./ApplicationDetailPageClient";


// Static candidates data
const candidatesData: Application[] = [
  {
    id: "1",
    fullName: "Tushar Bhowal",
    email: "tusharbhowal3211@gmail.com",
    phone: "+916290779683",
    linkedin: "https://www.linkedin.com/in/tushar-bhowal-32bb74205",
    applicationStatus: "pending",
    createdAt: "2025-08-17T20:51:15+05:30",
    startDate: "within-week",
    stipendExpectation: "5000/month",
    weeklyCommitment: "26-35",
    trialAccepted: "yes",
    additionalComments: "I am passionate about full-stack development and eager to contribute to innovative projects.",
    aiAnalysisStatus: "not-analyzed",
    overallScore: null,
    resumeAnalysis: {
      education: "B.Tech in Electrical Engineering, Academy of Technology, 2024",
      experience: "0 years, Fresher/Entry level",
      skills: ["React.js", "Next.js", "Node.js", "MongoDB", "TypeScript", "JavaScript", "HTML", "CSS", "Git"],
      summary:
        "Results-driven Software Engineer with hands-on experience in full-stack development using modern technologies like React, Next.js, and Node.js. Strong foundation in electrical engineering with a passion for web development.",
    },
    questionsAndAnswers: [
      {
        question: "Describe your experience with React.js and how you've used it in projects.",
        answer:
          "I have been working with React.js for over a year now. I've built several projects including a task management app using React hooks, context API for state management, and integrated it with a Node.js backend. I'm comfortable with functional components, custom hooks, and have experience with React Router for navigation. In my recent project, I implemented real-time updates using WebSocket connections and optimized performance using React.memo and useMemo hooks.",
      },
      {
        question: "How do you approach debugging in web development?",
        answer:
          "My debugging approach is systematic. I start by reproducing the issue consistently, then use browser developer tools to inspect the console for errors. I use React DevTools for component state inspection and Network tab for API issues. I also implement proper error boundaries in React and use try-catch blocks for async operations. For complex issues, I use debugger statements and step through code execution. I believe in writing comprehensive unit tests to catch issues early.",
      },
      {
        question: "Explain your understanding of RESTful APIs and how you implement them.",
        answer:
          "RESTful APIs follow REST principles using HTTP methods (GET, POST, PUT, DELETE) for different operations. I've implemented APIs using Node.js and Express.js, following proper status codes and resource naming conventions. I ensure proper error handling, input validation, and implement authentication using JWT tokens. I've also worked with API documentation using tools like Swagger and have experience with both consuming and creating RESTful services.",
      },
    ],
    aiAnalysis: null,
  },
  {
    id: "2",
    fullName: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1234567890",
    linkedin: "https://www.linkedin.com/in/sarah-johnson",
    applicationStatus: "accepted",
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
    questionsAndAnswers: [
      {
        question: "Describe your experience with Python and Django.",
        answer: "I have 2 years of experience with Python and Django, building scalable web applications with RESTful APIs.",
      },
      {
        question: "How do you handle database optimization?",
        answer: "I use indexing, query optimization, and database normalization to ensure efficient data retrieval and storage.",
      },
      {
        question: "Explain your experience with cloud platforms.",
        answer: "I have worked extensively with AWS, including EC2, S3, RDS, and Lambda for building serverless applications.",
      },
    ],
    aiAnalysis: {
      originalityScores: [
        {
          question: 1,
          score: 88,
          reasoning: "Shows practical experience with specific examples and technical depth.",
        },
        {
          question: 2,
          score: 85,
          reasoning: "Demonstrates systematic approach to database optimization with real-world knowledge.",
        },
        {
          question: 3,
          score: 90,
          reasoning: "Comprehensive understanding of AWS services with practical implementation experience.",
        },
      ],
      correctnessScores: [
        {
          question: 1,
          score: 8.9,
          reasoning: "Excellent grasp of Python/Django concepts with proper architectural understanding.",
        },
        {
          question: 2,
          score: 8.7,
          reasoning: "Strong knowledge of database optimization techniques and best practices.",
        },
        {
          question: 3,
          score: 9.1,
          reasoning: "Deep understanding of cloud platforms and serverless architecture patterns.",
        },
      ],
      overallVerdict: "Highly Recommended",
      aiRecommendation:
        "Exceptional candidate with strong technical background and practical experience. Demonstrates both theoretical knowledge and hands-on implementation skills. Highly recommended for immediate hiring.",
    },
  },
  {
    id: "3",
    fullName: "Alex Chen",
    email: "alex.chen@email.com",
    phone: "+9876543210",
    linkedin: "https://www.linkedin.com/in/alex-chen",
    applicationStatus: "rejected",
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
    questionsAndAnswers: [
      {
        question: "Describe your experience with JavaScript.",
        answer: "I have basic knowledge of JavaScript and have worked on some small projects during college.",
      },
      {
        question: "How do you approach learning new technologies?",
        answer: "I usually watch YouTube videos and follow online tutorials to learn new technologies.",
      },
      {
        question: "What motivates you in software development?",
        answer: "I like coding because it pays well and has good job opportunities.",
      },
    ],
    aiAnalysis: {
      originalityScores: [
        {
          question: 1,
          score: 45,
          reasoning: "Very basic response lacking depth and specific examples of practical application.",
        },
        {
          question: 2,
          score: 50,
          reasoning: "Generic learning approach without systematic methodology or advanced resources.",
        },
        {
          question: 3,
          score: 30,
          reasoning: "Motivation appears primarily financial rather than passion for technology and problem-solving.",
        },
      ],
      correctnessScores: [
        {
          question: 1,
          score: 4.0,
          reasoning: "Limited understanding of JavaScript concepts with no evidence of practical application.",
        },
        {
          question: 2,
          score: 4.5,
          reasoning: "Basic learning approach but lacks structured methodology for skill development.",
        },
        {
          question: 3,
          score: 4.0,
          reasoning: "Response shows lack of genuine interest in software development as a craft.",
        },
      ],
      overallVerdict: "Not Recommended",
      aiRecommendation:
        "Candidate shows very basic technical knowledge and lacks the passion and systematic approach needed for software development. Responses indicate surface-level understanding without practical experience. Not recommended for current position.",
    },
  },
  {
    id: "4",
    fullName: "David Kim",
    email: "david.kim@email.com",
    phone: "+8201234567",
    linkedin: "https://www.linkedin.com/in/david-kim",
    applicationStatus: "pending",
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
    questionsAndAnswers: [
      {
        question: "Describe your experience with machine learning.",
        answer: "I have extensive experience in ML with 3+ years in research and industrial applications, working with TensorFlow and PyTorch.",
      },
      {
        question: "How do you design microservices architecture?",
        answer: "I follow domain-driven design principles, ensure proper service boundaries, and implement robust communication patterns.",
      },
      {
        question: "What's your approach to system scalability?",
        answer: "I use horizontal scaling, load balancing, caching strategies, and database sharding to handle high traffic loads.",
      },
    ],
    aiAnalysis: null,
  },
];

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Server-side data fetching from static data
  let applicationDetails: Application | null = null;
  let error: string | null = null;

  try {
    // Find application by ID from static data
    applicationDetails = candidatesData.find(app => app.id === id) || null;
    
    if (!applicationDetails) {
      error = "Application not found";
    }
  } catch (err) {
    console.error("Error fetching application:", err);
    error = "Failed to load application data";
  }

  return (
    <ApplicationDetailPageClient 
      applicationDetails={applicationDetails!} 
      error={error}
    />
  );
}

// Generate static params for all applications
export async function generateStaticParams() {
  return candidatesData.map((application) => ({
    id: application.id,
  }));
}