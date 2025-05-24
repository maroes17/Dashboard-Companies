"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isAfter, isBefore, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Fleet, Poliza, Semirremolque, supabase } from "@/lib/supabase";
import { CalendarIcon, FileText, Check, AlertTriangle, AlertCircle, Car, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PolizaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poliza: Poliza | null;
  onRenewPoliza?: (poliza: Poliza) => void;
}

export function PolizaDetailsDialog({
  open,
  onOpenChange,
  poliza,
  onRenewPoliza,
}: PolizaDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("detalles");
  const [unitDetails, setUnitDetails] = useState<Fleet | Semirremolque | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [historialPolizas, setHistorialPolizas] = useState<Poliza[]>([]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  
  // Cargar datos de la unidad (vehículo o semirremolque) cuando se abre el diálogo
  useEffect(() => {
    if (poliza && open) {
      fetchUnitDetails();
      fetchPolizasHistory();
    }
  }, [poliza, open]);
  
  // Función para cargar los detalles de la unidad
  const fetchUnitDetails = async () => {
    if (!poliza) return;
    
    try {
      setIsLoadingDetails(true);
      
      // Determinar la tabla a consultar según el tipo de unidad
      const table = poliza.aplica_a === 'flota' ? 'flota' : 'semirremolques';
      const field = poliza.aplica_a === 'flota' ? 'patente' : 'patente';
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(field, poliza.patente)
        .single();
      
      if (error) {
        console.error(`Error al cargar detalles de ${poliza.aplica_a}:`, error);
        return;
      }
      
      if (data) {
        setUnitDetails(data);
      }
    } catch (error) {
      console.error("Error al cargar detalles de la unidad:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  // Función para cargar el historial de pólizas para la misma unidad
  const fetchPolizasHistory = async () => {
    if (!poliza) return;
    
    try {
      setIsLoadingHistorial(true);
      
      const { data, error } = await supabase
        .from('polizas')
        .select('*')
        .eq('patente', poliza.patente)
        .eq('aplica_a', poliza.aplica_a)
        .order('vigencia_desde', { ascending: false });
      
      if (error) {
        console.error("Error al cargar historial de pólizas:", error);
        return;
      }
      
      if (data) {
        // Formatear los datos
        const formattedHistory = data.map(item => ({
          id_poliza: item.id_poliza,
          aplica_a: item.aplica_a,
          patente: item.patente,
          aseguradora: item.aseguradora,
          nro_poliza: item.nro_poliza,
          vigencia_desde: item.vigencia_desde,
          vigencia_hasta: item.vigencia_hasta,
          importe_pagado: item.importe_pagado,
          fecha_pago: item.fecha_pago,
          estado: item.estado,
          observaciones: item.observaciones,
          creado_en: item.creado_en
        }));
        
        setHistorialPolizas(formattedHistory);
      }
    } catch (error) {
      console.error("Error al cargar historial de pólizas:", error);
    } finally {
      setIsLoadingHistorial(false);
    }
  };
  
  // Función para determinar el estado actual de la póliza
  const getPolizaStatus = (poliza: Poliza): 'vigente' | 'vencida' | 'renovada' | 'cancelada' => {
    if (poliza.estado === 'cancelada') return 'cancelada';
    if (poliza.estado === 'renovada') return 'renovada';
    
    if (!poliza.vigencia_hasta) return 'vigente';
    
    const today = new Date();
    const vigenciaHasta = new Date(poliza.vigencia_hasta);
    
    if (isBefore(vigenciaHasta, today)) {
      return 'vencida';
    } else {
      return 'vigente';
    }
  };
  
  // Función para verificar si una póliza está próxima a vencer (menos de 30 días)
  const isPolizaSoonToExpire = (poliza: Poliza): boolean => {
    if (!poliza.vigencia_hasta) return false;
    
    const today = new Date();
    const vigenciaHasta = new Date(poliza.vigencia_hasta);
    const thirtyDaysLater = addDays(today, 30);
    
    return isAfter(vigenciaHasta, today) && isBefore(vigenciaHasta, thirtyDaysLater);
  };
  
  // Formatear moneda
  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '-';
    return amount.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP'
    });
  };
  
  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return dateString;
    }
  };
  
  // Formatear fecha con formato largo
  const formatLongDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return dateString;
    }
  };
  
  if (!poliza) return null;
  
  // Determinar estado actual y posible alerta
  const currentStatus = getPolizaStatus(poliza);
  const soonToExpire = isPolizaSoonToExpire(poliza);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Póliza {poliza.nro_poliza}</span>
            <Badge 
              variant="state"
              className={
                currentStatus === "vigente" ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500 border-transparent" :
                currentStatus === "vencida" ? "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent" :
                currentStatus === "renovada" ? "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500 border-transparent" :
                "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500 border-transparent" // cancelada
              }
            >
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              {soonToExpire && currentStatus === "vigente" && (
                <span className="ml-1 text-xs">(Próx. a vencer)</span>
              )}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="detalles" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="detalles">Detalles de la Póliza</TabsTrigger>
            <TabsTrigger value="historial">Historial de Pólizas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detalles" className="space-y-4 pt-4">
            {/* Información de la unidad */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                {poliza.aplica_a === 'flota' ? (
                  <Car className="h-5 w-5 text-blue-500" />
                ) : (
                  <Truck className="h-5 w-5 text-blue-500" />
                )}
                <span>{poliza.aplica_a === 'flota' ? 'Vehículo' : 'Semirremolque'}</span>
              </h3>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Patente</p>
                <p className="font-medium">{poliza.patente}</p>
              </div>
              
              {isLoadingDetails ? (
                <p className="text-center py-2 text-muted-foreground">Cargando detalles...</p>
              ) : unitDetails ? (
                <div className="grid grid-cols-2 gap-4">
                  {poliza.aplica_a === 'flota' ? (
                    // Detalles de vehículo
                    <>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Marca/Modelo</p>
                        <p className="font-medium">
                          {(unitDetails as Fleet).marca} {(unitDetails as Fleet).modelo}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Año</p>
                        <p className="font-medium">{(unitDetails as Fleet).anio || '-'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Tipo</p>
                        <p className="font-medium">{(unitDetails as Fleet).tipo || '-'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Categoría</p>
                        <p className="font-medium">{(unitDetails as Fleet).categoria || '-'}</p>
                      </div>
                    </>
                  ) : (
                    // Detalles de semirremolque
                    <>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Marca/Modelo</p>
                        <p className="font-medium">
                          {(unitDetails as Semirremolque).marca || '-'} {(unitDetails as Semirremolque).modelo || '-'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Año</p>
                        <p className="font-medium">{(unitDetails as Semirremolque).anio || '-'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Tipo</p>
                        <p className="font-medium">{(unitDetails as Semirremolque).tipo || '-'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Nº Genset</p>
                        <p className="font-medium">{(unitDetails as Semirremolque).nro_genset || '-'}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-center py-2 text-muted-foreground">No se encontraron detalles de la unidad</p>
              )}
            </div>
            
            {/* Información de la póliza */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <span>Datos de la Póliza</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Aseguradora</p>
                  <p className="font-medium">{poliza.aseguradora || '-'}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Número de póliza</p>
                  <p className="font-medium">{poliza.nro_poliza || '-'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm text-muted-foreground">Vigencia</h4>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Desde: {formatLongDate(poliza.vigencia_desde)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className={soonToExpire ? 'text-yellow-600' : currentStatus === 'vencida' ? 'text-red-600' : ''}>
                    Hasta: {formatLongDate(poliza.vigencia_hasta)}
                    {soonToExpire && (
                      <Badge variant="outline" className="ml-2 py-0 px-2 bg-yellow-50 text-yellow-800 border-yellow-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Próxima a vencer
                      </Badge>
                    )}
                    {currentStatus === 'vencida' && (
                      <Badge variant="outline" className="ml-2 py-0 px-2 bg-red-50 text-red-800 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Vencida
                      </Badge>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Importe pagado</p>
                  <p className="font-medium">{formatCurrency(poliza.importe_pagado)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha de pago</p>
                  <p className="font-medium">{formatDate(poliza.fecha_pago)}</p>
                </div>
              </div>
            </div>
            
            {/* Observaciones */}
            {poliza.observaciones && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Observaciones</h3>
                <p className="text-sm">{poliza.observaciones}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="historial" className="space-y-4 pt-4">
            {isLoadingHistorial ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando historial de pólizas...
              </div>
            ) : historialPolizas.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-medium">Historial de pólizas para {poliza.patente}</h3>
                
                {historialPolizas.map((historicalPoliza) => {
                  const isCurrentPoliza = historicalPoliza.id_poliza === poliza.id_poliza;
                  const historyStatus = getPolizaStatus(historicalPoliza);
                  
                  return (
                    <div 
                      key={historicalPoliza.id_poliza}
                      className={`border rounded-lg p-4 ${isCurrentPoliza ? 'bg-muted/50 border-primary' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <p className="font-medium">
                              Póliza {historicalPoliza.nro_poliza || `#${historicalPoliza.id_poliza}`}
                              {isCurrentPoliza && (
                                <span className="ml-2 text-xs text-primary">(Actual)</span>
                              )}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {historicalPoliza.aseguradora || 'Aseguradora no especificada'}
                          </p>
                        </div>
                        <Badge 
                          variant="state"
                          className={
                            historyStatus === "vigente" ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500 border-transparent" :
                            historyStatus === "vencida" ? "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent" :
                            historyStatus === "renovada" ? "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500 border-transparent" :
                            "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500 border-transparent" // cancelada
                          }
                        >
                          {historyStatus.charAt(0).toUpperCase() + historyStatus.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <div>
                          <span className="text-muted-foreground">Vigencia: </span>
                          {formatDate(historicalPoliza.vigencia_desde)} - {formatDate(historicalPoliza.vigencia_hasta)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Importe: </span>
                          {formatCurrency(historicalPoliza.importe_pagado)}
                        </div>
                      </div>
                      
                      {historicalPoliza.fecha_pago && (
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">Pagado el: </span>
                          {formatDate(historicalPoliza.fecha_pago)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay historial de pólizas para esta unidad
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          {onRenewPoliza && currentStatus !== 'renovada' && (
            <Button 
              variant="outline"
              onClick={() => onRenewPoliza(poliza)}
              className="mr-auto"
            >
              Renovar Póliza
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 