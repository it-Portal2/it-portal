"use client";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface DashboardHeaderProps {
  title?: string;
  description?: string;
}

interface PageMetadata {
  title: string;
  description: string;
}

// Add index signature to allow string indexing
interface PageMetadataDict {
  [key: string]: PageMetadata;
}

// Complete metadata for all user types and routes
const pageMetadata: PageMetadataDict = {
  // Admin routes
  "/admin/": {
    title: "Admin Dashboard",
    description: "Overview of all projects and requests",
  },
  "/admin/requests/": {
    title: "Project Requests",
    description: "View and manage new client project submissions",
  },
  "/admin/ongoing/": {
    title: "Ongoing Projects",
    description: "Track ongoing projects, their progress, and deadlines",
  },
  "/admin/completed/": {
    title: "Completed Projects",
    description: "View all finished projects and their details",
  },
  "/admin/rejected/": {
    title: "Rejected Projects",
    description: "View and manage rejected project requests",
  },
  "/admin/candidate-application/": {
    title: "Candidate Applications",
    description: "Manage candidate applications and interviews",
  },
  "/admin/team/": {
    title: "Team Management",
    description: "Manage developers and designers",
  },
  "/admin/settings/": {
    title: "Settings",
    description: "Manage your account preferences",
  },
  "/admin/payments/": {
    title: "Payments",
    description: "View and manage all payment details and receipts",
  },

  // Developer routes
  "/developer/": {
    title: "Developer Dashboard",
    description: "Track your assigned projects and progress",
  },
  "/developer/projects/": {
    title: "My Projects",
    description: "View and manage your assigned projects",
  },
  "/developer/tasks/": {
    title: "Task Management",
    description: "Track and update your tasks and deadlines",
  },
  "/developer/chat/": {
    title: "Chat with Admin",
    description: "Direct communication channel with administrators",
  },
  "/developer/settings/": {
    title: "Settings",
    description: "Manage your account preferences",
  },

  // Client routes
  "/client/": {
    title: "Client Dashboard",
    description: "Monitor your projects and communicate with the team",
  },
  "/client/projects/": {
    title: "My Projects",
    description: "View status and details of your submitted projects",
  },
  "/client/requests/": {
    title: "New Request",
    description: "Submit a new project request",
  },
  "/client/payments/": {
    title: "Payment History",
    description: "View your payment history and invoices",
  },
  "/client/chat/": {
    title: "Support Chat",
    description: "Get support and communicate with our team",
  },
  "/client/settings/": {
    title: "Settings",
    description: "Manage your account preferences",
  },
  "/client/services/": {
    title: "Explore Our Services",
    description:
      "Discover additional Cehpoint services to help grow your business",
  },
};

const Header = ({ title, description }: DashboardHeaderProps) => {
  const pathname = usePathname();

  const dynamicMetadata = pathname ? pageMetadata[pathname] : null;

  // Use provided props or fall back to dynamic metadata or defaults
  const currentTitle = title || dynamicMetadata?.title || "Dashboard";
  const currentDescription = description || dynamicMetadata?.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{currentTitle}</h1>
        {currentDescription && (
          <p className="text-muted-foreground">{currentDescription}</p>
        )}
      </div>
    </motion.div>
  );
};

export default Header;
