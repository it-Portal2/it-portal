"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import Header from "./Header";
import SideBar from "./Sidebar";
import { useAuthStore } from "@/lib/store/userStore";
import { FullScreenLoader } from "@/components/ui-custom/full-screen-loader";

interface LayoutProps {
  user: User;
  title: string;
  description?: string;
  children: React.ReactNode;
}
const Layout = ({ user, title, description, children }: LayoutProps) => {
  const router = useRouter();
  const { profile, isAuthenticated, isInitialized } = useAuthStore();

  // Redirect to the auth page the moment the user becomes unauthenticated
  // (e.g. after logout) — complements the server middleware and ensures the
  // protected content below is never shown to a logged-out user.
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/");
    }
  }, [isInitialized, isAuthenticated, router]);

  // Auth boundary: don't render protected content until auth state is known,
  // and never render it when unauthenticated. This removes the post-login
  // flash and keeps the dashboard from lingering after logout.
  if (!isInitialized) {
    return <FullScreenLoader />;
  }
  if (!isAuthenticated) {
    return <FullScreenLoader label="Redirecting…" />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div>
        {profile && (
          <SideBar
            role={profile.role}
            userName={profile.name}
            userAvatar={profile.avatar}
          />
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <Header title={title} description={description} />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
