import { ClientLoadingShell } from "@/components/ui-custom/client-loading-shell";
import { ChatSkeleton } from "@/components/ui-custom/page-skeletons";

export default function Loading() {
  return (
    <ClientLoadingShell>
      <ChatSkeleton />
    </ClientLoadingShell>
  );
}
