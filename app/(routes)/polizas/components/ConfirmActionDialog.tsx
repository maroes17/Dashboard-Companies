"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionText: string;
  actionVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  actionText,
  actionVariant = "default",
  onConfirm,
  isLoading = false,
}: ConfirmActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant={actionVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Procesando..." : actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 