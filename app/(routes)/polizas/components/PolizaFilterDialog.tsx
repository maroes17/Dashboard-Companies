"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Poliza, supabase } from "@/lib/supabase";

interface PolizaFilter {
  estado?: string[];
  aseguradora?: string[];
  aplica_a?: string[];
  vigente?: boolean;
  vencida?: boolean;
  proximo_vencimiento?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
}

interface PolizaFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: PolizaFilter;
  onApplyFilters: (filters: PolizaFilter) => void;
}

export function PolizaFilterDialog({
  open,
  onOpenChange,
  activeFilters,
  onApplyFilters,
}: PolizaFilterDialogProps) {
  const [filters, setFilters] = useState<PolizaFilter>({});
  const [aseguradoras, setAseguradoras] = useState<string[]>(['HDI', 'Mapfre']);
  
  // Cargar el estado inicial de los filtros
  useEffect(() => {
    if (open) {
      setFilters(activeFilters);
      fetchAseguradoras();
    }
  }, [open, activeFilters]);
  
  // Función para cargar las aseguradoras disponibles
  const fetchAseguradoras = async () => {
    try {
      // Obtener todas las pólizas
      const { data, error } = await supabase
        .from('polizas')
        .select('aseguradora');
      
      if (error) {
        console.error("Error al cargar aseguradoras:", error);
        return;
      }
      
      if (!data) {
        console.error("No se recibieron datos al cargar aseguradoras");
        return;
      }
      
      // Filtrar valores nulos o vacíos y extraer valores únicos
      const loadedAseguradoras = [...new Set(data
        .map(item => item.aseguradora)
        .filter(item => item !== null && item !== undefined && item !== '')
      )];
      
      // Combinar con las aseguradoras predeterminadas y eliminar duplicados
      const allAseguradoras = [...new Set([...aseguradoras, ...loadedAseguradoras])];
      
      setAseguradoras(allAseguradoras);
    } catch (error) {
      console.error("Error al cargar aseguradoras:", error);
    }
  };

  // Manejar cambios en los filtros
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Manejar cambios en filtros de array (como estado)
  const handleArrayFilterChange = (key: string, value: string, checked: boolean) => {
    setFilters(prev => {
      const currentValues = prev[key as keyof PolizaFilter] as string[] || [];
      
      if (checked) {
        return {
          ...prev,
          [key]: [...currentValues, value],
        };
      } else {
        return {
          ...prev,
          [key]: currentValues.filter(item => item !== value),
        };
      }
    });
  };

  // Verificar si un valor está seleccionado en un filtro de array
  const isValueSelected = (key: keyof PolizaFilter, value: string): boolean => {
    const values = filters[key] as string[] | undefined;
    return Boolean(values && values.includes(value));
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtrar Pólizas</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Filtrar por tipo de unidad */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Tipo de unidad</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="aplica-a-flota" 
                  checked={isValueSelected('aplica_a', 'flota')}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('aplica_a', 'flota', checked === true)
                  }
                />
                <Label htmlFor="aplica-a-flota">Vehículos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="aplica-a-semirremolque" 
                  checked={isValueSelected('aplica_a', 'semirremolque')}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('aplica_a', 'semirremolque', checked === true)
                  }
                />
                <Label htmlFor="aplica-a-semirremolque">Semirremolques</Label>
              </div>
            </div>
          </div>
          
          {/* Filtrar por estado */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Estado</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="estado-vigente" 
                  checked={isValueSelected('estado', 'vigente')}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('estado', 'vigente', checked === true)
                  }
                />
                <Label htmlFor="estado-vigente">Vigente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="estado-vencida" 
                  checked={isValueSelected('estado', 'vencida')}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('estado', 'vencida', checked === true)
                  }
                />
                <Label htmlFor="estado-vencida">Vencida</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="estado-renovada" 
                  checked={isValueSelected('estado', 'renovada')}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('estado', 'renovada', checked === true)
                  }
                />
                <Label htmlFor="estado-renovada">Renovada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="estado-cancelada" 
                  checked={isValueSelected('estado', 'cancelada')}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('estado', 'cancelada', checked === true)
                  }
                />
                <Label htmlFor="estado-cancelada">Cancelada</Label>
              </div>
            </div>
          </div>
          
          {/* Filtrar por condición de vigencia */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Condiciones especiales</h3>
            <div className="grid gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vigente" 
                  checked={filters.vigente}
                  onCheckedChange={(checked) => 
                    handleFilterChange('vigente', checked === true)
                  }
                />
                <Label htmlFor="vigente">Solo pólizas vigentes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencida" 
                  checked={filters.vencida}
                  onCheckedChange={(checked) => 
                    handleFilterChange('vencida', checked === true)
                  }
                />
                <Label htmlFor="vencida">Solo pólizas vencidas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="proximo-vencimiento" 
                  checked={filters.proximo_vencimiento}
                  onCheckedChange={(checked) => 
                    handleFilterChange('proximo_vencimiento', checked === true)
                  }
                />
                <Label htmlFor="proximo-vencimiento">Próximas a vencer (30 días)</Label>
              </div>
            </div>
          </div>
          
          {/* Filtrar por aseguradora */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Aseguradora</h3>
            <div className="grid gap-4">
              {aseguradoras.length > 0 ? (
                aseguradoras.map((aseguradora) => (
                  <div key={aseguradora} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`aseguradora-${aseguradora}`} 
                      checked={isValueSelected('aseguradora', aseguradora)}
                      onCheckedChange={(checked) => 
                        handleArrayFilterChange('aseguradora', aseguradora, checked === true)
                      }
                    />
                    <Label htmlFor={`aseguradora-${aseguradora}`}>{aseguradora}</Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay aseguradoras disponibles o se están cargando...</p>
              )}
            </div>
          </div>
          
          {/* Filtrar por rango de fechas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Rango de fechas de vigencia</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha-desde">Desde</Label>
                <Input
                  id="fecha-desde"
                  type="date"
                  value={filters.fecha_desde || ''}
                  onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha-hasta">Hasta</Label>
                <Input
                  id="fecha-hasta"
                  type="date"
                  value={filters.fecha_hasta || ''}
                  onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            type="button"
            onClick={handleClearFilters}
          >
            Limpiar filtros
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApplyFilters}
            >
              Aplicar filtros
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 