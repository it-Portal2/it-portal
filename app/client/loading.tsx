import { ClientLoadingShell } from "@/components/ui-custom/client-loading-shell";
import { DashboardSkeleton } from "@/components/ui-custom/page-skeletons";

export default function Loading() {
  return (
    <ClientLoadingShell>
      <DashboardSkeleton />
    </ClientLoadingShell>
  );
}
