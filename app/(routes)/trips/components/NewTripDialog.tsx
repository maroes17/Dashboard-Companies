"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Trip } from "@/lib/types/trips";

interface NewTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewTripDialog({ open, onOpenChange, onSuccess }: NewTripDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Trip>>({
    tipo: 'ida',
    estado: 'en_ruta',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('viajes')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Viaje creado",
        description: "El viaje ha sido creado exitosamente.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al crear viaje:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Viaje</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Viaje</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as 'ida' | 'vuelta' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ida">Viaje de Ida</SelectItem>
                  <SelectItem value="vuelta">Viaje de Vuelta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                value={formData.cliente || ''}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origen">Origen</Label>
              <Input
                id="origen"
                value={formData.origen || ''}
                onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destino">Destino</Label>
              <Input
                id="destino"
                value={formData.destino || ''}
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_salida">Fecha de Salida</Label>
              <Input
                id="fecha_salida"
                type="date"
                value={formData.fecha_salida || ''}
                onChange={(e) => setFormData({ ...formData, fecha_salida: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_llegada">Fecha de Llegada</Label>
              <Input
                id="fecha_llegada"
                type="date"
                value={formData.fecha_llegada || ''}
                onChange={(e) => setFormData({ ...formData, fecha_llegada: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contenedor">Contenedor</Label>
              <Input
                id="contenedor"
                value={formData.contenedor || ''}
                onChange={(e) => setFormData({ ...formData, contenedor: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nro_guia">Número de Guía</Label>
              <Input
                id="nro_guia"
                value={formData.nro_guia || ''}
                onChange={(e) => setFormData({ ...formData, nro_guia: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conductor_id">Conductor</Label>
              <Select
                value={formData.conductor_id?.toString()}
                onValueChange={(value) => setFormData({ ...formData, conductor_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar conductor" />
                </SelectTrigger>
                <SelectContent>
                  {/* Aquí se cargarían los conductores desde la base de datos */}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehiculo_id">Vehículo</Label>
              <Select
                value={formData.vehiculo_id?.toString()}
                onValueChange={(value) => setFormData({ ...formData, vehiculo_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {/* Aquí se cargarían los vehículos desde la base de datos */}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semirremolque_id">Semirremolque</Label>
              <Select
                value={formData.semirremolque_id?.toString()}
                onValueChange={(value) => setFormData({ ...formData, semirremolque_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar semirremolque" />
                </SelectTrigger>
                <SelectContent>
                  {/* Aquí se cargarían los semirremolques desde la base de datos */}
                </SelectContent>
              </Select>
            </div>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Viaje"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 