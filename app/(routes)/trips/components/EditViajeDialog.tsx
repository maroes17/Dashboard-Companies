import { useState, useEffect } from "react";
import { Viaje, Localidad, Cliente, Driver, Fleet, Semirremolque, supabase } from "@/lib/supabase";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DatePickerInput } from "./ui/DatePickerInput";
import { Loader2 } from "lucide-react";
import { mockLocalidades } from "../utils/mock-data";

interface EditViajeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viaje: Viaje | null;
  onSave: (viaje: Viaje) => Promise<void>;
}

export function EditViajeDialog({
  open,
  onOpenChange,
  viaje,
  onSave,
}: EditViajeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [conductores, setConductores] = useState<Driver[]>([]);
  const [vehiculos, setVehiculos] = useState<Fleet[]>([]);
  const [semirremolques, setSemirremolques] = useState<Semirremolque[]>([]);
  
  const [formData, setFormData] = useState<Viaje | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [salidaDate, setSalidaDate] = useState<Date | null>(null);
  const [llegadaDate, setLlegadaDate] = useState<Date | null>(null);
  const [salidaRealDate, setSalidaRealDate] = useState<Date | null>(null);
  const [llegadaRealDate, setLlegadaRealDate] = useState<Date | null>(null);

  // Inicializar formulario cuando se abre el diálogo y se tiene un viaje
  useEffect(() => {
    if (open && viaje) {
      setFormData(viaje);
      
      // Inicializar fechas
      if (viaje.fecha_salida_programada) {
        setSalidaDate(new Date(viaje.fecha_salida_programada));
      }
      if (viaje.fecha_llegada_programada) {
        setLlegadaDate(new Date(viaje.fecha_llegada_programada));
      }
      if (viaje.fecha_salida_real) {
        setSalidaRealDate(new Date(viaje.fecha_salida_real));
      }
      if (viaje.fecha_llegada_real) {
        setLlegadaRealDate(new Date(viaje.fecha_llegada_real));
      }
      
      fetchInitialData();
    }
  }, [open, viaje]);

  const fetchInitialData = async () => {
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
        .select('*')
        .order('razon_social');
      
      if (clientesError) {
        console.error("Error al cargar clientes:", clientesError);
      } else if (clientesData) {
        setClientes(clientesData);
      }

      // Cargar conductores
      const { data: conductoresData, error: conductoresError } = await supabase
        .from('choferes')
        .select('*')
        .order('nombre_completo');
      
      if (conductoresError) {
        console.error("Error al cargar conductores:", conductoresError);
      } else if (conductoresData) {
        setConductores(conductoresData);
      }

      // Cargar vehículos
      const { data: vehiculosData, error: vehiculosError } = await supabase
        .from('flota')
        .select('*')
        .order('patente');
      
      if (vehiculosError) {
        console.error("Error al cargar vehículos:", vehiculosError);
      } else if (vehiculosData) {
        setVehiculos(vehiculosData);
      }

      // Cargar semirremolques
      const { data: semirremolquesData, error: semirremolquesError } = await supabase
        .from('semirremolques')
        .select('*')
        .order('patente');
      
      if (semirremolquesError) {
        console.error("Error al cargar semirremolques:", semirremolquesError);
      } else if (semirremolquesData) {
        setSemirremolques(semirremolquesData);
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      // Asegurar que siempre haya localidades disponibles usando datos de muestra
      setLocalidades(mockLocalidades);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener el vehículo y semirremolque asociados a un conductor
  const fetchDriverVehicleInfo = async (driverId: number) => {
    try {
      console.log("🔍 Buscando vehículo asignado al conductor ID:", driverId);
      
      // Buscar vehículo asignado al conductor
      const { data: vehiculoData, error: vehiculoError } = await supabase
        .from('flota')
        .select('*')
        .eq('id_chofer_asignado', driverId)
        .eq('estado', 'activo');
      
      if (vehiculoError) {
        console.error("❌ Error al buscar vehículo del conductor:", vehiculoError.message || vehiculoError);
        return { vehiculo: null, semirremolque: null };
      }
      
      // Si no hay vehículo o hay más de uno, manejar adecuadamente
      if (!vehiculoData || vehiculoData.length === 0) {
        console.log("⚠️ No se encontró ningún vehículo asignado al conductor ID:", driverId);
        return { vehiculo: null, semirremolque: null };
      }
      
      // Tomar el primer vehículo si hay más de uno asignado
      const vehiculo = vehiculoData[0];
      if (vehiculoData.length > 1) {
        console.log(`⚠️ El conductor tiene ${vehiculoData.length} vehículos asignados. Se usará el primero:`, vehiculo.patente);
      } else {
        console.log("✅ Vehículo encontrado:", vehiculo.patente, "ID:", vehiculo.id_flota);
      }
      
      let semirremolqueData = null;
      
      // Si encontramos un vehículo, buscamos el semirremolque vinculado a ese vehículo
      if (vehiculo) {
        console.log("🔍 Buscando semirremolque asignado al vehículo ID:", vehiculo.id_flota);
        
        const { data: semiData, error: semiError } = await supabase
          .from('semirremolques')
          .select('*')
          .eq('asignado_a_flota_id', vehiculo.id_flota)
          .eq('estado', 'activo');
        
        if (semiError) {
          console.error("❌ Error al buscar semirremolque del vehículo:", semiError.message || semiError);
        } else if (!semiData || semiData.length === 0) {
          console.log("⚠️ No se encontró ningún semirremolque asignado al vehículo", vehiculo.patente);
        } else if (semiData.length > 0) {
          // Tomar el primer semirremolque si hay varios
          semirremolqueData = semiData[0];
          
          if (semiData.length > 1) {
            console.log(`⚠️ El vehículo tiene ${semiData.length} semirremolques asignados. Se usará el primero:`, semirremolqueData.patente);
          } else {
            console.log("✅ Semirremolque encontrado:", semirremolqueData.patente, "ID:", semirremolqueData.id_semirremolque);
          }
        }
      }
      
      return {
        vehiculo: vehiculo || null,
        semirremolque: semirremolqueData || null
      };
    } catch (error) {
      console.error("❌ Error al obtener vehículo y semirremolque del conductor:", 
        error instanceof Error ? error.message : error);
      return { vehiculo: null, semirremolque: null };
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
    
    // Limpiar errores al editar
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = async (field: string, value: string | number) => {
    if (!formData) return;
    
    // Convertir a número si es necesario
    const processedValue = ['id_origen', 'id_destino', 'id_cliente', 'id_chofer', 'id_flota', 'id_semirremolque'].includes(field)
      ? Number(value)
      : value;

    setFormData(prev => prev ? { ...prev, [field]: processedValue } : null);
    
    // Limpiar errores al editar
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Si se seleccionó un conductor, buscar su vehículo y semirremolque asociados
    if (field === 'id_chofer') {
      try {
        setIsLoading(true);
        
        // Si hay un conductor (valor diferente de 0), establecer estado "en_ruta", de lo contrario "pendiente"
        // Solo actualizamos si el estado actual no es "incidente", "completado" o "cancelado"
        if (formData?.estado !== 'incidente' && formData?.estado !== 'completado' && formData?.estado !== 'cancelado') {
          const nuevoEstado = typeof processedValue === 'number' && processedValue > 0 ? "en_ruta" : "pendiente";
          setFormData(prev => prev ? { ...prev, estado: nuevoEstado } : null);
          console.log(`🔄 Estado actualizado automáticamente a: ${nuevoEstado}`);
        }
        
        if (typeof processedValue === 'number' && processedValue > 0) {
          // Buscar el conductor seleccionado para mostrar su nombre en los logs
          const conductorSeleccionado = conductores.find(c => c.id_chofer === processedValue);
          console.log(`🔄 Se seleccionó al conductor: ${conductorSeleccionado?.nombre_completo || 'Desconocido'} (ID: ${processedValue})`);
          console.log("🔄 Buscando vehículo y semirremolque asociados...");
          
          const { vehiculo, semirremolque } = await fetchDriverVehicleInfo(processedValue);
          
          if (vehiculo) {
            console.log(`✅ Se asignó automáticamente el vehículo: ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`);
            setFormData(prev => prev ? { 
              ...prev, 
              id_flota: vehiculo.id_flota 
            } : null);
          } else {
            console.log("⚠️ No se encontró vehículo asignado al conductor - No se realizó asignación automática");
            // Limpiar el campo de vehículo si no hay ninguno asignado
            setFormData(prev => prev ? { 
              ...prev, 
              id_flota: undefined
            } : null);
          }
          
          if (semirremolque) {
            console.log(`✅ Se asignó automáticamente el semirremolque: ${semirremolque.patente}`);
            setFormData(prev => prev ? { 
              ...prev, 
              id_semirremolque: semirremolque.id_semirremolque 
            } : null);
          } else {
            console.log("⚠️ No se encontró semirremolque asociado - No se realizó asignación automática");
            // Limpiar el campo de semirremolque si no hay ninguno asignado
            setFormData(prev => prev ? { 
              ...prev, 
              id_semirremolque: undefined
            } : null);
          }
        } else {
          // Si se deseleccionó el conductor, limpiar vehículo y semirremolque
          setFormData(prev => prev ? { 
            ...prev, 
            id_flota: undefined,
            id_semirremolque: undefined
          } : null);
          console.log("⚠️ Se eliminó el conductor asignado - Se limpiaron vehículo y semirremolque");
        }
      } catch (error) {
        console.error("❌ Error al asignar vehículo y semirremolque:", 
          error instanceof Error ? error.message : error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSalidaDateChange = (date: Date | null) => {
    if (!formData || !date) return;
    
    setSalidaDate(date);
    setFormData(prev => prev ? { ...prev, fecha_salida_programada: date.toISOString() } : null);
    
    // Limpiar errores al editar
    if (validationErrors.fecha_salida_programada) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.fecha_salida_programada;
        return newErrors;
      });
    }
  };

  const handleLlegadaDateChange = (date: Date | null) => {
    if (!formData || !date) return;
    
    setLlegadaDate(date);
    setFormData(prev => prev ? { ...prev, fecha_llegada_programada: date.toISOString() } : null);
    
    // Limpiar errores al editar
    if (validationErrors.fecha_llegada_programada) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.fecha_llegada_programada;
        return newErrors;
      });
    }
  };

  const handleSalidaRealDateChange = (date: Date | null) => {
    if (!formData) return;
    
    setSalidaRealDate(date);
    
    // Si date es null, eliminar la propiedad fecha_salida_real
    if (date === null) {
      setFormData(prev => {
        if (!prev) return null;
        const newFormData = { ...prev };
        delete newFormData.fecha_salida_real;
        return newFormData;
      });
    } else {
      // Si date tiene valor, asignar el valor como string
      setFormData(prev => prev ? { 
        ...prev, 
        fecha_salida_real: date.toISOString() 
      } : null);
    }
  };

  const handleLlegadaRealDateChange = (date: Date | null) => {
    if (!formData) return;
    
    setLlegadaRealDate(date);
    
    // Si date es null, eliminar la propiedad fecha_llegada_real
    if (date === null) {
      setFormData(prev => {
        if (!prev) return null;
        const newFormData = { ...prev };
        delete newFormData.fecha_llegada_real;
        return newFormData;
      });
    } else {
      // Si date tiene valor, asignar el valor como string
      setFormData(prev => prev ? { 
        ...prev, 
        fecha_llegada_real: date.toISOString() 
      } : null);
    }
    
    // Limpiar errores al editar
    if (validationErrors.fecha_llegada_real) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.fecha_llegada_real;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    if (!formData) return false;
    
    const errors: Record<string, string> = {};
    
    if (!formData.id_origen) {
      errors.id_origen = "Debe seleccionar un origen";
    }
    
    if (!formData.id_destino) {
      errors.id_destino = "Debe seleccionar un destino";
    } else if (formData.id_destino === formData.id_origen) {
      errors.id_destino = "El destino debe ser diferente al origen";
    }
    
    if (new Date(formData.fecha_llegada_programada) <= new Date(formData.fecha_salida_programada)) {
      errors.fecha_llegada_programada = "La fecha de llegada debe ser posterior a la de salida";
    }
    
    // Validar fechas reales si están establecidas
    if (formData.fecha_salida_real && formData.fecha_llegada_real && 
        new Date(formData.fecha_llegada_real) <= new Date(formData.fecha_salida_real)) {
      errors.fecha_llegada_real = "La fecha de llegada real debe ser posterior a la de salida real";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData || !validateForm()) return;
    
    try {
      setIsLoading(true);
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error al actualizar viaje:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Si no hay datos de viaje, no mostrar nada
  if (!formData) return null;

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Viaje #{formData.nro_control || formData.id_viaje}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basico">Información Básica</TabsTrigger>
              <TabsTrigger value="detalles">Detalles</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>
            
            {/* Pestaña de Información Básica */}
            <TabsContent value="basico" className="space-y-4 mt-4">
              {/* Tipo de Viaje */}
              <div className="space-y-2">
                <Label htmlFor="tipo_viaje">Tipo de Viaje</Label>
                <Select
                  value={formData.tipo_viaje}
                  onValueChange={(value) => handleSelectChange('tipo_viaje', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de viaje" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ida">Ida</SelectItem>
                    <SelectItem value="vuelta">Vuelta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Origen y Destino */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_origen" className="flex items-center gap-1">
                    Origen
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.id_origen?.toString() || ""}
                    onValueChange={(value) => handleSelectChange('id_origen', value)}
                    disabled={isLoading || localidades.length === 0}
                  >
                    <SelectTrigger className={validationErrors.id_origen ? "border-destructive" : ""}>
                      <SelectValue placeholder={localidades.length === 0 ? "Cargando localidades..." : "Seleccionar origen"} />
                    </SelectTrigger>
                    <SelectContent>
                      {localidades.map((localidad) => (
                        <SelectItem 
                          key={localidad.id_localidad} 
                          value={localidad.id_localidad.toString()}
                        >
                          {localidad.nombre}, {localidad.pais}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.id_origen && (
                    <p className="text-destructive text-xs">{validationErrors.id_origen}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="id_destino" className="flex items-center gap-1">
                    Destino
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.id_destino?.toString() || ""}
                    onValueChange={(value) => handleSelectChange('id_destino', value)}
                    disabled={isLoading || localidades.length === 0}
                  >
                    <SelectTrigger className={validationErrors.id_destino ? "border-destructive" : ""}>
                      <SelectValue placeholder={localidades.length === 0 ? "Cargando localidades..." : "Seleccionar destino"} />
                    </SelectTrigger>
                    <SelectContent>
                      {localidades.map((localidad) => (
                        <SelectItem 
                          key={localidad.id_localidad} 
                          value={localidad.id_localidad.toString()}
                        >
                          {localidad.nombre}, {localidad.pais}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.id_destino && (
                    <p className="text-destructive text-xs">{validationErrors.id_destino}</p>
                  )}
                </div>
              </div>
              
              {/* Fechas Programadas */}
              <div className="grid grid-cols-2 gap-4">
                <DatePickerInput
                  id="fecha_salida_programada"
                  label="Fecha de Salida Programada"
                  date={salidaDate}
                  onChange={handleSalidaDateChange}
                  required
                  error={validationErrors.fecha_salida_programada}
                  disabled={isLoading}
                />
                
                <DatePickerInput
                  id="fecha_llegada_programada"
                  label="Fecha de Llegada Programada"
                  date={llegadaDate}
                  onChange={handleLlegadaDateChange}
                  required
                  error={validationErrors.fecha_llegada_programada}
                  disabled={isLoading}
                />
              </div>
              
              {/* Fechas Reales */}
              <div className="grid grid-cols-2 gap-4">
                <DatePickerInput
                  id="fecha_salida_real"
                  label="Fecha de Salida Real"
                  date={salidaRealDate}
                  onChange={handleSalidaRealDateChange}
                  disabled={isLoading}
                />
                
                <DatePickerInput
                  id="fecha_llegada_real"
                  label="Fecha de Llegada Real"
                  date={llegadaRealDate}
                  onChange={handleLlegadaRealDateChange}
                  error={validationErrors.fecha_llegada_real}
                  disabled={isLoading}
                />
              </div>
              
              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="id_cliente">Cliente</Label>
                <Select
                  value={formData.id_cliente?.toString() || ""}
                  onValueChange={(value) => handleSelectChange('id_cliente', value)}
                  disabled={isLoading || clientes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={clientes.length === 0 ? "Cargando clientes..." : "Seleccionar cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem 
                        key={cliente.id_cliente} 
                        value={cliente.id_cliente.toString()}
                      >
                        {cliente.razon_social} {cliente.rut && `(${cliente.rut})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Estado y Prioridad */}
              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(value) => handleSelectChange('prioridad', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            {/* Pestaña de Detalles */}
            <TabsContent value="detalles" className="space-y-4 mt-4">
              {/* Conductor y Vehículo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_chofer">Conductor</Label>
                  <Select
                    value={formData.id_chofer?.toString() || ""}
                    onValueChange={(value) => handleSelectChange('id_chofer', value)}
                    disabled={isLoading || conductores.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={conductores.length === 0 ? "Cargando conductores..." : "Seleccionar conductor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {conductores.map((conductor) => (
                        <SelectItem 
                          key={conductor.id_chofer} 
                          value={conductor.id_chofer.toString()}
                        >
                          {conductor.nombre_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="id_flota">Vehículo</Label>
                  <Input
                    id="id_flota_display"
                    value={
                      formData.id_flota 
                        ? vehiculos.find(v => v.id_flota === formData.id_flota)
                            ? `${vehiculos.find(v => v.id_flota === formData.id_flota)?.marca} ${vehiculos.find(v => v.id_flota === formData.id_flota)?.modelo} (${vehiculos.find(v => v.id_flota === formData.id_flota)?.patente})`
                            : "Se asignará al seleccionar conductor"
                        : "Se asignará al seleccionar conductor"
                    }
                    disabled={true}
                  />
                </div>
              </div>
              
              {/* Semirremolque y Contenedor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_semirremolque">Semirremolque</Label>
                  <Input
                    id="id_semirremolque_display"
                    value={
                      formData.id_semirremolque 
                        ? semirremolques.find(s => s.id_semirremolque === formData.id_semirremolque)
                            ? `${semirremolques.find(s => s.id_semirremolque === formData.id_semirremolque)?.patente} ${semirremolques.find(s => s.id_semirremolque === formData.id_semirremolque)?.marca ? `(${semirremolques.find(s => s.id_semirremolque === formData.id_semirremolque)?.marca})` : ''}`
                            : "Se asignará al seleccionar conductor"
                        : "Se asignará al seleccionar conductor"
                    }
                    disabled={true}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contenedor">Contenedor</Label>
                  <Input
                    id="contenedor"
                    name="contenedor"
                    value={formData.contenedor || ""}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              {/* Empresa */}
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  name="empresa"
                  value={formData.empresa || ""}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              
              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  name="observaciones"
                  rows={4}
                  value={formData.observaciones || ""}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </TabsContent>
            
            {/* Pestaña de Documentos */}
            <TabsContent value="documentos" className="space-y-4 mt-4">
              {/* Número de Control */}
              <div className="space-y-2">
                <Label htmlFor="nro_control">Número de Control</Label>
                <Input
                  id="nro_control"
                  name="nro_control"
                  type="number"
                  value={formData.nro_control?.toString() || ""}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              
              {/* Número de Guía */}
              <div className="space-y-2">
                <Label htmlFor="nro_guia">Número de Guía</Label>
                <Input
                  id="nro_guia"
                  name="nro_guia"
                  value={formData.nro_guia || ""}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              
              {/* Factura */}
              <div className="space-y-2">
                <Label htmlFor="factura">Factura</Label>
                <Input
                  id="factura"
                  name="factura"
                  value={formData.factura || ""}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  La funcionalidad de adjuntar documentos estará disponible próximamente.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Viaje
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 