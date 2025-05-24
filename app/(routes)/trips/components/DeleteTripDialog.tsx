"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Trip } from "@/lib/types/trips";

interface DeleteTripDialogProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteTripDialog({ trip, open, onOpenChange, onSuccess }: DeleteTripDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!trip) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('viajes')
        .delete()
        .eq('id_viaje', trip.id_viaje);

      if (error) {
        throw error;
      }

      toast({
        title: "Viaje eliminado",
        description: `El viaje #${trip.nro_control || trip.id_viaje} ha sido eliminado exitosamente.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al eliminar viaje:", error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al eliminar el viaje.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminar Viaje</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar el viaje #{trip.nro_control || trip.id_viaje}? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 