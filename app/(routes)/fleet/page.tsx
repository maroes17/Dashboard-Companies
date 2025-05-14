"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, PlusCircle, FilterX, MoreHorizontal, Trash2, UserCircle2, Link, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Fleet, Driver, Semirremolque, supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { FleetFilterDialog } from "./components/FleetFilterDialog";
import { ConfirmActionDialog } from "./components/ConfirmActionDialog";
import { VehicleDetailsDialog } from "./components/VehicleDetailsDialog";
import { NewVehicleDialog } from "./components/NewVehicleDialog/NewVehicleDialog";
import { EditVehicleDialog } from "./components/EditVehicleDialog/EditVehicleDialog";
import { AssignDriverDialog } from "./components/AssignDriverDialog/AssignDriverDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Definir la interfaz FleetFilter localmente
interface FleetFilter {
  estado?: string[];
  tipo?: string[];
  categoria?: string[];
  vencimiento_prox_revision?: boolean;
  vencimiento_vencida_revision?: boolean;
  vencimiento_prox_permiso?: boolean;
  vencimiento_vencido_permiso?: boolean;
  vencimiento_prox_seguro?: boolean;
  vencimiento_vencido_seguro?: boolean;
  fecha_ingreso_desde?: string;
  fecha_ingreso_hasta?: string;
  km_superior?: number;
  km_inferior?: number;
}

