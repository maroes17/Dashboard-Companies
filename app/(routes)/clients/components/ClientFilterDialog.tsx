import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ClientFilter {
  estado?: string[];
  ciudad?: string[];
  pais?: string[];
}

interface ClientFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: ClientFilter;
  onApplyFilters: (filters: ClientFilter) => void;
}

export function ClientFilterDialog({
  open,
  onOpenChange,
  activeFilters,
  onApplyFilters,
}: ClientFilterDialogProps) {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ClientFilter>(activeFilters);
  
  // Opciones disponibles para los filtros
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState<string[]>([]);
  const [paisesDisponibles, setPaisesDisponibles] = useState<string[]>([]);
  
  // Estados disponibles (hardcoded porque son valores fijos)
  const estadosDisponibles = ["activo", "inactivo", "suspendido"];

  useEffect(() => {
    if (open) {
      setFilters(activeFilters);
      fetchFilterOptions();
    }
  }, [open, activeFilters]);

  const fetchFilterOptions = async () => {
    setLoading(true);
    try {
      // Obtener ciudades únicas
      const { data: ciudades, error: errorCiudades } = await supabase
        .from('clientes')
        .select('ciudad')
        .not('ciudad', 'is', null);

      if (!errorCiudades && ciudades) {
        const uniqueCiudades = Array.from(
          new Set(ciudades.map(item => item.ciudad).filter(Boolean))
        ).sort();
        setCiudadesDisponibles(uniqueCiudades);
      }

      // Obtener países únicos
      const { data: paises, error: errorPaises } = await supabase
        .from('clientes')
        .select('pais')
        .not('pais', 'is', null);

      if (!errorPaises && paises) {
        const uniquePaises = Array.from(
          new Set(paises.map(item => item.pais).filter(Boolean))
        ).sort();
        setPaisesDisponibles(uniquePaises);
      }
    } catch (error) {
      console.error("Error al cargar las opciones de filtro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = (estado: string, checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;

    setFilters(prev => {
      const currentEstados = prev.estado || [];
      
      if (checked) {
        // Agregar estado si no está presente
        return {
          ...prev,
          estado: [...currentEstados, estado],
        };
      } else {
        // Quitar estado si está presente
        return {
          ...prev,
          estado: currentEstados.filter(item => item !== estado),
        };
      }
    });
  };

  const handleCiudadChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      ciudad: value !== "all_cities" ? [value] : [],
    }));
  };

  const handlePaisChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      pais: value !== "all_countries" ? [value] : [],
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleResetFilters = () => {
    const emptyFilters: ClientFilter = {};
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
    onOpenChange(false);
  };

  // Verifica si hay algún filtro activo
  const hasActiveFilters = 
    (filters.estado && filters.estado.length > 0) ||
    (filters.ciudad && filters.ciudad.length > 0) ||
    (filters.pais && filters.pais.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filtrar Clientes</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            {/* Filtro por estado */}
            <div className="space-y-2">
              <Label htmlFor="estado" className="text-sm font-medium">
                Estado
              </Label>
              <div className="flex flex-wrap gap-4">
                {estadosDisponibles.map((estado) => (
                  <div key={estado} className="flex items-center space-x-2">
                    <Checkbox
                      id={`estado-${estado}`}
                      checked={(filters.estado || []).includes(estado)}
                      onCheckedChange={(checked) => handleEstadoChange(estado, checked)}
                    />
                    <label
                      htmlFor={`estado-${estado}`}
                      className="text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {estado}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtro por ciudad */}
            <div className="space-y-2">
              <Label htmlFor="ciudad" className="text-sm font-medium">
                Ciudad
              </Label>
              <Select
                value={(filters.ciudad && filters.ciudad[0]) || "all_cities"}
                onValueChange={handleCiudadChange}
              >
                <SelectTrigger id="ciudad" className="w-full">
                  <SelectValue placeholder="Seleccionar ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_cities">Todas las ciudades</SelectItem>
                  {ciudadesDisponibles.map((ciudad) => (
                    <SelectItem key={ciudad} value={ciudad}>
                      {ciudad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por país */}
            <div className="space-y-2">
              <Label htmlFor="pais" className="text-sm font-medium">
                País
              </Label>
              <Select
                value={(filters.pais && filters.pais[0]) || "all_countries"}
                onValueChange={handlePaisChange}
              >
                <SelectTrigger id="pais" className="w-full">
                  <SelectValue placeholder="Seleccionar país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_countries">Todos los países</SelectItem>
                  {paisesDisponibles.map((pais) => (
                    <SelectItem key={pais} value={pais}>
                      {pais}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetFilters}
            disabled={loading || !hasActiveFilters}
          >
            Limpiar filtros
          </Button>
          <Button
            type="button"
            onClick={handleApplyFilters}
            disabled={loading}
          >
            Aplicar filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 