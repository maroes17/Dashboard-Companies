"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionText: string;
  cancelText?: string;
  actionVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  actionText,
  cancelText = "Cancelar",
  actionVariant = "default",
  onConfirm,
  isLoading = false
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
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
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