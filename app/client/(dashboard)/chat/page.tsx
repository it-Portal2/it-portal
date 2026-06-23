"use client"

import ChatInterface from "@/components/client components/chat/ChatInterface"
import { useAuthStore } from "@/lib/store/userStore";

export default function SupportChatPage() {
  const { profile } = useAuthStore();
  return (
    <ChatInterface
      clientName={profile?.name || ""}
      clientAvatar={profile?.avatar || ""}
    />
  )
}
