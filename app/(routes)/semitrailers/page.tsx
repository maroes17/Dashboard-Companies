"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, PlusCircle, FilterX, MoreHorizontal, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Semirremolque, supabase } from "@/lib/supabase";
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

interface SemitrailerFilter {
  estado?: string[];
  tipo?: string[];
  marca?: string[];
  vencimiento_revision?: boolean;
  tiene_genset?: boolean;
  anio_desde?: number;
  anio_hasta?: number;
  asignado?: boolean;
}

export default function SemitrailersPage() {
  const { toast } = useToast();
  const [semitrailers, setSemitrailers] = useState<Semirremolque[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewSemitrailerDialogOpen, setIsNewSemitrailerDialogOpen] = useState(false);
  const [selectedSemitrailer, setSelectedSemitrailer] = useState<Semirremolque | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingSemitrailer, setEditingSemitrailer] = useState<Semirremolque | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SemitrailerFilter>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [deleteSemitrailer, setDeleteSemitrailer] = useState<Semirremolque | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    fetchSemitrailers();
  }, []);

  const fetchSemitrailers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('semirremolques')
        .select('*')
        .eq('estado', 'activo')
        .order('patente');
      
      if (error) throw error;
      setSemitrailers(data || []);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Error al cargar los datos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isRevisionExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const isRevisionSoonToExpire = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  const filteredSemitrailers = semitrailers.filter(semitrailer => {
    const matchesSearch = searchQuery.trim() === "" || 
      semitrailer.patente.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      
      switch (key) {
        case 'estado':
          return Array.isArray(value) && value.includes(semitrailer.estado);
        case 'tipo':
          return Array.isArray(value) && value.includes(semitrailer.tipo);
        case 'marca':
          return Array.isArray(value) && value.includes(semitrailer.marca);
        case 'vencimiento_revision':
          return value === isRevisionExpired(semitrailer.vencimiento_revision_tecnica);
        case 'tiene_genset':
          return value === !!semitrailer.nro_genset;
        case 'anio_desde':
          return semitrailer.anio !== undefined && semitrailer.anio >= value;
        case 'anio_hasta':
          return semitrailer.anio !== undefined && semitrailer.anio <= value;
        case 'asignado':
          return value === !!semitrailer.asignado_a_flota_id;
        default:
          return true;
      }
    });

    return matchesSearch && matchesFilters;
  });

  const handleViewDetails = (semitrailer: Semirremolque) => {
    setSelectedSemitrailer(semitrailer);
    setIsDetailsDialogOpen(true);
  };

  const handleEditSemitrailer = (semitrailer: Semirremolque) => {
    setEditingSemitrailer(semitrailer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteSemitrailer = (semitrailer: Semirremolque) => {
    setDeleteSemitrailer(semitrailer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteSemitrailer = async (semitrailer: Semirremolque) => {
    try {
      // 1. Obtener el vehículo asignado (si existe)
      let assignedVehicle = null;
      if (semitrailer.asignado_a_flota_id) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('flota')
          .select('*')
          .eq('id_flota', semitrailer.asignado_a_flota_id)
          .single();

        if (vehicleError) {
          console.error('Error al obtener vehículo asignado:', vehicleError);
          throw new Error('Error al obtener información del vehículo asignado');
        }

        assignedVehicle = vehicleData;
      }

      // 2. Marcar el semirremolque como dado de baja
      const { error: updateError } = await supabase
        .from('semirremolques')
        .update({
          estado: 'dado_de_baja',
          asignado_a_flota_id: null,
          actualizado_en: new Date().toISOString()
        })
        .eq('id_semirremolque', semitrailer.id_semirremolque);

      if (updateError) {
        console.error('Error al actualizar semirremolque:', updateError);
        throw new Error('Error al dar de baja el semirremolque');
      }

      // 3. Si había un vehículo asignado, registrar el evento de desasignación
      if (assignedVehicle) {
        const { error: eventError } = await supabase
          .from('eventos_flota')
          .insert({
            id_flota: assignedVehicle.id_flota,
            tipo_evento: 'desasignacion_semirremolque',
            descripcion: `Se desasignó el semirremolque ${semitrailer.patente} (dado de baja)`,
            fecha_evento: new Date().toISOString(),
            creado_en: new Date().toISOString()
          });

        if (eventError) {
          console.error('Error al registrar evento:', eventError);
          // No lanzamos error aquí para no interrumpir el flujo principal
        }
      }

      // 4. Actualizar el estado local
      setSemitrailers(prev => prev.map(s => 
        s.id_semirremolque === semitrailer.id_semirremolque 
          ? { ...s, estado: 'dado_de_baja', asignado_a_flota_id: undefined }
          : s
      ));

      toast({
        title: "Semirremolque dado de baja",
        description: "El semirremolque ha sido dado de baja correctamente.",
      });
    } catch (error: any) {
      console.error('Error al dar de baja semirremolque:', error);
      toast({
        title: "Error",
        description: error.message || "Error al dar de baja el semirremolque",
        variant: "destructive",
      });
    }
  };

  const handleApplyFilters = (filters: SemitrailerFilter) => {
    setActiveFilters(filters);
    setHasActiveFilters(Object.values(filters).some(value => 
      value !== undefined && 
      (Array.isArray(value) ? value.length > 0 : value !== false)
    ));
    setIsFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setHasActiveFilters(false);
  };

  const getActiveFiltersCount = () => {
    return Object.values(activeFilters).filter(value => 
      value !== undefined && 
      (Array.isArray(value) ? value.length > 0 : value !== false)
    ).length;
  };

  const handleSaveNewSemitrailer = async (newSemitrailer: Semirremolque) => {
    try {
      // 1. Insertar el nuevo semirremolque
      const { data, error } = await supabase
        .from('semirremolques')
        .insert([{
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
          observaciones: newSemitrailer.observaciones,
          creado_en: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error al crear semirremolque:', error);
        throw new Error(error.message || 'Error al crear el semirremolque');
      }

      if (!data) {
        throw new Error('No se recibió respuesta al crear el semirremolque');
      }

      // 2. Actualizar el estado local
      setSemitrailers(prev => [...prev, data]);

      toast({
        title: "Semirremolque creado",
        description: "El semirremolque ha sido creado correctamente.",
      });
    } catch (error: any) {
      console.error('Error al crear semirremolque:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el semirremolque",
        variant: "destructive",
      });
      throw error; // Re-lanzar el error para que el diálogo lo maneje
    }
  };

  const handleSaveEditSemitrailer = async (updatedSemitrailer: Semirremolque) => {
    try {
      // 1. Actualizar el semirremolque
      const { data, error } = await supabase
        .from('semirremolques')
        .update({
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
          observaciones: updatedSemitrailer.observaciones,
          actualizado_en: new Date().toISOString()
        })
        .eq('id_semirremolque', updatedSemitrailer.id_semirremolque)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar semirremolque:', error);
        throw new Error(error.message || 'Error al actualizar el semirremolque');
      }

      if (!data) {
        throw new Error('No se recibió respuesta al actualizar el semirremolque');
      }

      // 2. Actualizar el estado local
      setSemitrailers(prev => prev.map(s => 
        s.id_semirremolque === data.id_semirremolque ? data : s
      ));

      toast({
        title: "Semirremolque actualizado",
        description: "El semirremolque ha sido actualizado correctamente.",
      });
    } catch (error: any) {
      console.error('Error al actualizar semirremolque:', error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el semirremolque",
        variant: "destructive",
      });
      throw error; // Re-lanzar el error para que el diálogo lo maneje
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Semirremolques</h1>
        <Button onClick={() => setIsNewSemitrailerDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Semirremolque
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por patente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsFilterDialogOpen(true)}
          className={hasActiveFilters ? "border-primary" : ""}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters}>
            <FilterX className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium">Patente</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Tipo</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Estado</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Última Revisión</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredSemitrailers.map((semitrailer) => (
                  <tr key={semitrailer.id_semirremolque} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle">{semitrailer.patente}</td>
                    <td className="p-4 align-middle">{semitrailer.tipo}</td>
                    <td className="p-4 align-middle">
                      <Badge variant={semitrailer.estado === 'activo' ? 'default' : 'secondary'}>
                        {semitrailer.estado}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {semitrailer.vencimiento_revision_tecnica ? (
                        <div className="flex items-center gap-2">
                          <span>{new Date(semitrailer.vencimiento_revision_tecnica).toLocaleDateString()}</span>
                          {isRevisionExpired(semitrailer.vencimiento_revision_tecnica) && (
                            <Badge variant="destructive">Vencida</Badge>
                          )}
                          {isRevisionSoonToExpire(semitrailer.vencimiento_revision_tecnica) && (
                            <Badge variant="warning">Próxima a vencer</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No especificada</span>
                      )}
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
                          <DropdownMenuItem
                            onClick={() => handleDeleteSemitrailer(semitrailer)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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

      <NewSemitrailerDialog
        open={isNewSemitrailerDialogOpen}
        onOpenChange={setIsNewSemitrailerDialogOpen}
        onSave={handleSaveNewSemitrailer}
      />

      <EditSemitrailerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        semitrailer={editingSemitrailer}
        onSave={handleSaveEditSemitrailer}
      />

      <SemitrailerDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        semitrailer={selectedSemitrailer}
      />

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Eliminar Semirremolque"
        description="¿Estás seguro de que deseas eliminar este semirremolque? Esta acción no se puede deshacer."
        onConfirm={() => confirmDeleteSemitrailer(deleteSemitrailer!)}
        isLoading={isDeleteLoading}
        actionText="Eliminar"
        actionVariant="destructive"
      />

      <SemitrailerFilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        onApplyFilters={handleApplyFilters}
        activeFilters={activeFilters}
      />
    </div>
  );
} 