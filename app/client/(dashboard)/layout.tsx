"use client";

import Layout from "@/components/layout/Layout";
import { useAuthStore } from "@/lib/store/userStore";
import { User } from "@/lib/types";

/**
 * Shell for the client dashboard routes (everything under /client except the
 * intentionally full-screen create-project flow, which sits outside this route
 * group). Renders the sidebar/header once so it persists across navigation and
 * during loading.tsx states. Page titles come from the pathname (see Header).
 */
export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useAuthStore();

  return (
    <Layout user={profile || ({} as User)} title="" description="">
      {children}
    </Layout>
  );
}
