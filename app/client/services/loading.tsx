import { ClientLoadingShell } from "@/components/ui-custom/client-loading-shell";
import { CardGridSkeleton } from "@/components/ui-custom/page-skeletons";

export default function Loading() {
  return (
    <ClientLoadingShell>
      <CardGridSkeleton cards={9} />
    </ClientLoadingShell>
  );
}
