"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, PlusCircle, FilterX, MoreHorizontal, Trash2, FileText, AlertCircle, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Poliza, Fleet, Semirremolque, supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isAfter, isBefore, addDays, addYears, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PolizaFilterDialog } from "./components/PolizaFilterDialog";
import { PolizaDetailsDialog } from "./components/PolizaDetailsDialog";
import { NewPolizaDialog } from "./components/NewPolizaDialog";
import { EditPolizaDialog } from "./components/EditPolizaDialog";
import { ConfirmActionDialog } from "./components/ConfirmActionDialog";

// Definir la interfaz PolizaFilter
interface PolizaFilter {
  estado?: string[];
  aseguradora?: string[];
  aplica_a?: string[];
  vigente?: boolean;
  vencida?: boolean;
  proximo_vencimiento?: boolean; // pólizas que vencen en los próximos 30 días
  fecha_desde?: string;
  fecha_hasta?: string;
}

export default function PolizasPage() {
  const { toast } = useToast();
  const [polizas, setPolizas] = useState<Poliza[]>([]);
  const [fleetMap, setFleetMap] = useState<{[key: string]: Fleet}>({});
  const [semitrailerMap, setSemitrailerMap] = useState<{[key: string]: Semirremolque}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewPolizaDialogOpen, setIsNewPolizaDialogOpen] = useState(false);
  
  // Estado para manejo de detalles
  const [selectedPoliza, setSelectedPoliza] = useState<Poliza | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Estado para manejo de edición
  const [editingPoliza, setEditingPoliza] = useState<Poliza | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estado para manejo de filtros
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<PolizaFilter>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Estado para manejo de eliminación
  const [deletePoliza, setDeletePoliza] = useState<Poliza | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Estado para manejo de renovación de póliza
  const [isRenewPolizaDialogOpen, setIsRenewPolizaDialogOpen] = useState(false);
  const [formForRenewal, setFormForRenewal] = useState<Poliza | null>(null);

  // Cargar datos desde Supabase
  useEffect(() => {
    fetchPolizas();
  }, []);

  const fetchPolizas = async () => {
    try {
      setIsLoading(true);
      
      // Cargar datos de pólizas
      const { data, error } = await supabase
        .from('polizas')
        .select('*');
      
      if (error) {
        console.error('Error al cargar pólizas:', error);
        toast({
          title: "Error al cargar datos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No se encontraron pólizas en la respuesta');
        setPolizas([]);
        setIsLoading(false);
        return;
      }
      
      // Convertir los datos al formato Poliza
      const formattedData: Poliza[] = data.map(item => ({
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
      
      setPolizas(formattedData);
      
      // Obtener todas las patentes únicas
      const patentes = [...new Set(formattedData.map(poliza => poliza.patente))];
      
      // Cargar datos de flota
      const { data: fleetData, error: fleetError } = await supabase
        .from('flota')
        .select('*')
        .in('patente', patentes);
      
      if (fleetError) {
        console.error('Error al cargar datos de flota:', fleetError);
      } else if (fleetData) {
        // Crear un mapa de flota para acceso rápido por patente
        const fleetMapByPatente: {[key: string]: Fleet} = {};
        fleetData.forEach(vehicle => {
          fleetMapByPatente[vehicle.patente] = {
            id_flota: vehicle.id_flota,
            tipo: vehicle.tipo,
            categoria: vehicle.categoria,
            subcategoria: vehicle.subcategoria,
            patente: vehicle.patente,
            nro_chasis: vehicle.nro_chasis,
            marca: vehicle.marca,
            modelo: vehicle.modelo,
            anio: vehicle.anio,
            capacidad: vehicle.capacidad,
            estado: vehicle.estado,
            fecha_ingreso: vehicle.fecha_ingreso,
            id_chofer_asignado: vehicle.id_chofer_asignado,
            km_actual: vehicle.km_actual,
            km_ultimo_servicio: vehicle.km_ultimo_servicio,
            km_proximo_servicio: vehicle.km_proximo_servicio,
            fecha_ultima_mantencion: vehicle.fecha_ultima_mantencion,
            fecha_proximo_mantenimiento: vehicle.fecha_proximo_mantenimiento,
            vencimiento_revision_tecnica: vehicle.vencimiento_revision_tecnica,
            vencimiento_permiso_circulacion: vehicle.vencimiento_permiso_circulacion,
            vencimiento_seguro: vehicle.vencimiento_seguro,
            consumo_promedio: vehicle.consumo_promedio,
            origen: vehicle.origen,
            observaciones: vehicle.observaciones,
            creado_en: vehicle.creado_en,
            actualizado_en: vehicle.actualizado_en
          };
        });
        setFleetMap(fleetMapByPatente);
      }
      
      // Cargar datos de semirremolques
      const { data: semitrailerData, error: semitrailerError } = await supabase
        .from('semirremolques')
        .select('*')
        .in('patente', patentes);
      
      if (semitrailerError) {
        console.error('Error al cargar datos de semirremolques:', semitrailerError);
      } else if (semitrailerData) {
        // Crear un mapa de semirremolques para acceso rápido por patente
        const semitrailerMapByPatente: {[key: string]: Semirremolque} = {};
        semitrailerData.forEach(semitrailer => {
          semitrailerMapByPatente[semitrailer.patente] = {
            id_semirremolque: semitrailer.id_semirremolque,
            patente: semitrailer.patente,
            nro_genset: semitrailer.nro_genset,
            tipo: semitrailer.tipo,
            marca: semitrailer.marca,
            modelo: semitrailer.modelo,
            anio: semitrailer.anio,
            estado: semitrailer.estado,
            fecha_ingreso: semitrailer.fecha_ingreso,
            fecha_ultima_revision: semitrailer.fecha_ultima_revision,
            vencimiento_revision_tecnica: semitrailer.vencimiento_revision_tecnica,
            observaciones: semitrailer.observaciones,
            asignado_a_flota_id: semitrailer.asignado_a_flota_id,
            creado_en: semitrailer.creado_en
          };
        });
        setSemitrailerMap(semitrailerMapByPatente);
      }
      
    } catch (error) {
      console.error('Error inesperado:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los datos de pólizas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar el estado de las pólizas en base a fechas
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

  // Filtrado combinado (búsqueda + filtros)
  const filteredPolizas = polizas.filter(poliza => {
    // Primero aplicar búsqueda de texto
    const matchesSearch = searchQuery.trim() === "" || 
      poliza.patente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (poliza.nro_poliza && poliza.nro_poliza.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (poliza.aseguradora && poliza.aseguradora.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    // Luego aplicar filtros adicionales
    let matches = true;
    
    // Filtrar por estado
    if (activeFilters.estado && activeFilters.estado.length > 0) {
      const currentStatus = getPolizaStatus(poliza);
      matches = matches && activeFilters.estado.includes(currentStatus);
    }
    
    // Filtrar por aseguradora
    if (activeFilters.aseguradora && activeFilters.aseguradora.length > 0) {
      matches = matches && Boolean(poliza.aseguradora && activeFilters.aseguradora.includes(poliza.aseguradora));
    }
    
    // Filtrar por tipo de unidad
    if (activeFilters.aplica_a && activeFilters.aplica_a.length > 0) {
      matches = matches && activeFilters.aplica_a.includes(poliza.aplica_a);
    }
    
    // Filtrar por pólizas vigentes
    if (activeFilters.vigente) {
      matches = matches && getPolizaStatus(poliza) === 'vigente';
    }
    
    // Filtrar por pólizas vencidas
    if (activeFilters.vencida) {
      matches = matches && getPolizaStatus(poliza) === 'vencida';
    }
    
    // Filtrar por pólizas próximas a vencer
    if (activeFilters.proximo_vencimiento) {
      matches = matches && isPolizaSoonToExpire(poliza);
    }
    
    // Filtrar por fecha desde
    if (activeFilters.fecha_desde && poliza.vigencia_desde) {
      const fechaDesde = new Date(activeFilters.fecha_desde);
      const vigenciaDesde = new Date(poliza.vigencia_desde);
      matches = matches && isAfter(vigenciaDesde, fechaDesde);
    }
    
    // Filtrar por fecha hasta
    if (activeFilters.fecha_hasta && poliza.vigencia_hasta) {
      const fechaHasta = new Date(activeFilters.fecha_hasta);
      const vigenciaHasta = new Date(poliza.vigencia_hasta);
      matches = matches && isBefore(vigenciaHasta, fechaHasta);
    }
    
    return matches;
  });

  const handleViewDetails = (poliza: Poliza) => {
    setSelectedPoliza(poliza);
    setIsDetailsDialogOpen(true);
  };

  const handleEditPoliza = (poliza: Poliza) => {
    setEditingPoliza(poliza);
    setIsEditDialogOpen(true);
  };

  const handleDeletePoliza = (poliza: Poliza) => {
    setDeletePoliza(poliza);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePoliza = async () => {
    if (!deletePoliza) return;

    try {
      setIsDeleteLoading(true);

      const { error } = await supabase
        .from('polizas')
        .delete()
        .eq('id_poliza', deletePoliza.id_poliza);

      if (error) {
        throw error;
      }

      // Actualizar la lista localmente
      setPolizas(prev => prev.filter(p => p.id_poliza !== deletePoliza.id_poliza));

      toast({
        title: "Póliza eliminada",
        description: `La póliza #${deletePoliza.nro_poliza || deletePoliza.id_poliza} ha sido eliminada permanentemente.`,
      });

      // Cerrar el diálogo
      setIsDeleteDialogOpen(false);
      setDeletePoliza(null);

    } catch (error: any) {
      console.error("Error al eliminar póliza:", error);
      toast({
        title: "Error al eliminar",
        description: error.message || "Ocurrió un error al eliminar la póliza.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleApplyFilters = (filters: PolizaFilter) => {
    setActiveFilters(filters);
    setHasActiveFilters(
      Boolean(
        (filters.estado && filters.estado.length > 0) ||
        (filters.aseguradora && filters.aseguradora.length > 0) ||
        (filters.aplica_a && filters.aplica_a.length > 0) ||
        filters.vigente ||
        filters.vencida ||
        filters.proximo_vencimiento ||
        filters.fecha_desde ||
        filters.fecha_hasta
      )
    );
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setHasActiveFilters(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    
    if (activeFilters.estado && activeFilters.estado.length > 0) count++;
    if (activeFilters.aseguradora && activeFilters.aseguradora.length > 0) count++;
    if (activeFilters.aplica_a && activeFilters.aplica_a.length > 0) count++;
    if (activeFilters.vigente) count++;
    if (activeFilters.vencida) count++;
    if (activeFilters.proximo_vencimiento) count++;
    if (activeFilters.fecha_desde) count++;
    if (activeFilters.fecha_hasta) count++;
    
    return count;
  };

  // Obtener información del vehículo o semirremolque asociado
  const getUnitInfo = (poliza: Poliza) => {
    if (poliza.aplica_a === 'flota' && fleetMap[poliza.patente]) {
      const vehicle = fleetMap[poliza.patente];
      return {
        tipo: vehicle.tipo,
        marca: vehicle.marca,
        modelo: vehicle.modelo
      };
    } else if (poliza.aplica_a === 'semirremolque' && semitrailerMap[poliza.patente]) {
      const semitrailer = semitrailerMap[poliza.patente];
      return {
        tipo: semitrailer.tipo || 'Semirremolque',
        marca: semitrailer.marca,
        modelo: semitrailer.modelo
      };
    }
    
    return {
      tipo: poliza.aplica_a === 'flota' ? 'Vehículo' : 'Semirremolque',
      marca: 'No disponible',
      modelo: 'No disponible'
    };
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
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  const addPoliza = async (newPoliza: Poliza) => {
    try {
      // Preparar datos para insertar en Supabase
      const polizaData = {
        aplica_a: newPoliza.aplica_a,
        patente: newPoliza.patente,
        aseguradora: newPoliza.aseguradora,
        nro_poliza: newPoliza.nro_poliza,
        vigencia_desde: newPoliza.vigencia_desde,
        vigencia_hasta: newPoliza.vigencia_hasta,
        importe_pagado: newPoliza.importe_pagado,
        fecha_pago: newPoliza.fecha_pago,
        estado: newPoliza.estado,
        observaciones: newPoliza.observaciones
      };

      const { data, error } = await supabase
        .from('polizas')
        .insert([polizaData])
        .select();

      if (error) throw error;

      // Añadir la nueva póliza al estado local con el ID generado
      if (data && data.length > 0) {
        const insertedPoliza = {
          ...newPoliza,
          id_poliza: data[0].id_poliza,
          creado_en: data[0].creado_en
        };
        setPolizas(prev => [...prev, insertedPoliza]);
      }

      toast({
        title: "Póliza agregada",
        description: `La póliza ${newPoliza.nro_poliza} ha sido agregada correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al agregar póliza:', error);
      toast({
        title: "Error al agregar",
        description: error.message || "No se pudo agregar la póliza",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    }
  };

  const updatePoliza = async (updatedPoliza: Poliza) => {
    try {
      // Preparar datos para actualizar en Supabase
      const polizaData = {
        aplica_a: updatedPoliza.aplica_a,
        patente: updatedPoliza.patente,
        aseguradora: updatedPoliza.aseguradora,
        nro_poliza: updatedPoliza.nro_poliza,
        vigencia_desde: updatedPoliza.vigencia_desde,
        vigencia_hasta: updatedPoliza.vigencia_hasta,
        importe_pagado: updatedPoliza.importe_pagado,
        fecha_pago: updatedPoliza.fecha_pago,
        estado: updatedPoliza.estado,
        observaciones: updatedPoliza.observaciones
      };

      const { error } = await supabase
        .from('polizas')
        .update(polizaData)
        .eq('id_poliza', updatedPoliza.id_poliza);

      if (error) throw error;

      // Actualizar el estado local
      setPolizas(prev => 
        prev.map(p => 
          p.id_poliza === updatedPoliza.id_poliza ? updatedPoliza : p
        )
      );

      toast({
        title: "Póliza actualizada",
        description: `La póliza ${updatedPoliza.nro_poliza} ha sido actualizada correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al actualizar póliza:', error);
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar la póliza",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    }
  };

  const handleRenewPoliza = (poliza: Poliza) => {
    // Preparar datos para la renovación
    const today = new Date();
    const vigenciaDesde = poliza.vigencia_hasta || format(today, 'yyyy-MM-dd');
    const vigenciaHasta = format(addYears(parseISO(vigenciaDesde), 1), 'yyyy-MM-dd');
    
    // Actualizar la póliza actual como "renovada"
    updatePoliza({
      ...poliza,
      estado: 'renovada'
    }).then(() => {
      // Crear una nueva póliza con la nueva vigencia
      const newPoliza: Omit<Poliza, 'id_poliza' | 'creado_en'> = {
        aplica_a: poliza.aplica_a,
        patente: poliza.patente,
        aseguradora: poliza.aseguradora,
        nro_poliza: `${poliza.nro_poliza}-R`, // Añadir sufijo para renovación
        vigencia_desde: vigenciaDesde,
        vigencia_hasta: vigenciaHasta,
        importe_pagado: 0, // Inicializar con 0 en lugar de undefined
        fecha_pago: format(today, 'yyyy-MM-dd'),
        estado: 'vigente',
        observaciones: `Renovación de póliza ${poliza.nro_poliza}`
      };
      
      // Abrir el diálogo para editar la nueva póliza
      setFormForRenewal(newPoliza as Poliza);
      setIsRenewPolizaDialogOpen(true);
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Pólizas</h1>
        <Button 
          className="bg-primary" 
          onClick={() => setIsNewPolizaDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Póliza
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por patente, número de póliza o aseguradora..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          onClick={() => setIsFilterDialogOpen(true)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 h-5">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            title="Limpiar filtros"
          >
            <FilterX className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-muted-foreground">Cargando pólizas...</p>
        </div>
      ) : filteredPolizas.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <p className="text-lg text-muted-foreground">
            {polizas.length === 0
              ? "No hay pólizas registradas en el sistema."
              : "No se encontraron pólizas con los criterios de búsqueda."}
          </p>
          {polizas.length === 0 && (
            <Button 
              onClick={() => setIsNewPolizaDialogOpen(true)}
              className="bg-primary"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Póliza
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium">Patente</th>
                    <th className="h-12 px-4 text-left align-middle font-medium hidden sm:table-cell">Unidad</th>
                    <th className="h-12 px-4 text-left align-middle font-medium hidden sm:table-cell">Aseguradora</th>
                    <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">Nº Póliza</th>
                    <th className="h-12 px-4 text-left align-middle font-medium hidden sm:table-cell">Vigencia</th>
                    <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">Importe</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Estado</th>
                    <th className="h-12 px-4 text-center align-middle font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredPolizas.map((poliza) => {
                    const unitInfo = getUnitInfo(poliza);
                    const polizaStatus = getPolizaStatus(poliza);
                    const soonToExpire = isPolizaSoonToExpire(poliza);
                    
                    return (
                      <tr 
                        key={poliza.id_poliza} 
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                        onClick={() => handleViewDetails(poliza)}
                      >
                        <td className="p-4 align-middle">
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">{poliza.patente}</span>
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden mt-1">
                              {poliza.aplica_a === 'flota' ? 'Vehículo' : 'Semirremolque'} • {unitInfo.marca} {unitInfo.modelo}
                            </div>
                            <div className="text-xs font-medium sm:hidden mt-2 flex items-center">
                              <FileText className="h-3 w-3 mr-1 text-primary" />
                              <span className="text-primary">{poliza.aseguradora}</span>
                              <span className="mx-1 text-muted-foreground">•</span>
                              <span className="text-muted-foreground">Nº {poliza.nro_poliza || "-"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden mt-1 flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              <span>Hasta: </span>
                              <span className={`ml-1 ${soonToExpire ? 'text-yellow-600 font-medium' : polizaStatus === 'vencida' ? 'text-red-600 font-medium' : ''}`}>
                                {formatDate(poliza.vigencia_hasta)}
                                {soonToExpire && <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-600" />}
                              </span>
                            </div>
                            <div className="sm:hidden mt-2">
                              <Badge 
                                variant="state"
                                className={
                                  polizaStatus === "vigente" ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500 border-transparent" :
                                  polizaStatus === "vencida" ? "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent" :
                                  polizaStatus === "renovada" ? "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500 border-transparent" :
                                  "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500 border-transparent" // cancelada
                                }
                              >
                                {polizaStatus.charAt(0).toUpperCase() + polizaStatus.slice(1)}
                                {soonToExpire && polizaStatus === "vigente" && (
                                  <span className="ml-1 text-xs">(Próx. a vencer)</span>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle hidden sm:table-cell">
                          <div>
                            <span className="font-medium">{unitInfo.tipo}</span>
                            <span className="block text-muted-foreground">{unitInfo.marca} {unitInfo.modelo}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle hidden sm:table-cell">
                          {poliza.aseguradora || "-"}
                        </td>
                        <td className="p-4 align-middle hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            {poliza.nro_poliza || "-"}
                          </div>
                        </td>
                        <td className="p-4 align-middle hidden sm:table-cell">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Desde: {formatDate(poliza.vigencia_desde)}</span>
                            <span className={`text-xs ${soonToExpire ? 'text-yellow-600 font-medium' : polizaStatus === 'vencida' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              Hasta: {formatDate(poliza.vigencia_hasta)}
                              {soonToExpire && <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-600" />}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle hidden md:table-cell">
                          {formatCurrency(poliza.importe_pagado)}
                          {poliza.fecha_pago && (
                            <div className="text-xs text-muted-foreground">
                              Pagado: {formatDate(poliza.fecha_pago)}
                            </div>
                          )}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge 
                            variant="state"
                            className={
                              polizaStatus === "vigente" ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500 border-transparent" :
                              polizaStatus === "vencida" ? "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent" :
                              polizaStatus === "renovada" ? "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500 border-transparent" :
                              "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500 border-transparent" // cancelada
                            }
                          >
                            {polizaStatus.charAt(0).toUpperCase() + polizaStatus.slice(1)}
                            {soonToExpire && polizaStatus === "vigente" && (
                              <span className="ml-1 text-xs">(Próx. a vencer)</span>
                            )}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(poliza);
                              }}>
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEditPoliza(poliza);
                              }}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleRenewPoliza(poliza);
                              }}>
                                Renovar póliza
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePoliza(poliza);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Componentes de diálogo */}
      <PolizaFilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Diálogo para agregar nueva póliza */}
      <NewPolizaDialog
        open={isNewPolizaDialogOpen}
        onOpenChange={setIsNewPolizaDialogOpen}
        onSave={addPoliza}
      />

      {/* Diálogo de detalles de póliza */}
      <PolizaDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        poliza={selectedPoliza}
        onRenewPoliza={handleRenewPoliza}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Eliminar Póliza"
        description={`¿Estás seguro de que deseas eliminar la póliza ${deletePoliza?.nro_poliza || ''}? Esta acción no se puede deshacer.`}
        actionText="Eliminar"
        actionVariant="destructive"
        onConfirm={confirmDeletePoliza}
        isLoading={isDeleteLoading}
      />

      {/* Diálogo de edición de póliza */}
      <EditPolizaDialog
        poliza={editingPoliza}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={updatePoliza}
      />

      {/* Diálogo de renovación de póliza */}
      <EditPolizaDialog
        poliza={formForRenewal}
        open={isRenewPolizaDialogOpen}
        onOpenChange={setIsRenewPolizaDialogOpen}
        onSave={addPoliza}
      />
    </div>
  );
} 