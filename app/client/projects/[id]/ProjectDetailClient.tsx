
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import type { Project, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProjectDetailCard from "@/components/client components/dashboard/ProjectDetailCard";
import ProjectTimeline from "@/components/client components/dashboard/ProjectTimeline";
import { useAuthStore } from "@/lib/store/userStore";

interface ProjectDetailClientProps {
  initialProject: Project | null;
  error: string | null;
}

export default function ProjectDetailClient({ 
  initialProject, 
  error: initialError 
}: ProjectDetailClientProps) {
  const { profile } = useAuthStore();
  const router = useRouter();
  const [project] = useState<Project | null>(initialProject);
  const [error] = useState<string | null>(initialError);

  if (error || !project) {
    return (
      <Layout user={profile || ({} as User)} title="Project Details" description="Error">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-destructive font-medium">
            {error || "Project not found"}
          </p>
          <Link href="/client" className="mt-4">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      user={profile || ({} as User)}
      title="Project Details"
      description={`View details for ${project.projectName}`}
    >
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectDetailCard project={project} />
        </div>
        <div>
          <ProjectTimeline project={project} />
        </div>
      </div>
    </Layout>
  );
}