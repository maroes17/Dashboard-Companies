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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Fleet, Poliza, Semirremolque, supabase } from "@/lib/supabase";
import { AlertCircle, Calendar, CalendarIcon } from "lucide-react";
import { addYears, format, isAfter, isBefore, parseISO } from "date-fns";

interface NewPolizaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (poliza: Poliza) => Promise<void>;
}

export function NewPolizaDialog({
  open,
  onOpenChange,
  onSave,
}: NewPolizaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fleetOptions, setFleetOptions] = useState<Fleet[]>([]);
  const [semitrailerOptions, setSemitrailerOptions] = useState<Semirremolque[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Estado del formulario
  const [formData, setFormData] = useState<Omit<Poliza, 'id_poliza' | 'creado_en'>>({
    aplica_a: 'flota',
    patente: '',
    aseguradora: '',
    nro_poliza: '',
    vigencia_desde: format(new Date(), 'yyyy-MM-dd'),
    vigencia_hasta: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
    importe_pagado: undefined,
    fecha_pago: format(new Date(), 'yyyy-MM-dd'),
    estado: 'vigente',
    observaciones: ''
  });
  
  // Cargar opciones de vehículos y semirremolques
  useEffect(() => {
    if (open) {
      fetchFleetOptions();
      fetchSemitrailerOptions();
    }
  }, [open]);
  
  // Cargar vehículos de flota
  const fetchFleetOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('flota')
        .select('*')
        .order('patente');
      
      if (error) {
        console.error("Error al cargar opciones de flota:", error);
        return;
      }
      
      if (data) {
        setFleetOptions(data.map(item => ({
          id_flota: item.id_flota,
          tipo: item.tipo,
          categoria: item.categoria,
          subcategoria: item.subcategoria,
          patente: item.patente,
          nro_chasis: item.nro_chasis,
          marca: item.marca,
          modelo: item.modelo,
          anio: item.anio,
          capacidad: item.capacidad,
          estado: item.estado,
          fecha_ingreso: item.fecha_ingreso,
          id_chofer_asignado: item.id_chofer_asignado,
          km_actual: item.km_actual,
          km_ultimo_servicio: item.km_ultimo_servicio,
          km_proximo_servicio: item.km_proximo_servicio,
          fecha_ultima_mantencion: item.fecha_ultima_mantencion,
          fecha_proximo_mantenimiento: item.fecha_proximo_mantenimiento,
          vencimiento_revision_tecnica: item.vencimiento_revision_tecnica,
          vencimiento_permiso_circulacion: item.vencimiento_permiso_circulacion,
          vencimiento_seguro: item.vencimiento_seguro,
          consumo_promedio: item.consumo_promedio,
          origen: item.origen,
          observaciones: item.observaciones,
          creado_en: item.creado_en,
          actualizado_en: item.actualizado_en
        })));
      }
    } catch (error) {
      console.error("Error al cargar opciones de flota:", error);
    }
  };
  
  // Cargar semirremolques
  const fetchSemitrailerOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('semirremolques')
        .select('*')
        .order('patente');
      
      if (error) {
        console.error("Error al cargar opciones de semirremolques:", error);
        return;
      }
      
      if (data) {
        setSemitrailerOptions(data.map(item => ({
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
        })));
      }
    } catch (error) {
      console.error("Error al cargar opciones de semirremolques:", error);
    }
  };

  // Limpiar el formulario cuando se abre o cierra el diálogo
  useEffect(() => {
    if (open) {
      // Inicializar con valores por defecto
      setFormData({
        aplica_a: 'flota',
        patente: '',
        aseguradora: '',
        nro_poliza: '',
        vigencia_desde: format(new Date(), 'yyyy-MM-dd'),
        vigencia_hasta: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
        importe_pagado: undefined,
        fecha_pago: format(new Date(), 'yyyy-MM-dd'),
        estado: 'vigente',
        observaciones: ''
      });
      setFormErrors({});
    }
  }, [open]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores cuando el usuario modifica el campo
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Actualización automática de la fecha de fin basada en el cambio de fecha de inicio
    if (field === 'vigencia_desde' && value) {
      try {
        const fechaDesde = parseISO(value);
        const fechaHasta = addYears(fechaDesde, 1);
        setFormData(prev => ({
          ...prev,
          vigencia_hasta: format(fechaHasta, 'yyyy-MM-dd')
        }));
      } catch (error) {
        console.error("Error al calcular fecha de fin:", error);
      }
    }
  };

  // Validar el formulario
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.aplica_a) {
      errors.aplica_a = "Debes seleccionar a qué se aplica la póliza";
    }
    
    if (!formData.patente) {
      errors.patente = "Debes seleccionar un vehículo o semirremolque";
    }
    
    if (!formData.aseguradora) {
      errors.aseguradora = "Debes seleccionar una aseguradora";
    }
    
    if (!formData.nro_poliza) {
      errors.nro_poliza = "Debes ingresar el número de póliza";
    }
    
    if (!formData.vigencia_desde) {
      errors.vigencia_desde = "Debes seleccionar la fecha de inicio de vigencia";
    }
    
    if (!formData.vigencia_hasta) {
      errors.vigencia_hasta = "Debes seleccionar la fecha de fin de vigencia";
    } else if (formData.vigencia_desde && isBefore(parseISO(formData.vigencia_hasta), parseISO(formData.vigencia_desde))) {
      errors.vigencia_hasta = "La fecha de fin debe ser posterior a la fecha de inicio";
    }
    
    if (formData.importe_pagado !== undefined && formData.importe_pagado !== null && formData.importe_pagado < 0) {
      errors.importe_pagado = "El importe no puede ser negativo";
    }
    
    setFormErrors(errors);
    
    return Object.keys(errors).length === 0;
  };

  // Manejar el envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      await onSave(formData as Poliza);
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar la póliza:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Póliza</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Tipo de unidad (flota o semirremolque) */}
          <div className="space-y-2">
            <Label htmlFor="aplica_a">Tipo de unidad</Label>
            <Select
              value={formData.aplica_a}
              onValueChange={(value) => handleInputChange('aplica_a', value)}
            >
              <SelectTrigger id="aplica_a" className={formErrors.aplica_a ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona el tipo de unidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flota">Vehículo</SelectItem>
                <SelectItem value="semirremolque">Semirremolque</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.aplica_a && (
              <p className="text-sm text-red-500">{formErrors.aplica_a}</p>
            )}
          </div>
          
          {/* Patente del vehículo o semirremolque */}
          <div className="space-y-2">
            <Label htmlFor="patente">Unidad</Label>
            <Select
              value={formData.patente}
              onValueChange={(value) => handleInputChange('patente', value)}
              disabled={
                (formData.aplica_a === 'flota' && fleetOptions.length === 0) ||
                (formData.aplica_a === 'semirremolque' && semitrailerOptions.length === 0)
              }
            >
              <SelectTrigger id="patente" className={formErrors.patente ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona la unidad" />
              </SelectTrigger>
              <SelectContent>
                {formData.aplica_a === 'flota' 
                  ? fleetOptions.map((vehicle) => (
                      <SelectItem key={vehicle.id_flota} value={vehicle.patente}>
                        {vehicle.patente} - {vehicle.marca} {vehicle.modelo}
                      </SelectItem>
                    ))
                  : semitrailerOptions.map((semitrailer) => (
                      <SelectItem key={semitrailer.id_semirremolque} value={semitrailer.patente}>
                        {semitrailer.patente} - {semitrailer.marca || ''} {semitrailer.modelo || ''}
                      </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
            {formErrors.patente && (
              <p className="text-sm text-red-500">{formErrors.patente}</p>
            )}
          </div>
          
          {/* Datos de la póliza */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aseguradora">Aseguradora</Label>
              <Select
                value={formData.aseguradora}
                onValueChange={(value) => handleInputChange('aseguradora', value)}
              >
                <SelectTrigger id="aseguradora" className={formErrors.aseguradora ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecciona la aseguradora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HDI">HDI</SelectItem>
                  <SelectItem value="Mapfre">Mapfre</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.aseguradora && (
                <p className="text-sm text-red-500">{formErrors.aseguradora}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nro_poliza">Número de póliza</Label>
              <Input
                id="nro_poliza"
                value={formData.nro_poliza}
                onChange={(e) => handleInputChange('nro_poliza', e.target.value)}
                className={formErrors.nro_poliza ? "border-red-500" : ""}
              />
              {formErrors.nro_poliza && (
                <p className="text-sm text-red-500">{formErrors.nro_poliza}</p>
              )}
            </div>
          </div>
          
          {/* Fechas de vigencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vigencia_desde">Vigencia desde</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vigencia_desde"
                  type="date"
                  value={formData.vigencia_desde}
                  onChange={(e) => handleInputChange('vigencia_desde', e.target.value)}
                  className={`pl-8 ${formErrors.vigencia_desde ? "border-red-500" : ""}`}
                />
              </div>
              {formErrors.vigencia_desde && (
                <p className="text-sm text-red-500">{formErrors.vigencia_desde}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vigencia_hasta">Vigencia hasta</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vigencia_hasta"
                  type="date"
                  value={formData.vigencia_hasta}
                  onChange={(e) => handleInputChange('vigencia_hasta', e.target.value)}
                  className={`pl-8 ${formErrors.vigencia_hasta ? "border-red-500" : ""}`}
                />
              </div>
              {formErrors.vigencia_hasta && (
                <p className="text-sm text-red-500">{formErrors.vigencia_hasta}</p>
              )}
            </div>
          </div>
          
          {/* Datos de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="importe_pagado">Importe pagado</Label>
              <Input
                id="importe_pagado"
                type="number"
                min="0"
                step="0.01"
                value={formData.importe_pagado?.toString() || ''}
                onChange={(e) => handleInputChange('importe_pagado', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                className={formErrors.importe_pagado ? "border-red-500" : ""}
              />
              {formErrors.importe_pagado && (
                <p className="text-sm text-red-500">{formErrors.importe_pagado}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fecha_pago">Fecha de pago</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fecha_pago"
                  type="date"
                  value={formData.fecha_pago}
                  onChange={(e) => handleInputChange('fecha_pago', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          
          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) => handleInputChange('estado', value)}
            >
              <SelectTrigger id="estado">
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vigente">Vigente</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
                <SelectItem value="renovada">Renovada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              rows={3}
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 