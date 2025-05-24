"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TripStatus } from "@/lib/types/trips";

interface TripFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    estado?: TripStatus[];
    tipo?: ('ida' | 'vuelta')[];
    cliente?: string[];
    origen?: string[];
    destino?: string[];
  };
  onApplyFilters: (filters: TripFilterDialogProps['filters']) => void;
}

export function TripFilterDialog({ open, onOpenChange, filters, onApplyFilters }: TripFilterDialogProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setLocalFilters({});
    onApplyFilters({});
    onOpenChange(false);
  };

  const toggleEstado = (estado: TripStatus) => {
    setLocalFilters(prev => ({
      ...prev,
      estado: prev.estado?.includes(estado)
        ? prev.estado.filter(e => e !== estado)
        : [...(prev.estado || []), estado]
    }));
  };

  const toggleTipo = (tipo: 'ida' | 'vuelta') => {
    setLocalFilters(prev => ({
      ...prev,
      tipo: prev.tipo?.includes(tipo)
        ? prev.tipo.filter(t => t !== tipo)
        : [...(prev.tipo || []), tipo]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar Viajes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label>Estado</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="estado-en-ruta"
                  checked={localFilters.estado?.includes('en_ruta')}
                  onCheckedChange={() => toggleEstado('en_ruta')}
                />
                <Label htmlFor="estado-en-ruta">En Ruta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="estado-incidente"
                  checked={localFilters.estado?.includes('incidente')}
                  onCheckedChange={() => toggleEstado('incidente')}
                />
                <Label htmlFor="estado-incidente">Incidente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="estado-realizado"
                  checked={localFilters.estado?.includes('realizado')}
                  onCheckedChange={() => toggleEstado('realizado')}
                />
                <Label htmlFor="estado-realizado">Realizado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="estado-cancelado"
                  checked={localFilters.estado?.includes('cancelado')}
                  onCheckedChange={() => toggleEstado('cancelado')}
                />
                <Label htmlFor="estado-cancelado">Cancelado</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Tipo de Viaje</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tipo-ida"
                  checked={localFilters.tipo?.includes('ida')}
                  onCheckedChange={() => toggleTipo('ida')}
                />
                <Label htmlFor="tipo-ida">Viaje de Ida</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tipo-vuelta"
                  checked={localFilters.tipo?.includes('vuelta')}
                  onCheckedChange={() => toggleTipo('vuelta')}
                />
                <Label htmlFor="tipo-vuelta">Viaje de Vuelta</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>
            Limpiar Filtros
          </Button>
          <Button onClick={handleApply}>
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 