"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AdvancedPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancedPlanDialog({ open, onOpenChange }: AdvancedPlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Advance Plan Bundles</DialogTitle>
          <DialogDescription>
            Configure predefined bundles for the client.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
            {/* Bundle implementation goes here */}
            Bundle selection interface will be implemented here.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
