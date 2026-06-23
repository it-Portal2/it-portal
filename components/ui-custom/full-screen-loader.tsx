import { Loader2 } from "lucide-react";

/**
 * Full-viewport loading state used as the auth boundary fallback — shown while
 * auth state is initializing or while a protected route is being left
 * (logout / unauthenticated). Prevents protected content from flashing.
 */
export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {label ? (
        <p className="text-sm text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}
