"use client";

import { useState, useEffect } from "react";
import { Viaje } from "@/lib/supabase";
import { TripStatus } from "@/lib/types/trips";
import { Localidad, Cliente, Driver, Fleet, Semirremolque, supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useToast } from "@/components/ui/use-toast";
import { mockLocalidades } from "../utils/mock-data";

interface EditTripDialogProps {
  trip: Viaje | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditTripDialog({ trip, open, onOpenChange, onSuccess }: EditTripDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [conductores, setConductores] = useState<Driver[]>([]);
  const [vehiculos, setVehiculos] = useState<Fleet[]>([]);
  const [semirremolques, setSemirremolques] = useState<Semirremolque[]>([]);
  
  const [formData, setFormData] = useState<Partial<Viaje>>({
    tipo_viaje: 'ida',
    estado: 'pendiente',
    fecha_salida_programada: new Date().toISOString(),
    fecha_llegada_programada: new Date().toISOString(),
    id_origen: 0,
    id_destino: 0,
    id_cliente: 0,
    contenedor: '',
    nro_guia: '',
    empresa: '',
    factura: '',
    prioridad: 'media'
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [salidaDate, setSalidaDate] = useState<Date>(new Date());
  const [llegadaDate, setLlegadaDate] = useState<Date>(new Date());

  useEffect(() => {
    if (open) {
      fetchInitialData();
      if (trip) {
        setFormData({
          ...trip,
          fecha_salida_programada: trip.fecha_salida_programada,
          fecha_llegada_programada: trip.fecha_llegada_programada,
          id_origen: trip.id_origen,
          id_destino: trip.id_destino,
          id_cliente: trip.id_cliente,
          id_chofer: trip.id_chofer,
          id_flota: trip.id_flota,
          id_semirremolque: trip.id_semirremolque,
          contenedor: trip.contenedor,
          nro_guia: trip.nro_guia,
          empresa: trip.empresa,
          factura: trip.factura,
          prioridad: trip.prioridad || 'media',
          notas: trip.notas || ''
        });
        setSalidaDate(new Date(trip.fecha_salida_programada));
        setLlegadaDate(new Date(trip.fecha_llegada_programada));
      }
    }
  }, [open, trip]);

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
        setLocalidades(mockLocalidades);
      } else if (localidadesData && localidadesData.length > 0) {
        setLocalidades(localidadesData);
      } else {
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

      // Cargar conductores activos
      const { data: conductoresData, error: conductoresError } = await supabase
        .from('choferes')
        .select('*')
        .eq('estado', 'activo')
        .order('nombre_completo');
      
      if (conductoresError) {
        console.error("Error al cargar conductores:", conductoresError);
      } else if (conductoresData) {
        // Obtener los viajes activos (planificados o en ruta)
        const { data: viajesActivos, error: viajesError } = await supabase
          .from('viajes')
          .select('id_chofer, estado')
          .in('estado', ['pendiente', 'en_ruta'])
          .not('id_chofer', 'is', null);

        if (viajesError) {
          console.error("Error al cargar viajes activos:", viajesError);
        } else {
          // Crear un conjunto de IDs de conductores ocupados
          const conductoresOcupados = new Set(
            viajesActivos?.map(viaje => viaje.id_chofer)
          );

          // Filtrar los conductores disponibles
          const conductoresDisponibles = conductoresData.filter(conductor => {
            // Si el conductor está ocupado, no está disponible
            if (conductoresOcupados.has(conductor.id_chofer)) {
              return false;
            }

            // Si el conductor es el actual del viaje que se está editando, lo incluimos
            if (trip && trip.id_chofer === conductor.id_chofer) {
              return true;
            }

            return true;
          });

          setConductores(conductoresDisponibles);
        }
      }

      // Cargar vehículos
      const { data: vehiculosData, error: vehiculosError } = await supabase
        .from('flota')
        .select('*')
        .eq('estado', 'activo')
        .order('patente');
      
      if (vehiculosError) {
        console.error("Error al cargar vehículos:", vehiculosError);
      } else if (vehiculosData) {
        // Obtener los viajes activos con vehículos asignados
        const { data: viajesConVehiculos, error: viajesVehiculosError } = await supabase
          .from('viajes')
          .select('id_flota, estado')
          .in('estado', ['pendiente', 'en_ruta'])
          .not('id_flota', 'is', null);

        if (viajesVehiculosError) {
          console.error("Error al cargar viajes con vehículos:", viajesVehiculosError);
        } else {
          // Crear un conjunto de IDs de vehículos ocupados
          const vehiculosOcupados = new Set(
            viajesConVehiculos?.map(viaje => viaje.id_flota)
          );

          // Filtrar los vehículos disponibles
          const vehiculosDisponibles = vehiculosData.filter(vehiculo => {
            // Si el vehículo está ocupado, no está disponible
            if (vehiculosOcupados.has(vehiculo.id_flota)) {
              return false;
            }

            // Si el vehículo es el actual del viaje que se está editando, lo incluimos
            if (trip && trip.id_flota === vehiculo.id_flota) {
              return true;
            }

            return true;
          });

          setVehiculos(vehiculosDisponibles);
        }
      }

      // Cargar semirremolques
      const { data: semirremolquesData, error: semirremolquesError } = await supabase
        .from('semirremolques')
        .select('*')
        .eq('estado', 'activo')
        .order('patente');
      
      if (semirremolquesError) {
        console.error("Error al cargar semirremolques:", semirremolquesError);
      } else if (semirremolquesData) {
        // Obtener los viajes activos con semirremolques asignados
        const { data: viajesConSemirremolques, error: viajesSemirremolquesError } = await supabase
          .from('viajes')
          .select('id_semirremolque, estado')
          .in('estado', ['pendiente', 'en_ruta'])
          .not('id_semirremolque', 'is', null);

        if (viajesSemirremolquesError) {
          console.error("Error al cargar viajes con semirremolques:", viajesSemirremolquesError);
        } else {
          // Crear un conjunto de IDs de semirremolques ocupados
          const semirremolquesOcupados = new Set(
            viajesConSemirremolques?.map(viaje => viaje.id_semirremolque)
          );

          // Filtrar los semirremolques disponibles
          const semirremolquesDisponibles = semirremolquesData.filter(semirremolque => {
            // Si el semirremolque está ocupado, no está disponible
            if (semirremolquesOcupados.has(semirremolque.id_semirremolque)) {
              return false;
            }

            // Si el semirremolque es el actual del viaje que se está editando, lo incluimos
            if (trip && trip.id_semirremolque === semirremolque.id_semirremolque) {
              return true;
            }

            return true;
          });

          setSemirremolques(semirremolquesDisponibles);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSalidaDateChange = (date: Date | null) => {
    if (!date) return;
    
    setSalidaDate(date);
    setFormData(prev => ({ ...prev, fecha_salida_programada: date.toISOString() }));
    
    if (validationErrors.fecha_salida_programada) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.fecha_salida_programada;
        return newErrors;
      });
    }
  };

  const handleLlegadaDateChange = (date: Date | null) => {
    if (!date) return;
    
    setLlegadaDate(date);
    setFormData(prev => ({ ...prev, fecha_llegada_programada: date.toISOString() }));
    
    if (validationErrors.fecha_llegada_programada) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.fecha_llegada_programada;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.id_origen) {
      errors.id_origen = "Debe seleccionar un origen";
    }
    
    if (!formData.id_destino) {
      errors.id_destino = "Debe seleccionar un destino";
    } else if (formData.id_destino === formData.id_origen) {
      errors.id_destino = "El destino debe ser diferente al origen";
    }
    
    if (new Date(formData.fecha_llegada_programada!) <= new Date(formData.fecha_salida_programada!)) {
      errors.fecha_llegada_programada = "La fecha de llegada debe ser posterior a la de salida";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !trip) return;
    
    try {
      setIsLoading(true);

      // Convertir el contenedor a mayúsculas
      const contenedor = formData.contenedor?.toUpperCase() || '';

      // Actualizar el viaje
      const { error } = await supabase
        .from('viajes')
        .update({
          tipo_viaje: formData.tipo_viaje,
          estado: formData.estado,
          fecha_salida_programada: formData.fecha_salida_programada,
          fecha_llegada_programada: formData.fecha_llegada_programada,
          id_origen: formData.id_origen,
          id_destino: formData.id_destino,
          id_cliente: formData.id_cliente,
          id_chofer: formData.id_chofer,
          id_flota: formData.id_flota,
          id_semirremolque: formData.id_semirremolque,
          contenedor: contenedor,
          nro_guia: formData.nro_guia || '',
          empresa: formData.empresa || '',
          factura: formData.factura || '',
          prioridad: formData.prioridad || 'media',
          notas: formData.notas || ''
        })
        .eq('id_viaje', trip.id_viaje);

      if (error) throw error;

      toast({
        title: "Viaje actualizado",
        description: "El viaje ha sido actualizado exitosamente.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al actualizar viaje:', error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al actualizar el viaje.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          .eq('estado', 'activo')
          .order('creado_en', { ascending: false })
          .limit(1);
        
        if (semiError) {
          console.error("❌ Error al buscar semirremolque del vehículo:", semiError.message || semiError);
        } else if (!semiData || semiData.length === 0) {
          console.log("⚠️ No se encontró ningún semirremolque asignado al vehículo", vehiculo.patente);
        } else {
          semirremolqueData = semiData[0];
          console.log("✅ Semirremolque encontrado:", semirremolqueData.patente, "ID:", semirremolqueData.id_semirremolque);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Viaje #{trip?.id_viaje}</DialogTitle>
          <DialogDescription>
            Actualiza la información del viaje. Los campos marcados con * son obligatorios.
          </DialogDescription>
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
                    value={formData.id_origen?.toString()}
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
                    value={formData.id_destino?.toString()}
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
                  label="Fecha de Salida"
                  date={salidaDate}
                  onChange={handleSalidaDateChange}
                  required
                  error={validationErrors.fecha_salida_programada}
                  disabled={isLoading}
                />
                
                <DatePickerInput
                  id="fecha_llegada_programada"
                  label="Fecha de Llegada"
                  date={llegadaDate}
                  onChange={handleLlegadaDateChange}
                  required
                  error={validationErrors.fecha_llegada_programada}
                  disabled={isLoading}
                />
              </div>
              
              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="id_cliente">Cliente</Label>
                <Select
                  value={formData.id_cliente?.toString()}
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
                        {cliente.razon_social} {cliente.cuit && `(${cliente.cuit})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Estado y Prioridad */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => handleSelectChange('estado', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_ruta">En Ruta</SelectItem>
                      <SelectItem value="completado">Completado</SelectItem>
                      <SelectItem value="incidente">Incidente</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
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
              </div>
            </TabsContent>
            
            {/* Pestaña de Detalles */}
            <TabsContent value="detalles" className="space-y-4 mt-4">
              {/* Conductor y Vehículo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_chofer">Conductor</Label>
                  <Select
                    value={formData.id_chofer?.toString()}
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
                  <Select
                    value={formData.id_flota?.toString()}
                    onValueChange={(value) => handleSelectChange('id_flota', value)}
                    disabled={isLoading || vehiculos.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={vehiculos.length === 0 ? "Cargando vehículos..." : "Seleccionar vehículo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {vehiculos.map((vehiculo) => (
                        <SelectItem 
                          key={vehiculo.id_flota} 
                          value={vehiculo.id_flota.toString()}
                        >
                          {vehiculo.marca} {vehiculo.modelo} ({vehiculo.patente})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Semirremolque y Contenedor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_semirremolque">Semirremolque</Label>
                  <Select
                    value={formData.id_semirremolque?.toString()}
                    onValueChange={(value) => handleSelectChange('id_semirremolque', value)}
                    disabled={isLoading || semirremolques.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={semirremolques.length === 0 ? "Cargando semirremolques..." : "Seleccionar semirremolque"} />
                    </SelectTrigger>
                    <SelectContent>
                      {semirremolques.map((semirremolque) => (
                        <SelectItem 
                          key={semirremolque.id_semirremolque} 
                          value={semirremolque.id_semirremolque.toString()}
                        >
                          {semirremolque.tipo} ({semirremolque.patente})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              
              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  name="notas"
                  rows={4}
                  value={formData.notas || ""}
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
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 