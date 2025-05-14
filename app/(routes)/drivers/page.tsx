"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, UserPlus, FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Driver, supabase } from "@/lib/supabase";
import { DriversList } from "./components/DriversList";
import { NewDriverDialog } from "./components/NewDriverDialog";
import { DriverDetailsDialog } from "./components/DriverDetailsDialog";
import { EditDriverDialog } from "./components/EditDriverDialog";
import { DriversFilterDialog } from "./components/DriversFilterDialog";
import { ConfirmActionDialog } from "./components/ConfirmActionDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Definir la interfaz DriversFilter localmente
interface DriversFilter {
  estado?: string[];
  tipo_licencia?: string[];
  vencimiento_proxima?: boolean;
  vencimiento_vencida?: boolean;
  nacionalidad?: string[];
  fecha_ingreso_desde?: string;
  fecha_ingreso_hasta?: string;
}

export default function DriversPage() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewDriverDialogOpen, setIsNewDriverDialogOpen] = useState(false);
  
  // Estado para manejo de detalles
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Estado para manejo de edición
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estado para manejo de filtros
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<DriversFilter>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Estado para manejo de cambio de estado
  const [statusDriver, setStatusDriver] = useState<Driver | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  
  // Estado para manejo de eliminación
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Cargar datos desde Supabase
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setIsLoading(true);
        console.log('Iniciando carga de choferes desde Supabase...');
        
        // Intentar consultar la tabla en el esquema público
        const { data, error } = await supabase
          .from('public.choferes')
          .select('*');
        
        console.log('Respuesta de Supabase (esquema público):', { data, error });
        
        // Si hay error, probar sin especificar esquema
        if (error) {
          console.log('Intentando consulta sin especificar esquema...');
          const { data: dataAlt, error: errorAlt } = await supabase
            .from('choferes')
            .select('*');
          
          console.log('Respuesta alternativa:', { data: dataAlt, error: errorAlt });
          
          if (errorAlt) {
            console.error('Error al cargar choferes:', errorAlt);
            toast({
              title: "Error al cargar datos",
              description: errorAlt.message,
              variant: "destructive",
            });
            return;
          }
          
          if (!dataAlt || dataAlt.length === 0) {
            console.log('No se encontraron choferes en la respuesta alternativa');
            setDrivers([]);
            return;
          }
          
          // Procesar datos de la consulta alternativa
          const formattedDataAlt: Driver[] = dataAlt.map(item => ({
            id_chofer: item.id_chofer,
            nombre_completo: item.nombre_completo,
            documento_identidad: item.documento_identidad,
            tipo_licencia: item.tipo_licencia,
            vencimiento_licencia: item.vencimiento_licencia,
            telefono: item.telefono,
            email: item.email,
            nacionalidad: item.nacionalidad,
            direccion: item.direccion,
            fecha_nacimiento: item.fecha_nacimiento,
            fecha_ingreso: item.fecha_ingreso,
            contacto_emergencia: item.contacto_emergencia,
            estado: item.estado as "activo" | "inactivo" | "suspendido",
            observaciones: item.observaciones,
            creado_en: item.creado_en,
          }));
          
          console.log('Datos formateados (alt):', formattedDataAlt);
          setDrivers(formattedDataAlt);
          return;
        }
        
        if (!data || data.length === 0) {
          console.log('No se encontraron choferes en la respuesta');
          setDrivers([]);
          return;
        }
        
        // Convertir los datos al formato Driver
        const formattedData: Driver[] = data.map(item => ({
          id_chofer: item.id_chofer,
          nombre_completo: item.nombre_completo,
          documento_identidad: item.documento_identidad,
          tipo_licencia: item.tipo_licencia,
          vencimiento_licencia: item.vencimiento_licencia,
          telefono: item.telefono,
          email: item.email,
          nacionalidad: item.nacionalidad,
          direccion: item.direccion,
          fecha_nacimiento: item.fecha_nacimiento,
          fecha_ingreso: item.fecha_ingreso,
          contacto_emergencia: item.contacto_emergencia,
          estado: item.estado as "activo" | "inactivo" | "suspendido",
          observaciones: item.observaciones,
          creado_en: item.creado_en,
        }));
        
        console.log('Datos formateados:', formattedData);
        setDrivers(formattedData);
      } catch (error) {
        console.error('Error inesperado:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los datos de choferes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDrivers();
  }, [toast]);

  // Función para verificar si una licencia está próxima a vencer (menos de 30 días)
  const isLicenseSoonToExpire = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  // Función para verificar si una licencia está vencida
  const isLicenseExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  // Filtrado combinado (búsqueda + filtros)
  const filteredDrivers = drivers.filter(driver => {
    // Primero aplicar búsqueda de texto
    const matchesSearch = searchQuery.trim() === "" || 
      driver.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (driver.email && driver.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      driver.documento_identidad.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Luego aplicar filtros adicionales
    let matches = true;
    
    // Filtrar por estado
    if (activeFilters.estado && activeFilters.estado.length > 0) {
      matches = matches && Boolean(driver.estado && activeFilters.estado.includes(driver.estado));
    }
    
    // Filtrar por tipo de licencia
    if (activeFilters.tipo_licencia && activeFilters.tipo_licencia.length > 0) {
      matches = matches && Boolean(driver.tipo_licencia && activeFilters.tipo_licencia.includes(driver.tipo_licencia));
    }
    
    // Filtrar por nacionalidad
    if (activeFilters.nacionalidad && activeFilters.nacionalidad.length > 0) {
      matches = matches && Boolean(driver.nacionalidad && activeFilters.nacionalidad.includes(driver.nacionalidad));
    }
    
    // Filtrar por vencimiento próximo
    if (activeFilters.vencimiento_proxima) {
      matches = matches && isLicenseSoonToExpire(driver.vencimiento_licencia);
    }
    
    // Filtrar por vencimiento vencido
    if (activeFilters.vencimiento_vencida) {
      matches = matches && isLicenseExpired(driver.vencimiento_licencia);
    }
    
    // Filtrar por fecha de ingreso (desde)
    if (activeFilters.fecha_ingreso_desde && driver.fecha_ingreso) {
      matches = matches && new Date(driver.fecha_ingreso) >= new Date(activeFilters.fecha_ingreso_desde);
    }
    
    // Filtrar por fecha de ingreso (hasta)
    if (activeFilters.fecha_ingreso_hasta && driver.fecha_ingreso) {
      matches = matches && new Date(driver.fecha_ingreso) <= new Date(activeFilters.fecha_ingreso_hasta);
    }
    
    return matches;
  });

  const handleViewDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDetailsDialogOpen(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDriver = async (updatedDriver: Driver) => {
    try {
      const { error } = await supabase
        .from('choferes')
        .update({
          nombre_completo: updatedDriver.nombre_completo,
          documento_identidad: updatedDriver.documento_identidad,
          tipo_licencia: updatedDriver.tipo_licencia,
          vencimiento_licencia: updatedDriver.vencimiento_licencia,
          telefono: updatedDriver.telefono,
          email: updatedDriver.email,
          nacionalidad: updatedDriver.nacionalidad,
          direccion: updatedDriver.direccion,
          fecha_nacimiento: updatedDriver.fecha_nacimiento,
          fecha_ingreso: updatedDriver.fecha_ingreso,
          contacto_emergencia: updatedDriver.contacto_emergencia,
          estado: updatedDriver.estado,
          observaciones: updatedDriver.observaciones
        })
        .eq('id_chofer', updatedDriver.id_chofer);
      
      if (error) throw error;
      
      // Actualizar el estado local
      setDrivers(prev => 
        prev.map(driver => 
          driver.id_chofer === updatedDriver.id_chofer ? updatedDriver : driver
        )
      );
      setIsEditDialogOpen(false);
      
      toast({
        title: "Chofer actualizado",
        description: `Los datos de ${updatedDriver.nombre_completo} han sido actualizados.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al actualizar chofer:', error);
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el chofer",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const addDriver = async (newDriver: Driver) => {
    try {
      const { data, error } = await supabase
        .from('choferes')
        .insert([{
          nombre_completo: newDriver.nombre_completo,
          documento_identidad: newDriver.documento_identidad,
          tipo_licencia: newDriver.tipo_licencia,
          vencimiento_licencia: newDriver.vencimiento_licencia,
          telefono: newDriver.telefono,
          email: newDriver.email,
          nacionalidad: newDriver.nacionalidad,
          direccion: newDriver.direccion,
          fecha_nacimiento: newDriver.fecha_nacimiento,
          fecha_ingreso: newDriver.fecha_ingreso,
          contacto_emergencia: newDriver.contacto_emergencia,
          estado: newDriver.estado,
          observaciones: newDriver.observaciones
        }])
        .select();
      
      if (error) throw error;
      
      // Añadir el nuevo chofer al estado local con el ID generado
      if (data && data.length > 0) {
        const insertedDriver = {
          ...newDriver,
          id_chofer: data[0].id_chofer,
          creado_en: data[0].creado_en
        };
        setDrivers(prev => [...prev, insertedDriver]);
      }
      
      setIsNewDriverDialogOpen(false);
      
      toast({
        title: "Chofer agregado",
        description: `${newDriver.nombre_completo} ha sido agregado correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al agregar chofer:', error);
      toast({
        title: "Error al agregar",
        description: error.message || "No se pudo agregar el chofer",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  const handleApplyFilters = (filters: DriversFilter) => {
    setActiveFilters(filters);
    
    // Verificar si hay filtros activos
    const hasFilters = 
      (filters.estado && filters.estado.length > 0) ||
      (filters.tipo_licencia && filters.tipo_licencia.length > 0) ||
      (filters.nacionalidad && filters.nacionalidad.length > 0) ||
      filters.vencimiento_proxima === true ||
      filters.vencimiento_vencida === true ||
      Boolean(filters.fecha_ingreso_desde) ||
      Boolean(filters.fecha_ingreso_hasta);
    
    setHasActiveFilters(hasFilters);
  };
  
  const handleClearFilters = () => {
    setActiveFilters({});
    setHasActiveFilters(false);
  };
  
  // Contar la cantidad de filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    
    if (activeFilters.estado && activeFilters.estado.length > 0) count += 1;
    if (activeFilters.tipo_licencia && activeFilters.tipo_licencia.length > 0) count += 1;
    if (activeFilters.nacionalidad && activeFilters.nacionalidad.length > 0) count += 1;
    if (activeFilters.vencimiento_proxima) count += 1;
    if (activeFilters.vencimiento_vencida) count += 1;
    if (activeFilters.fecha_ingreso_desde) count += 1;
    if (activeFilters.fecha_ingreso_hasta) count += 1;
    
    return count;
  };
  
  // Cambiar estado de chofer (activar/desactivar)
  const handleToggleStatus = (driver: Driver) => {
    setStatusDriver(driver);
    setIsStatusDialogOpen(true);
  };
  
  const confirmToggleStatus = async () => {
    if (!statusDriver) return;
    
    try {
      const newStatus = statusDriver.estado === "activo" ? "inactivo" : "activo";
      
      const { error } = await supabase
        .from('choferes')
        .update({ estado: newStatus })
        .eq('id_chofer', statusDriver.id_chofer);
      
      if (error) throw error;
      
      // Actualizar el estado local
      const updatedDrivers = drivers.map(driver => 
        driver.id_chofer === statusDriver.id_chofer 
          ? { ...driver, estado: newStatus as "activo" | "inactivo" | "suspendido" }
          : driver
      );
      
      setDrivers(updatedDrivers);
      setIsStatusDialogOpen(false);
      
      toast({
        title: newStatus === "activo" ? "Chofer activado" : "Chofer desactivado",
        description: `${statusDriver.nombre_completo} ha sido ${newStatus === "activo" ? "activado" : "desactivado"} correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el estado del chofer",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Eliminar chofer
  const handleDeleteDriver = (driver: Driver) => {
    setDeleteDriver(driver);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteDriver = async () => {
    if (!deleteDriver) return;
    
    try {
      const { error } = await supabase
        .from('choferes')
        .delete()
        .eq('id_chofer', deleteDriver.id_chofer);
      
      if (error) throw error;
      
      // Actualizar el estado local
      const updatedDrivers = drivers.filter(driver => 
        driver.id_chofer !== deleteDriver.id_chofer
      );
      
      setDrivers(updatedDrivers);
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Chofer eliminado",
        description: `${deleteDriver.nombre_completo} ha sido eliminado correctamente.`,
        variant: "destructive",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al eliminar chofer:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el chofer",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Choferes</h2>
          <p className="text-muted-foreground">Gestiona los choferes de la empresa</p>
        </div>
        <Button onClick={() => setIsNewDriverDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Chofer
        </Button>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, documento o email..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="gap-1.5 relative"
            onClick={() => setIsFilterDialogOpen(true)}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearFilters}
              className="gap-1.5 text-muted-foreground"
            >
              <FilterX className="h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
        
        {/* Chips de filtros activos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.estado?.map((estado: string) => (
              <Badge key={`estado-${estado}`} variant="outline" className="py-1 flex items-center gap-1">
                <span className="capitalize">{estado}</span>
              </Badge>
            ))}
            
            {activeFilters.tipo_licencia?.map((tipo: string) => (
              <Badge key={`licencia-${tipo}`} variant="outline" className="py-1 flex items-center gap-1">
                <span>Licencia {tipo}</span>
              </Badge>
            ))}
            
            {activeFilters.nacionalidad?.map((nac: string) => (
              <Badge key={`nac-${nac}`} variant="outline" className="py-1 flex items-center gap-1">
                <span>{nac}</span>
              </Badge>
            ))}
            
            {activeFilters.vencimiento_proxima && (
              <Badge variant="outline" className="py-1 flex items-center gap-1 bg-yellow-50 text-yellow-800 border-yellow-300">
                <span>Próximos a vencer</span>
              </Badge>
            )}
            
            {activeFilters.vencimiento_vencida && (
              <Badge variant="outline" className="py-1 flex items-center gap-1 bg-red-50 text-red-800 border-red-300">
                <span>Licencias vencidas</span>
              </Badge>
            )}
            
            {activeFilters.fecha_ingreso_desde && (
              <Badge variant="outline" className="py-1 flex items-center gap-1">
                <span>Desde {new Date(activeFilters.fecha_ingreso_desde).toLocaleDateString("es-CL")}</span>
              </Badge>
            )}
            
            {activeFilters.fecha_ingreso_hasta && (
              <Badge variant="outline" className="py-1 flex items-center gap-1">
                <span>Hasta {new Date(activeFilters.fecha_ingreso_hasta).toLocaleDateString("es-CL")}</span>
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3">Cargando choferes...</span>
        </div>
      ) : (
        <DriversList 
          drivers={filteredDrivers} 
          onViewDetails={handleViewDetails}
          onEditDriver={handleEditDriver}
          onToggleStatus={handleToggleStatus}
          onDeleteDriver={handleDeleteDriver}
        />
      )}
      
      {/* Diálogos */}
      <NewDriverDialog 
        open={isNewDriverDialogOpen} 
        onOpenChange={setIsNewDriverDialogOpen}
        onSave={addDriver}
      />
      
      <DriverDetailsDialog
        driver={selectedDriver}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
      
      <EditDriverDialog
        driver={editingDriver}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateDriver}
      />
      
      <DriversFilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
      />
      
      {/* Diálogo para cambiar estado */}
      <ConfirmActionDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        title={statusDriver?.estado === "activo" ? "Desactivar Chofer" : "Activar Chofer"}
        description={
          statusDriver?.estado === "activo"
            ? `¿Estás seguro de desactivar a ${statusDriver?.nombre_completo}? Un chofer desactivado no podrá ser asignado a viajes.`
            : `¿Estás seguro de activar a ${statusDriver?.nombre_completo}?`
        }
        actionText={statusDriver?.estado === "activo" ? "Desactivar" : "Activar"}
        variant={statusDriver?.estado === "activo" ? "destructive" : "default"}
        onConfirm={confirmToggleStatus}
      />
      
      {/* Diálogo para eliminar */}
      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Eliminar Chofer"
        description={
          `¿Estás seguro de eliminar a ${deleteDriver?.nombre_completo}? Esta acción no se puede deshacer y eliminará toda la información asociada a este chofer.`
        }
        actionText="Eliminar"
        variant="destructive"
        onConfirm={confirmDeleteDriver}
      />
    </div>
  );
} 