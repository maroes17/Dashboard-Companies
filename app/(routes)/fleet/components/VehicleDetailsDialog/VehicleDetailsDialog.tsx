"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Driver, Fleet, FleetEvent, Semirremolque, supabase } from "@/lib/supabase";
import { Calendar, Gauge, Wrench, FileText, UserRound, Truck, Clock, AlertCircle } from "lucide-react";
import { AssignDriverDialog } from "../AssignDriverDialog/AssignDriverDialog";
import { AssignSemitrailerDialog } from "../AssignSemitrailerDialog/AssignSemitrailerDialog";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/components/ui/use-toast";

interface VehicleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Fleet | null;
  onAssignDriver?: (vehicleId: number, driverId: number | null) => Promise<void>;
  onAssignSemitrailer?: (vehicleId: number, semitrailerId: number | null) => Promise<void>;
}

export function VehicleDetailsDialog({
  open,
  onOpenChange,
  vehicle: initialVehicle,
  onAssignDriver,
  onAssignSemitrailer
}: VehicleDetailsDialogProps) {
  const [vehicle, setVehicle] = useState<Fleet | null>(initialVehicle);
  const { toast } = useToast();
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [driverLoading, setDriverLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [assignmentHistory, setAssignmentHistory] = useState<FleetEvent[]>([]);
  const [assignmentHistoryLoading, setAssignmentHistoryLoading] = useState(false);
  const [assignedSemitrailer, setAssignedSemitrailer] = useState<Semirremolque | null>(null);
  const [semitrailerLoading, setSemitrailerLoading] = useState(false);
  const [assignmentDrivers, setAssignmentDrivers] = useState<{[key: number]: Driver}>({});
  const [isAssignDriverDialogOpen, setIsAssignDriverDialogOpen] = useState(false);
  const [isAssignSemitrailerDialogOpen, setIsAssignSemitrailerDialogOpen] = useState(false);

  // Actualizar el vehículo cuando cambia el prop
  useEffect(() => {
    setVehicle(initialVehicle);
  }, [initialVehicle]);

  // Cambiar a la pestaña de asignaciones cuando abre el diálogo si viene desde la asignación
  useEffect(() => {
    if (open && onAssignDriver) {
      setActiveTab("assignments");
    }
  }, [open, onAssignDriver]);

  // Cargar información del chofer asignado
  useEffect(() => {
    if (open && vehicle?.id_chofer_asignado) {
      fetchDriverInfo(vehicle.id_chofer_asignado);
    } else {
      setAssignedDriver(null);
    }
  }, [open, vehicle]);

  // Cargar historial de asignaciones y semirremolque
  useEffect(() => {
    if (open && vehicle?.id_flota) {
      fetchAssignmentHistory(vehicle.id_flota);
      fetchAssignedSemitrailer(vehicle.id_flota);
    } else {
      setAssignmentHistory([]);
      setAssignedSemitrailer(null);
    }
  }, [open, vehicle]);

  const fetchDriverInfo = async (driverId: number) => {
    try {
      setDriverLoading(true);
      
      // Verificar que el ID del chofer sea válido
      if (!driverId) {
        setAssignedDriver(null);
        return;
      }

      const { data: driver, error } = await supabase
        .from('choferes')
        .select('*')
        .eq('id_chofer', driverId)
        .single();

      if (error) {
        console.error('Error al cargar chofer:', error);
        if (error.code === 'PGRST116') {
          // El chofer no existe
          setAssignedDriver(null);
          throw new Error('El chofer asignado ya no existe en la base de datos');
        }
        throw new Error(`Error al cargar información del chofer: ${error.message}`);
      }

      if (!driver) {
        setAssignedDriver(null);
        throw new Error('No se encontró información del chofer');
      }

      // Verificar que el chofer esté activo
      if (driver.estado !== 'activo') {
        setAssignedDriver(null);
        throw new Error(`El chofer ${driver.nombre_completo} no está activo`);
      }

      setAssignedDriver(driver);
    } catch (error: any) {
      console.error('Error en fetchDriverInfo:', error);
      setAssignedDriver(null);
      toast({
        title: "Error",
        description: error.message || "Error al cargar información del chofer",
        variant: "destructive",
      });
      throw error;
    } finally {
      setDriverLoading(false);
    }
  };

  const fetchAssignmentHistory = async (vehicleId: number) => {
    try {
      setAssignmentHistoryLoading(true);
      
      // Obtener eventos de asignación de chofer y cambios de estado
      const { data, error } = await supabase
        .from('eventos_flota')
        .select('*')
        .eq('id_flota', vehicleId)
        .eq('tipo_evento', 'cambio_estado_manual')
        .order('fecha_inicio', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error("Error al cargar historial de asignaciones:", error);
        return;
      }
      
      if (data && data.length > 0) {
        // Filtrar para solo incluir eventos de asignación de choferes y cambios de semirremolques
        const assignmentEvents = data.filter(event => 
          event.descripcion && (
            event.descripcion.includes('ASIGNACIÓN DE CHOFER') || 
            event.descripcion.includes('SEMIRREMOLQUE')
          )
        );
        
        setAssignmentHistory(assignmentEvents);
        
        // Obtener IDs de choferes mencionados en el historial
        const driverIdsInEvents = assignmentEvents
          .filter(event => event.descripcion?.includes('ASIGNACIÓN DE CHOFER') && event.descripcion?.includes('ID'))
          .map(event => {
            const match = event.descripcion?.match(/ID (\d+)/);
            return match ? parseInt(match[1]) : null;
          })
          .filter((id): id is number => id !== null);
        
        // Si hay choferes en los eventos, cargar sus datos
        if (driverIdsInEvents.length > 0) {
          await fetchDriversForHistory(driverIdsInEvents);
        }
      } else {
        setAssignmentHistory([]);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
    } finally {
      setAssignmentHistoryLoading(false);
    }
  };

  const fetchDriversForHistory = async (driverIds: number[]) => {
    try {
      const { data, error } = await supabase
        .from('choferes')
        .select('*')
        .in('id_chofer', driverIds);
      
      if (error) {
        console.error("Error al cargar datos de choferes para historial:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const driversMap: {[key: number]: Driver} = {};
        data.forEach(driver => {
          driversMap[driver.id_chofer] = {
            id_chofer: driver.id_chofer,
            nombre_completo: driver.nombre_completo,
            documento_identidad: driver.documento_identidad,
            tipo_licencia: driver.tipo_licencia,
            vencimiento_licencia: driver.vencimiento_licencia,
            telefono: driver.telefono,
            email: driver.email,
            nacionalidad: driver.nacionalidad,
            direccion: driver.direccion,
            fecha_nacimiento: driver.fecha_nacimiento,
            fecha_ingreso: driver.fecha_ingreso,
            contacto_emergencia: driver.contacto_emergencia,
            estado: driver.estado,
            observaciones: driver.observaciones,
            creado_en: driver.creado_en,
          };
        });
        setAssignmentDrivers(driversMap);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
    }
  };

  const fetchAssignedSemitrailer = async (vehicleId: number) => {
    try {
      setSemitrailerLoading(true);
      
      const { data, error } = await supabase
        .from('semirremolques')
        .select('*')
        .eq('asignado_a_flota_id', vehicleId)
        .maybeSingle();
      
      if (error) {
        console.error("Error al cargar semirremolque asignado:", error);
        return;
      }
      
      if (data) {
        setAssignedSemitrailer({
          id_semirremolque: data.id_semirremolque,
          patente: data.patente,
          nro_genset: data.nro_genset,
          tipo: data.tipo,
          marca: data.marca,
          modelo: data.modelo,
          anio: data.anio,
          estado: data.estado,
          fecha_ingreso: data.fecha_ingreso,
          fecha_ultima_revision: data.fecha_ultima_revision,
          vencimiento_revision_tecnica: data.vencimiento_revision_tecnica,
          observaciones: data.observaciones,
          asignado_a_flota_id: data.asignado_a_flota_id,
          creado_en: data.creado_en
        });
      } else {
        setAssignedSemitrailer(null);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
    } finally {
      setSemitrailerLoading(false);
    }
  };

  if (!vehicle) return null;

  // Función para formatear fechas
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "No registrado";
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para verificar si un documento está vencido
  const isDocumentExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const expiryDate = new Date(dateStr);
    return expiryDate < today;
  };

  // Función para verificar si un documento está próximo a vencer (30 días)
  const isDocumentSoonToExpire = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const expiryDate = new Date(dateStr);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  // Función para obtener el estado de un documento
  const getDocumentStatus = (dateStr?: string) => {
    if (!dateStr) return "No registrado";
    if (isDocumentExpired(dateStr)) return "Vencido";
    if (isDocumentSoonToExpire(dateStr)) return "Próximo a vencer";
    return "Vigente";
  };

  // Función para obtener el color de un estado
  const getStatusColor = (status: string) => {
    if (status === "Vencido") return "text-red-600/80";
    if (status === "Próximo a vencer") return "text-orange-500";
    if (status === "Vigente") return "text-green-500";
    return "text-gray-500";
  };

  const onAssign = async (vehicleId: number, driverId: number | null) => {
    try {
      console.log('VehicleDetailsDialog - onAssign:', {
        vehicleId,
        driverId
      });
      
      if (!vehicle || !onAssignDriver) {
        throw new Error('No hay vehículo seleccionado o falta la función de asignación');
      }

      await onAssignDriver(vehicleId, driverId);
      
      // Actualizar la información del vehículo
      const { data: updatedVehicle, error: vehicleError } = await supabase
        .from('flota')
        .select(`
          *,
          choferes:choferes!id_chofer_asignado(*)
        `)
        .eq('id_flota', vehicleId)
        .single();

      if (vehicleError) {
        throw new Error(`Error al actualizar información del vehículo: ${vehicleError.message}`);
      }

      if (updatedVehicle) {
        setVehicle(updatedVehicle);
      }
    } catch (error: any) {
      console.error('Error en onAssign:', error);
      toast({
        title: "Error",
        description: error.message || "Error al asignar el chofer",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {vehicle.marca} {vehicle.modelo} {vehicle.anio}
              </DialogTitle>
              <div className="text-base mt-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{vehicle.patente}</span>
                  <Badge 
                    variant="state"
                    className={
                      vehicle.estado === "activo" ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500 border-transparent" :
                      vehicle.estado === "mantenimiento" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500 border-transparent" :
                      vehicle.estado === "en_reparacion" ? "bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-500 border-transparent" :
                      vehicle.estado === "inactivo" ? "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500 border-transparent" :
                      "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent" // dado_de_baja
                    }
                  >
                    {vehicle.estado.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignDriverDialogOpen(true)}
                className="gap-2"
              >
                <UserRound className="h-4 w-4" />
                {assignedDriver ? "Cambiar Chofer" : "Asignar Chofer"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignSemitrailerDialogOpen(true)}
                className="gap-2"
              >
                <Truck className="h-4 w-4" />
                {assignedSemitrailer ? "Cambiar Semirremolque" : "Asignar Semirremolque"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información General
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              Asignaciones
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Mantenimiento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Información Básica
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Patente</p>
                    <p className="font-medium">{vehicle.patente}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Número de Chasis</p>
                    <p>{vehicle.nro_chasis || "No registrado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Marca</p>
                    <p>{vehicle.marca}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Modelo</p>
                    <p>{vehicle.modelo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Año</p>
                    <p>{vehicle.anio || "No registrado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Capacidad</p>
                    <p>{vehicle.capacidad || "No registrado"}</p>
                  </div>
                </div>
              </div>

              {/* Clasificación */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Clasificación
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                    <p>{vehicle.tipo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                    <p>{vehicle.categoria || "No registrado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Subcategoría</p>
                    <p>{vehicle.subcategoria || "No registrado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Origen</p>
                    <p>{vehicle.origen || "No registrado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Ingreso</p>
                    <p>{formatDate(vehicle.fecha_ingreso)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Observaciones
              </h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">{vehicle.observaciones || "Sin observaciones"}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sección de Chofer */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-primary" />
                  Chofer Asignado
                </h3>

                {driverLoading ? (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Cargando información del chofer...</p>
                  </div>
                ) : assignedDriver ? (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-lg">{assignedDriver.nombre_completo}</h4>
                        <p className="text-sm text-muted-foreground">{assignedDriver.documento_identidad}</p>
                      </div>
                      <Badge variant="outline" className={
                        assignedDriver.estado === 'activo' 
                          ? "bg-green-50 text-green-700" 
                          : assignedDriver.estado === 'inactivo' 
                            ? "bg-gray-50 text-gray-700"
                            : "bg-red-50 text-red-700"
                      }>
                        {assignedDriver.estado || 'No especificado'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Licencia</p>
                        <p>{assignedDriver.tipo_licencia || "No registrada"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                        <p>{assignedDriver.telefono || "No registrado"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p>{assignedDriver.email || "No registrado"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Nacionalidad</p>
                        <p>{assignedDriver.nacionalidad || "No registrada"}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">No hay chofer asignado</p>
                  </div>
                )}
              </div>

              {/* Sección de Semirremolque */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Semirremolque Asignado
                </h3>

                {semitrailerLoading ? (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Cargando información del semirremolque...</p>
                  </div>
                ) : assignedSemitrailer ? (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-lg">{assignedSemitrailer.patente}</h4>
                        <p className="text-sm text-muted-foreground">{assignedSemitrailer.tipo}</p>
                      </div>
                      <Badge variant="outline" className={
                        assignedSemitrailer.estado === 'activo' 
                          ? "bg-green-50 text-green-700" 
                          : assignedSemitrailer.estado === 'inactivo' 
                            ? "bg-gray-50 text-gray-700"
                            : "bg-red-50 text-red-700"
                      }>
                        {assignedSemitrailer.estado || 'No especificado'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Marca/Modelo</p>
                        <p>{assignedSemitrailer.marca} {assignedSemitrailer.modelo}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Año</p>
                        <p>{assignedSemitrailer.anio}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Nº Genset</p>
                        <p>{assignedSemitrailer.nro_genset || "No registrado"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Última Revisión</p>
                        <p>{formatDate(assignedSemitrailer.fecha_ultima_revision)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">No hay semirremolque asignado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Historial de Asignaciones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Historial de Asignaciones
              </h3>
              {assignmentHistoryLoading ? (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Cargando historial...</p>
                </div>
              ) : assignmentHistory.length > 0 ? (
                <div className="space-y-3">
                  {assignmentHistory.map((event, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {event.descripcion?.includes('CHOFER') ? (
                          <UserRound className="h-5 w-5 text-primary" />
                        ) : (
                          <Truck className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.descripcion}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.fecha_inicio).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">No hay historial de asignaciones</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kilometraje */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  Kilometraje
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Actual</p>
                    <p className="font-medium">{vehicle.km_actual?.toLocaleString() || 0} km</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Último servicio</p>
                    <p>{vehicle.km_ultimo_servicio?.toLocaleString() || "No registrado"} km</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Próximo servicio</p>
                    <p>{vehicle.km_proximo_servicio?.toLocaleString() || "No registrado"} km</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Consumo promedio</p>
                    <p>{vehicle.consumo_promedio ? `${vehicle.consumo_promedio} km/l` : "No registrado"}</p>
                  </div>
                </div>
              </div>

              {/* Mantenimientos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Mantenimientos
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Último mantenimiento</p>
                    <p>{formatDate(vehicle.fecha_ultima_mantencion)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Próximo mantenimiento</p>
                    <p>{formatDate(vehicle.fecha_proximo_mantenimiento)}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Wrench className="h-4 w-4" />
                  Ver historial de mantenimientos
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Diálogo de asignación de chofer */}
      <AssignDriverDialog
        vehicle={vehicle}
        open={isAssignDriverDialogOpen}
        onOpenChange={setIsAssignDriverDialogOpen}
        onAssign={onAssign}
      />

      {/* Diálogo de asignación de semirremolque */}
      <AssignSemitrailerDialog
        open={isAssignSemitrailerDialogOpen}
        onOpenChange={setIsAssignSemitrailerDialogOpen}
        vehicle={vehicle}
        onAssign={async (vehicleId: number, semitrailerId: number | null) => {
          if (onAssignSemitrailer) {
            await onAssignSemitrailer(vehicleId, semitrailerId);
            await fetchAssignedSemitrailer(vehicleId);
            await fetchAssignmentHistory(vehicleId);
            setIsAssignSemitrailerDialogOpen(false);
          }
        }}
      />
    </Dialog>
  );
} 