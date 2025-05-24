"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, PlusCircle, FilterX, Calendar as CalendarIcon, LayoutGrid, Table as TableIcon, MapPin, Building, Package, Plus, Calendar, Clock, MoreHorizontal, Trash2, User, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trip, TripStatus } from "@/lib/types/trips";
import { CreateTripDialog } from "./components/CreateTripDialog";
import { EditTripDialog } from "./components/EditTripDialog";
import { TripDetailsDialog } from "./components/TripDetailsDialog";
import { useToast } from "@/components/ui/use-toast";
import { Viaje, Localidad, Cliente, Driver, Fleet, Semirremolque, supabase } from "@/lib/supabase";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteTripDialog } from "./components/DeleteTripDialog";

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

interface FilterState {
  status: TripStatus | 'todos';
  type: 'ida' | 'vuelta' | 'todos';
  dateRange: {
    start: string;
    end: string;
  };
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
  const [selectedViaje, setSelectedViaje] = useState<Trip | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingViaje, setEditingViaje] = useState<Viaje | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ViajeFilter>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'calendar'>('table');
  const [isNewIncidenteDialogOpen, setIsNewIncidenteDialogOpen] = useState(false);
  const [isResolveIncidenteDialogOpen, setIsResolveIncidenteDialogOpen] = useState(false);
  const [selectedIncidente, setSelectedIncidente] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    status: "todos",
    type: "todos",
    dateRange: {
      start: "",
      end: "",
    },
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Cargar datos desde Supabase
  useEffect(() => {
    fetchData();
    fetchTrips();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

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

  const fetchTrips = async () => {
    try {
      const { data: viajesData, error } = await supabase
        .from('viajes')
        .select('*')
        .order('fecha_salida_programada', { ascending: false });

      if (error) {
        throw error;
      }

      // Convertir Viaje a Trip
      const tripsData = viajesData.map((viaje: Viaje): Trip => {
        // Convertir estado de Viaje a TripStatus
        let estado: TripStatus;
        switch (viaje.estado) {
          case 'pendiente':
            estado = 'pendiente';
            break;
          case 'en_ruta':
            estado = 'en_ruta';
            break;
          case 'completado':
            estado = 'completado';
            break;
          case 'incidente':
            estado = 'incidente';
            break;
          case 'cancelado':
            estado = 'cancelado';
            break;
          default:
            estado = 'pendiente';
        }

        return {
          id_viaje: viaje.id_viaje,
          fecha_salida: viaje.fecha_salida_programada,
          fecha_llegada: viaje.fecha_llegada_programada,
          tipo: viaje.tipo_viaje as 'ida' | 'vuelta',
          id_cliente: viaje.id_cliente || 0,
          origen: viaje.id_origen.toString(),
          destino: viaje.id_destino.toString(),
          empresa: viaje.empresa || '',
          conductor_id: viaje.id_chofer || 0,
          vehiculo_id: viaje.id_flota || 0,
          semirremolque_id: viaje.id_semirremolque || 0,
          contenedor: viaje.contenedor || '',
          nro_guia: viaje.nro_guia || '',
          factura: viaje.factura || '',
          estado,
          nro_control: viaje.nro_control || 0,
          creado_en: viaje.creado_en,
          prioridad: viaje.prioridad || 'media'
        };
      });

      setTrips(tripsData);
    } catch (error: any) {
      console.error('Error al cargar viajes:', error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al cargar los viajes.",
        variant: "destructive",
      });
    }
  };

  // Función para convertir Trip a Viaje
  const convertTripToViaje = (trip: Trip): Viaje => {
    let estado: TripStatus;
    switch (trip.estado) {
      case 'pendiente':
        estado = 'pendiente';
        break;
      case 'en_ruta':
        estado = 'en_ruta';
        break;
      case 'completado':
        estado = 'completado';
        break;
      case 'incidente':
        estado = 'incidente';
        break;
      case 'cancelado':
        estado = 'cancelado';
        break;
      default:
        estado = 'pendiente';
    }

    return {
      id_viaje: trip.id_viaje,
      tipo_viaje: trip.tipo,
      estado: estado,
      fecha_salida_programada: trip.fecha_salida,
      fecha_llegada_programada: trip.fecha_llegada,
      id_origen: parseInt(trip.origen),
      id_destino: parseInt(trip.destino),
      id_cliente: trip.id_cliente || undefined,
      id_chofer: trip.conductor_id || undefined,
      id_flota: trip.vehiculo_id || undefined,
      id_semirremolque: trip.semirremolque_id || undefined,
      contenedor: trip.contenedor || undefined,
      nro_guia: trip.nro_guia || undefined,
      empresa: trip.empresa || undefined,
      factura: trip.factura || undefined,
      prioridad: trip.prioridad || 'media',
      nro_control: trip.nro_control || undefined,
      creado_en: trip.creado_en,
      actualizado_en: new Date().toISOString(),
      notas: undefined
    };
  };

  // Función para convertir Viaje a Trip
  const convertViajeToTrip = (viaje: Viaje): Trip => {
    let estado: TripStatus;
    switch (viaje.estado) {
      case 'pendiente':
        estado = 'pendiente';
        break;
      case 'en_ruta':
        estado = 'en_ruta';
        break;
      case 'completado':
        estado = 'completado';
        break;
      case 'incidente':
        estado = 'incidente';
        break;
      case 'cancelado':
        estado = 'cancelado';
        break;
      default:
        estado = 'pendiente';
    }

    return {
      id_viaje: viaje.id_viaje,
      fecha_salida: viaje.fecha_salida_programada,
      fecha_llegada: viaje.fecha_llegada_programada,
      tipo: viaje.tipo_viaje as 'ida' | 'vuelta',
      id_cliente: viaje.id_cliente || 0,
      origen: viaje.id_origen.toString(),
      destino: viaje.id_destino.toString(),
      empresa: viaje.empresa || '',
      conductor_id: viaje.id_chofer || 0,
      vehiculo_id: viaje.id_flota || 0,
      semirremolque_id: viaje.id_semirremolque || 0,
      contenedor: viaje.contenedor || '',
      nro_guia: viaje.nro_guia || '',
      factura: viaje.factura || '',
      estado,
      nro_control: viaje.nro_control || 0,
      creado_en: viaje.creado_en,
      prioridad: viaje.prioridad || 'media'
    };
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
    // Convertir estado de Viaje a TripStatus
    let estado: TripStatus;
    switch (viaje.estado) {
      case 'pendiente':
        estado = 'pendiente';
        break;
      case 'en_ruta':
        estado = 'en_ruta';
        break;
      case 'completado':
        estado = 'completado';
        break;
      case 'incidente':
        estado = 'incidente';
        break;
      case 'cancelado':
        estado = 'cancelado';
        break;
      default:
        estado = 'pendiente';
    }

    const trip: Trip = {
      id_viaje: viaje.id_viaje,
      fecha_salida: viaje.fecha_salida_programada,
      fecha_llegada: viaje.fecha_llegada_programada,
      tipo: viaje.tipo_viaje as 'ida' | 'vuelta',
      id_cliente: viaje.id_cliente || 0,
      origen: viaje.id_origen.toString(),
      destino: viaje.id_destino.toString(),
      empresa: viaje.empresa || '',
      conductor_id: viaje.id_chofer || 0,
      vehiculo_id: viaje.id_flota || 0,
      semirremolque_id: viaje.id_semirremolque || 0,
      contenedor: viaje.contenedor || '',
      nro_guia: viaje.nro_guia || '',
      factura: viaje.factura || '',
      estado,
      nro_control: viaje.nro_control || 0,
      creado_en: viaje.creado_en,
      prioridad: viaje.prioridad || 'media'
    };
    setSelectedViaje(trip);
    setIsDetailsDialogOpen(true);
  };

  const handleEditViaje = (viaje: Viaje) => {
    setEditingViaje(viaje);
    setIsEditDialogOpen(true);
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
        title: "Error",
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
        title: "Error",
        description: error.message || "Ocurrió un error al actualizar el viaje.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'en_ruta':
        return 'bg-blue-500';
      case 'incidente':
        return 'bg-red-500';
      case 'completado':
        return 'bg-green-500';
      case 'cancelado':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
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
  const handleRegisterIncidente = async (viaje: Viaje) => {
    try {
      const { error } = await supabase
        .from('viajes')
        .update({ estado: 'incidente' })
        .eq('id_viaje', viaje.id_viaje);

      if (error) throw error;

      // Convertir estado de Viaje a TripStatus
      let estado: TripStatus;
      switch (viaje.estado) {
        case 'pendiente':
          estado = 'en_ruta';
          break;
        case 'en_ruta':
          estado = 'en_ruta';
          break;
        case 'completado':
          estado = 'completado';
          break;
        case 'incidente':
          estado = 'incidente';
          break;
        case 'cancelado':
          estado = 'cancelado';
          break;
        default:
          estado = 'en_ruta';
      }

      const trip: Trip = {
        id_viaje: viaje.id_viaje,
        fecha_salida: viaje.fecha_salida_programada,
        fecha_llegada: viaje.fecha_llegada_programada,
        tipo: viaje.tipo_viaje as 'ida' | 'vuelta',
        id_cliente: viaje.id_cliente || 0,
        origen: viaje.id_origen.toString(),
        destino: viaje.id_destino.toString(),
        empresa: viaje.empresa || '',
        conductor_id: viaje.id_chofer || 0,
        vehiculo_id: viaje.id_flota || 0,
        semirremolque_id: viaje.id_semirremolque || 0,
        contenedor: viaje.contenedor || '',
        nro_guia: viaje.nro_guia || '',
        factura: viaje.factura || '',
        estado,
        nro_control: viaje.nro_control || 0,
        creado_en: viaje.creado_en,
        prioridad: viaje.prioridad || 'media'
      };
      setSelectedViaje(trip);
      setIsNewIncidenteDialogOpen(true);
      await fetchTrips();
    } catch (error: any) {
      console.error('Error al registrar incidente:', error);
      toast({
        title: "Error",
        description: 'Error al registrar incidente',
        variant: "destructive",
      });
    }
  };

  // Función para resolver un incidente
  const handleResolveIncidente = async (viaje: Viaje) => {
    try {
      const { error } = await supabase
        .from('viajes')
        .update({ estado: 'en_ruta' })
        .eq('id_viaje', viaje.id_viaje);

      if (error) throw error;

      // Convertir estado de Viaje a TripStatus
      let estado: TripStatus;
      switch (viaje.estado) {
        case 'pendiente':
          estado = 'en_ruta';
          break;
        case 'en_ruta':
          estado = 'en_ruta';
          break;
        case 'completado':
          estado = 'completado';
          break;
        case 'incidente':
          estado = 'incidente';
          break;
        case 'cancelado':
          estado = 'cancelado';
          break;
        default:
          estado = 'en_ruta';
      }

      const trip: Trip = {
        id_viaje: viaje.id_viaje,
        fecha_salida: viaje.fecha_salida_programada,
        fecha_llegada: viaje.fecha_llegada_programada,
        tipo: viaje.tipo_viaje as 'ida' | 'vuelta',
        id_cliente: viaje.id_cliente || 0,
        origen: viaje.id_origen.toString(),
        destino: viaje.id_destino.toString(),
        empresa: viaje.empresa || '',
        conductor_id: viaje.id_chofer || 0,
        vehiculo_id: viaje.id_flota || 0,
        semirremolque_id: viaje.id_semirremolque || 0,
        contenedor: viaje.contenedor || '',
        nro_guia: viaje.nro_guia || '',
        factura: viaje.factura || '',
        estado,
        nro_control: viaje.nro_control || 0,
        creado_en: viaje.creado_en,
        prioridad: viaje.prioridad || 'media'
      };
      setSelectedViaje(trip);
      setIsResolveIncidenteDialogOpen(true);
      await fetchTrips();
    } catch (error: any) {
      console.error('Error al resolver incidente:', error);
      toast({
        title: "Error",
        description: 'Error al resolver incidente',
        variant: "destructive",
      });
    }
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
          setSelectedViaje(updatedViaje as Trip);
          
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

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDateRangeChange = (key: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value,
      },
    }));
  };

  const filteredTrips = trips.filter(trip => {
    const searchLower = searchQuery.toLowerCase();
    return (
      trip.empresa.toLowerCase().includes(searchLower) ||
      trip.origen.toLowerCase().includes(searchLower) ||
      trip.destino.toLowerCase().includes(searchLower) ||
      trip.contenedor.toLowerCase().includes(searchLower) ||
      trip.nro_guia.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Viajes</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Viaje
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar viajes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="en_ruta">En Ruta</SelectItem>
            <SelectItem value="incidente">Incidente</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.type}
          onValueChange={(value) => handleFilterChange('type', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="ida">Viaje de Ida</SelectItem>
            <SelectItem value="vuelta">Viaje de Vuelta</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
            className="w-[180px]"
          />
          <Input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
            className="w-[180px]"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Viaje</TableHead>
              <TableHead>Tipo de Viaje</TableHead>
              <TableHead>Origen - Destino</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Contenedor</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Cargando viajes...
                </TableCell>
              </TableRow>
            ) : filteredTrips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No se encontraron viajes
                </TableCell>
              </TableRow>
            ) : (
              filteredTrips.map((trip) => (
                <TableRow key={trip.id_viaje}>
                  <TableCell className="font-medium">
                    #{trip.nro_control || trip.id_viaje}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={
                        trip.tipo === "ida" 
                          ? "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950/50" 
                          : "border-purple-500 text-purple-500 bg-purple-50 dark:bg-purple-950/50"
                      }
                    >
                      {trip.tipo === "ida" ? "IDA" : "VUELTA"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-blue-500" />
                        <span>{localidades[parseInt(trip.origen)]?.nombre || "Origen desconocido"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span>{localidades[parseInt(trip.destino)]?.nombre || "Destino desconocido"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span>Salida: {format(new Date(trip.fecha_salida), "dd/MM/yyyy", { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span>Llegada: {format(new Date(trip.fecha_llegada), "dd/MM/yyyy", { locale: es })}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span className="truncate max-w-[150px]" title={clientes[trip.id_cliente]?.razon_social || "Cliente no especificado"}>
                        {clientes[trip.id_cliente]?.razon_social || "Cliente no especificado"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{trip.contenedor?.toUpperCase() || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{trip.conductor_id ? conductores[trip.conductor_id]?.nombre_completo || "No encontrado" : "No asignado"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        <span>{trip.vehiculo_id ? vehiculos[trip.vehiculo_id]?.patente || "No encontrado" : "Sin vehículo"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span>{trip.semirremolque_id ? semirremolques[trip.semirremolque_id]?.patente || "No encontrado" : "Sin semirremolque"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="state"
                      className={
                        trip.estado === "en_ruta" ? "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500 border-transparent" :
                        trip.estado === "incidente" ? "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent" :
                        trip.estado === "completado" ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500 border-transparent" :
                        trip.estado === "cancelado" ? "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500 border-transparent" :
                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500 border-transparent" // planificacion
                      }
                    >
                      {trip.estado.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedViaje(trip);
                          setIsDetailsDialogOpen(true);
                        }}>
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedViaje(trip);
                          setIsEditDialogOpen(true);
                        }}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={() => {
                            setSelectedViaje(trip);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateTripDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          fetchTrips();
        }}
      />

      {selectedViaje && (
        <>
          <EditTripDialog
            trip={convertTripToViaje(selectedViaje)}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              fetchTrips();
            }}
          />
          <TripDetailsDialog
            trip={selectedViaje as Trip}
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
          />
          <DeleteTripDialog
            trip={selectedViaje as Trip}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={() => {
              setIsDeleteDialogOpen(false);
              fetchTrips();
            }}
          />
        </>
      )}
    </div>
  );
} 