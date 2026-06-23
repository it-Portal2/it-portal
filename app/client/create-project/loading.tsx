import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the create-project flow. Mirrors the page's full-screen
 * centered multi-step form (stepper + form card + nav buttons) so the skeleton
 * is structurally aligned with what loads in.
 */
export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        {/* Stepper */}
        <div className="flex items-center justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-1 items-center">
              <Skeleton className="h-9 w-9 rounded-full" />
              {i < 3 && <Skeleton className="mx-2 h-1 flex-1" />}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="space-y-6 rounded-xl border p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          {/* Nav buttons */}
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>
    </main>
  );
}
