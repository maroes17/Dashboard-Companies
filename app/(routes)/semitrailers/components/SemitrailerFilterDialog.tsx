"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/lib/supabase";

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

interface SemitrailerFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: SemitrailerFilter;
  onApplyFilters: (filters: SemitrailerFilter) => void;
}

export function SemitrailerFilterDialog({
  open,
  onOpenChange,
  activeFilters,
  onApplyFilters
}: SemitrailerFilterDialogProps) {
  const [filters, setFilters] = useState<SemitrailerFilter>(activeFilters);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  
  // Reset filters when dialog opens with active filters
  useEffect(() => {
    if (open) {
      setFilters(activeFilters);
      fetchFilterOptions();
    }
  }, [open, activeFilters]);

  // Fetch available filter options from the database
  const fetchFilterOptions = async () => {
    try {
      // Fetch unique types
      const { data: typeData, error: typeError } = await supabase
        .from('semirremolques')
        .select('tipo')
        .not('tipo', 'is', null);
      
      if (!typeError && typeData) {
        const types = Array.from(new Set(typeData.map(item => item.tipo))).filter(Boolean) as string[];
        setAvailableTypes(types.sort());
      }
      
      // Fetch unique brands
      const { data: brandData, error: brandError } = await supabase
        .from('semirremolques')
        .select('marca')
        .not('marca', 'is', null);
      
      if (!brandError && brandData) {
        const brands = Array.from(new Set(brandData.map(item => item.marca))).filter(Boolean) as string[];
        setAvailableBrands(brands.sort());
      }
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
    }
  };

  const handleFilterChange = (key: keyof SemitrailerFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleItem = (key: keyof SemitrailerFilter, item: string) => {
    setFilters(prev => {
      const currentItems = prev[key] as string[] || [];
      if (currentItems.includes(item)) {
        return { ...prev, [key]: currentItems.filter(i => i !== item) };
      } else {
        return { ...prev, [key]: [...currentItems, item] };
      }
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtrar Semirremolques</DialogTitle>
          <DialogDescription>
            Selecciona los filtros para refinar los resultados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Filtro por estado */}
          <div className="space-y-4">
            <h3 className="font-medium">Estado</h3>
            <div className="grid grid-cols-2 gap-2">
              {['activo', 'inactivo', 'mantenimiento', 'en_reparacion', 'dado_de_baja'].map(estado => (
                <div key={estado} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`estado-${estado}`} 
                    checked={(filters.estado || []).includes(estado)}
                    onCheckedChange={() => handleToggleItem('estado', estado)}
                  />
                  <Label htmlFor={`estado-${estado}`} className="capitalize">
                    {estado.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro por tipo */}
          {availableTypes.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Tipo</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableTypes.map(tipo => (
                  <div key={tipo} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tipo-${tipo}`} 
                      checked={(filters.tipo || []).includes(tipo)}
                      onCheckedChange={() => handleToggleItem('tipo', tipo)}
                    />
                    <Label htmlFor={`tipo-${tipo}`}>{tipo}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtro por marca */}
          {availableBrands.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Marca</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableBrands.map(marca => (
                  <div key={marca} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`marca-${marca}`} 
                      checked={(filters.marca || []).includes(marca)}
                      onCheckedChange={() => handleToggleItem('marca', marca)}
                    />
                    <Label htmlFor={`marca-${marca}`}>{marca}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtros adicionales */}
          <div className="space-y-4">
            <h3 className="font-medium">Filtros adicionales</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="vencimiento-revision" 
                checked={filters.vencimiento_revision}
                onCheckedChange={(checked) => 
                  handleFilterChange('vencimiento_revision', Boolean(checked))
                }
              />
              <Label htmlFor="vencimiento-revision">Revisión técnica vencida</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="tiene-genset" 
                checked={filters.tiene_genset}
                onCheckedChange={(checked) => 
                  handleFilterChange('tiene_genset', Boolean(checked))
                }
              />
              <Label htmlFor="tiene-genset">Tiene genset</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="asignado" 
                checked={filters.asignado === true}
                onCheckedChange={(checked) => 
                  handleFilterChange('asignado', checked === true ? true : (checked === false ? false : undefined))
                }
              />
              <Label htmlFor="asignado">Asignado a vehículo</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="no-asignado" 
                checked={filters.asignado === false}
                onCheckedChange={(checked) => 
                  handleFilterChange('asignado', checked === true ? false : undefined)
                }
              />
              <Label htmlFor="no-asignado">No asignado</Label>
            </div>
          </div>

          {/* Filtro por rango de años */}
          <div className="space-y-4">
            <h3 className="font-medium">Rango de años</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="anio-desde">Desde</Label>
                <Input 
                  id="anio-desde" 
                  type="number" 
                  placeholder="Ej: 2010"
                  value={filters.anio_desde || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : Number(e.target.value);
                    handleFilterChange('anio_desde', value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anio-hasta">Hasta</Label>
                <Input 
                  id="anio-hasta" 
                  type="number" 
                  placeholder="Ej: 2023"
                  value={filters.anio_hasta || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : Number(e.target.value);
                    handleFilterChange('anio_hasta', value);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handleResetFilters}>
            Limpiar filtros
          </Button>
          <Button onClick={handleApplyFilters}>
            Aplicar filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 