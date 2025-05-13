"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, UserPlus, FilterX, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Driver } from "@/lib/supabase";
import { DriversList } from "./components/DriversList";
import { NewDriverDialog } from "./components/NewDriverDialog";
import { DriverDetailsDialog } from "./components/DriverDetailsDialog";
import { EditDriverDialog } from "./components/EditDriverDialog";
import { DriversFilterDialog } from "./components/DriversFilterDialog";
import { ConfirmActionDialog } from "./components/ConfirmActionDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  const supabase = createClientComponentClient();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Cargar datos de choferes desde Supabase al iniciar
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('choferes')
          .select('*');
          
        if (error) {
          console.error('Error al cargar choferes:', error);
          toast({
            title: "Error al cargar datos",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Mapear los datos al formato Driver si es necesario
        const formattedData = data.map((driver: any) => ({
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
        }));
        
        setDrivers(formattedData || []);
      } catch (err) {
        console.error('Error inesperado:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrivers();
  }, [supabase, toast]);

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
        description: error.message || "Ha ocurrido un error al actualizar el chofer",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const addDriver = async (newDriver: Driver) => {
    try {
      // Eliminar id_chofer para que Supabase lo genere automáticamente
      const { id_chofer, creado_en, ...driverData } = newDriver;
      
      const { data, error } = await supabase
        .from('choferes')
        .insert([driverData])
        .select();
      
      if (error) throw error;
      
      // Añadir el nuevo chofer con el id generado por Supabase
      setDrivers(prev => [...prev, data[0]]);
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
        description: error.message || "Ha ocurrido un error al agregar el chofer",
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
      
      const updatedDrivers = drivers.map(driver => 
        driver.id_chofer === statusDriver.id_chofer 
          ? { ...driver, estado: newStatus }
          : driver
      );
      
      setDrivers(updatedDrivers as Driver[]);
      setIsStatusDialogOpen(false);
      
      toast({
        title: newStatus === "activo" ? "Chofer activado" : "Chofer desactivado",
        description: `${statusDriver.nombre_completo} ha sido ${newStatus === "activo" ? "activado" : "desactivado"} correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al cambiar estado del chofer:', error);
      toast({
        title: "Error al cambiar estado",
        description: error.message || "Ha ocurrido un error al cambiar el estado del chofer",
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
        title: "Error al eliminar",
        description: error.message || "Ha ocurrido un error al eliminar el chofer",
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
      
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Cargando choferes...</span>
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