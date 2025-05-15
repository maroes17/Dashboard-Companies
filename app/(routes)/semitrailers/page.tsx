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
import { AssignVehicleDialog } from "./components/AssignVehicleDialog";

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
  const [assignSemitrailer, setAssignSemitrailer] = useState<Semirremolque | null>(null);
  const [isAssignVehicleDialogOpen, setIsAssignVehicleDialogOpen] = useState(false);

  useEffect(() => {
    fetchSemitrailers();
  }, []);

  const fetchSemitrailers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('semirremolques')
        .select('*');
      
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

      if (error) throw error;

      toast({
        title: "Semirremolque eliminado",
        description: "El semirremolque ha sido eliminado correctamente.",
      });

      await fetchSemitrailers();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el semirremolque",
        variant: "destructive",
      });
    } finally {
      setIsDeleteLoading(false);
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

  return (
    <div className="p-6 space-y-6">
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
                  <td className="p-4 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(semitrailer)}>
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditSemitrailer(semitrailer)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignVehicle(semitrailer)}>
                          Asignar vehículo
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

      <NewSemitrailerDialog
        open={isNewSemitrailerDialogOpen}
        onOpenChange={setIsNewSemitrailerDialogOpen}
        onSave={fetchSemitrailers}
      />

      <EditSemitrailerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        semitrailer={editingSemitrailer}
        onSave={fetchSemitrailers}
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
        onConfirm={confirmDeleteSemitrailer}
        isLoading={isDeleteLoading}
        actionText="Eliminar"
        actionVariant="destructive"
      />

      <AssignVehicleDialog
        open={isAssignVehicleDialogOpen}
        onOpenChange={setIsAssignVehicleDialogOpen}
        semitrailer={assignSemitrailer}
        onAssign={fetchSemitrailers}
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