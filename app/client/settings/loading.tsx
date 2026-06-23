import { ClientLoadingShell } from "@/components/ui-custom/client-loading-shell";
import { FormSkeleton } from "@/components/ui-custom/page-skeletons";

export default function Loading() {
  return (
    <ClientLoadingShell>
      <FormSkeleton />
    </ClientLoadingShell>
  );
}
