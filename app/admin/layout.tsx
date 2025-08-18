"use client";
import Layout from "@/components/layout/Layout";
import type React from "react";
import { usePathname } from "next/navigation"; // Assuming you're using Next.js
import { useAuthStore } from "@/lib/store/userStore";
import { User } from "@/lib/types";

interface PageMetadata {
  title: string;
  description: string;
}

interface PageMetadataDict {
  [path: string]: PageMetadata;
}

// Define page metadata for different paths
const pageMetadata: PageMetadataDict = {
  "/admin": {
    title: "Admin Dashboard",
    description: "Overview of all projects and requests",
  },
  "/admin/requests": {
    title: "Project Requests",
    description: "View and manage new client project submissions",
  },
  "/admin/ongoing": {
    title: "Ongoing Projects",
    description: "Track ongoing projects, their progress, and deadlines.",
  },
  "/admin/completed": {
    title: "Completed Projects",
    description: "View all finished projects and their details",
  },
  "/admin/rejected": {
    title: "Rejected Projects",
    description: "View and manage rejected project requests",
  },
  "/admin/intern-application": {
    title: "Intern Applications",
    description: "Review, accept, or reject internship applications",
  },
  "/admin/team": {
    title: "Team Management",
    description: "Manage developers and designers",
  },
  "/admin/settings": {
    title: "Settings",
    description: "Manage your account preferences",
  },
  "/admin/payments": {
    title: "Payments",
    description: "View and manage all payment details and receipts",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile } = useAuthStore();

  // Get metadata for current path or use defaults
  const metadata = pageMetadata[pathname] || {
    title: "Admin Dashboard",
    description: "Overview of all projects and requests",
  };

  return (
    <Layout
      user={profile || ({} as User)}
      title={metadata.title}
      description={metadata.description}
    >
      {children}
    </Layout>
  );
}
