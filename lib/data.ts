// import { Project, Task, TeamMember, Message, User } from "./types";
// import { addDays, subDays, format } from "date-fns";

// // Current date for reference
// const today = new Date();



// // Mock Tasks (additional tasks not tied to specific projects)
// export const mockTasks: Task[] = [
//   {
//     id: "1",
//     name: "Design Database Schema",
//     projectId: "2",
//     projectName: "Mobile Banking App",
//     status: "completed",
//     deadline: "2023-08-25T00:00:00",
//     priority: "high",
//   },
//   {
//     id: "2",
//     name: "Implement User Authentication",
//     projectId: "2",
//     projectName: "Mobile Banking App",
//     status: "in-progress",
//     deadline: "2023-09-10T00:00:00",
//     priority: "high",
//   },
//   {
//     id: "3",
//     name: "Create Transaction API",
//     projectId: "2",
//     projectName: "Mobile Banking App",
//     status: "not-started",
//     deadline: "2023-09-25T00:00:00",
//     priority: "medium",
//   },
//   {
//     id: "4",
//     name: "Design Patient Dashboard",
//     projectId: "3",
//     projectName: "Healthcare Management System",
//     status: "completed",
//     deadline: "2023-08-15T00:00:00",
//     priority: "medium",
//   },
//   {
//     id: "5",
//     name: "Implement Appointment Scheduling",
//     projectId: "3",
//     projectName: "Healthcare Management System",
//     status: "completed",
//     deadline: "2023-09-01T00:00:00",
//     priority: "high",
//   },
//   {
//     id: "6",
//     name: "Develop Billing Module",
//     projectId: "3",
//     projectName: "Healthcare Management System",
//     status: "in-progress",
//     deadline: "2023-10-15T00:00:00",
//     priority: "medium",
//   },
//   {
//     id: "7",
//     name: "Integrate Electronic Health Records",
//     projectId: "3",
//     projectName: "Healthcare Management System",
//     status: "not-started",
//     deadline: "2023-11-01T00:00:00",
//     priority: "high",
//   },
//   {
//     id: "8",
//     name: "Design Course Listing UI",
//     projectId: "6",
//     projectName: "Educational Course Platform",
//     status: "completed",
//     deadline: "2023-09-05T00:00:00",
//     priority: "medium",
//   },
//   {
//     id: "9",
//     name: "Implement Video Streaming",
//     projectId: "6",
//     projectName: "Educational Course Platform",
//     status: "in-progress",
//     deadline: "2023-10-10T00:00:00",
//     priority: "high",
//   },
//   {
//     id: "10",
//     name: "Develop Quiz Module",
//     projectId: "6",
//     projectName: "Educational Course Platform",
//     status: "not-started",
//     deadline: "2023-10-25T00:00:00",
//     priority: "medium",
//   },
// ];

// // Mock Team Members
// export const teamMembers: TeamMember[] = [
//   {
//     id: "user-2",
//     name: "Sarah Developer",
//     role: "developer",
//     projectsAssigned: ["project-2", "project-5"],
//     availability: "busy",
//     avatar:
//       "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
//   },
//   {
//     id: "team-2",
//     name: "Mike Johnson",
//     role: "developer",
//     projectsAssigned: [],
//     availability: "available",
//     avatar:
//       "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
//   },
//   {
//     id: "team-3",
//     name: "Emily Chen",
//     role: "designer",
//     projectsAssigned: ["project-2"],
//     availability: "busy",
//     avatar:
//       "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
//   },
//   {
//     id: "team-4",
//     name: "James Wilson",
//     role: "developer",
//     projectsAssigned: ["project-5"],
//     availability: "busy",
//     avatar:
//       "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
//   },
//   {
//     id: "team-5",
//     name: "Sophia Martinez",
//     role: "designer",
//     projectsAssigned: [],
//     availability: "available",
//     avatar:
//       "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
//   },
// ];

// // Mock Messages
// export const messages: Message[] = [
//   {
//     id: "msg-1",
//     senderId: "user-1",
//     receiverId: "user-2",
//     content: "How is the progress on the Mobile App project?",
//     timestamp: new Date(
//       today.getFullYear(),
//       today.getMonth(),
//       today.getDate(),
//       9,
//       30
//     ).toISOString(),
//     read: true,
//   },
//   {
//     id: "msg-2",
//     senderId: "user-2",
//     receiverId: "user-1",
//     content:
//       "Going well! I've completed the UI design and started on the frontend development.",
//     timestamp: new Date(
//       today.getFullYear(),
//       today.getMonth(),
//       today.getDate(),
//       9,
//       45
//     ).toISOString(),
//     read: true,
//   },
//   {
//     id: "msg-3",
//     senderId: "user-1",
//     receiverId: "user-2",
//     content:
//       "Great! Let me know if you need any resources or have questions about the requirements.",
//     timestamp: new Date(
//       today.getFullYear(),
//       today.getMonth(),
//       today.getDate(),
//       10,
//       0
//     ).toISOString(),
//     read: false,
//   },
//   {
//     id: "msg-4",
//     senderId: "user-2",
//     receiverId: "user-1",
//     content:
//       "I might need clarification on the API integration. Can we discuss that tomorrow?",
//     timestamp: new Date(
//       today.getFullYear(),
//       today.getMonth(),
//       today.getDate(),
//       10,
//       15
//     ).toISOString(),
//     read: false,
//   },
// ];


// export const getTasksByProjectId = (projectId: string) => tasks.filter(task => task.projectId === projectId);
// export const getTasksByDeveloper = (developerId: string) => {
//   const developerProjects = projects.filter(project =>
//     project.assignedTo?.includes(developerId)
//   ).map(project => project.id);

//   return tasks.filter(task =>
//     developerProjects.includes(task.projectId)
//   );
// };

// export const getUpcomingDeadlines = () => {
//   const sevenDaysFromNow = addDays(today, 7);
//   return projects.filter(project =>
//     project.status === 'ongoing' &&
//     project.deadline &&
//     new Date(project.deadline) <= sevenDaysFromNow
//   );
// };

// export const getTotalRevenue = () => {
//   return projects
//     .filter(project => project.status === 'ongoing' || project.status === 'completed')
//     .reduce((total, project) => total + project.estimatedCost, 0);
// };

// export const getRecentRequests = (count = 5) => {
//   return [...projects]
//     .filter(project => project.status === 'pending')
//     .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
//     .slice(0, count);
// };
