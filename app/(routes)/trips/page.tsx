"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, PlusCircle, FilterX, Calendar as CalendarIcon, LayoutGrid, Table as TableIcon, MapPin, Building, Package, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Viaje, Localidad, Cliente, Driver, Fleet, Semirremolque, supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ViajeCardSkeleton } from "./components/ViajeCardSkeleton";
import { ViajeFilterDialog } from "./components/ViajeFilterDialog";
import { ViajeDetailsDialog } from "./components/ViajeDetailsDialog";
import { NewViajeDialog } from "./components/NewViajeDialog";
import { EditViajeDialog } from "./components/EditViajeDialog";
import { ConfirmActionDialog } from "./components/ConfirmActionDialog";
import { NewIncidenteDialog } from "./components/NewIncidenteDialog";
import { ResolveIncidenteDialog } from "./components/ResolveIncidenteDialog";
import { format, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { mockLocalidades } from "./utils/mock-data";
import { ViajeTable } from "./components/ViajeTable";
import { ViajeCalendar } from "./components/ViajeCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Definir la interfaz ViajeFilter
interface ViajeFilter {
  tipo_viaje?: string[];
  estado?: string[];
  prioridad?: string[];
  id_origen?: number[];
  id_destino?: number[];
  id_cliente?: number[];
  fecha_salida?: DateRange;
  fecha_llegada?: DateRange;
}

export default function TripsPage() {
  const { toast } = useToast();
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [localidades, setLocalidades] = useState<Record<number, Localidad>>({});
  const [clientes, setClientes] = useState<Record<number, Cliente>>({});
  const [conductores, setConductores] = useState<Record<number, Driver>>({});
  const [vehiculos, setVehiculos] = useState<Record<number, Fleet>>({});
  const [semirremolques, setSemirremolques] = useState<Record<number, Semirremolque>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewViajeDialogOpen, setIsNewViajeDialogOpen] = useState(false);
  
  // Estado para manejo de detalles
  const [selectedViaje, setSelectedViaje] = useState<Viaje | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Estado para manejo de edición
  const [editingViaje, setEditingViaje] = useState<Viaje | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estado para manejo de filtros
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ViajeFilter>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Estado para manejo de eliminación
  const [deleteViaje, setDeleteViaje] = useState<Viaje | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  
  // Estado para el modo de vista (tabla, tarjetas o calendario)
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'calendar'>('table');
  
  // Estados para manejar los incidentes
  const [isNewIncidenteDialogOpen, setIsNewIncidenteDialogOpen] = useState(false);
  const [isResolveIncidenteDialogOpen, setIsResolveIncidenteDialogOpen] = useState(false);
  const [selectedIncidente, setSelectedIncidente] = useState<any>(null);

  // Cargar datos desde Supabase
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Cargar viajes
      const { data: viajesData, error: viajesError } = await supabase
        .from('viajes')
        .select('*')
        .order('fecha_salida_programada', { ascending: false });

      if (viajesError) throw viajesError;
      setViajes(viajesData || []);

      // Cargar localidades
      const { data: localidadesData, error: localidadesError } = await supabase
        .from('localidades')
        .select('*');

      if (localidadesError) throw localidadesError;
      const localidadesMap = (localidadesData || []).reduce((acc, localidad) => {
        acc[localidad.id_localidad] = localidad;
        return acc;
      }, {} as Record<number, Localidad>);
      setLocalidades(localidadesMap);

      // Cargar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .eq('estado', 'activo');

      if (clientesError) throw clientesError;
      const clientesMap = (clientesData || []).reduce((acc, cliente) => {
        acc[cliente.id_cliente] = cliente;
        return acc;
      }, {} as Record<number, Cliente>);
      setClientes(clientesMap);

      // Cargar conductores
      const { data: conductoresData, error: conductoresError } = await supabase
        .from('choferes')
        .select('*')
        .eq('estado', 'activo');

      if (conductoresError) throw conductoresError;
      const conductoresMap = (conductoresData || []).reduce((acc, conductor) => {
        acc[conductor.id_chofer] = conductor;
        return acc;
      }, {} as Record<number, Driver>);
      setConductores(conductoresMap);

      // Cargar vehículos
      const { data: vehiculosData, error: vehiculosError } = await supabase
        .from('flota')
        .select('*')
        .eq('estado', 'activo');

      if (vehiculosError) throw vehiculosError;
      const vehiculosMap = (vehiculosData || []).reduce((acc, vehiculo) => {
        acc[vehiculo.id_flota] = vehiculo;
        return acc;
      }, {} as Record<number, Fleet>);
      setVehiculos(vehiculosMap);

      // Cargar semirremolques
      const { data: semirremolquesData, error: semirremolquesError } = await supabase
        .from('semirremolques')
        .select('*')
        .eq('estado', 'activo');

      if (semirremolquesError) throw semirremolquesError;
      const semirremolquesMap = (semirremolquesData || []).reduce((acc, semirremolque) => {
        acc[semirremolque.id_semirremolque] = semirremolque;
        return acc;
      }, {} as Record<number, Semirremolque>);
      setSemirremolques(semirremolquesMap);

    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado combinado (búsqueda + filtros)
  const filteredViajes = viajes.filter(viaje => {
    // Primero aplicar búsqueda de texto
    const origenNombre = localidades[viaje.id_origen]?.nombre?.toLowerCase() || "";
    const destinoNombre = localidades[viaje.id_destino]?.nombre?.toLowerCase() || "";
    const clienteNombre = clientes[viaje.id_cliente || 0]?.razon_social?.toLowerCase() || "";
    
    const matchesSearch = searchQuery.trim() === "" || 
      origenNombre.includes(searchQuery.toLowerCase()) ||
      destinoNombre.includes(searchQuery.toLowerCase()) ||
      clienteNombre.includes(searchQuery.toLowerCase()) ||
      (viaje.contenedor && viaje.contenedor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (viaje.nro_guia && viaje.nro_guia.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (viaje.nro_control?.toString().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    // Luego aplicar filtros adicionales
    let matches = true;
    
    // Filtrar por tipo de viaje
    if (activeFilters.tipo_viaje && activeFilters.tipo_viaje.length > 0) {
      matches = matches && activeFilters.tipo_viaje.includes(viaje.tipo_viaje);
    }
    
    // Filtrar por estado
    if (activeFilters.estado && activeFilters.estado.length > 0) {
      matches = matches && activeFilters.estado.includes(viaje.estado);
    }
    
    // Filtrar por prioridad
    if (activeFilters.prioridad && activeFilters.prioridad.length > 0) {
      matches = matches && activeFilters.prioridad.includes(viaje.prioridad);
    }
    
    // Filtrar por origen
    if (activeFilters.id_origen && activeFilters.id_origen.length > 0) {
      matches = matches && activeFilters.id_origen.includes(viaje.id_origen);
    }
    
    // Filtrar por destino
    if (activeFilters.id_destino && activeFilters.id_destino.length > 0) {
      matches = matches && activeFilters.id_destino.includes(viaje.id_destino);
    }
    
    // Filtrar por cliente
    if (activeFilters.id_cliente && activeFilters.id_cliente.length > 0) {
      matches = matches && viaje.id_cliente !== undefined && activeFilters.id_cliente.includes(viaje.id_cliente);
    }
    
    // Filtrar por fecha de salida
    if (activeFilters.fecha_salida && activeFilters.fecha_salida.from && activeFilters.fecha_salida.to) {
      const fechaSalida = new Date(viaje.fecha_salida_programada);
      matches = matches && isWithinInterval(fechaSalida, {
        start: activeFilters.fecha_salida.from,
        end: activeFilters.fecha_salida.to
      });
    }
    
    // Filtrar por fecha de llegada
    if (activeFilters.fecha_llegada && activeFilters.fecha_llegada.from && activeFilters.fecha_llegada.to) {
      const fechaLlegada = new Date(viaje.fecha_llegada_programada);
      matches = matches && isWithinInterval(fechaLlegada, {
        start: activeFilters.fecha_llegada.from,
        end: activeFilters.fecha_llegada.to
      });
    }
    
    return matches;
  });

  const handleViewDetails = (viaje: Viaje) => {
    setSelectedViaje(viaje);
    setIsDetailsDialogOpen(true);
  };

  const handleEditViaje = (viaje: Viaje) => {
    setEditingViaje(viaje);
    setIsEditDialogOpen(true);
  };

  const handleDeleteViaje = (viaje: Viaje) => {
    setDeleteViaje(viaje);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteViaje = async () => {
    if (!deleteViaje) return;

    try {
      setIsDeleteLoading(true);

      const { error } = await supabase
        .from('viajes')
        .delete()
        .eq('id_viaje', deleteViaje.id_viaje);

      if (error) {
        throw error;
      }

      // Actualizar la lista localmente
      setViajes(prev => prev.filter(v => v.id_viaje !== deleteViaje.id_viaje));

      toast({
        title: "Viaje eliminado",
        description: `El viaje #${deleteViaje.nro_control || deleteViaje.id_viaje} ha sido eliminado permanentemente.`,
      });

      // Cerrar el diálogo
      setIsDeleteDialogOpen(false);
      setDeleteViaje(null);

    } catch (error: any) {
      console.error("Error al eliminar viaje:", error);
      toast({
        title: "Error al eliminar",
        description: error.message || "Ocurrió un error al eliminar el viaje.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleApplyFilters = (filters: ViajeFilter) => {
    setActiveFilters(filters);
    
    // Verificar si hay filtros activos
    const hasFilters = Object.values(filters).some(
      value => Array.isArray(value) ? value.length > 0 : value !== undefined
    );
    
    setHasActiveFilters(hasFilters);
    setIsFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setHasActiveFilters(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    
    // Contar filtros activos
    Object.values(activeFilters).forEach(value => {
      if (Array.isArray(value) && value.length > 0) {
        count += 1;
      } else if (value !== undefined) {
        count += 1;
      }
    });
    
    return count;
  };

  const addViaje = async (newViaje: Omit<Viaje, 'id_viaje' | 'creado_en' | 'actualizado_en'>) => {
    try {
      const { data, error } = await supabase
        .from('viajes')
        .insert([newViaje])
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Agregar el nuevo viaje a la lista
        setViajes(prev => [data[0], ...prev]);
        
        toast({
          title: "Viaje creado",
          description: `Se ha creado el viaje #${data[0].nro_control || data[0].id_viaje} correctamente.`,
        });
      }
    } catch (error: any) {
      console.error("Error al crear viaje:", error);
      toast({
        title: "Error al crear",
        description: error.message || "Ocurrió un error al crear el viaje.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateViaje = async (updatedViaje: Viaje) => {
    try {
      const { error } = await supabase
        .from('viajes')
        .update(updatedViaje)
        .eq('id_viaje', updatedViaje.id_viaje);
      
      if (error) {
        throw error;
      }
      
      // Actualizar el viaje en la lista local
      setViajes(prev => 
        prev.map(viaje => 
          viaje.id_viaje === updatedViaje.id_viaje ? updatedViaje : viaje
        )
      );
      
      toast({
        title: "Viaje actualizado",
        description: `Se ha actualizado el viaje #${updatedViaje.nro_control || updatedViaje.id_viaje} correctamente.`,
      });
    } catch (error: any) {
      console.error("Error al actualizar viaje:", error);
      toast({
        title: "Error al actualizar",
        description: error.message || "Ocurrió un error al actualizar el viaje.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getEstadoClassName = (estado: string) => {
    switch (estado) {
      case 'planificado': return 'bg-blue-500';
      case 'en_ruta': return 'bg-green-500';
      case 'incidente': return 'bg-amber-500';
      case 'realizado': return 'bg-green-700';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPrioridadClassName = (prioridad: string) => {
    switch (prioridad) {
      case 'baja': return 'bg-blue-500';
      case 'media': return 'bg-green-500';
      case 'alta': return 'bg-amber-500';
      case 'urgente': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Función para formatear fechas
  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
  };

  // Función para registrar un nuevo incidente
  const handleRegisterIncidente = (viaje: Viaje) => {
    setSelectedViaje(viaje);
    setIsNewIncidenteDialogOpen(true);
  };

  // Función para resolver un incidente
  const handleResolveIncidente = (viaje: Viaje, incidente: any) => {
    setSelectedViaje(viaje);
    setSelectedIncidente(incidente);
    setIsResolveIncidenteDialogOpen(true);
  };

  // Función ejecutada cuando un incidente es creado o resuelto para actualizar los datos
  const handleIncidenteAction = async () => {
    try {
      console.log('Actualizando datos después de acción de incidente');
      
      // Forzar una recarga completa de los datos
      await fetchData();
      
      // Si hay un viaje seleccionado, actualizar sus detalles
      if (selectedViaje) {
        console.log('Actualizando detalles del viaje:', selectedViaje.id_viaje);
        
        const { data: updatedViaje, error: viajeError } = await supabase
          .from('viajes')
          .select('*')
          .eq('id_viaje', selectedViaje.id_viaje)
          .single();
          
        if (viajeError) {
          console.error('Error al actualizar viaje:', viajeError);
          return;
        }
        
        if (updatedViaje) {
          console.log('Viaje actualizado:', updatedViaje);
          setSelectedViaje(updatedViaje);
          
          // Recargar los incidentes del viaje
          const { data: incidentesData, error: incidentesError } = await supabase
            .from('incidentes_viaje')
            .select('*')
            .eq('id_viaje', selectedViaje.id_viaje)
            .order('fecha_inicio', { ascending: false });
            
          if (incidentesError) {
            console.error('Error al cargar incidentes:', incidentesError);
            return;
          }
          
          console.log('Incidentes actualizados:', incidentesData);
        }
      }
    } catch (error) {
      console.error('Error al actualizar datos después de acción de incidente:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Viajes</h1>
        <Button 
          onClick={() => setIsNewViajeDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Nuevo Viaje
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar viajes..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 relative"
            onClick={() => setIsFilterDialogOpen(true)}
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {getActiveFiltersCount()}
              </span>
            )}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              className="gap-1"
              onClick={handleClearFilters}
            >
              <FilterX className="h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
          
          <Tabs 
            defaultValue="table" 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as 'table' | 'card' | 'calendar')}
            className="w-fit"
          >
            <TabsList>
              <TabsTrigger value="table" className="flex items-center gap-1">
                <TableIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Tabla</span>
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-1">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Tarjetas</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Calendario</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Mostrar filtros activos como badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.tipo_viaje && activeFilters.tipo_viaje.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              Tipo: {activeFilters.tipo_viaje.join(', ')}
            </Badge>
          )}
          {activeFilters.estado && activeFilters.estado.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              Estado: {activeFilters.estado.map(e => e.replace('_', ' ')).join(', ')}
            </Badge>
          )}
          {activeFilters.prioridad && activeFilters.prioridad.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              Prioridad: {activeFilters.prioridad.join(', ')}
            </Badge>
          )}
          {activeFilters.fecha_salida && activeFilters.fecha_salida.from && activeFilters.fecha_salida.to && (
            <Badge variant="outline" className="flex items-center gap-1">
              Salida: {format(activeFilters.fecha_salida.from, "dd/MM/yy", { locale: es })} - {format(activeFilters.fecha_salida.to, "dd/MM/yy", { locale: es })}
            </Badge>
          )}
          {activeFilters.fecha_llegada && activeFilters.fecha_llegada.from && activeFilters.fecha_llegada.to && (
            <Badge variant="outline" className="flex items-center gap-1">
              Llegada: {format(activeFilters.fecha_llegada.from, "dd/MM/yy", { locale: es })} - {format(activeFilters.fecha_llegada.to, "dd/MM/yy", { locale: es })}
            </Badge>
          )}
        </div>
      )}
      
      {isLoading ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <ViajeCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Cargando viajes...</p>
          </div>
        )
      ) : filteredViajes.length === 0 ? (
        // Mensaje cuando no hay resultados
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No se encontraron viajes</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || hasActiveFilters
              ? "Prueba con otros términos de búsqueda o filtros diferentes."
              : "Crea un nuevo viaje para comenzar."}
          </p>
          {!(searchQuery || hasActiveFilters) && (
            <Button 
              className="mt-4"
              onClick={() => setIsNewViajeDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Viaje
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Vista de Tabla */}
          {viewMode === 'table' && (
            <ViajeTable 
              viajes={filteredViajes}
              localidades={localidades}
              clientes={clientes}
              conductores={conductores}
              vehiculos={vehiculos}
              semirremolques={semirremolques}
              onViewDetails={handleViewDetails}
              onEditViaje={handleEditViaje}
              onDeleteViaje={handleDeleteViaje}
            />
          )}
          
          {/* Vista de Tarjetas */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredViajes.map((viaje) => (
                <Card key={viaje.id_viaje} className="h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-1 text-base">
                          {viaje.tipo_viaje === 'ida' ? "➡️" : "⬅️"} 
                          Viaje #{viaje.nro_control || viaje.id_viaje}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(viaje.fecha_salida_programada), "d MMM yyyy", { locale: es })}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge className={`${getEstadoClassName(viaje.estado)}`}>
                          {viaje.estado.replace('_', ' ')}
                        </Badge>
                        <Badge className={`${getPrioridadClassName(viaje.prioridad)}`}>
                          {viaje.prioridad}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2 flex-grow">
                    <div className="grid gap-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium">Origen:</p>
                          <p className="text-sm">
                            {localidades[viaje.id_origen]
                              ? `${localidades[viaje.id_origen].nombre}, ${localidades[viaje.id_origen].pais}`
                              : "No especificado"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium">Destino:</p>
                          <p className="text-sm">
                            {localidades[viaje.id_destino]
                              ? `${localidades[viaje.id_destino].nombre}, ${localidades[viaje.id_destino].pais}`
                              : "No especificado"}
                          </p>
                        </div>
                      </div>
                      
                      {viaje.id_cliente && clientes[viaje.id_cliente] && (
                        <div className="flex items-start gap-2">
                          <Building className="h-4 w-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium">Cliente:</p>
                            <p className="text-sm truncate">
                              {clientes[viaje.id_cliente].razon_social}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {viaje.contenedor && (
                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium">Contenedor:</p>
                            <p className="text-sm">{viaje.contenedor}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-2 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(viaje)}
                    >
                      Ver detalles
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditViaje(viaje)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteViaje(viaje)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Vista de Calendario */}
          {viewMode === 'calendar' && (
            <ViajeCalendar 
              viajes={filteredViajes}
              localidades={localidades}
              clientes={clientes}
              onViewDetails={handleViewDetails}
            />
          )}
        </>
      )}
      
      {/* Diálogos */}
      <NewViajeDialog
        open={isNewViajeDialogOpen}
        onOpenChange={setIsNewViajeDialogOpen}
        onSave={addViaje}
      />
      
      <EditViajeDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        viaje={editingViaje}
        onSave={updateViaje}
      />
      
      <ViajeDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        viaje={selectedViaje}
        localidades={localidades}
        clientes={clientes}
        conductores={conductores}
        vehiculos={vehiculos}
        semirremolques={semirremolques}
        onRegisterIncidente={handleRegisterIncidente}
        onResolveIncidente={handleResolveIncidente}
      />
      
      <ViajeFilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        onApplyFilters={handleApplyFilters}
        activeFilters={activeFilters}
      />
      
      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Eliminar Viaje"
        description={`¿Estás seguro de que deseas eliminar el viaje ${deleteViaje?.nro_control || deleteViaje?.id_viaje}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleteLoading}
        onConfirm={confirmDeleteViaje}
      />
      
      {/* Dialogo para registrar incidente */}
      {selectedViaje && (
        <NewIncidenteDialog
          open={isNewIncidenteDialogOpen}
          onOpenChange={setIsNewIncidenteDialogOpen}
          viajeId={selectedViaje.id_viaje}
          onIncidenteCreated={handleIncidenteAction}
        />
      )}
      
      {/* Dialogo para resolver incidente */}
      {selectedViaje && selectedIncidente && (
        <ResolveIncidenteDialog
          open={isResolveIncidenteDialogOpen}
          onOpenChange={setIsResolveIncidenteDialogOpen}
          incidente={selectedIncidente}
          viajeId={selectedViaje.id_viaje}
          onIncidenteResolved={handleIncidenteAction}
        />
      )}
    </div>
  );
} 