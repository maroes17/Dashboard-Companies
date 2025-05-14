"use client";

import { useState, useEffect } from "react";
import { Semirremolque, Fleet, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, AlertCircle, Truck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface AssignVehicleDialogProps {
  semitrailer: Semirremolque | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (semitrailerId: number, fleetId: number | null) => Promise<void>;
}

export function AssignVehicleDialog({
  semitrailer,
  open,
  onOpenChange,
  onAssign,
}: AssignVehicleDialogProps) {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Fleet[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Fleet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAssignedVehicle, setCurrentAssignedVehicle] = useState<Fleet | null>(null);
  const [assignedVehicleIds, setAssignedVehicleIds] = useState<number[]>([]);

  // Resetear el estado cuando el diálogo se cierra
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setSearchQuery("");
        setError(null);
        setSelectedVehicleId(null);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Cargar la lista de vehículos disponibles al abrir el diálogo
  useEffect(() => {
    if (open && semitrailer) {
      setSearchQuery("");
      setError(null);
      
      fetchVehiclesAndSemitrailers();
      
      if (semitrailer.asignado_a_flota_id) {
        setSelectedVehicleId(semitrailer.asignado_a_flota_id);
      } else {
        setSelectedVehicleId(null);
      }
    }
  }, [open, semitrailer]);

  const fetchVehiclesAndSemitrailers = async () => {
    if (!semitrailer) return;
    
    try {
      setIsLoading(true);
      
      // 1. Obtener todos los vehículos
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("flota")
        .select("*")
        .order("patente");
      
      if (vehiclesError) throw vehiclesError;
      
      // 2. Obtener semirremolques para saber cuáles ya están asignados
      const { data: semitrailersData, error: semitrailersError } = await supabase
        .from("semirremolques")
        .select("asignado_a_flota_id")
        .not("id_semirremolque", "eq", semitrailer.id_semirremolque) // Excluir el semirremolque actual
        .not("asignado_a_flota_id", "is", null); // Solo los que tienen asignación
      
      if (semitrailersError) throw semitrailersError;
      
      // 3. Identificar vehículos que ya tienen semirremolques asignados
      const assignedVehicleIds = semitrailersData.map(s => s.asignado_a_flota_id);
      setAssignedVehicleIds(assignedVehicleIds as number[]);
      
      // 4. Filtrar para tener solo vehículos disponibles (no tienen semirremolque asignado)
      // Incluye también el vehículo actualmente asignado al semirremolque actual (si existe)
      const vehicles = vehiclesData.map(v => ({
        id_flota: v.id_flota,
        tipo: v.tipo,
        categoria: v.categoria,
        subcategoria: v.subcategoria,
        patente: v.patente,
        nro_chasis: v.nro_chasis,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        capacidad: v.capacidad,
        estado: v.estado,
        fecha_ingreso: v.fecha_ingreso,
        id_chofer_asignado: v.id_chofer_asignado,
        km_actual: v.km_actual,
        km_ultimo_servicio: v.km_ultimo_servicio,
        km_proximo_servicio: v.km_proximo_servicio,
        fecha_ultima_mantencion: v.fecha_ultima_mantencion,
        fecha_proximo_mantenimiento: v.fecha_proximo_mantenimiento,
        vencimiento_revision_tecnica: v.vencimiento_revision_tecnica,
        vencimiento_permiso_circulacion: v.vencimiento_permiso_circulacion,
        vencimiento_seguro: v.vencimiento_seguro,
        consumo_promedio: v.consumo_promedio,
        origen: v.origen,
        observaciones: v.observaciones,
        creado_en: v.creado_en,
        actualizado_en: v.actualizado_en
      }));
      
      setVehicles(vehicles);
      
      // Filtrar vehículos disponibles (no tienen semirremolque asignado o es el actual)
      const availableVehiclesList = vehicles.filter(vehicle => 
        !assignedVehicleIds.includes(vehicle.id_flota) || 
        vehicle.id_flota === semitrailer.asignado_a_flota_id
      );
      
      setAvailableVehicles(availableVehiclesList);
      
      // Si el semirremolque ya tiene un vehículo asignado, guardarlo como el actual
      if (semitrailer.asignado_a_flota_id) {
        const currentVehicle = vehicles.find(v => v.id_flota === semitrailer.asignado_a_flota_id) || null;
        setCurrentAssignedVehicle(currentVehicle);
      } else {
        setCurrentAssignedVehicle(null);
      }
      
    } catch (err: any) {
      console.error("Error al cargar vehículos:", err);
      setError(`Error al cargar datos: ${err.message}`);
      toast({
        title: "Error",
        description: "No se pudieron cargar los vehículos disponibles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar vehículos según la búsqueda
  const filteredVehicles = availableVehicles.filter(vehicle => {
    if (searchQuery.trim() === "") return true;
    
    const query = searchQuery.toLowerCase();
    return (
      vehicle.patente.toLowerCase().includes(query) ||
      vehicle.marca.toLowerCase().includes(query) ||
      vehicle.modelo.toLowerCase().includes(query) ||
      (vehicle.tipo && vehicle.tipo.toLowerCase().includes(query))
    );
  });

  const handleAssign = async () => {
    if (!semitrailer) return;
    
    try {
      setUpdating(true);
      setError(null);
      
      await onAssign(semitrailer.id_semirremolque, selectedVehicleId);
      
      onOpenChange(false);
      
    } catch (err: any) {
      console.error("Error al asignar vehículo:", err);
      setError(`Error al asignar: ${err.message}`);
      
      toast({
        title: "Error",
        description: "No se pudo completar la asignación del vehículo",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Vehículo</DialogTitle>
          <DialogDescription>
            {semitrailer ? (
              <>Selecciona un vehículo para asignar al semirremolque <strong>{semitrailer.patente}</strong></>
            ) : (
              'Selecciona un vehículo para asignar al semirremolque'
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
          
          <div className="space-y-2">
            <Label htmlFor="search">Buscar vehículo</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="search"
                placeholder="Buscar por patente o marca..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="border rounded-md">
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Cargando vehículos...</p>
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">No se encontraron vehículos disponibles</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredVehicles.map((vehicle) => {
                    // Verificar si el vehículo tiene un semirremolque asignado
                    const hasSemitrailer = assignedVehicleIds.includes(vehicle.id_flota) && 
                                          vehicle.id_flota !== semitrailer?.asignado_a_flota_id;
                    
                    return (
                      <div 
                        key={vehicle.id_flota}
                        className={`p-3 flex justify-between items-center hover:bg-accent cursor-pointer ${
                          hasSemitrailer 
                            ? "opacity-50" 
                            : selectedVehicleId === vehicle.id_flota 
                              ? "bg-accent/30" 
                              : ""
                        }`}
                        onClick={() => {
                          if (!hasSemitrailer) {
                            setSelectedVehicleId(vehicle.id_flota);
                          }
                        }}
                      >
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <Truck className={`h-4 w-4 ${
                              vehicle.estado === "activo" ? "text-green-500" :
                              vehicle.estado === "mantenimiento" ? "text-yellow-500" :
                              vehicle.estado === "en_reparacion" ? "text-orange-500" :
                              "text-gray-500"
                            }`} />
                            <span className="font-medium">{vehicle.patente}</span>
                            <Badge variant="outline" className="ml-1 h-5 py-0 px-2">
                              {vehicle.estado.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {vehicle.marca} {vehicle.modelo} {vehicle.anio && `(${vehicle.anio})`}
                          </div>
                          {hasSemitrailer && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                              <AlertCircle className="h-3 w-3" />
                              <span>Este vehículo ya tiene un semirremolque asignado</span>
                            </div>
                          )}
                        </div>
                        <div>
                          {vehicle.id_flota === semitrailer?.asignado_a_flota_id && (
                            <Badge className="bg-primary">Asignado</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
            disabled={updating || (selectedVehicleId === semitrailer?.asignado_a_flota_id)}
          >
            {updating ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 