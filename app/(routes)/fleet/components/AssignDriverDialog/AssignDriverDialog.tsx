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
import { toast } from "@/components/ui/use-toast";

interface AssignDriverDialogProps {
  vehicle: Fleet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (vehicleId: number, driverId: number | null) => Promise<void>;
}

interface VehicleAssignment {
  id_flota: number;
  id_chofer: number;
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
  const [currentAssignedDriver, setCurrentAssignedDriver] = useState<Driver | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [vehicleAssignments, setVehicleAssignments] = useState<{[key: number]: VehicleAssignment}>({});

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
      
      // Obtener todos los choferes activos
      const { data: driversData, error: driversError } = await supabase
        .from('choferes')
        .select('*')
        .eq('estado', 'activo')
        .order('nombre_completo');
      
      if (driversError) {
        console.error('Error al cargar choferes:', driversError);
        throw new Error(`Error al cargar choferes: ${driversError.message}`);
      }
      
      console.log('Choferes cargados:', driversData);
      
      if (!driversData || driversData.length === 0) {
        setDrivers([]);
        setCurrentAssignedDriver(null);
        return;
      }
      
      // Obtener todas las asignaciones actuales
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('flota')
        .select('id_flota, id_chofer_asignado')
        .not('id_chofer_asignado', 'is', null);
      
      if (assignmentsError) {
        console.error('Error al cargar asignaciones:', assignmentsError);
        throw new Error(`Error al cargar asignaciones: ${assignmentsError.message}`);
      }
      
      console.log('Vehículos con choferes asignados:', assignmentsData);
      
      // Crear un mapa de asignaciones
      const assignmentsMap: {[key: number]: VehicleAssignment} = {};
      assignmentsData?.forEach(assignment => {
        if (assignment.id_chofer_asignado) {
          assignmentsMap[assignment.id_flota] = {
            id_flota: assignment.id_flota,
            id_chofer: assignment.id_chofer_asignado
          };
        }
      });
      
      setAvailableDrivers(driversData || []);
      setVehicleAssignments(assignmentsMap);
      
      // Formatear los choferes
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
      
