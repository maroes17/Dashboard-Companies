"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Trip, TripIncident } from "@/lib/types/trips";

interface TripIncidentDialogProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TripIncidentDialog({ trip, open, onOpenChange, onSuccess }: TripIncidentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<TripIncident>>({
    tipo_incidente: '',
    descripcion: '',
    estado: 'reportado',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    setIsLoading(true);

    try {
      // 1. Crear el incidente
      const { data: incidentData, error: incidentError } = await supabase
        .from('incidentes_viaje')
        .insert([{
          ...formData,
          id_viaje: trip.id_viaje,
          fecha_inicio: new Date().toISOString(),
        }])
        .select()
        .single();

      if (incidentError) throw incidentError;

      // 2. Actualizar el estado del viaje
      const { error: tripError } = await supabase
        .from('viajes')
        .update({ estado: 'incidente' })
        .eq('id_viaje', trip.id_viaje);

      if (tripError) throw tripError;

      toast({
        title: "Incidente reportado",
        description: "El incidente ha sido registrado exitosamente.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al reportar incidente:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reportar Incidente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo_incidente">Tipo de Incidente</Label>
            <Input
              id="tipo_incidente"
              value={formData.tipo_incidente || ''}
              onChange={(e) => setFormData({ ...formData, tipo_incidente: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acciones_tomadas">Acciones Tomadas</Label>
            <Textarea
              id="acciones_tomadas"
              value={formData.acciones_tomadas || ''}
              onChange={(e) => setFormData({ ...formData, acciones_tomadas: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? "Reportando..." : "Reportar Incidente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 