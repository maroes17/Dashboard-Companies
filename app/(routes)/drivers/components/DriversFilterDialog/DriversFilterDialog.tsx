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

export interface DriversFilter {
  estado?: string[];
  tipo_licencia?: string[];
  vencimiento_proxima?: boolean;
  vencimiento_vencida?: boolean;
  nacionalidad?: string[];
  fecha_ingreso_desde?: string;
  fecha_ingreso_hasta?: string;
}

interface DriversFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: DriversFilter;
  onApplyFilters: (filters: DriversFilter) => void;
}

// Lista de nacionalidades disponibles
const NACIONALIDADES = ["Chilena", "Argentina", "Brasileña"];

export function DriversFilterDialog({ 
  open, 
  onOpenChange, 
  activeFilters, 
  onApplyFilters 
}: DriversFilterDialogProps) {
  const [filters, setFilters] = useState<DriversFilter>({
    estado: [],
    tipo_licencia: [],
    vencimiento_proxima: false,
    vencimiento_vencida: false,
    nacionalidad: [],
    fecha_ingreso_desde: "",
    fecha_ingreso_hasta: ""
  });

  // Cargar filtros activos al abrir el diálogo
  useEffect(() => {
    if (open) {
      setFilters({
        estado: activeFilters.estado || [],
        tipo_licencia: activeFilters.tipo_licencia || [],
        vencimiento_proxima: activeFilters.vencimiento_proxima || false,
        vencimiento_vencida: activeFilters.vencimiento_vencida || false,
        nacionalidad: activeFilters.nacionalidad || [],
        fecha_ingreso_desde: activeFilters.fecha_ingreso_desde || "",
        fecha_ingreso_hasta: activeFilters.fecha_ingreso_hasta || ""
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

  // Manejar cambios en tipo de licencia
  const handleTipoLicenciaChange = (tipo: string) => {
    setFilters(prev => {
      if (prev.tipo_licencia?.includes(tipo)) {
        return {
          ...prev,
          tipo_licencia: prev.tipo_licencia.filter(t => t !== tipo)
        };
      } else {
        return {
          ...prev,
          tipo_licencia: [...(prev.tipo_licencia || []), tipo]
        };
      }
    });
  };

  // Manejar cambios en checkboxes
  const handleCheckboxChange = (field: 'vencimiento_proxima' | 'vencimiento_vencida', checked: boolean) => {
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

  // Manejar cambio en nacionalidad
  const handleNacionalidadChange = (nacionalidad: string) => {
    setFilters(prev => {
      if (prev.nacionalidad?.includes(nacionalidad)) {
        return {
          ...prev,
          nacionalidad: prev.nacionalidad.filter(n => n !== nacionalidad)
        };
      } else {
        return {
          ...prev,
          nacionalidad: [...(prev.nacionalidad || []), nacionalidad]
        };
      }
    });
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      estado: [],
      tipo_licencia: [],
      vencimiento_proxima: false,
      vencimiento_vencida: false,
      nacionalidad: [],
      fecha_ingreso_desde: "",
      fecha_ingreso_hasta: ""
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
          <DialogTitle>Filtrar Choferes</DialogTitle>
          <DialogDescription>
            Selecciona los criterios para filtrar la lista de choferes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Estado */}
          <div className="space-y-3">
            <Label>Estado</Label>
            <div className="flex flex-wrap gap-2">
              {["activo", "inactivo", "suspendido"].map((estado) => (
                <Button
                  key={estado}
                  type="button"
                  size="sm"
                  variant={filters.estado?.includes(estado) ? "default" : "outline"}
                  onClick={() => handleEstadoChange(estado)}
                  className="capitalize"
                >
                  {estado}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Tipo de Licencia */}
          <div className="space-y-3">
            <Label>Tipo de Licencia</Label>
            <div className="flex flex-wrap gap-2">
              {["A-1", "A-2", "A-3", "A-4", "A-5"].map((tipo) => (
                <Button
                  key={tipo}
                  type="button"
                  size="sm"
                  variant={filters.tipo_licencia?.includes(tipo) ? "default" : "outline"}
                  onClick={() => handleTipoLicenciaChange(tipo)}
                >
                  {tipo}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Vencimientos */}
          <div className="space-y-3">
            <Label>Vencimiento de Licencia</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencimiento_proxima" 
                  checked={filters.vencimiento_proxima} 
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('vencimiento_proxima', checked === true)
                  }
                />
                <label
                  htmlFor="vencimiento_proxima"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Próximos a vencer (30 días)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencimiento_vencida" 
                  checked={filters.vencimiento_vencida}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('vencimiento_vencida', checked === true)
                  }
                />
                <label
                  htmlFor="vencimiento_vencida"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Licencias vencidas
                </label>
              </div>
            </div>
          </div>
          
          {/* Nacionalidad */}
          <div className="space-y-3">
            <Label>Nacionalidad</Label>
            <div className="flex flex-wrap gap-2">
              {NACIONALIDADES.map((nacionalidad) => (
                <Button
                  key={nacionalidad}
                  type="button"
                  size="sm"
                  variant={filters.nacionalidad?.includes(nacionalidad) ? "default" : "outline"}
                  onClick={() => handleNacionalidadChange(nacionalidad)}
                >
                  {nacionalidad}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Fecha de Ingreso */}
          <div className="space-y-3">
            <Label>Fecha de Ingreso</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_ingreso_desde" className="text-xs">Desde</Label>
                <Input
                  id="fecha_ingreso_desde"
                  type="date"
                  value={filters.fecha_ingreso_desde}
                  onChange={(e) => handleDateChange('fecha_ingreso_desde', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_ingreso_hasta" className="text-xs">Hasta</Label>
                <Input
                  id="fecha_ingreso_hasta"
                  type="date"
                  value={filters.fecha_ingreso_hasta}
                  onChange={(e) => handleDateChange('fecha_ingreso_hasta', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center">
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
            <Button type="button" onClick={handleApplyFilters}>
              Aplicar Filtros
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 