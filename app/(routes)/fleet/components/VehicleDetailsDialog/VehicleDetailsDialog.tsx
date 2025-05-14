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
import { Driver, Fleet, supabase } from "@/lib/supabase";
import { Calendar, Gauge, Wrench, FileText, UserRound } from "lucide-react";

interface VehicleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Fleet | null;
  onAssignDriver?: (vehicle: Fleet) => void;
}

export function VehicleDetailsDialog({
  open,
  onOpenChange,
  vehicle,
  onAssignDriver
}: VehicleDetailsDialogProps) {
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [driverLoading, setDriverLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

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

  const fetchDriverInfo = async (driverId: number) => {
    try {
      setDriverLoading(true);
      
      const { data, error } = await supabase
        .from('choferes')
        .select('*')
        .eq('id_chofer', driverId)
        .single();
      
      if (error) {
        console.error("Error al cargar chofer:", error);
        return;
      }
      
      if (data) {
        setAssignedDriver({
          id_chofer: data.id_chofer,
          nombre_completo: data.nombre_completo,
          documento_identidad: data.documento_identidad,
          tipo_licencia: data.tipo_licencia,
          vencimiento_licencia: data.vencimiento_licencia,
          telefono: data.telefono,
          email: data.email,
          nacionalidad: data.nacionalidad,
          direccion: data.direccion,
          fecha_nacimiento: data.fecha_nacimiento,
          fecha_ingreso: data.fecha_ingreso,
          contacto_emergencia: data.contacto_emergencia,
          estado: data.estado,
          observaciones: data.observaciones,
          creado_en: data.creado_en
        });
      }
    } catch (error) {
      console.error("Error inesperado:", error);
    } finally {
      setDriverLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {vehicle.marca} {vehicle.modelo} - {vehicle.patente}
          </DialogTitle>
          <DialogDescription>
            Detalles completos del vehículo
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
            <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
          </TabsList>

          {/* Pestaña de información general */}
          <TabsContent value="general" className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{vehicle.marca} {vehicle.modelo} {vehicle.anio}</h3>
                <p className="text-muted-foreground">{vehicle.tipo} {vehicle.categoria && `- ${vehicle.categoria}`}</p>
              </div>
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

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Patente</p>
                <p>{vehicle.patente}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Número de Chasis</p>
                <p>{vehicle.nro_chasis || "No registrado"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Marca</p>
                <p>{vehicle.marca}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Modelo</p>
                <p>{vehicle.modelo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Año</p>
                <p>{vehicle.anio || "No registrado"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Capacidad</p>
                <p>{vehicle.capacidad || "No registrado"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Tipo</p>
                <p>{vehicle.tipo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Categoría</p>
                <p>{vehicle.categoria || "No registrado"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Subcategoría</p>
                <p>{vehicle.subcategoria || "No registrado"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Fecha de Ingreso</p>
                <p>{formatDate(vehicle.fecha_ingreso)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Origen</p>
                <p>{vehicle.origen || "No registrado"}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-sm font-medium">Observaciones</p>
              <p className="text-sm">{vehicle.observaciones || "Sin observaciones"}</p>
            </div>
          </TabsContent>

          {/* Pestaña de documentos */}
          <TabsContent value="documents" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">Revisión Técnica</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Vencimiento</p>
                    <p>{formatDate(vehicle.vencimiento_revision_tecnica)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Estado</p>
                    <p className={getStatusColor(getDocumentStatus(vehicle.vencimiento_revision_tecnica))}>
                      {getDocumentStatus(vehicle.vencimiento_revision_tecnica)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium">Permiso de Circulación</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Vencimiento</p>
                    <p>{formatDate(vehicle.vencimiento_permiso_circulacion)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Estado</p>
                    <p className={getStatusColor(getDocumentStatus(vehicle.vencimiento_permiso_circulacion))}>
                      {getDocumentStatus(vehicle.vencimiento_permiso_circulacion)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  <h3 className="font-medium">Seguro</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Vencimiento</p>
                    <p>{formatDate(vehicle.vencimiento_seguro)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Estado</p>
                    <p className={getStatusColor(getDocumentStatus(vehicle.vencimiento_seguro))}>
                      {getDocumentStatus(vehicle.vencimiento_seguro)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Pestaña de mantenimiento */}
          <TabsContent value="maintenance" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">Kilometraje</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Actual</p>
                    <p>{vehicle.km_actual?.toLocaleString() || 0} km</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Último servicio</p>
                    <p>{vehicle.km_ultimo_servicio?.toLocaleString() || "No registrado"} km</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Próximo servicio</p>
                    <p>{vehicle.km_proximo_servicio?.toLocaleString() || "No registrado"} km</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Consumo promedio</p>
                    <p>{vehicle.consumo_promedio ? `${vehicle.consumo_promedio} km/l` : "No registrado"}</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-500" />
                  <h3 className="font-medium">Mantenimientos</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Último mantenimiento</p>
                    <p>{formatDate(vehicle.fecha_ultima_mantencion)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Próximo mantenimiento</p>
                    <p>{formatDate(vehicle.fecha_proximo_mantenimiento)}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver historial de mantenimientos
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Pestaña de asignaciones */}
          <TabsContent value="assignments" className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-blue-500" />
                    Chofer Asignado
                  </h3>
                  {onAssignDriver && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAssignDriver(vehicle)}
                    >
                      {vehicle.id_chofer_asignado ? "Cambiar chofer" : "Asignar chofer"}
                    </Button>
                  )}
                </div>
                
                {vehicle.id_chofer_asignado ? (
                  driverLoading ? (
                    <div className="py-4 text-center text-muted-foreground">
                      Cargando información del chofer...
                    </div>
                  ) : (
                    assignedDriver ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-lg">{assignedDriver.nombre_completo}</span>
                          <Badge 
                            variant="state"
                            className={
                              assignedDriver.estado === "activo" ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500 border-transparent" :
                              assignedDriver.estado === "suspendido" ? "bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-500 border-transparent" :
                              "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500 border-transparent" // inactivo
                            }
                          >
                            {assignedDriver.estado}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Documento</p>
                            <p>{assignedDriver.documento_identidad}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Tipo Licencia</p>
                            <p>{assignedDriver.tipo_licencia || "No registrado"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Vencimiento Licencia</p>
                            <p className={
                              isDocumentExpired(assignedDriver.vencimiento_licencia) ? "text-red-600/80" :
                              isDocumentSoonToExpire(assignedDriver.vencimiento_licencia) ? "text-orange-500" :
                              "text-green-500"
                            }>
                              {formatDate(assignedDriver.vencimiento_licencia)}
                              {isDocumentExpired(assignedDriver.vencimiento_licencia) && " (Vencida)"}
                              {isDocumentSoonToExpire(assignedDriver.vencimiento_licencia) && " (Próxima a vencer)"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Contacto</p>
                            <p>{assignedDriver.telefono || "No registrado"}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2">
                        <p>Chofer #{vehicle.id_chofer_asignado}</p>
                        <p className="text-muted-foreground text-sm mt-1">No se pudo cargar la información detallada</p>
                      </div>
                    )
                  )
                ) : (
                  <div className="py-4 text-center space-y-2">
                    <p className="text-muted-foreground">No hay chofer asignado actualmente</p>
                    {onAssignDriver && (
                      <p className="text-sm text-gray-500">
                        Selecciona "Asignar chofer" para vincular un conductor a este vehículo.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Historial de Asignaciones</h3>
                <p className="text-muted-foreground">No hay datos de asignaciones previas</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 