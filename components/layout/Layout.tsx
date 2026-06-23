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

  // Auth boundary:
  // - Definitively unauthenticated (e.g. after logout / expired session) →
  //   show the redirecting loader (the effect above navigates to "/").
  if (isInitialized && !isAuthenticated) {
    return <FullScreenLoader label="Redirecting…" />;
  }
  // - Auth state not yet known AND no persisted profile to render → brief
  //   full loader (prevents a null-profile flash). When a persisted session
  //   exists, `profile` is already populated, so we fall through and render
  //   the full shell immediately — only the page content shows its route-level
  //   skeleton, the sidebar/header stay put.
  if (!profile) {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div>
        <SideBar
          role={profile.role}
          userName={profile.name}
          userAvatar={profile.avatar}
        />
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
