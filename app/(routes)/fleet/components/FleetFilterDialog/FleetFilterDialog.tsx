"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { X } from "lucide-react";

export interface FleetFilter {
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

interface FleetFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: FleetFilter;
  onApplyFilters: (filters: FleetFilter) => void;
}

export function FleetFilterDialog({ 
  open, 
  onOpenChange, 
  activeFilters, 
  onApplyFilters 
}: FleetFilterDialogProps) {
  const [filters, setFilters] = useState<FleetFilter>({
    estado: [],
    tipo: [],
    categoria: [],
    vencimiento_prox_revision: false,
    vencimiento_vencida_revision: false,
    vencimiento_prox_permiso: false,
    vencimiento_vencido_permiso: false,
    vencimiento_prox_seguro: false,
    vencimiento_vencido_seguro: false,
    fecha_ingreso_desde: "",
    fecha_ingreso_hasta: "",
    km_superior: undefined,
    km_inferior: undefined
  });

  // Cargar filtros activos al abrir el diálogo
  useEffect(() => {
    if (open) {
      setFilters({
        estado: activeFilters.estado || [],
        tipo: activeFilters.tipo || [],
        categoria: activeFilters.categoria || [],
        vencimiento_prox_revision: activeFilters.vencimiento_prox_revision || false,
        vencimiento_vencida_revision: activeFilters.vencimiento_vencida_revision || false,
        vencimiento_prox_permiso: activeFilters.vencimiento_prox_permiso || false,
        vencimiento_vencido_permiso: activeFilters.vencimiento_vencido_permiso || false,
        vencimiento_prox_seguro: activeFilters.vencimiento_prox_seguro || false,
        vencimiento_vencido_seguro: activeFilters.vencimiento_vencido_seguro || false,
        fecha_ingreso_desde: activeFilters.fecha_ingreso_desde || "",
        fecha_ingreso_hasta: activeFilters.fecha_ingreso_hasta || "",
        km_superior: activeFilters.km_superior,
        km_inferior: activeFilters.km_inferior
      });
    }
  }, [open, activeFilters]);

  // Manejar cambios en estado
  const handleEstadoChange = (estado: string) => {
    setFilters(prev => {
      if (prev.estado?.includes(estado)) {
        return {
          ...prev,
          estado: prev.estado.filter(e => e !== estado)
        };
      } else {
        return {
          ...prev,
          estado: [...(prev.estado || []), estado]
        };
      }
    });
  };

  // Manejar cambios en tipo
  const handleTipoChange = (tipo: string) => {
    setFilters(prev => {
      if (prev.tipo?.includes(tipo)) {
        return {
          ...prev,
          tipo: prev.tipo.filter(t => t !== tipo)
        };
      } else {
        return {
          ...prev,
          tipo: [...(prev.tipo || []), tipo]
        };
      }
    });
  };

  // Manejar cambios en categoría
  const handleCategoriaChange = (categoria: string) => {
    setFilters(prev => {
      if (prev.categoria?.includes(categoria)) {
        return {
          ...prev,
          categoria: prev.categoria.filter(c => c !== categoria)
        };
      } else {
        return {
          ...prev,
          categoria: [...(prev.categoria || []), categoria]
        };
      }
    });
  };

  // Manejar cambios en checkboxes de vencimientos
  const handleCheckboxChange = (field: keyof FleetFilter, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  // Manejar cambios en fechas
  const handleDateChange = (field: 'fecha_ingreso_desde' | 'fecha_ingreso_hasta', value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar cambios en kilometraje
  const handleKmChange = (field: 'km_superior' | 'km_inferior', value: string) => {
    const numValue = value.trim() === '' ? undefined : Number(value);
    setFilters(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      estado: [],
      tipo: [],
      categoria: [],
      vencimiento_prox_revision: false,
      vencimiento_vencida_revision: false,
      vencimiento_prox_permiso: false,
      vencimiento_vencido_permiso: false,
      vencimiento_prox_seguro: false,
      vencimiento_vencido_seguro: false,
      fecha_ingreso_desde: "",
      fecha_ingreso_hasta: "",
      km_superior: undefined,
      km_inferior: undefined
    });
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtrar Flota</DialogTitle>
          <DialogDescription>
            Selecciona los criterios para filtrar la lista de vehículos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Estado */}
          <div className="space-y-3">
            <Label>Estado</Label>
            <div className="flex flex-wrap gap-2">
              {["activo", "inactivo", "mantenimiento", "en_reparacion", "dado_de_baja"].map((estado) => (
                <Button
                  key={estado}
                  type="button"
                  size="sm"
                  variant={filters.estado?.includes(estado) ? "default" : "outline"}
                  onClick={() => handleEstadoChange(estado)}
                  className="capitalize"
                >
                  {estado.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Tipo */}
          <div className="space-y-3">
            <Label>Tipo de Vehículo</Label>
            <div className="flex flex-wrap gap-2">
              {["Camión", "Camioneta", "Automóvil", "Maquinaria", "Bus", "Van"].map((tipo) => (
                <Button
                  key={tipo}
                  type="button"
                  size="sm"
                  variant={filters.tipo?.includes(tipo) ? "default" : "outline"}
                  onClick={() => handleTipoChange(tipo)}
                >
                  {tipo}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Categoría */}
          <div className="space-y-3">
            <Label>Categoría de Vehículo</Label>
            <div className="flex flex-wrap gap-2">
              {["Carga", "Pasajeros", "Maquinaria pesada", "Servicio", "Especial"].map((categoria) => (
                <Button
                  key={categoria}
                  type="button"
                  size="sm"
                  variant={filters.categoria?.includes(categoria) ? "default" : "outline"}
                  onClick={() => handleCategoriaChange(categoria)}
                >
                  {categoria}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Fechas de vencimiento */}
          <div className="space-y-3">
            <Label>Vencimientos</Label>
            <div className="grid gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencimiento_prox_revision" 
                  checked={filters.vencimiento_prox_revision}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('vencimiento_prox_revision', checked as boolean)
                  }
                />
                <label
                  htmlFor="vencimiento_prox_revision"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Revisión técnica próxima a vencer (30 días)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencimiento_vencida_revision" 
                  checked={filters.vencimiento_vencida_revision}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('vencimiento_vencida_revision', checked as boolean)
                  }
                />
                <label
                  htmlFor="vencimiento_vencida_revision"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Revisión técnica vencida
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencimiento_prox_permiso" 
                  checked={filters.vencimiento_prox_permiso}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('vencimiento_prox_permiso', checked as boolean)
                  }
                />
                <label
                  htmlFor="vencimiento_prox_permiso"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Permiso de circulación próximo a vencer (30 días)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencimiento_vencido_permiso" 
                  checked={filters.vencimiento_vencido_permiso}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('vencimiento_vencido_permiso', checked as boolean)
                  }
                />
                <label
                  htmlFor="vencimiento_vencido_permiso"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Permiso de circulación vencido
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencimiento_prox_seguro" 
                  checked={filters.vencimiento_prox_seguro}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('vencimiento_prox_seguro', checked as boolean)
                  }
                />
                <label
                  htmlFor="vencimiento_prox_seguro"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Seguro próximo a vencer (30 días)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencimiento_vencido_seguro" 
                  checked={filters.vencimiento_vencido_seguro}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('vencimiento_vencido_seguro', checked as boolean)
                  }
                />
                <label
                  htmlFor="vencimiento_vencido_seguro"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Seguro vencido
                </label>
              </div>
            </div>
          </div>
          
          {/* Fecha de ingreso */}
          <div className="space-y-3">
            <Label>Fecha de Ingreso</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_ingreso_desde" className="text-sm">Desde</Label>
                <Input
                  id="fecha_ingreso_desde"
                  type="date"
                  value={filters.fecha_ingreso_desde}
                  onChange={(e) => handleDateChange('fecha_ingreso_desde', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_ingreso_hasta" className="text-sm">Hasta</Label>
                <Input
                  id="fecha_ingreso_hasta"
                  type="date"
                  value={filters.fecha_ingreso_hasta}
                  onChange={(e) => handleDateChange('fecha_ingreso_hasta', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Kilometraje */}
          <div className="space-y-3">
            <Label>Kilometraje</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="km_superior" className="text-sm">Mayor a</Label>
                <Input
                  id="km_superior"
                  type="number"
                  min="0"
                  placeholder="Ej: 50000"
                  value={filters.km_superior !== undefined ? filters.km_superior : ''}
                  onChange={(e) => handleKmChange('km_superior', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="km_inferior" className="text-sm">Menor a</Label>
                <Input
                  id="km_inferior"
                  type="number"
                  min="0"
                  placeholder="Ej: 100000"
                  value={filters.km_inferior !== undefined ? filters.km_inferior : ''}
                  onChange={(e) => handleKmChange('km_inferior', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
          >
            Limpiar Filtros
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
            >
              Aplicar Filtros
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 