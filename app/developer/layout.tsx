"use client"
import Layout from "@/components/layout/Layout";
import type React from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/userStore";
import { User } from "@/lib/types";

interface PageMetadata {
  title: string;
  description: string;
}


interface PageMetadataDict {
  [path: string]: PageMetadata;
}

const pageMetadata: PageMetadataDict = {
  "/developer": {
    title: "Developer Dashboard",
    description: "Track your assigned projects and progress"
  },
  "/developer/projects": {
    title: "My Projects",
    description: "View and manage your assigned projects"
  },
  "/developer/tasks": {
    title: "Task Management",
    description: "Track and update your tasks and deadlines"
  },
  "/developer/chat": {
    title: "Chat with Admin",
    description: "Direct communication channel with administrators"
  },
  "/developer/settings": {
    title: "Settings",
    description: "Manage your account preferences",
  },
};

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile } = useAuthStore()
  const metadata = pageMetadata[pathname] || {
    title: "Developer Dashboard",
    description: "Track your assigned projects and progress"
  };

  return (
    <Layout
      user={profile || {} as User}
      title={metadata.title}
      description={metadata.description}
    >
      {children}
    </Layout>
  );
}