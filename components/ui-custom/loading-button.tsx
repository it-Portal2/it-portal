import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

export interface LoadingButtonProps extends ButtonProps {
  /** When true, shows a spinner and disables the button. */
  loading?: boolean;
  /** Optional text to show while loading (defaults to children). */
  loadingText?: React.ReactNode;
}

/**
 * Button that shows a spinner and disables itself while an async action is in
 * flight. Drive `loading` from `useTransition()`'s `isPending` (React 18) or a
 * local loading flag. Prevents double-submits and gives visible feedback.
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, loadingText, disabled, children, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={disabled || loading} {...props}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            {loadingText ?? children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  },
);
LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
