"use client";

import { useState, useEffect } from "react";
import { Driver, Fleet, supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, UserRound, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface AssignDriverDialogProps {
  vehicle: Fleet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (vehicleId: number, driverId: number | null) => Promise<void>;
}

export function AssignDriverDialog({ 
  vehicle, 
  open, 
  onOpenChange, 
  onAssign 
}: AssignDriverDialogProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignedDriverIds, setAssignedDriverIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetear el estado cuando el diálogo se cierra
  useEffect(() => {
    if (!open) {
      // Esperar un momento antes de resetear para evitar cambios visuales durante la animación de cierre
      const timer = setTimeout(() => {
        setSearchQuery("");
        setError(null);
        setSelectedDriverId(null);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Cargar la lista de choferes y vehículos al abrir el diálogo
  useEffect(() => {
    if (open) {
      // Limpiar estados al abrir el diálogo
      setSearchQuery("");
      setError(null);
      
      // Cargar datos frescos
      fetchDriversAndAssignments();
      
      // Si el vehículo ya tiene un chofer asignado, seleccionarlo
      if (vehicle?.id_chofer_asignado) {
        setSelectedDriverId(vehicle.id_chofer_asignado);
      } else {
        setSelectedDriverId(null);
      }
    }
  }, [open, vehicle]);

  // Obtener choferes y verificar asignaciones existentes
  const fetchDriversAndAssignments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obtener todos los choferes
      const { data: driversData, error: driversError } = await supabase
        .from('choferes')
        .select('*');
      
      if (driversError) throw driversError;
      
      // Obtener todos los vehículos con choferes asignados
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('flota')
        .select('id_flota, id_chofer_asignado, patente')
        .not('id_chofer_asignado', 'is', null);
      
      if (vehiclesError) throw vehiclesError;
      
      console.log("Vehículos con choferes asignados:", vehiclesData);
      
      // Crear un array con los IDs de choferes ya asignados, excepto el del vehículo actual
      const assignedIds = vehiclesData && vehiclesData.length > 0
        ? vehiclesData
            .filter(v => vehicle ? v.id_flota !== vehicle.id_flota : true)
            .map(v => v.id_chofer_asignado)
            .filter(id => id !== null) as number[]
        : [];
      
      setAssignedDriverIds(assignedIds);
      
      if (driversData) {
        const formattedDrivers: Driver[] = driversData.map(item => ({
          id_chofer: item.id_chofer,
          nombre_completo: item.nombre_completo,
          documento_identidad: item.documento_identidad,
          tipo_licencia: item.tipo_licencia,
          vencimiento_licencia: item.vencimiento_licencia,
          telefono: item.telefono,
          email: item.email,
          nacionalidad: item.nacionalidad,
          direccion: item.direccion,
          fecha_nacimiento: item.fecha_nacimiento,
          fecha_ingreso: item.fecha_ingreso,
          contacto_emergencia: item.contacto_emergencia,
          estado: item.estado,
          observaciones: item.observaciones,
          creado_en: item.creado_en,
        }));
        
        setDrivers(formattedDrivers);
      } else {
        setDrivers([]);
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      setError('No se pudieron cargar los datos. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener choferes disponibles (no asignados a otros vehículos)
  const availableDrivers = drivers.filter(driver => 
    !assignedDriverIds.includes(driver.id_chofer)
  );

  // Obtener choferes asignados (no disponibles para este vehículo)
  const unavailableDrivers = drivers.filter(driver => 
    assignedDriverIds.includes(driver.id_chofer)
  );

  // El chofer actualmente asignado al vehículo (si existe)
  const currentAssignedDriver = vehicle?.id_chofer_asignado 
    ? drivers.find(d => d.id_chofer === vehicle.id_chofer_asignado)
    : null;

  // Filtrar los choferes disponibles según la búsqueda
  const filteredAvailableDrivers = availableDrivers.filter(driver => 
    searchQuery.trim() === "" || 
    driver.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.documento_identidad.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Si el chofer actual está asignado, agregarlo a los resultados filtrados
  const filteredDrivers = currentAssignedDriver 
    ? [currentAssignedDriver, ...filteredAvailableDrivers.filter(d => d.id_chofer !== currentAssignedDriver.id_chofer)] 
    : filteredAvailableDrivers;

  const handleAssign = async () => {
    if (!vehicle) return;
    
    try {
      setUpdating(true);
      setError(null);
      
      await onAssign(vehicle.id_flota, selectedDriverId);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al asignar chofer:', error);
      setError(error.message || 'No se pudo asignar el chofer. Intente nuevamente.');
    } finally {
      setUpdating(false);
    }
  };

  // Verificar si una licencia está vencida
  const isLicenseExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  // Verificar si una licencia está próxima a vencer (menos de 30 días)
  const isLicenseSoonToExpire = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Chofer</DialogTitle>
          <DialogDescription>
            {vehicle ? (
              <>Selecciona un chofer para asignar al vehículo <strong>{vehicle.marca} {vehicle.modelo} ({vehicle.patente})</strong></>
            ) : (
              'Selecciona un chofer para asignar al vehículo'
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
          
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o documento..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="border rounded-md">
            <div className="flex justify-between items-center p-2 border-b">
              <Label className="font-medium">Chofer actual:</Label>
              <div>
                {vehicle?.id_chofer_asignado ? (
                  <span>
                    {currentAssignedDriver?.nombre_completo || `Chofer #${vehicle.id_chofer_asignado}`}
                    {selectedDriverId === null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-7 text-red-500 hover:text-red-700"
                        onClick={() => setSelectedDriverId(vehicle.id_chofer_asignado ?? null)}
                      >
                        Restaurar
                      </Button>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No hay chofer asignado</span>
                )}
              </div>
            </div>
            
            <div className="p-2 border-b">
              <Label className="font-medium mb-2 block">Seleccionar acción:</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={selectedDriverId !== null ? "default" : "outline"} 
                  className="w-full justify-start"
                  onClick={() => {
                    let nextDriverId: number = 0;
                    if (selectedDriverId === null) {
                      if (vehicle?.id_chofer_asignado && typeof vehicle.id_chofer_asignado === 'number') {
                        nextDriverId = vehicle.id_chofer_asignado;
                      } else if (filteredAvailableDrivers.length > 0) {
                        nextDriverId = filteredAvailableDrivers[0].id_chofer;
                      }
                    } else {
                      nextDriverId = selectedDriverId;
                    }
                    setSelectedDriverId(nextDriverId || filteredAvailableDrivers[0]?.id_chofer || null);
                  }}
                  disabled={filteredAvailableDrivers.length === 0}
                >
                  <UserRound className="mr-2 h-4 w-4" />
                  Asignar chofer
                </Button>
                <Button 
                  variant={selectedDriverId === null ? "default" : "outline"} 
                  className="w-full justify-start"
                  onClick={() => setSelectedDriverId(null)}
                >
                  <UserRound className="mr-2 h-4 w-4" />
                  Remover asignación
                </Button>
              </div>
            </div>
            
            {selectedDriverId !== null && (
              <div>
                <div className="p-2">
                  <Label className="font-medium mb-2 block">Seleccionar chofer:</Label>
                  {isLoading ? (
                    <div className="py-2 text-center text-muted-foreground">
                      Cargando choferes disponibles...
                    </div>
                  ) : filteredDrivers.length > 0 ? (
                    <>
                      <Select
                        value={selectedDriverId?.toString() || ""}
                        onValueChange={(value) => setSelectedDriverId(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un chofer" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredDrivers.map(driver => (
                            <SelectItem key={driver.id_chofer} value={driver.id_chofer.toString()}>
                              {driver.nombre_completo} ({driver.documento_identidad})
                              {driver.estado && driver.estado !== 'activo' && 
                                ` - ${driver.estado}`
                              }
                              {driver.id_chofer === vehicle?.id_chofer_asignado && " (Actual)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {unavailableDrivers.length > 0 && (
                        <div className="flex items-start gap-2 mt-3 p-2 bg-blue-50 text-blue-700 rounded-md text-xs">
                          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p>
                            Hay {unavailableDrivers.length} chofer(es) no disponible(s) porque ya están asignados a otros vehículos.
                          </p>
                        </div>
                      )}
                      
                      {filteredDrivers.some(d => d.estado !== 'activo') && (
                        <p className="text-xs text-amber-600 mt-2">
                          Nota: Se muestran también choferes no activos porque no hay suficientes choferes activos disponibles.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="py-2 text-center text-muted-foreground border rounded-md">
                      {drivers.length === 0 
                        ? "No se encontraron choferes registrados en el sistema. Primero debes agregar choferes."
                        : "No hay choferes disponibles. Todos los choferes ya están asignados a otros vehículos."}
                    </div>
                  )}
                </div>
                
                {/* Información del chofer seleccionado */}
                {selectedDriverId && (
                  <div className="p-2 border-t">
                    {drivers.filter(d => d.id_chofer === selectedDriverId).map(driver => (
                      <div key={driver.id_chofer} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{driver.nombre_completo}</span>
                          <Badge variant="outline" className={
                            driver.estado === 'activo' 
                              ? "bg-green-50 text-green-700" 
                              : driver.estado === 'inactivo' 
                                ? "bg-gray-50 text-gray-700"
                                : "bg-red-50 text-red-700"
                          }>
                            {driver.estado || 'No especificado'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">Documento: </span>
                            {driver.documento_identidad}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Licencia: </span>
                            {driver.tipo_licencia || "No registrada"}
                          </div>
                          {driver.vencimiento_licencia && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Vencimiento licencia: </span>
                              <span className={
                                isLicenseExpired(driver.vencimiento_licencia) ? "text-red-500" : 
                                isLicenseSoonToExpire(driver.vencimiento_licencia) ? "text-yellow-600" : ""
                              }>
                                {new Date(driver.vencimiento_licencia).toLocaleDateString()}
                                {isLicenseExpired(driver.vencimiento_licencia) && " (Vencida)"}
                                {isLicenseSoonToExpire(driver.vencimiento_licencia) && " (Próxima a vencer)"}
                              </span>
                            </div>
                          )}
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
            disabled={updating || (selectedDriverId === vehicle?.id_chofer_asignado)}
          >
            {updating ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 