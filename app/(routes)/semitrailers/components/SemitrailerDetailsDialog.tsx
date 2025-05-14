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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, AlertCircle, Link } from "lucide-react";

interface SemitrailerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semitrailer: Semirremolque | null;
  onAssignVehicle?: (semitrailer: Semirremolque) => void;
}

export function SemitrailerDetailsDialog({
  open,
  onOpenChange,
  semitrailer,
  onAssignVehicle
}: SemitrailerDetailsDialogProps) {
  const [assignedVehicle, setAssignedVehicle] = useState<Fleet | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Cargar información del vehículo asignado si existe
  useEffect(() => {
    if (open && semitrailer?.asignado_a_flota_id) {
      fetchVehicleInfo(semitrailer.asignado_a_flota_id);
    } else {
      setAssignedVehicle(null);
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
                      {isRevisionExpired(semitrailer.vencimiento_revision_tecnica) && (
                        <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">Vencida</Badge>
                      )}
                      {isRevisionSoonToExpire(semitrailer.vencimiento_revision_tecnica) && (
                        <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">Próxima a vencer</Badge>
                      )}
                    </>
                  ) : "-"}
                </p>
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
              <h3 className="font-medium mb-2">Vehículo asignado</h3>
              
              {semitrailer.asignado_a_flota_id ? (
                vehicleLoading ? (
                  <p className="text-center py-4 text-muted-foreground">Cargando información del vehículo...</p>
                ) : assignedVehicle ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{assignedVehicle.patente}</span>
                        <p className="text-sm text-muted-foreground">
                          {assignedVehicle.marca} {assignedVehicle.modelo} {assignedVehicle.anio}
                        </p>
                      </div>
                      <Badge variant="outline" className={
                        assignedVehicle.estado === "activo" ? "bg-green-50 text-green-700" :
                        assignedVehicle.estado === "mantenimiento" ? "bg-yellow-50 text-yellow-700" :
                        assignedVehicle.estado === "en_reparacion" ? "bg-orange-50 text-orange-700" :
                        assignedVehicle.estado === "inactivo" ? "bg-gray-50 text-gray-700" :
                        "bg-red-50 text-red-700" // dado_de_baja
                      }>
                        {assignedVehicle.estado.replace("_", " ")}
                      </Badge>
                    </div>
                    
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
                    
                    {onAssignVehicle && (
                      <div className="flex justify-end mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onAssignVehicle(semitrailer)}
                        >
                          Cambiar asignación
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2">
                    <p>Vehículo #{semitrailer.asignado_a_flota_id}</p>
                    <p className="text-muted-foreground text-sm mt-1">No se pudo cargar la información detallada</p>
                  </div>
                )
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-muted-foreground">No hay vehículo asignado actualmente</p>
                  {onAssignVehicle && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAssignVehicle(semitrailer)}
                      className="mt-2"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Asignar a vehículo
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Historial de Asignaciones</h3>
              <p className="text-muted-foreground">No hay datos de asignaciones previas</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 