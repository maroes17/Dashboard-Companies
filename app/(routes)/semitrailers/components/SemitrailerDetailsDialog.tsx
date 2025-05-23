"use client";

import { useState, useEffect } from "react";
import { Semirremolque, Fleet, FleetEvent, supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, AlertCircle, Link, Clock, Truck, UserCircle2, LinkIcon, Unlink } from "lucide-react";

interface SemitrailerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semitrailer: Semirremolque | null;
}

export function SemitrailerDetailsDialog({
  open,
  onOpenChange,
  semitrailer,
}: SemitrailerDetailsDialogProps) {
  const [assignedVehicle, setAssignedVehicle] = useState<Fleet | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [assignmentHistory, setAssignmentHistory] = useState<FleetEvent[]>([]);
  const [assignmentHistoryLoading, setAssignmentHistoryLoading] = useState(false);

  // Cargar información del vehículo asignado si existe
  useEffect(() => {
    if (open && semitrailer?.asignado_a_flota_id) {
      fetchVehicleInfo(semitrailer.asignado_a_flota_id);
    } else {
      setAssignedVehicle(null);
    }
  }, [open, semitrailer]);

  // Cargar historial de asignaciones
  useEffect(() => {
    if (open && semitrailer?.id_semirremolque) {
      fetchAssignmentHistory(semitrailer.id_semirremolque);
    } else {
      setAssignmentHistory([]);
    }
  }, [open, semitrailer]);

  const fetchVehicleInfo = async (vehicleId: number) => {
    try {
      setVehicleLoading(true);
      
      const { data, error } = await supabase
        .from('flota')
        .select('*')
        .eq('id_flota', vehicleId)
        .single();
      
      if (error) {
        console.error("Error al cargar información del vehículo:", error);
        return;
      }
      
      if (data) {
        setAssignedVehicle({
          id_flota: data.id_flota,
          tipo: data.tipo,
          categoria: data.categoria,
          subcategoria: data.subcategoria,
          patente: data.patente,
          nro_chasis: data.nro_chasis,
          marca: data.marca,
          modelo: data.modelo,
          anio: data.anio,
          capacidad: data.capacidad,
          estado: data.estado,
          fecha_ingreso: data.fecha_ingreso,
          id_chofer_asignado: data.id_chofer_asignado,
          km_actual: data.km_actual,
          km_ultimo_servicio: data.km_ultimo_servicio,
          km_proximo_servicio: data.km_proximo_servicio,
          fecha_ultima_mantencion: data.fecha_ultima_mantencion,
          fecha_proximo_mantenimiento: data.fecha_proximo_mantenimiento,
          vencimiento_revision_tecnica: data.vencimiento_revision_tecnica,
          vencimiento_permiso_circulacion: data.vencimiento_permiso_circulacion,
          vencimiento_seguro: data.vencimiento_seguro,
          consumo_promedio: data.consumo_promedio,
          origen: data.origen,
          observaciones: data.observaciones,
          creado_en: data.creado_en,
          actualizado_en: data.actualizado_en
        });
      }
    } catch (error) {
      console.error("Error inesperado:", error);
    } finally {
      setVehicleLoading(false);
    }
  };

  const fetchAssignmentHistory = async (semitrailerId: number) => {
    try {
      setAssignmentHistoryLoading(true);
      
      // Necesitamos dos consultas: una para eventos del vehículo asignado actual
      // y otra para eventos históricos que mencionen este semirremolque
      let combinedEvents: FleetEvent[] = [];
      
      // 1. Si el semirremolque tiene un vehículo asignado, buscar eventos relacionados con ese vehículo
      if (semitrailer?.asignado_a_flota_id) {
        const { data: currentVehicleEvents, error: currentVehicleError } = await supabase
          .from('eventos_flota')
          .select('*')
          .eq('id_flota', semitrailer.asignado_a_flota_id)
          .eq('tipo_evento', 'cambio_estado_manual')
          .like('descripcion', '%SEMIRREMOLQUE%')
          .order('fecha_inicio', { ascending: false });
        
        if (currentVehicleError) {
          console.error("Error al cargar eventos del vehículo actual:", currentVehicleError);
        } else if (currentVehicleEvents && currentVehicleEvents.length > 0) {
          // Filtrar eventos relacionados con este semirremolque en particular
          const relevantEvents = currentVehicleEvents.filter(event => 
            event.descripcion?.includes(semitrailer.patente) || 
            (semitrailer.id_semirremolque && event.descripcion?.includes(`#${semitrailer.id_semirremolque}`))
          );
          
          combinedEvents = [...relevantEvents];
        }
      }
      
      // 2. Buscar en todos los eventos para encontrar referencias a este semirremolque
      // (en caso de que haya estado asignado a otros vehículos en el pasado)
      const { data: historicalEvents, error: historicalError } = await supabase
        .from('eventos_flota')
        .select('*')
        .eq('tipo_evento', 'cambio_estado_manual')
        .like('descripcion', `%SEMIRREMOLQUE%${semitrailer?.patente || ''}%`)
        .order('fecha_inicio', { ascending: false });
      
      if (historicalError) {
        console.error("Error al cargar historial de asignaciones:", historicalError);
      } else if (historicalEvents && historicalEvents.length > 0) {
        // Filtrar duplicados si ya tenemos algunos eventos del vehículo actual
        const newEvents = historicalEvents.filter(histEvent => 
          !combinedEvents.some(existingEvent => existingEvent.id_evento === histEvent.id_evento)
        );
        
        combinedEvents = [...combinedEvents, ...newEvents];
      }
      
      // Ordenar todos los eventos por fecha, más recientes primero
      combinedEvents.sort((a, b) => 
        new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
      );
      
      // Limitar a 20 eventos para no sobrecargar la interfaz
      setAssignmentHistory(combinedEvents.slice(0, 20));
    } catch (error) {
      console.error("Error inesperado:", error);
      setAssignmentHistory([]);
    } finally {
      setAssignmentHistoryLoading(false);
    }
  };

  // Verificar si una revisión está vencida
  const isRevisionExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  // Verificar si una revisión está próxima a vencer (menos de 30 días)
  const isRevisionSoonToExpire = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  if (!semitrailer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Semirremolque {semitrailer.patente}</span>
            {semitrailer.estado && (
              <Badge 
                variant="state"
                className={
                  semitrailer.estado === "activo" ? "bg-green-100 text-green-800" :
                  semitrailer.estado === "mantenimiento" ? "bg-yellow-100 text-yellow-800" :
                  semitrailer.estado === "en_reparacion" ? "bg-orange-100 text-orange-800" :
                  semitrailer.estado === "inactivo" ? "bg-gray-100 text-gray-800" :
                  "bg-red-100 text-red-800" // dado_de_baja
                }
              >
                {semitrailer.estado.replace("_", " ")}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {semitrailer.marca} {semitrailer.modelo} {semitrailer.anio && `(${semitrailer.anio})`}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{semitrailer.tipo || "-"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nº Genset</p>
                <p className="font-medium">{semitrailer.nro_genset || "-"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Marca</p>
                <p className="font-medium">{semitrailer.marca || "-"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-medium">{semitrailer.modelo || "-"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Año</p>
                <p className="font-medium">{semitrailer.anio || "-"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fecha de ingreso</p>
                <p className="font-medium flex items-center gap-1">
                  {semitrailer.fecha_ingreso ? (
                    <>
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {formatDate(semitrailer.fecha_ingreso)}
                    </>
                  ) : "-"}
                </p>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Documentación</h3>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fecha última revisión</p>
                <p className="font-medium flex items-center gap-1">
                  {semitrailer.fecha_ultima_revision ? (
                    <>
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {formatDate(semitrailer.fecha_ultima_revision)}
                    </>
                  ) : "-"}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Vencimiento revisión técnica</p>
                <p className={`font-medium flex items-center gap-1 ${
                  isRevisionExpired(semitrailer.vencimiento_revision_tecnica) ? "text-red-500" :
                  isRevisionSoonToExpire(semitrailer.vencimiento_revision_tecnica) ? "text-yellow-600" : ""
                }`}>
                  {semitrailer.vencimiento_revision_tecnica ? (
                    <>
                      <CalendarIcon className="h-4 w-4" />
                      {formatDate(semitrailer.vencimiento_revision_tecnica)}
                    </>
                  ) : "-"}
                </p>
                {semitrailer.vencimiento_revision_tecnica && (
                  <>
                    {isRevisionExpired(semitrailer.vencimiento_revision_tecnica) && (
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Vencida</Badge>
                      </div>
                    )}
                    {isRevisionSoonToExpire(semitrailer.vencimiento_revision_tecnica) && (
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Próxima a vencer</Badge>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {semitrailer.observaciones && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Observaciones</h3>
                <p className="text-sm">{semitrailer.observaciones}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="assignments" className="space-y-4 pt-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-500" />
                  Vehículo asignado
                </h3>
              </div>
              
              {vehicleLoading ? (
                <p className="text-center py-4 text-muted-foreground">Cargando información del vehículo...</p>
              ) : assignedVehicle ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{assignedVehicle.patente}</span>
                      <Badge 
                        variant="outline" 
                        className={
                          assignedVehicle.estado === "activo" ? "bg-green-50 text-green-700" :
                          assignedVehicle.estado === "mantenimiento" ? "bg-yellow-50 text-yellow-700" :
                          assignedVehicle.estado === "en_reparacion" ? "bg-orange-50 text-orange-700" :
                          assignedVehicle.estado === "inactivo" ? "bg-gray-50 text-gray-700" :
                          "bg-red-50 text-red-700" // dado_de_baja
                        }
                      >
                        {assignedVehicle.estado.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {assignedVehicle.marca} {assignedVehicle.modelo} {assignedVehicle.anio}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>
                      <span className="text-muted-foreground">Tipo: </span>
                      {assignedVehicle.tipo}
                    </div>
                    {assignedVehicle.categoria && (
                      <div>
                        <span className="text-muted-foreground">Categoría: </span>
                        {assignedVehicle.categoria}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Kilometraje: </span>
                      {assignedVehicle.km_actual?.toLocaleString() || "-"} km
                    </div>
                  </div>
                  
                  {/* Mostrar chofer asignado al vehículo si existe */}
                  {assignedVehicle.id_chofer_asignado && (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <UserCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Chofer asignado al vehículo:</span>
                      <span>ID #{assignedVehicle.id_chofer_asignado}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-muted-foreground">No hay vehículo asignado actualmente</p>
                </div>
              )}
            </div>

            {/* Historial de asignaciones */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Historial de Asignaciones
              </h3>
              
              {assignmentHistoryLoading ? (
                <div className="py-4 text-center text-muted-foreground">
                  Cargando historial de asignaciones...
                </div>
              ) : assignmentHistory.length > 0 ? (
                <div className="space-y-3">
                  {assignmentHistory.map((event) => {
                    // Extraer información del vehículo del mensaje de descripción
                    let vehicleInfo = "";
                    let eventAction = "";
                    let eventType = "other"; // "assigned", "unassigned", "other"
                    let alreadyContainsVehicle = false; // Bandera para indicar si ya contiene la patente
                    
                    if (event.descripcion) {
                      // Verificar si el mensaje ya termina con un patrón de patente
                      const endsWithPatternMatch = event.descripcion.match(/\s+([A-Z0-9-]{5,8})$/i);
                      if (endsWithPatternMatch && endsWithPatternMatch[1]) {
                        alreadyContainsVehicle = true;
                        vehicleInfo = endsWithPatternMatch[1];
                      }
                      
                      // Detectar el tipo de acción (asignación, desasignación, etc.)
                      if (event.descripcion.includes("Asignación de semirremolque")) {
                        eventAction = "asignado a";
                        eventType = "assigned";
                      } else if (event.descripcion.includes("Desasignación de semirremolque")) {
                        eventAction = "desasignado de";
                        eventType = "unassigned";
                      }
                      
                      // Si no se ha encontrado ya una patente al final, buscarla
                      if (!alreadyContainsVehicle) {
                        // Intentar extraer la patente del vehículo de varias formas
                        // 1. Patrón "al vehículo PATENTE" en cualquier parte del texto
                        const assignmentMatch = event.descripcion.match(/al vehículo\s+([A-Z0-9-]+)/i);
                        if (assignmentMatch && assignmentMatch[1]) {
                          vehicleInfo = assignmentMatch[1];
                        } else {
                          // 2. Patrón "vehículo PATENTE"
                          const vehicleMatch = event.descripcion.match(/vehículo\s+([A-Z0-9-]+)/i);
                          if (vehicleMatch && vehicleMatch[1]) {
                            vehicleInfo = vehicleMatch[1];
                          } else {
                            // 3. Buscar una patente genérica
                            const patenteMatch = event.descripcion.match(/[A-Z]{2,4}\d{2,3}[A-Z0-9]{0,2}/);
                            if (patenteMatch) {
                              vehicleInfo = patenteMatch[0];
                            }
                          }
                        }
                      }
                    }
                    
                    // Procesar el mensaje para mostrar
                    let displayMessage = event.descripcion || "";
                    
                    // Si es una asignación y el mensaje no tiene la patente al final, agregarla
                    if (eventType === "assigned" && !alreadyContainsVehicle && vehicleInfo && 
                        displayMessage.includes("[SEMIRREMOLQUE]") && 
                        !displayMessage.endsWith(vehicleInfo)) {
                      // Si ya contiene "al vehículo", reemplazar con la patente correcta
                      if (displayMessage.includes("al vehículo")) {
                        displayMessage = displayMessage.replace(
                          /al vehículo(\s+[A-Z0-9-]*)?/i, 
                          `al vehículo ${vehicleInfo}`
                        );
                      } else {
                        // Si no tiene "al vehículo", agregarlo al final
                        displayMessage = `${displayMessage} al vehículo ${vehicleInfo}`;
                      }
                    }
                    
                    return (
                      <div key={event.id_evento} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex justify-between">
                          <div className="flex items-start gap-2">
                            {eventType === "assigned" ? (
                              <LinkIcon className="h-4 w-4 mt-1 text-green-500" />
                            ) : eventType === "unassigned" ? (
                              <Unlink className="h-4 w-4 mt-1 text-orange-500" />
                            ) : (
                              <Truck className="h-4 w-4 mt-1 text-blue-500" />
                            )}
                            <div>
                              <p className="text-sm">{displayMessage}</p>
                              {vehicleInfo && !displayMessage.endsWith(vehicleInfo) && (
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      eventType === "assigned" 
                                        ? "bg-green-50 text-green-700 border-green-200" 
                                        : eventType === "unassigned"
                                          ? "bg-orange-50 text-orange-700 border-orange-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                    }
                                  >
                                    {eventAction ? `${eventAction} vehículo ${vehicleInfo}` : `Vehículo: ${vehicleInfo}`}
                                  </Badge>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-1.5">
                                {new Date(event.fecha_inicio).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No hay datos de asignaciones previas</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 