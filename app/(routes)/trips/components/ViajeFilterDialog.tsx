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
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase, Viaje, Localidad } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { DateRangePickerInput } from "./ui/DateRangePickerInput";
import { Loader2 } from "lucide-react";
import { mockLocalidades } from "../utils/mock-data";

// Definir la interfaz ViajeFilter
interface ViajeFilter {
  tipo_viaje?: string[];
  estado?: string[];
  prioridad?: string[];
  id_origen?: number[];
  id_destino?: number[];
  id_cliente?: number[];
  fecha_salida?: DateRange;
  fecha_llegada?: DateRange;
}

interface ViajeFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: ViajeFilter) => void;
  activeFilters: ViajeFilter;
}

export function ViajeFilterDialog({
  open,
  onOpenChange,
  onApplyFilters,
  activeFilters,
}: ViajeFilterDialogProps) {
  const [filters, setFilters] = useState<ViajeFilter>(activeFilters);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [clientes, setClientes] = useState<{id_cliente: number, razon_social: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fechas
  const [fechaSalidaRange, setFechaSalidaRange] = useState<DateRange | undefined>(
    activeFilters.fecha_salida
  );
  const [fechaLlegadaRange, setFechaLlegadaRange] = useState<DateRange | undefined>(
    activeFilters.fecha_llegada
  );

  // Cargar datos iniciales
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoading(true);
      try {
        // Cargar localidades
        const { data: localidadesData, error: localidadesError } = await supabase
          .from('localidades')
          .select('*')
          .order('nombre');
          
        if (localidadesError) {
          console.error("Error al cargar localidades:", localidadesError);
          // Usar datos de muestra si hay un error
          setLocalidades(mockLocalidades);
        } else if (localidadesData && localidadesData.length > 0) {
          setLocalidades(localidadesData);
        } else {
          // Si no hay datos, usar datos de muestra
          setLocalidades(mockLocalidades);
        }
        
        // Cargar clientes
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('id_cliente, razon_social')
          .eq('estado', 'activo')
          .order('razon_social');
          
        if (clientesError) {
          console.error("Error al cargar clientes:", clientesError);
        } else if (clientesData) {
          setClientes(clientesData);
        }
      } catch (error) {
        console.error("Error al cargar opciones de filtro:", error);
        // Asegurar que siempre haya localidades disponibles usando datos de muestra
        setLocalidades(mockLocalidades);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (open) {
      fetchFilterOptions();
    }
  }, [open]);

  // Reiniciar filtros al abrir el diálogo
  useEffect(() => {
    if (open) {
      setFilters(activeFilters);
      setFechaSalidaRange(activeFilters.fecha_salida);
      setFechaLlegadaRange(activeFilters.fecha_llegada);
    }
  }, [open, activeFilters]);

  const handleCheckboxChange = (field: keyof ViajeFilter, value: string | number) => {
    setFilters(prev => {
      const currentValues = prev[field] as (string[] | number[]) || [];
      const isChecked = currentValues.includes(value);
      
      // Si está marcado, lo quitamos. Si no, lo agregamos
      const newValues = isChecked
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [field]: newValues.length > 0 ? newValues : undefined
      };
    });
  };

  const isChecked = (field: keyof ViajeFilter, value: string | number) => {
    return (filters[field] as (string[] | number[]) || []).includes(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Crear objeto de filtros con los rangos de fechas
    const updatedFilters = {
      ...filters,
      fecha_salida: fechaSalidaRange,
      fecha_llegada: fechaLlegadaRange,
    };
    
    onApplyFilters(updatedFilters);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtrar Viajes</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipos de Viaje */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tipo de Viaje</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="tipo_ida" 
                  checked={isChecked('tipo_viaje', 'ida')}
                  onCheckedChange={() => handleCheckboxChange('tipo_viaje', 'ida')}
                  disabled={isLoading}
                />
                <Label htmlFor="tipo_ida">Ida</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="tipo_vuelta" 
                  checked={isChecked('tipo_viaje', 'vuelta')}
                  onCheckedChange={() => handleCheckboxChange('tipo_viaje', 'vuelta')}
                  disabled={isLoading}
                />
                <Label htmlFor="tipo_vuelta">Vuelta</Label>
              </div>
            </div>
          </div>

          {/* Estados */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Estado</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="estado_planificado" 
                  checked={isChecked('estado', 'planificado')}
                  onCheckedChange={() => handleCheckboxChange('estado', 'planificado')}
                  disabled={isLoading}
                />
                <Label htmlFor="estado_planificado">Planificado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="estado_en_ruta" 
                  checked={isChecked('estado', 'en_ruta')}
                  onCheckedChange={() => handleCheckboxChange('estado', 'en_ruta')}
                  disabled={isLoading}
                />
                <Label htmlFor="estado_en_ruta">En Ruta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="estado_incidente" 
                  checked={isChecked('estado', 'incidente')}
                  onCheckedChange={() => handleCheckboxChange('estado', 'incidente')}
                  disabled={isLoading}
                />
                <Label htmlFor="estado_incidente">Incidente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="estado_realizado" 
                  checked={isChecked('estado', 'realizado')}
                  onCheckedChange={() => handleCheckboxChange('estado', 'realizado')}
                  disabled={isLoading}
                />
                <Label htmlFor="estado_realizado">Realizado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="estado_cancelado" 
                  checked={isChecked('estado', 'cancelado')}
                  onCheckedChange={() => handleCheckboxChange('estado', 'cancelado')}
                  disabled={isLoading}
                />
                <Label htmlFor="estado_cancelado">Cancelado</Label>
              </div>
            </div>
          </div>

          {/* Prioridad */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Prioridad</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="prioridad_baja" 
                  checked={isChecked('prioridad', 'baja')}
                  onCheckedChange={() => handleCheckboxChange('prioridad', 'baja')}
                  disabled={isLoading}
                />
                <Label htmlFor="prioridad_baja">Baja</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="prioridad_media" 
                  checked={isChecked('prioridad', 'media')}
                  onCheckedChange={() => handleCheckboxChange('prioridad', 'media')}
                  disabled={isLoading}
                />
                <Label htmlFor="prioridad_media">Media</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="prioridad_alta" 
                  checked={isChecked('prioridad', 'alta')}
                  onCheckedChange={() => handleCheckboxChange('prioridad', 'alta')}
                  disabled={isLoading}
                />
                <Label htmlFor="prioridad_alta">Alta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="prioridad_urgente" 
                  checked={isChecked('prioridad', 'urgente')}
                  onCheckedChange={() => handleCheckboxChange('prioridad', 'urgente')}
                  disabled={isLoading}
                />
                <Label htmlFor="prioridad_urgente">Urgente</Label>
              </div>
            </div>
          </div>

          {/* Localidades */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Origen</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando localidades...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 max-h-[150px] overflow-y-auto">
                {localidades.map((localidad) => (
                  <div key={`origen-${localidad.id_localidad}`} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`origen-${localidad.id_localidad}`} 
                      checked={isChecked('id_origen', localidad.id_localidad)}
                      onCheckedChange={() => handleCheckboxChange('id_origen', localidad.id_localidad)}
                    />
                    <Label htmlFor={`origen-${localidad.id_localidad}`}>
                      {localidad.nombre}, {localidad.pais}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Destino</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando localidades...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 max-h-[150px] overflow-y-auto">
                {localidades.map((localidad) => (
                  <div key={`destino-${localidad.id_localidad}`} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`destino-${localidad.id_localidad}`} 
                      checked={isChecked('id_destino', localidad.id_localidad)}
                      onCheckedChange={() => handleCheckboxChange('id_destino', localidad.id_localidad)}
                    />
                    <Label htmlFor={`destino-${localidad.id_localidad}`}>
                      {localidad.nombre}, {localidad.pais}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clientes */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Cliente</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando clientes...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 max-h-[150px] overflow-y-auto">
                {clientes.map((cliente) => (
                  <div key={cliente.id_cliente} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`cliente-${cliente.id_cliente}`} 
                      checked={isChecked('id_cliente', cliente.id_cliente)}
                      onCheckedChange={() => handleCheckboxChange('id_cliente', cliente.id_cliente)}
                    />
                    <Label htmlFor={`cliente-${cliente.id_cliente}`} className="truncate">
                      {cliente.razon_social}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="space-y-4">
            <DateRangePickerInput
              id="fecha_salida"
              label="Rango de Fechas de Salida"
              dateRange={fechaSalidaRange}
              onChange={setFechaSalidaRange}
              disabled={isLoading}
            />
            
            <DateRangePickerInput
              id="fecha_llegada"
              label="Rango de Fechas de Llegada"
              dateRange={fechaLlegadaRange}
              onChange={setFechaLlegadaRange}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 