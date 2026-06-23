import { ClientLoadingShell } from "@/components/ui-custom/client-loading-shell";
import { PaymentSkeleton } from "@/components/ui-custom/page-skeletons";

export default function Loading() {
  return (
    <ClientLoadingShell>
      <PaymentSkeleton />
    </ClientLoadingShell>
  );
}