      // Si el vehículo ya tiene un chofer asignado, verificar que existe
      if (vehicle?.id_chofer_asignado) {
        const currentDriver = formattedDrivers.find(d => d.id_chofer === vehicle.id_chofer_asignado);
        console.log('Chofer actual asignado:', currentDriver);
        if (currentDriver) {
          setCurrentAssignedDriver(currentDriver);
          setSelectedDriverId(currentDriver.id_chofer);
        } else {
          console.warn(`Chofer asignado (ID: ${vehicle.id_chofer_asignado}) no encontrado en la lista de choferes activos`);
          setCurrentAssignedDriver(null);
          setSelectedDriverId(null);
        }
      } else {
        setCurrentAssignedDriver(null);
        setSelectedDriverId(null);
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      setError(error.message || 'No se pudieron cargar los datos. Intente nuevamente.');
      setDrivers([]);
      setCurrentAssignedDriver(null);
      setSelectedDriverId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener choferes disponibles (no asignados a otros vehículos)
  const filteredDrivers = availableDrivers.filter(driver => {
    const matchesSearch = searchQuery.trim() === "" || 
      driver.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.documento_identidad.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isAssignedToOtherVehicle = Object.values(vehicleAssignments).some(
      assignment => assignment.id_chofer === driver.id_chofer && assignment.id_flota !== vehicle?.id_flota
    );

    return matchesSearch && !isAssignedToOtherVehicle;
  });

  // Si el chofer actual está asignado, agregarlo a los resultados filtrados
  const filteredAvailableDrivers = currentAssignedDriver 
    ? [currentAssignedDriver, ...filteredDrivers.filter(d => d.id_chofer !== currentAssignedDriver.id_chofer)] 
    : filteredDrivers;

  const handleAssign = async () => {
    try {
      setUpdating(true);
      console.log('AssignDriverDialog - handleAssign:', {
        vehicleId: vehicle?.id_flota,
        selectedDriverId,
        availableDrivers: filteredAvailableDrivers
      });

      if (!vehicle) {
        throw new Error('No hay vehículo seleccionado');
      }

      // Verificar que el chofer seleccionado existe y está activo
      const selectedDriver = filteredAvailableDrivers.find(d => d.id_chofer === selectedDriverId);
      if (selectedDriverId && !selectedDriver) {
        throw new Error(`El chofer seleccionado no está disponible`);
      }

      if (selectedDriver && selectedDriver.estado !== 'activo') {
        throw new Error(`El chofer ${selectedDriver.nombre_completo} no está activo`);
      }

      // Verificar si el chofer ya está asignado a otro vehículo
      if (selectedDriverId) {
        const { data: existingAssignment, error: assignmentError } = await supabase
          .from('flota')
          .select('id_flota, patente')
          .eq('id_chofer_asignado', selectedDriverId)
          .neq('id_flota', vehicle.id_flota)
          .maybeSingle();

        if (assignmentError) {
          throw new Error(`Error al verificar asignación existente: ${assignmentError.message}`);
        }

        if (existingAssignment) {
          throw new Error(`El chofer ya está asignado al vehículo ${existingAssignment.patente}`);
        }
      }

      await onAssign(vehicle.id_flota, selectedDriverId);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error en handleAssign:', error);
      toast({
        title: "Error",
        description: error.message || "Error al asignar el chofer",
        variant: "destructive"
      });
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
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        aria-describedby="assign-driver-description"
      >
        <DialogHeader>
          <DialogTitle>Asignar Chofer</DialogTitle>
          <DialogDescription id="assign-driver-description">
            {vehicle ? (
              <>Selecciona un chofer para asignar al vehículo <strong>{vehicle.marca} {vehicle.modelo} ({vehicle.patente})</strong></>
            ) : (
              'Selecciona un chofer para asignar al vehículo'
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {error && (
            <div 
              className="bg-red-50 text-red-500 p-3 rounded-md flex items-center gap-2"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="border rounded-md">
            <div className="flex justify-between items-center p-2 border-b">
              <Label className="font-medium" htmlFor="current-driver">Chofer actual:</Label>
              <div id="current-driver">
                {currentAssignedDriver ? (
                  <span>
                    {currentAssignedDriver.nombre_completo} ({currentAssignedDriver.documento_identidad})
                    {selectedDriverId === null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-7 text-red-500 hover:text-red-700"
                        onClick={() => setSelectedDriverId(currentAssignedDriver.id_chofer)}
                        aria-label="Restaurar chofer actual"
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
              <Label className="font-medium mb-2 block" htmlFor="action-buttons">Seleccionar acción:</Label>
              <div id="action-buttons" className="grid grid-cols-2 gap-2">
                <Button 
                  variant={selectedDriverId !== null ? "default" : "outline"} 
                  className="w-full justify-start"
                  onClick={() => {
                    let nextDriverId: number | null = null;
                    if (selectedDriverId === null) {
                      if (currentAssignedDriver) {
                        nextDriverId = currentAssignedDriver.id_chofer;
                      } else if (filteredAvailableDrivers.length > 0) {
                        nextDriverId = filteredAvailableDrivers[0].id_chofer;
                      }
                    }
                    setSelectedDriverId(nextDriverId);
                  }}
                  disabled={filteredAvailableDrivers.length === 0}
                  aria-pressed={selectedDriverId !== null}
                >
                  <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
                  Asignar chofer
                </Button>
                <Button 
                  variant={selectedDriverId === null ? "default" : "outline"} 
                  className="w-full justify-start"
                  onClick={() => setSelectedDriverId(null)}
                  aria-pressed={selectedDriverId === null}
                >
                  <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
                  Remover asignación
                </Button>
              </div>
            </div>
            
            {selectedDriverId !== null && (
              <div>
                <div className="p-2">
                  <Label className="font-medium mb-2 block" htmlFor="driver-select">Seleccionar chofer:</Label>
                  {isLoading ? (
                    <div 
                      className="py-2 text-center text-muted-foreground"
                      role="status"
                      aria-live="polite"
                    >
                      Cargando choferes disponibles...
                    </div>
                  ) : filteredAvailableDrivers.length > 0 ? (
                    <Select
                      value={selectedDriverId?.toString() || ""}
                      onValueChange={(value) => setSelectedDriverId(parseInt(value))}
                    >
                      <SelectTrigger id="driver-select">
                        <SelectValue placeholder="Selecciona un chofer" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredAvailableDrivers.map(driver => (
                          <SelectItem 
                            key={driver.id_chofer} 
                            value={driver.id_chofer.toString()}
                            aria-selected={driver.id_chofer === selectedDriverId}
                          >
                            {driver.nombre_completo} ({driver.documento_identidad})
                            {driver.id_chofer === currentAssignedDriver?.id_chofer && " (Actual)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div 
                      className="py-2 text-center text-muted-foreground"
                      role="status"
                      aria-live="polite"
                    >
                      No hay choferes disponibles
                    </div>
                  )}
                </div>
                
                {selectedDriverId && (
                  <div className="p-2 border-t">
                    {filteredAvailableDrivers.filter(d => d.id_chofer === selectedDriverId).map(driver => (
                      <div key={driver.id_chofer} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{driver.nombre_completo}</span>
                          <Badge 
                            variant="outline" 
                            className={
                              driver.estado === 'activo' 
                                ? "bg-green-50 text-green-700" 
                                : driver.estado === 'inactivo' 
                                  ? "bg-gray-50 text-gray-700"
                                  : "bg-red-50 text-red-700"
                            }
                            aria-label={`Estado: ${driver.estado || 'No especificado'}`}
                          >
                            {driver.estado || 'No especificado'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {driver.documento_identidad} - {driver.tipo_licencia || 'Sin licencia'}
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
            aria-label="Cancelar asignación"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={updating || (selectedDriverId === currentAssignedDriver?.id_chofer)}
            aria-label={updating ? "Guardando cambios..." : "Guardar asignación"}
          >
            {updating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 