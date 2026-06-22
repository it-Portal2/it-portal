"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Shared error UI for App Router `error.tsx` boundaries. Logs the error and
 * offers a retry via the provided `reset` callback.
 */
export function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          We couldn&apos;t load this page. Please try again — if the problem
          persists, refresh or come back in a moment.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        <RotateCcw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
