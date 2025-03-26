"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/userStore";

import type { Project } from "@/lib/types";
import { fetchClientProjects } from "@/app/actions/client-actions";
import ClientDashboardUI from "./DashboardUI";

export default function ClientDashboardWrapper() {
  const { profile } = useAuthStore();
  const [projects, setProjects] = useState<Project[] | undefined>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      if (profile?.email) {
        try {
          setLoading(true);
          const result = await fetchClientProjects(profile.email);
          
          if (result.success) {
            setProjects(result.data);
          } else {
            setError(result.error || "An error occurred");
          }
        } catch (err) {
          setError("Failed to load projects");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProjects();
  }, [profile?.email]);

  return (
    <ClientDashboardUI
      projects={projects }
      loading={loading}
      error={error}
      profile={profile}
    />
  );
}