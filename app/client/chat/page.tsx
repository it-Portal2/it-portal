"use client"

import ChatInterface from "@/components/client components/chat/ChatInterface"
import Layout from "@/components/layout/Layout"
import { useAuthStore } from "@/lib/store/userStore";
import type { User } from "@/lib/types"


export default function SupportChatPage() {
  const { profile } = useAuthStore();
  return (
    <Layout user={profile || {} as User} title="Support Chat" description="Get help from our support team">
      <ChatInterface clientName={profile?.name || ""} clientAvatar={profile?.avatar || ""} />
    </Layout>
  )
}

