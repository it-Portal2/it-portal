"use client";

import Layout from "@/components/layout/Layout";
import { useAuthStore } from "@/lib/store/userStore";
import type { User } from "@/lib/types";

/**
 * Wraps a route-level loading skeleton in the dashboard shell (sidebar +
 * header). The client portal renders `<Layout>` inside each page rather than
 * via a parent `layout.tsx`, so its `loading.tsx` files must render the shell
 * themselves — otherwise the skeleton would take over the full page and hide
 * the sidebar during navigation (admin/developer get the shell from their
 * `layout.tsx`, so their loading files don't need this).
 */
export function ClientLoadingShell({
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