export default function FleetPage() {
  const { toast } = useToast();
  const [fleet, setFleet] = useState<Fleet[]>([]);
  const [drivers, setDrivers] = useState<{[key: number]: Driver}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewVehicleDialogOpen, setIsNewVehicleDialogOpen] = useState(false);
  
  // Estado para manejo de detalles
  const [selectedVehicle, setSelectedVehicle] = useState<Fleet | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Estado para manejo de edición
  const [editingVehicle, setEditingVehicle] = useState<Fleet | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estado para manejo de filtros
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FleetFilter>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Estado para manejo de cambio de estado
  const [statusVehicle, setStatusVehicle] = useState<Fleet | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isStatusChangeLoading, setIsStatusChangeLoading] = useState(false);
  
  // Estado para manejo de eliminación
  const [deleteVehicle, setDeleteVehicle] = useState<Fleet | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  
  // Estado para manejo de mantenimiento
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<Fleet | null>(null);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);

  // Estado para manejo de asignación de chofer
  const [assignVehicle, setAssignVehicle] = useState<Fleet | null>(null);
  const [isAssignDriverDialogOpen, setIsAssignDriverDialogOpen] = useState(false);

  // Estado para semirremolques
  const [semirremolques, setSemirremolques] = useState<{[key: number]: Semirremolque}>({});

  // Cargar datos desde Supabase
  useEffect(() => {
    fetchFleet();
  }, []);

  const fetchFleet = async () => {
    try {
      setIsLoading(true);
      console.log('Iniciando carga de flota desde Supabase...');
      
      // Cargar datos de vehículos
      const { data, error } = await supabase
        .from('flota')
        .select('*');
      
      console.log('Respuesta de Supabase para flota:', { data, error });
      
      if (error) {
        console.error('Error al cargar flota:', error);
        toast({
          title: "Error al cargar datos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No se encontraron vehículos en la respuesta');
        setFleet([]);
        return;
      }
      
      // Convertir los datos al formato Fleet
      const formattedData: Fleet[] = data.map(item => ({
        id_flota: item.id_flota,
        tipo: item.tipo,
        categoria: item.categoria,
        subcategoria: item.subcategoria,
        patente: item.patente,
        nro_chasis: item.nro_chasis,
        marca: item.marca,
        modelo: item.modelo,
        anio: item.anio,
        capacidad: item.capacidad,
        estado: item.estado as "activo" | "inactivo" | "mantenimiento" | "en_reparacion" | "dado_de_baja",
        fecha_ingreso: item.fecha_ingreso,
        id_chofer_asignado: item.id_chofer_asignado,
        km_actual: item.km_actual,
        km_ultimo_servicio: item.km_ultimo_servicio,
        km_proximo_servicio: item.km_proximo_servicio,
        fecha_ultima_mantencion: item.fecha_ultima_mantencion,
        fecha_proximo_mantenimiento: item.fecha_proximo_mantenimiento,
        vencimiento_revision_tecnica: item.vencimiento_revision_tecnica,
        vencimiento_permiso_circulacion: item.vencimiento_permiso_circulacion,
        vencimiento_seguro: item.vencimiento_seguro,
        consumo_promedio: item.consumo_promedio,
        origen: item.origen,
        observaciones: item.observaciones,
        creado_en: item.creado_en,
        actualizado_en: item.actualizado_en
      }));
      
      setFleet(formattedData);
      
      // Obtener los IDs de choferes asignados
      const driverIds = formattedData
        .filter(vehicle => vehicle.id_chofer_asignado)
        .map(vehicle => vehicle.id_chofer_asignado as number);
      
      // Si hay choferes asignados, cargar sus datos
      if (driverIds.length > 0) {
        const { data: driversData, error: driversError } = await supabase
          .from('choferes')
          .select('*')
          .in('id_chofer', driverIds);
        
        if (driversError) {
          console.error('Error al cargar datos de choferes:', driversError);
        } else if (driversData) {
          // Convertir a un objeto para acceso rápido por ID
          const driversMap: {[key: number]: Driver} = {};
          driversData.forEach(driver => {
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
          setDrivers(driversMap);
        }
      }
      
      // Cargar semirremolques asignados a estos vehículos
      const vehicleIds = formattedData.map(vehicle => vehicle.id_flota);
      const { data: semitrailersData, error: semitrailersError } = await supabase
        .from('semirremolques')
        .select('*')
        .filter('asignado_a_flota_id', 'in', `(${vehicleIds.join(',')})`);
      
      if (semitrailersError) {
        console.error('Error al cargar semirremolques:', semitrailersError);
      } else if (semitrailersData && semitrailersData.length > 0) {
        // Crear un mapa de semirremolques para acceso rápido por ID de vehículo
        const semitrailersMap: {[key: number]: Semirremolque} = {};
        semitrailersData.forEach(semirremolque => {
          if (semirremolque.asignado_a_flota_id) {
            semitrailersMap[semirremolque.asignado_a_flota_id] = {
              id_semirremolque: semirremolque.id_semirremolque,
              patente: semirremolque.patente,
              nro_genset: semirremolque.nro_genset,
              tipo: semirremolque.tipo,
              marca: semirremolque.marca,
              modelo: semirremolque.modelo,
              anio: semirremolque.anio,
              estado: semirremolque.estado,
              fecha_ingreso: semirremolque.fecha_ingreso,
              fecha_ultima_revision: semirremolque.fecha_ultima_revision,
              vencimiento_revision_tecnica: semirremolque.vencimiento_revision_tecnica,
              observaciones: semirremolque.observaciones,
              asignado_a_flota_id: semirremolque.asignado_a_flota_id,
              creado_en: semirremolque.creado_en
            };
          }
        });
        setSemirremolques(semitrailersMap);
      }
      
      console.log('Datos formateados:', formattedData);
    } catch (error) {
      console.error('Error inesperado:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los datos de flota",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para verificar si un documento está próximo a vencer (menos de 30 días)
  const isDocumentSoonToExpire = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  // Función para verificar si un documento está vencido
  const isDocumentExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  // Filtrado combinado (búsqueda + filtros)
  const filteredFleet = fleet.filter(vehicle => {
    // Primero aplicar búsqueda de texto
    const matchesSearch = searchQuery.trim() === "" || 
      vehicle.patente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.marca.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.modelo.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Luego aplicar filtros adicionales
    let matches = true;
    
    // Filtrar por estado
    if (activeFilters.estado && activeFilters.estado.length > 0) {
      matches = matches && Boolean(vehicle.estado && activeFilters.estado.includes(vehicle.estado));
    }
    
    // Filtrar por tipo
    if (activeFilters.tipo && activeFilters.tipo.length > 0) {
      matches = matches && Boolean(vehicle.tipo && activeFilters.tipo.includes(vehicle.tipo));
    }
    
    // Filtrar por categoría
    if (activeFilters.categoria && activeFilters.categoria.length > 0) {
      matches = matches && Boolean(vehicle.categoria && activeFilters.categoria.includes(vehicle.categoria));
    }
    
    // Filtrar por vencimiento próximo de revisión técnica
    if (activeFilters.vencimiento_prox_revision) {
      matches = matches && isDocumentSoonToExpire(vehicle.vencimiento_revision_tecnica);
    }
    
    // Filtrar por vencimiento de revisión técnica
    if (activeFilters.vencimiento_vencida_revision) {
      matches = matches && isDocumentExpired(vehicle.vencimiento_revision_tecnica);
    }
    
    // Filtrar por vencimiento próximo de permiso de circulación
    if (activeFilters.vencimiento_prox_permiso) {
      matches = matches && isDocumentSoonToExpire(vehicle.vencimiento_permiso_circulacion);
    }
    
    // Filtrar por vencimiento de permiso de circulación
    if (activeFilters.vencimiento_vencido_permiso) {
      matches = matches && isDocumentExpired(vehicle.vencimiento_permiso_circulacion);
    }
    
    // Filtrar por vencimiento próximo de seguro
    if (activeFilters.vencimiento_prox_seguro) {
      matches = matches && isDocumentSoonToExpire(vehicle.vencimiento_seguro);
    }
    
    // Filtrar por vencimiento de seguro
    if (activeFilters.vencimiento_vencido_seguro) {
      matches = matches && isDocumentExpired(vehicle.vencimiento_seguro);
    }
    
    // Filtrar por fecha de ingreso
    if (activeFilters.fecha_ingreso_desde && vehicle.fecha_ingreso) {
      const fechaIngreso = new Date(vehicle.fecha_ingreso);
      const fechaDesde = new Date(activeFilters.fecha_ingreso_desde);
      matches = matches && fechaIngreso >= fechaDesde;
    }
    
    if (activeFilters.fecha_ingreso_hasta && vehicle.fecha_ingreso) {
      const fechaIngreso = new Date(vehicle.fecha_ingreso);
      const fechaHasta = new Date(activeFilters.fecha_ingreso_hasta);
      matches = matches && fechaIngreso <= fechaHasta;
    }
    
    // Filtrar por kilometraje
    if (activeFilters.km_superior !== undefined && vehicle.km_actual !== undefined) {
      matches = matches && vehicle.km_actual >= activeFilters.km_superior;
    }
    
    if (activeFilters.km_inferior !== undefined && vehicle.km_actual !== undefined) {
      matches = matches && vehicle.km_actual <= activeFilters.km_inferior;
    }
    
    return matches;
  });

  const handleApplyFilters = (filters: FleetFilter) => {
    setActiveFilters(filters);
    setHasActiveFilters(
      Boolean(
        (filters.estado && filters.estado.length > 0) ||
        (filters.tipo && filters.tipo.length > 0) ||
        (filters.categoria && filters.categoria.length > 0) ||
        filters.vencimiento_prox_revision ||
        filters.vencimiento_vencida_revision ||
        filters.vencimiento_prox_permiso ||
        filters.vencimiento_vencido_permiso ||
        filters.vencimiento_prox_seguro ||
        filters.vencimiento_vencido_seguro ||
        filters.fecha_ingreso_desde ||
        filters.fecha_ingreso_hasta ||
        filters.km_superior !== undefined ||
        filters.km_inferior !== undefined
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
    if (activeFilters.tipo && activeFilters.tipo.length > 0) count++;
    if (activeFilters.categoria && activeFilters.categoria.length > 0) count++;
    if (activeFilters.vencimiento_prox_revision) count++;
    if (activeFilters.vencimiento_vencida_revision) count++;
    if (activeFilters.vencimiento_prox_permiso) count++;
    if (activeFilters.vencimiento_vencido_permiso) count++;
    if (activeFilters.vencimiento_prox_seguro) count++;
    if (activeFilters.vencimiento_vencido_seguro) count++;
    if (activeFilters.fecha_ingreso_desde) count++;
    if (activeFilters.fecha_ingreso_hasta) count++;
    if (activeFilters.km_superior !== undefined) count++;
    if (activeFilters.km_inferior !== undefined) count++;
    
    return count;
  };

  const handleViewDetails = (vehicle: Fleet) => {
    setSelectedVehicle(vehicle);
    setIsDetailsDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Fleet) => {
    setEditingVehicle(vehicle);
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = (vehicle: Fleet) => {
    setStatusVehicle(vehicle);
    setSelectedStatus(vehicle.estado);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!statusVehicle || !selectedStatus) return;

    try {
      setIsStatusChangeLoading(true);

      // Preparar la fecha actual para el evento
      const now = new Date().toISOString();

      // 1. Actualizar el estado del vehículo en la tabla flota
      const { error: updateError } = await supabase
        .from('flota')
        .update({ 
          estado: selectedStatus,
          actualizado_en: now
        })
        .eq('id_flota', statusVehicle.id_flota);

      if (updateError) {
        throw updateError;
      }

      // 2. Registrar el evento de cambio de estado
      const { error: eventError } = await supabase
        .from('eventos_flota')
        .insert({
          id_flota: statusVehicle.id_flota,
          tipo_evento: 'cambio_estado_manual',
          fecha_inicio: now,
          descripcion: `Cambio manual de estado: ${statusVehicle.estado} → ${selectedStatus}`,
          estado_resultante: selectedStatus,
          resuelto: true
        });

      if (eventError) {
        console.error("Error al registrar evento:", eventError);
        // No lanzar error aquí para no interrumpir el flujo, ya que el estado del vehículo ya se actualizó
      }

      // Actualizar la lista localmente
      setFleet(prev => 
        prev.map(v => 
          v.id_flota === statusVehicle.id_flota 
            ? { ...v, estado: selectedStatus as any } 
            : v
        )
      );

      toast({
        title: "Estado actualizado",
        description: `El vehículo ${statusVehicle.patente} ha sido actualizado a estado "${selectedStatus.replace("_", " ")}".`,
      });

      // Cerrar el diálogo
      setIsStatusDialogOpen(false);
      setStatusVehicle(null);
      setSelectedStatus("");

    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      toast({
        title: "Error al cambiar estado",
        description: error.message || "Ocurrió un error al actualizar el estado del vehículo.",
        variant: "destructive",
      });
    } finally {
      setIsStatusChangeLoading(false);
    }
  };

  const handleDeleteVehicle = (vehicle: Fleet) => {
    setDeleteVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!deleteVehicle) return;

    try {
      setIsDeleteLoading(true);

      // Eliminación en cascada gracias a los constraints ON DELETE CASCADE
      const { error } = await supabase
        .from('flota')
        .delete()
        .eq('id_flota', deleteVehicle.id_flota);

      if (error) {
        throw error;
      }

      // Actualizar la lista localmente
      setFleet(prev => prev.filter(v => v.id_flota !== deleteVehicle.id_flota));

      toast({
        title: "Vehículo eliminado",
        description: `El vehículo ${deleteVehicle.patente} ha sido eliminado permanentemente.`,
      });

      // Cerrar el diálogo
      setIsDeleteDialogOpen(false);
      setDeleteVehicle(null);

    } catch (error: any) {
      console.error("Error al eliminar vehículo:", error);
      toast({
        title: "Error al eliminar",
        description: error.message || "Ocurrió un error al eliminar el vehículo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const addVehicle = async (newVehicle: Fleet) => {
    try {
      // Preparar datos para insertar en Supabase
      const vehicleData = {
        tipo: newVehicle.tipo,
        categoria: newVehicle.categoria,
        subcategoria: newVehicle.subcategoria,
        patente: newVehicle.patente,
        nro_chasis: newVehicle.nro_chasis,
        marca: newVehicle.marca,
        modelo: newVehicle.modelo,
        anio: newVehicle.anio,
        capacidad: newVehicle.capacidad,
        estado: newVehicle.estado,
        fecha_ingreso: newVehicle.fecha_ingreso,
        km_actual: newVehicle.km_actual,
        km_ultimo_servicio: newVehicle.km_ultimo_servicio,
        km_proximo_servicio: newVehicle.km_proximo_servicio,
        fecha_ultima_mantencion: newVehicle.fecha_ultima_mantencion,
        fecha_proximo_mantenimiento: newVehicle.fecha_proximo_mantenimiento,
        vencimiento_revision_tecnica: newVehicle.vencimiento_revision_tecnica,
        vencimiento_permiso_circulacion: newVehicle.vencimiento_permiso_circulacion,
        vencimiento_seguro: newVehicle.vencimiento_seguro,
        consumo_promedio: newVehicle.consumo_promedio,
        origen: newVehicle.origen,
        observaciones: newVehicle.observaciones
      };

      const { data, error } = await supabase
        .from('flota')
        .insert([vehicleData])
        .select();

      if (error) throw error;

      // Añadir el nuevo vehículo al estado local con el ID generado
      if (data && data.length > 0) {
        const insertedVehicle = {
          ...newVehicle,
          id_flota: data[0].id_flota,
          creado_en: data[0].creado_en,
          actualizado_en: data[0].actualizado_en
        };
        setFleet(prev => [...prev, insertedVehicle]);
      }

      setIsNewVehicleDialogOpen(false);

      toast({
        title: "Vehículo agregado",
        description: `El vehículo ${newVehicle.patente} ha sido agregado correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al agregar vehículo:', error);
      toast({
        title: "Error al agregar",
        description: error.message || "No se pudo agregar el vehículo",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleUpdateVehicle = async (updatedVehicle: Fleet) => {
    try {
      // Preparar datos para actualizar en Supabase
      const vehicleData = {
        tipo: updatedVehicle.tipo,
        categoria: updatedVehicle.categoria,
        subcategoria: updatedVehicle.subcategoria,
        patente: updatedVehicle.patente,
        nro_chasis: updatedVehicle.nro_chasis,
        marca: updatedVehicle.marca,
        modelo: updatedVehicle.modelo,
        anio: updatedVehicle.anio,
        capacidad: updatedVehicle.capacidad,
        estado: updatedVehicle.estado,
        fecha_ingreso: updatedVehicle.fecha_ingreso,
        km_actual: updatedVehicle.km_actual,
        km_ultimo_servicio: updatedVehicle.km_ultimo_servicio,
        km_proximo_servicio: updatedVehicle.km_proximo_servicio,
        fecha_ultima_mantencion: updatedVehicle.fecha_ultima_mantencion,
        fecha_proximo_mantenimiento: updatedVehicle.fecha_proximo_mantenimiento,
        vencimiento_revision_tecnica: updatedVehicle.vencimiento_revision_tecnica,
        vencimiento_permiso_circulacion: updatedVehicle.vencimiento_permiso_circulacion,
        vencimiento_seguro: updatedVehicle.vencimiento_seguro,
        consumo_promedio: updatedVehicle.consumo_promedio,
        origen: updatedVehicle.origen,
        observaciones: updatedVehicle.observaciones,
        actualizado_en: new Date().toISOString()
      };

      const { error } = await supabase
        .from('flota')
        .update(vehicleData)
        .eq('id_flota', updatedVehicle.id_flota);

      if (error) throw error;

      // Actualizar el vehículo en el estado local
      setFleet(prev => 
        prev.map(vehicle => 
          vehicle.id_flota === updatedVehicle.id_flota ? updatedVehicle : vehicle
        )
      );

      setIsEditDialogOpen(false);
      setEditingVehicle(null);

      toast({
        title: "Vehículo actualizado",
        description: `El vehículo ${updatedVehicle.patente} ha sido actualizado correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al actualizar vehículo:', error);
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el vehículo",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Función para asignar un chofer a un vehículo
  const handleAssignDriver = (vehicle: Fleet) => {
    setAssignVehicle(vehicle);
    setIsAssignDriverDialogOpen(true);
  };

  // Función para realizar la asignación de chofer
  const assignDriverToVehicle = async (vehicleId: number, driverId: number | null) => {
    try {
      console.log(`Asignando chofer: vehicleId=${vehicleId}, driverId=${driverId}`);
      
      // Preparar la fecha actual para el evento
      const now = new Date().toISOString();

      // Si se está asignando un chofer (driverId no es null), verificar si ya está asignado a otro vehículo
      if (driverId !== null) {
        const { data: assignedVehicles, error: checkError } = await supabase
          .from('flota')
          .select('id_flota, patente, marca, modelo')
          .eq('id_chofer_asignado', driverId)
          .neq('id_flota', vehicleId);
          
        if (checkError) throw checkError;
        
        console.log("Vehículos con este chofer asignado:", assignedVehicles);
        
        if (assignedVehicles && assignedVehicles.length > 0) {
          const vehicleInfo = assignedVehicles[0];
          throw new Error(`El chofer seleccionado ya está asignado al vehículo ${vehicleInfo.patente} (${vehicleInfo.marca} ${vehicleInfo.modelo}). Un chofer solo puede estar asignado a un vehículo a la vez.`);
        }
      }

      // 1. Actualizar la asignación en la tabla flota
      const updateObj = {
        id_chofer_asignado: driverId === null ? null : driverId,
        actualizado_en: now
      };
      
      console.log("Actualizando vehículo con:", updateObj);
      
      const { data: updateData, error: updateError } = await supabase
        .from('flota')
        .update(updateObj)
        .eq('id_flota', vehicleId)
        .select();

      if (updateError) throw updateError;
      
      console.log("Resultado de la actualización:", updateData);

      // 2. Registrar el evento de asignación en eventos_flota
      const descripcion = driverId 
        ? `[ASIGNACIÓN DE CHOFER] Asignación de chofer ID ${driverId} al vehículo` 
        : `[ASIGNACIÓN DE CHOFER] Remoción de chofer asignado al vehículo`;

      const { error: eventError } = await supabase
        .from('eventos_flota')
        .insert({
          id_flota: vehicleId,
          tipo_evento: 'cambio_estado_manual',
          fecha_inicio: now,
          descripcion: descripcion,
          resuelto: true
        });

      if (eventError) {
        console.error("Error al registrar evento:", eventError);
        // No lanzar error para no interrumpir el flujo principal
      }

      // 3. Si se asignó un nuevo chofer, obtener sus datos para mostrarlos
      if (driverId !== null && !drivers[driverId]) {
        const { data: driverData, error: driverError } = await supabase
          .from('choferes')
          .select('*')
          .eq('id_chofer', driverId)
          .single();
          
        if (!driverError && driverData) {
          // Actualizar el state de drivers con el nuevo chofer
          setDrivers(prev => ({
            ...prev,
            [driverId]: {
              id_chofer: driverData.id_chofer,
              nombre_completo: driverData.nombre_completo,
              documento_identidad: driverData.documento_identidad,
              tipo_licencia: driverData.tipo_licencia,
              vencimiento_licencia: driverData.vencimiento_licencia,
              telefono: driverData.telefono,
              email: driverData.email,
              nacionalidad: driverData.nacionalidad,
              direccion: driverData.direccion,
              fecha_nacimiento: driverData.fecha_nacimiento,
              fecha_ingreso: driverData.fecha_ingreso,
              contacto_emergencia: driverData.contacto_emergencia,
              estado: driverData.estado,
              observaciones: driverData.observaciones,
              creado_en: driverData.creado_en,
            }
          }));
        }
      }

      // Actualizar la lista localmente
      setFleet(prev => 
        prev.map(v => {
          if (v.id_flota === vehicleId) {
            return { 
              ...v, 
              id_chofer_asignado: driverId === null ? undefined : driverId 
            };
          }
          return v;
        })
      );

      toast({
        title: driverId ? "Chofer asignado" : "Asignación removida",
        description: driverId 
          ? `Se ha asignado el chofer #${driverId} al vehículo exitosamente.`
          : `Se ha removido la asignación de chofer del vehículo.`,
      });

    } catch (error: any) {
      console.error("Error al asignar chofer:", error);
      toast({
        title: "Error en la asignación",
        description: error.message || "Ocurrió un error al asignar el chofer al vehículo.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Flota</h1>
        <Button 
          className="bg-primary" 
          onClick={() => setIsNewVehicleDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Vehículo
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por patente, marca o modelo..."
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
          <p className="text-lg text-muted-foreground">Cargando flota...</p>
        </div>
      ) : filteredFleet.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <p className="text-lg text-muted-foreground">
            {fleet.length === 0
              ? "No hay vehículos registrados en el sistema."
              : "No se encontraron vehículos con los criterios de búsqueda."}
          </p>
          {fleet.length === 0 && (
            <Button 
              onClick={() => setIsNewVehicleDialogOpen(true)}
              className="bg-primary"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Vehículo
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
                    <th className="h-12 px-4 text-left align-middle font-medium">Marca/Modelo</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Tipo</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Estado</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Chofer</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Semirremolque</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Kilometraje</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Documentos</th>
                    <th className="h-12 px-4 text-center align-middle font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredFleet.map((vehicle) => (
                    <tr 
                      key={vehicle.id_flota} 
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">{vehicle.patente}</td>
                      <td className="p-4 align-middle">
                        <div>
                          <span className="font-medium">{vehicle.marca}</span>
                          <span className="block text-muted-foreground">{vehicle.modelo} {vehicle.anio}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div>
                          <span className="font-medium">{vehicle.tipo}</span>
                          {vehicle.categoria && (
                            <span className="block text-muted-foreground">{vehicle.categoria}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
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
                      </td>
                      <td className="p-4 align-middle">
                        {vehicle.id_chofer_asignado && drivers[vehicle.id_chofer_asignado] ? (
                          <div className="flex items-center gap-2">
                            <UserCircle2 className="h-4 w-4 text-primary" />
                            <div>
                              <span className="font-medium">{drivers[vehicle.id_chofer_asignado].nombre_completo}</span>
                              {drivers[vehicle.id_chofer_asignado].estado && (
                                <Badge variant="outline" className={
                                  drivers[vehicle.id_chofer_asignado].estado === 'activo' 
                                    ? "bg-green-50 text-green-700 ml-2 py-0 h-5" 
                                    : drivers[vehicle.id_chofer_asignado].estado === 'inactivo' 
                                      ? "bg-gray-50 text-gray-700 ml-2 py-0 h-5"
                                      : "bg-red-50 text-red-700 ml-2 py-0 h-5"
                                }>
                                  {drivers[vehicle.id_chofer_asignado].estado}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : vehicle.id_chofer_asignado ? (
                          <span className="text-muted-foreground">Chofer #{vehicle.id_chofer_asignado}</span>
                        ) : (
                          <span className="text-muted-foreground">Sin asignar</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {semirremolques[vehicle.id_flota] ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-primary" />
                              <span className="font-medium">{semirremolques[vehicle.id_flota].patente}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {semirremolques[vehicle.id_flota].marca} {semirremolques[vehicle.id_flota].modelo}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No asignado</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {vehicle.km_actual?.toLocaleString()} km
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col gap-1">
                          {isDocumentExpired(vehicle.vencimiento_revision_tecnica) && (
                            <Badge variant="state" className="text-xs w-fit bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent">Rev. técnica vencida</Badge>
                          )}
                          {isDocumentSoonToExpire(vehicle.vencimiento_revision_tecnica) && (
                            <Badge variant="state" className="text-xs w-fit bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500 border-orange-300">Rev. técnica próxima</Badge>
                          )}
                          
                          {isDocumentExpired(vehicle.vencimiento_permiso_circulacion) && (
                            <Badge variant="state" className="text-xs w-fit bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent">Permiso vencido</Badge>
                          )}
                          {isDocumentSoonToExpire(vehicle.vencimiento_permiso_circulacion) && (
                            <Badge variant="state" className="text-xs w-fit bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500 border-orange-300">Permiso próximo</Badge>
                          )}
                          
                          {isDocumentExpired(vehicle.vencimiento_seguro) && (
                            <Badge variant="state" className="text-xs w-fit bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent">Seguro vencido</Badge>
                          )}
                          {isDocumentSoonToExpire(vehicle.vencimiento_seguro) && (
                            <Badge variant="state" className="text-xs w-fit bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500 border-orange-300">Seguro próximo</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(vehicle)}>
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditVehicle(vehicle)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAssignDriver(vehicle)}>
                              Asignar chofer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(vehicle)}>
                              Cambiar estado
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => handleDeleteVehicle(vehicle)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Componentes de diálogo */}
      <FleetFilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Diálogo para agregar nuevo vehículo */}
      <NewVehicleDialog
        open={isNewVehicleDialogOpen}
        onOpenChange={setIsNewVehicleDialogOpen}
        onSave={addVehicle}
      />

      {/* Diálogo de detalles del vehículo */}
      <VehicleDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        vehicle={selectedVehicle}
        onAssignDriver={handleAssignDriver}
      />

      {/* Diálogo de cambio de estado */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Vehículo</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo estado para el vehículo {statusVehicle?.patente}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="estado" className="text-sm font-medium">
                Estado
              </label>
              <Select 
                value={selectedStatus} 
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="en_reparacion">En Reparación</SelectItem>
                  <SelectItem value="dado_de_baja">Dado de Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isStatusChangeLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmStatusChange}
              disabled={isStatusChangeLoading || !selectedStatus}
            >
              {isStatusChangeLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Eliminar Vehículo"
        description={`¿Estás seguro de que deseas eliminar el vehículo ${deleteVehicle?.patente}? Esta acción eliminará también todos los eventos y mantenimientos asociados al vehículo.`}
        actionText="Eliminar"
        actionVariant="destructive"
        onConfirm={confirmDeleteVehicle}
        isLoading={isDeleteLoading}
      />

      {/* Diálogo de edición del vehículo */}
      <EditVehicleDialog
        vehicle={editingVehicle}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateVehicle}
      />

      {/* Diálogo de asignación de chofer */}
      <AssignDriverDialog
        vehicle={assignVehicle}
        open={isAssignDriverDialogOpen}
        onOpenChange={setIsAssignDriverDialogOpen}
        onAssign={assignDriverToVehicle}
      />
    </div>
  );
} 