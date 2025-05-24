"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Trip } from "@/lib/types/trips";

interface Driver {
  id_chofer: number;
  nombre_completo: string;
  estado: string;
  vehiculo?: {
    id_flota: number;
    patente: string;
    marca: string;
    modelo: string;
  } | null;
  semirremolque?: {
    id_semirremolque: number;
    patente: string;
    tipo: string;
  } | null;
}

interface AssignDriverDialogProps {
  trip: Partial<Trip>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedTrip: Partial<Trip>) => void;
}

export function AssignDriverDialog({ trip, open, onOpenChange, onSuccess }: AssignDriverDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      fetchAvailableDrivers();
    }
  }, [open]);

  const fetchAvailableDrivers = async () => {
    try {
      // Primero obtenemos los conductores activos con sus vehículos asignados
      const { data: driversData, error: driversError } = await supabase
        .from('choferes')
        .select(`
          id_chofer,
          nombre_completo,
          estado,
          flota!inner (
            id_flota,
            patente,
            marca,
            modelo
          )
        `)
        .eq('estado', 'activo');

      if (driversError) throw driversError;

      // Luego obtenemos los viajes activos para filtrar conductores ocupados
      const { data: activeTrips, error: tripsError } = await supabase
        .from('viajes')
        .select('id_chofer')
        .in('estado', ['en_ruta', 'incidente']);

      if (tripsError) throw tripsError;

      // Obtenemos los IDs de los conductores ocupados
      const busyDriverIds = new Set(activeTrips?.map(trip => trip.id_chofer));

      // Filtramos los conductores disponibles que tienen vehículo asignado
      const availableDrivers = driversData
        ?.filter(driver => !busyDriverIds.has(driver.id_chofer))
        .map(driver => ({
          id_chofer: driver.id_chofer,
          nombre_completo: driver.nombre_completo,
          estado: driver.estado,
          vehiculo: {
            id_flota: driver.flota[0].id_flota,
            patente: driver.flota[0].patente,
            marca: driver.flota[0].marca,
            modelo: driver.flota[0].modelo
          },
          semirremolque: null // Por ahora no manejamos semirremolques
        })) || [];

      setDrivers(availableDrivers);
    } catch (error: any) {
      console.error('Error al cargar conductores:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los conductores disponibles.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedDriver) {
      toast({
        title: "Error",
        description: "Por favor selecciona un conductor.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const selectedDriverData = drivers.find(d => d.id_chofer === selectedDriver);
      if (!selectedDriverData) {
        throw new Error("No se encontró la información del conductor seleccionado");
      }

      if (!selectedDriverData.vehiculo) {
        throw new Error("El conductor seleccionado no tiene un vehículo asignado");
      }

      // Actualizar el viaje con la información del conductor y sus vehículos
      const { error: updateError } = await supabase
        .from('viajes')
        .update({
          id_chofer: selectedDriverData.id_chofer,
          id_flota: selectedDriverData.vehiculo.id_flota,
          id_semirremolque: selectedDriverData.semirremolque?.id_semirremolque || null,
          estado: 'en_ruta'
        })
        .eq('id_viaje', trip.id_viaje);

      if (updateError) {
        throw new Error(`Error al actualizar viaje: ${updateError.message}`);
      }

      const updatedTrip: Partial<Trip> = {
        ...trip,
        conductor_id: selectedDriverData.id_chofer,
        vehiculo_id: selectedDriverData.vehiculo.id_flota,
        semirremolque_id: selectedDriverData.semirremolque?.id_semirremolque || undefined,
        estado: 'en_ruta'
      };

      onSuccess(updatedTrip);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al asignar conductor:', error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al asignar el conductor.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Conductor</DialogTitle>
          <DialogDescription>
            Selecciona un conductor para asignar al viaje. Se asignará automáticamente su vehículo y semirremolque.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Select
              value={selectedDriver?.toString()}
              onValueChange={(value) => setSelectedDriver(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar conductor" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem 
                    key={driver.id_chofer} 
                    value={driver.id_chofer.toString()}
                    disabled={!driver.vehiculo}
                  >
                    {driver.nombre_completo}
                    {driver.vehiculo ? ` - ${driver.vehiculo.patente}` : ' (Sin vehículo asignado)'}
                  </SelectItem>
                ))}
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
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !selectedDriver}
          >
            {isLoading ? "Asignando..." : "Asignar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 