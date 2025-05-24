"use client";

import { useState, useEffect } from "react";
import { Semirremolque, Fleet, supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, AlertCircle, Truck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignSemitrailerDialogProps {
  vehicle: Fleet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (vehicleId: number, semitrailerId: number | null) => Promise<void>;
}

export function AssignSemitrailerDialog({
  vehicle,
  open,
  onOpenChange,
  onAssign,
}: AssignSemitrailerDialogProps) {
  const { toast } = useToast();
  const [semitrailers, setSemitrailers] = useState<Semirremolque[]>([]);
  const [availableSemitrailers, setAvailableSemitrailers] = useState<Semirremolque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemitrailerId, setSelectedSemitrailerId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAssignedSemitrailer, setCurrentAssignedSemitrailer] = useState<Semirremolque | null>(null);

  // Resetear el estado cuando el diálogo se cierra
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setSearchQuery("");
        setError(null);
        setSelectedSemitrailerId(null);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Cargar la lista de semirremolques disponibles al abrir el diálogo
  useEffect(() => {
    if (open && vehicle) {
      setSearchQuery("");
      setError(null);
      
      fetchSemitrailers();
      
      // Si el vehículo ya tiene un semirremolque asignado, seleccionarlo
      if (vehicle.id_semirremolque_asignado) {
        setSelectedSemitrailerId(vehicle.id_semirremolque_asignado);
      } else {
        setSelectedSemitrailerId(null);
      }
    }
  }, [open, vehicle]);

  const fetchSemitrailers = async () => {
    if (!vehicle) return;
    
    try {
      setIsLoading(true);
      
      // 1. Obtener todos los semirremolques activos
      const { data: semitrailersData, error: semitrailersError } = await supabase
        .from("semirremolques")
        .select("*")
        .eq("estado", "activo")
        .order("patente");
      
      if (semitrailersError) throw semitrailersError;
      
      // 2. Filtrar semirremolques disponibles (no asignados o asignados al vehículo actual)
      const availableSemitrailersList = semitrailersData.filter(semitrailer => 
        !semitrailer.asignado_a_flota_id || 
        semitrailer.asignado_a_flota_id === vehicle.id_flota
      );
      
      setSemitrailers(semitrailersData);
      setAvailableSemitrailers(availableSemitrailersList);
      
      // 3. Si el vehículo ya tiene un semirremolque asignado, guardarlo como el actual
      const currentSemitrailer = semitrailersData.find(s => s.asignado_a_flota_id === vehicle.id_flota) || null;
      setCurrentAssignedSemitrailer(currentSemitrailer);
    } catch (error) {
      console.error("Error al cargar semirremolques:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los semirremolques disponibles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar semirremolques según la búsqueda
  const filteredSemitrailers = availableSemitrailers.filter(semitrailer => {
    if (searchQuery.trim() === "") return true;
    
    const query = searchQuery.toLowerCase();
    return (
      semitrailer.patente.toLowerCase().includes(query) ||
      (semitrailer.marca?.toLowerCase() || '').includes(query) ||
      (semitrailer.modelo?.toLowerCase() || '').includes(query) ||
      (semitrailer.tipo?.toLowerCase() || '').includes(query)
    );
  });

  const handleAssign = async () => {
    if (!vehicle) return;
    
    try {
      setUpdating(true);
      setError(null);
      
      await onAssign(vehicle.id_flota, selectedSemitrailerId);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al asignar semirremolque:', error);
      setError(error.message || 'No se pudo asignar el semirremolque. Intente nuevamente.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Semirremolque</DialogTitle>
          <DialogDescription>
            {vehicle ? (
              <>Selecciona un semirremolque para asignar al vehículo <strong>{vehicle.marca} {vehicle.modelo} ({vehicle.patente})</strong></>
            ) : (
              'Selecciona un semirremolque para asignar al vehículo'
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="border rounded-md">
            <div className="flex justify-between items-center p-2 border-b">
              <Label className="font-medium">Semirremolque actual:</Label>
              <div>
                {currentAssignedSemitrailer ? (
                  <span>
                    {currentAssignedSemitrailer.patente} ({currentAssignedSemitrailer.tipo})
                    {selectedSemitrailerId === null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-7 text-red-500 hover:text-red-700"
                        onClick={() => setSelectedSemitrailerId(currentAssignedSemitrailer.id_semirremolque)}
                      >
                        Restaurar
                      </Button>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No hay semirremolque asignado</span>
                )}
              </div>
            </div>
            
            <div className="p-2 border-b">
              <Label className="font-medium mb-2 block">Seleccionar acción:</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={selectedSemitrailerId !== null ? "default" : "outline"} 
                  className="w-full justify-start"
                  onClick={() => {
                    let nextSemitrailerId: number = 0;
                    if (selectedSemitrailerId === null) {
                      if (currentAssignedSemitrailer) {
                        nextSemitrailerId = currentAssignedSemitrailer.id_semirremolque;
                      } else if (filteredSemitrailers.length > 0) {
                        nextSemitrailerId = filteredSemitrailers[0].id_semirremolque;
                      }
                    } else {
                      nextSemitrailerId = selectedSemitrailerId;
                    }
                    setSelectedSemitrailerId(nextSemitrailerId || filteredSemitrailers[0]?.id_semirremolque || null);
                  }}
                  disabled={filteredSemitrailers.length === 0}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Asignar semirremolque
                </Button>
                <Button 
                  variant={selectedSemitrailerId === null ? "default" : "outline"} 
                  className="w-full justify-start"
                  onClick={() => setSelectedSemitrailerId(null)}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Remover asignación
                </Button>
              </div>
            </div>
            
            {selectedSemitrailerId !== null && (
              <div>
                <div className="p-2">
                  <Label className="font-medium mb-2 block">Seleccionar semirremolque:</Label>
                  {isLoading ? (
                    <div className="py-2 text-center text-muted-foreground">
                      Cargando semirremolques disponibles...
                    </div>
                  ) : filteredSemitrailers.length > 0 ? (
                    <Select
                      value={selectedSemitrailerId?.toString() || ""}
                      onValueChange={(value) => setSelectedSemitrailerId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un semirremolque" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSemitrailers.map(semitrailer => (
                          <SelectItem key={semitrailer.id_semirremolque} value={semitrailer.id_semirremolque.toString()}>
                            {semitrailer.patente} - {semitrailer.tipo}
                            {semitrailer.id_semirremolque === currentAssignedSemitrailer?.id_semirremolque && " (Actual)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="py-2 text-center text-muted-foreground">
                      No hay semirremolques disponibles
                    </div>
                  )}
                </div>
                
                {selectedSemitrailerId && (
                  <div className="p-2 border-t">
                    {filteredSemitrailers.filter(s => s.id_semirremolque === selectedSemitrailerId).map(semitrailer => (
                      <div key={semitrailer.id_semirremolque} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{semitrailer.patente}</span>
                          <Badge variant="outline" className={
                            semitrailer.estado === 'activo' 
                              ? "bg-green-50 text-green-700" 
                              : semitrailer.estado === 'inactivo' 
                                ? "bg-gray-50 text-gray-700"
                                : "bg-red-50 text-red-700"
                          }>
                            {semitrailer.estado || 'No especificado'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {semitrailer.marca} {semitrailer.modelo} {semitrailer.anio && `(${semitrailer.anio})`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={updating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={updating || (selectedSemitrailerId === currentAssignedSemitrailer?.id_semirremolque)}
          >
            {updating ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 