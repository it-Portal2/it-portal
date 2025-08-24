"use client";
import Layout from "@/components/layout/Layout";
import type React from "react";
import { useAuthStore } from "@/lib/store/userStore";
import { User } from "@/lib/types";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useAuthStore();

  return (
    <Layout
      user={profile || {} as User}
      title="" 
      description="" 
    >
      {children}
    </Layout>
  );
}
