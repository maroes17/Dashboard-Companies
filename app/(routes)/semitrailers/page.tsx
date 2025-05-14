"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, PlusCircle, FilterX, MoreHorizontal, Trash2, Link, UserCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Semirremolque, Fleet, Driver, supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SemitrailerFilterDialog } from "./components/SemitrailerFilterDialog";
import { ConfirmActionDialog } from "./components/ConfirmActionDialog";
import { SemitrailerDetailsDialog } from "./components/SemitrailerDetailsDialog";
import { NewSemitrailerDialog } from "./components/NewSemitrailerDialog";
import { EditSemitrailerDialog } from "./components/EditSemitrailerDialog";
import { AssignVehicleDialog } from "./components/AssignVehicleDialog";

// Definir la interfaz SemitrailerFilter
interface SemitrailerFilter {
  estado?: string[];
  tipo?: string[];
  marca?: string[];
  vencimiento_revision?: boolean; // Para filtrar semirremolques con revisión vencida
  tiene_genset?: boolean; // Para filtrar semirremolques con genset
  anio_desde?: number;
  anio_hasta?: number;
  asignado?: boolean; // Para filtrar semirremolques ya asignados a algún vehículo
}

export default function SemitrailersPage() {
  const { toast } = useToast();
  const [semitrailers, setSemitrailers] = useState<Semirremolque[]>([]);
  const [fleet, setFleet] = useState<{[key: number]: Fleet}>({});  // Mapa para acceder rápido a los vehículos por ID
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewSemitrailerDialogOpen, setIsNewSemitrailerDialogOpen] = useState(false);
  
  // Estado para manejo de detalles
  const [selectedSemitrailer, setSelectedSemitrailer] = useState<Semirremolque | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Estado para manejo de edición
  const [editingSemitrailer, setEditingSemitrailer] = useState<Semirremolque | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estado para manejo de filtros
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SemitrailerFilter>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Estado para manejo de eliminación
  const [deleteSemitrailer, setDeleteSemitrailer] = useState<Semirremolque | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  
  // Estado para manejo de asignación a vehículo
  const [assignSemitrailer, setAssignSemitrailer] = useState<Semirremolque | null>(null);
  const [isAssignVehicleDialogOpen, setIsAssignVehicleDialogOpen] = useState(false);
  const [isAssignVehicleLoading, setIsAssignVehicleLoading] = useState(false);
  const [drivers, setDrivers] = useState<{[key: number]: Driver}>({});  // Mapa para acceder rápido a los choferes por ID

  // Cargar datos desde Supabase
  useEffect(() => {
    fetchSemitrailers();
  }, []);

  const fetchSemitrailers = async () => {
    try {
      setIsLoading(true);
      console.log('Iniciando carga de semirremolques desde Supabase...');
      
      // Cargar datos de semirremolques
      const { data, error } = await supabase
        .from('semirremolques')
        .select('*');
      
      console.log('Respuesta de Supabase para semirremolques:', { data, error });
      
      if (error) {
        console.error('Error al cargar semirremolques:', error);
        console.error('Mensaje detallado del error:', JSON.stringify(error));
        toast({
          title: "Error al cargar datos",
          description: error.message || "Error desconocido",
          variant: "destructive",
        });
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No se encontraron semirremolques en la respuesta');
        setSemitrailers([]);
        return;
      }
      
      // Convertir los datos al formato Semirremolque
      const formattedData: Semirremolque[] = data.map(item => ({
        id_semirremolque: item.id_semirremolque,
        patente: item.patente,
        nro_genset: item.nro_genset,
        tipo: item.tipo,
        marca: item.marca,
        modelo: item.modelo,
        anio: item.anio,
        estado: item.estado,
        fecha_ingreso: item.fecha_ingreso,
        fecha_ultima_revision: item.fecha_ultima_revision,
        vencimiento_revision_tecnica: item.vencimiento_revision_tecnica,
        observaciones: item.observaciones,
        asignado_a_flota_id: item.asignado_a_flota_id,
        creado_en: item.creado_en
      }));
      
      setSemitrailers(formattedData);
      
      // Obtener los IDs de los vehículos a los que están asignados los semirremolques
      const fleetIds = formattedData
        .filter(semitrailer => semitrailer.asignado_a_flota_id)
        .map(semitrailer => semitrailer.asignado_a_flota_id as number);
      
      // Si hay semirremolques asignados, cargar los datos de los vehículos
      if (fleetIds.length > 0) {
        const { data: fleetData, error: fleetError } = await supabase
          .from('flota')
          .select('*')
          .in('id_flota', fleetIds);
        
        if (fleetError) {
          console.error('Error al cargar datos de vehículos:', fleetError);
        } else if (fleetData) {
          // Convertir a un objeto para acceso rápido por ID
          const fleetMap: {[key: number]: Fleet} = {};
          fleetData.forEach(vehicle => {
            fleetMap[vehicle.id_flota] = {
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
          setFleet(fleetMap);
          
          // Obtener IDs de choferes de los vehículos con semirremolques asignados
          const driverIds = fleetData
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
              // Crear un mapa de choferes para acceso rápido por ID
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
                  creado_en: driver.creado_en
                };
              });
              
              // Actualizar el state con los choferes
              setDrivers(driversMap);
            }
          }
        }
      }
      
      console.log('Datos formateados:', formattedData);
    } catch (error) {
      console.error('Error inesperado:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los datos de semirremolques",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para verificar si una revisión está vencida
  const isRevisionExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  // Función para verificar si una revisión está próxima a vencer (menos de 30 días)
  const isRevisionSoonToExpire = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  // Filtrado combinado (búsqueda + filtros)
  const filteredSemitrailers = semitrailers.filter(semitrailer => {
    // Primero aplicar búsqueda de texto
    const matchesSearch = searchQuery.trim() === "" || 
      semitrailer.patente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (semitrailer.marca && semitrailer.marca.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (semitrailer.modelo && semitrailer.modelo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (semitrailer.nro_genset && semitrailer.nro_genset.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    // Luego aplicar filtros adicionales
    let matches = true;
    
    // Filtrar por estado
    if (activeFilters.estado && activeFilters.estado.length > 0) {
      matches = matches && Boolean(semitrailer.estado && activeFilters.estado.includes(semitrailer.estado));
    }
    
    // Filtrar por tipo
    if (activeFilters.tipo && activeFilters.tipo.length > 0) {
      matches = matches && Boolean(semitrailer.tipo && activeFilters.tipo.includes(semitrailer.tipo));
    }
    
    // Filtrar por marca
    if (activeFilters.marca && activeFilters.marca.length > 0) {
      matches = matches && Boolean(semitrailer.marca && activeFilters.marca.includes(semitrailer.marca));
    }
    
    // Filtrar por vencimiento de revisión técnica
    if (activeFilters.vencimiento_revision) {
      matches = matches && isRevisionExpired(semitrailer.vencimiento_revision_tecnica);
    }
    
    // Filtrar por presencia de genset
    if (activeFilters.tiene_genset) {
      matches = matches && Boolean(semitrailer.nro_genset && semitrailer.nro_genset.trim() !== "");
    }
    
    // Filtrar por año desde
    if (activeFilters.anio_desde !== undefined && semitrailer.anio !== undefined) {
      matches = matches && semitrailer.anio >= activeFilters.anio_desde;
    }
    
    // Filtrar por año hasta
    if (activeFilters.anio_hasta !== undefined && semitrailer.anio !== undefined) {
      matches = matches && semitrailer.anio <= activeFilters.anio_hasta;
    }
    
    // Filtrar por asignación a vehículo
    if (activeFilters.asignado !== undefined) {
      if (activeFilters.asignado) {
        // Solo mostrar los asignados
        matches = matches && Boolean(semitrailer.asignado_a_flota_id);
      } else {
        // Solo mostrar los no asignados
        matches = matches && !Boolean(semitrailer.asignado_a_flota_id);
      }
    }
    
    return matches;
  });

  const handleViewDetails = (semitrailer: Semirremolque) => {
    setSelectedSemitrailer(semitrailer);
    setIsDetailsDialogOpen(true);
  };

  const handleEditSemitrailer = (semitrailer: Semirremolque) => {
    setEditingSemitrailer(semitrailer);
    setIsEditDialogOpen(true);
  };

  const handleAssignVehicle = (semitrailer: Semirremolque) => {
    setAssignSemitrailer(semitrailer);
    setIsAssignVehicleDialogOpen(true);
  };

  const handleDeleteSemitrailer = (semitrailer: Semirremolque) => {
    setDeleteSemitrailer(semitrailer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteSemitrailer = async () => {
    if (!deleteSemitrailer) return;

    try {
      setIsDeleteLoading(true);

      const { error } = await supabase
        .from('semirremolques')
        .delete()
        .eq('id_semirremolque', deleteSemitrailer.id_semirremolque);

      if (error) {
        throw error;
      }

      // Actualizar la lista localmente
      setSemitrailers(prev => prev.filter(s => s.id_semirremolque !== deleteSemitrailer.id_semirremolque));

      toast({
        title: "Semirremolque eliminado",
        description: `El semirremolque ${deleteSemitrailer.patente} ha sido eliminado permanentemente.`,
      });

      // Cerrar el diálogo
      setIsDeleteDialogOpen(false);
      setDeleteSemitrailer(null);

    } catch (error: any) {
      console.error("Error al eliminar semirremolque:", error);
      toast({
        title: "Error al eliminar",
        description: error.message || "Ocurrió un error al eliminar el semirremolque.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleApplyFilters = (filters: SemitrailerFilter) => {
    setActiveFilters(filters);
    setHasActiveFilters(
      Boolean(
        (filters.estado && filters.estado.length > 0) ||
        (filters.tipo && filters.tipo.length > 0) ||
        (filters.marca && filters.marca.length > 0) ||
        filters.vencimiento_revision ||
        filters.tiene_genset ||
        filters.anio_desde !== undefined ||
        filters.anio_hasta !== undefined ||
        filters.asignado !== undefined
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
    if (activeFilters.marca && activeFilters.marca.length > 0) count++;
    if (activeFilters.vencimiento_revision) count++;
    if (activeFilters.tiene_genset) count++;
    if (activeFilters.anio_desde !== undefined) count++;
    if (activeFilters.anio_hasta !== undefined) count++;
    if (activeFilters.asignado !== undefined) count++;
    
    return count;
  };

  const addSemitrailer = async (newSemitrailer: Semirremolque) => {
    try {
      // Preparar datos para insertar en Supabase
      const semitrailerData = {
        patente: newSemitrailer.patente,
        nro_genset: newSemitrailer.nro_genset,
        tipo: newSemitrailer.tipo,
        marca: newSemitrailer.marca,
        modelo: newSemitrailer.modelo,
        anio: newSemitrailer.anio,
        estado: newSemitrailer.estado,
        fecha_ingreso: newSemitrailer.fecha_ingreso,
        fecha_ultima_revision: newSemitrailer.fecha_ultima_revision,
        vencimiento_revision_tecnica: newSemitrailer.vencimiento_revision_tecnica,
        observaciones: newSemitrailer.observaciones
      };

      const { data, error } = await supabase
        .from('semirremolques')
        .insert([semitrailerData])
        .select();

      if (error) throw error;

      // Añadir el nuevo semirremolque al estado local con el ID generado
      if (data && data.length > 0) {
        const insertedSemitrailer = {
          ...newSemitrailer,
          id_semirremolque: data[0].id_semirremolque,
          creado_en: data[0].creado_en
        };
        setSemitrailers(prev => [...prev, insertedSemitrailer]);
      }

      setIsNewSemitrailerDialogOpen(false);

      toast({
        title: "Semirremolque agregado",
        description: `El semirremolque ${newSemitrailer.patente} ha sido agregado correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al agregar semirremolque:', error);
      toast({
        title: "Error al agregar",
        description: error.message || "No se pudo agregar el semirremolque",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    }
  };

  const handleUpdateSemitrailer = async (updatedSemitrailer: Semirremolque) => {
    try {
      // Preparar datos para actualizar en Supabase
      const semitrailerData = {
        patente: updatedSemitrailer.patente,
        nro_genset: updatedSemitrailer.nro_genset,
        tipo: updatedSemitrailer.tipo,
        marca: updatedSemitrailer.marca,
        modelo: updatedSemitrailer.modelo,
        anio: updatedSemitrailer.anio,
        estado: updatedSemitrailer.estado,
        fecha_ingreso: updatedSemitrailer.fecha_ingreso,
        fecha_ultima_revision: updatedSemitrailer.fecha_ultima_revision,
        vencimiento_revision_tecnica: updatedSemitrailer.vencimiento_revision_tecnica,
        observaciones: updatedSemitrailer.observaciones
      };

      const { error } = await supabase
        .from('semirremolques')
        .update(semitrailerData)
        .eq('id_semirremolque', updatedSemitrailer.id_semirremolque);

      if (error) throw error;

      // Actualizar el semirremolque en el estado local
      setSemitrailers(prev => 
        prev.map(s => 
          s.id_semirremolque === updatedSemitrailer.id_semirremolque ? updatedSemitrailer : s
        )
      );

      setIsEditDialogOpen(false);
      setEditingSemitrailer(null);

      toast({
        title: "Semirremolque actualizado",
        description: `El semirremolque ${updatedSemitrailer.patente} ha sido actualizado correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al actualizar semirremolque:', error);
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el semirremolque",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    }
  };

  const assignVehicleToSemitrailer = async (semitrailerId: number, fleetId: number | null) => {
    try {
      setIsAssignVehicleLoading(true);
      
      // Actualizar la asignación en la base de datos
      const { error } = await supabase
        .from('semirremolques')
        .update({ asignado_a_flota_id: fleetId })
        .eq('id_semirremolque', semitrailerId);
      
      if (error) throw error;
      
      // Actualizar el estado local
      setSemitrailers(prev => 
        prev.map(s => 
          s.id_semirremolque === semitrailerId 
            ? { ...s, asignado_a_flota_id: fleetId as number | undefined } 
            : s
        )
      );
      
      toast({
        title: "Asignación actualizada",
        description: fleetId 
          ? `El semirremolque ha sido asignado al vehículo #${fleetId}.`
          : "Se ha removido la asignación del semirremolque.",
        duration: 3000,
      });
      
    } catch (error: any) {
      console.error('Error al asignar vehículo:', error);
      toast({
        title: "Error al asignar",
        description: error.message || "No se pudo completar la asignación",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    } finally {
      setIsAssignVehicleLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Semirremolques</h1>
        <Button 
          className="bg-primary" 
          onClick={() => setIsNewSemitrailerDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Semirremolque
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por patente, marca, modelo o genset..."
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
          <p className="text-lg text-muted-foreground">Cargando semirremolques...</p>
        </div>
      ) : filteredSemitrailers.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <p className="text-lg text-muted-foreground">
            {semitrailers.length === 0
              ? "No hay semirremolques registrados en el sistema."
              : "No se encontraron semirremolques con los criterios de búsqueda."}
          </p>
          {semitrailers.length === 0 && (
            <Button 
              onClick={() => setIsNewSemitrailerDialogOpen(true)}
              className="bg-primary"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Semirremolque
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
                    <th className="h-12 px-4 text-left align-middle font-medium">Genset</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Asignado a</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Documentos</th>
                    <th className="h-12 px-4 text-center align-middle font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredSemitrailers.map((semitrailer) => (
                    <tr 
                      key={semitrailer.id_semirremolque} 
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">{semitrailer.patente}</td>
                      <td className="p-4 align-middle">
                        <div>
                          <span className="font-medium">{semitrailer.marca || "-"}</span>
                          <span className="block text-muted-foreground">{semitrailer.modelo} {semitrailer.anio}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {semitrailer.tipo || "-"}
                      </td>
                      <td className="p-4 align-middle">
                        {semitrailer.estado ? (
                          <Badge 
                            variant="state"
                            className={
                              semitrailer.estado === "activo" ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500 border-transparent" :
                              semitrailer.estado === "mantenimiento" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500 border-transparent" :
                              semitrailer.estado === "en_reparacion" ? "bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-500 border-transparent" :
                              semitrailer.estado === "inactivo" ? "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500 border-transparent" :
                              "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent" // dado_de_baja
                            }
                          >
                            {semitrailer.estado.replace("_", " ")}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {semitrailer.nro_genset ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                            {semitrailer.nro_genset}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Sin genset</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {semitrailer.asignado_a_flota_id && fleet[semitrailer.asignado_a_flota_id] ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Link className="h-4 w-4 text-primary" />
                              <span className="font-medium">{fleet[semitrailer.asignado_a_flota_id].patente}</span>
                            </div>
                            {fleet[semitrailer.asignado_a_flota_id].id_chofer_asignado && 
                             drivers[fleet[semitrailer.asignado_a_flota_id].id_chofer_asignado as number] ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <UserCircle2 className="h-3.5 w-3.5" />
                                <span>{drivers[fleet[semitrailer.asignado_a_flota_id].id_chofer_asignado as number].nombre_completo}</span>
                              </div>
                            ) : fleet[semitrailer.asignado_a_flota_id].id_chofer_asignado ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <UserCircle2 className="h-3.5 w-3.5" />
                                <span>Chofer #{fleet[semitrailer.asignado_a_flota_id].id_chofer_asignado}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin chofer asignado</span>
                            )}
                          </div>
                        ) : semitrailer.asignado_a_flota_id ? (
                          <span className="text-muted-foreground">Vehículo #{semitrailer.asignado_a_flota_id}</span>
                        ) : (
                          <span className="text-muted-foreground">No asignado</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col gap-1">
                          {isRevisionExpired(semitrailer.vencimiento_revision_tecnica) && (
                            <Badge variant="state" className="text-xs w-fit bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-transparent">Rev. técnica vencida</Badge>
                          )}
                          {isRevisionSoonToExpire(semitrailer.vencimiento_revision_tecnica) && (
                            <Badge variant="state" className="text-xs w-fit bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500 border-orange-300">Rev. técnica próxima</Badge>
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
                            <DropdownMenuItem onClick={() => handleViewDetails(semitrailer)}>
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditSemitrailer(semitrailer)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAssignVehicle(semitrailer)}>
                              {semitrailer.asignado_a_flota_id ? "Cambiar asignación" : "Asignar a vehículo"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => handleDeleteSemitrailer(semitrailer)}
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
      <SemitrailerFilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Diálogo para agregar nuevo semirremolque */}
      <NewSemitrailerDialog
        open={isNewSemitrailerDialogOpen}
        onOpenChange={setIsNewSemitrailerDialogOpen}
        onSave={addSemitrailer}
      />

      {/* Diálogo de detalles del semirremolque */}
      <SemitrailerDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        semitrailer={selectedSemitrailer}
        onAssignVehicle={handleAssignVehicle}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Eliminar Semirremolque"
        description={`¿Estás seguro de que deseas eliminar el semirremolque ${deleteSemitrailer?.patente}? Esta acción no se puede deshacer.`}
        actionText="Eliminar"
        actionVariant="destructive"
        onConfirm={confirmDeleteSemitrailer}
        isLoading={isDeleteLoading}
      />

      {/* Diálogo de edición del semirremolque */}
      <EditSemitrailerDialog
        semitrailer={editingSemitrailer}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateSemitrailer}
      />

      {/* Diálogo para asignar vehículo */}
      <AssignVehicleDialog
        open={isAssignVehicleDialogOpen}
        onOpenChange={setIsAssignVehicleDialogOpen}
        semitrailer={assignSemitrailer}
        onAssign={assignVehicleToSemitrailer}
      />
    </div>
  );
} 