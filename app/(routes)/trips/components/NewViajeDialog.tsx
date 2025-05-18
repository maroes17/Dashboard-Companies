import { useState, useEffect } from "react";
import { Viaje, Localidad, Cliente, Driver, Fleet, Semirremolque, supabase, getEtapasByTipoViaje, TipoEtapa } from "@/lib/supabase";
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
import { addHours } from "date-fns";
import { DatePickerInput } from "./ui/DatePickerInput";
import { Loader2 } from "lucide-react";
import { mockLocalidades } from "../utils/mock-data";
import { PostgrestError } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { crearEtapasAutomaticamente } from "./ViajeForm";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface NewViajeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViajeCreated: () => void;
}

interface DocumentoViaje {
  id_documento: number;
  id_viaje: number;
  tipo_documento: 'guia' | 'factura' | 'control';
  numero_documento: string;
  url_documento: string | null;
  creado_en: string;
  actualizado_en: string;
}

interface OrigenDestino {
  id_origen_destino: number;
  nombre: string;
  ciudad: string;
  pais: string;
  tipo: 'origen' | 'destino' | 'ambos';
  activo: boolean;
}

export function NewViajeDialog({
  open,
  onOpenChange,
  onViajeCreated
}: NewViajeDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [origenesDestinos, setOrigenesDestinos] = useState<OrigenDestino[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [conductores, setConductores] = useState<Driver[]>([]);
  const [vehiculos, setVehiculos] = useState<Fleet[]>([]);
  const [semirremolques, setSemirremolques] = useState<Semirremolque[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoViaje[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<'guia' | 'factura' | 'control'>('guia');
  const [numeroDocumento, setNumeroDocumento] = useState("");
  
  const [formData, setFormData] = useState<Omit<Viaje, "id_viaje" | "creado_en" | "actualizado_en">>({
    tipo_viaje: "ida" as const,
    fecha_salida_programada: new Date().toISOString(),
    fecha_llegada_programada: addHours(new Date(), 48).toISOString(),
    id_origen: 0,
    id_destino: 0,
    estado: "planificado",
    prioridad: "media",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [salidaDate, setSalidaDate] = useState<Date>(new Date());
  const [llegadaDate, setLlegadaDate] = useState<Date>(addHours(new Date(), 48));
  const [localidades, setLocalidades] = useState<Record<number, Localidad>>({});

  // Cargar datos iniciales al abrir el diálogo
  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open]);

  const insertarLocalidadesBasicas = async () => {
    try {
      // Primero, obtener las localidades existentes
      const { data: localidadesExistentes, error: errorVerificar } = await supabase
        .from('localidades')
        .select('nombre, ciudad, pais');

      if (errorVerificar) throw errorVerificar;

      // Definir las localidades que queremos tener
      const localidadesDeseadas = [
        // Chile
        { nombre: 'San Antonio', tipo: 'puerto', ciudad: 'San Antonio', pais: 'Chile' },
        { nombre: 'Valparaíso', tipo: 'puerto', ciudad: 'Valparaíso', pais: 'Chile' },
        { nombre: 'Los Andes', tipo: 'cliente', ciudad: 'Los Andes', pais: 'Chile' },
        
        // Argentina
        { nombre: 'Buenos Aires', tipo: 'cliente', ciudad: 'Buenos Aires', pais: 'Argentina' },
        { nombre: 'Córdoba', tipo: 'cliente', ciudad: 'Córdoba', pais: 'Argentina' },
        { nombre: 'Mendoza', tipo: 'cliente', ciudad: 'Mendoza', pais: 'Argentina' },
        { nombre: 'Rosario', tipo: 'cliente', ciudad: 'Rosario', pais: 'Argentina' },
        { nombre: 'Santa Fe', tipo: 'cliente', ciudad: 'Santa Fe', pais: 'Argentina' },
        { nombre: 'Mar del Plata', tipo: 'cliente', ciudad: 'Mar del Plata', pais: 'Argentina' },
        { nombre: 'Victoria', tipo: 'cliente', ciudad: 'Victoria', pais: 'Argentina' }
      ];

      // Filtrar las localidades que no existen
      const localidadesAFaltantes = localidadesDeseadas.filter(
        localidad => !localidadesExistentes?.some(
          existente => 
            existente.nombre === localidad.nombre && 
            existente.ciudad === localidad.ciudad && 
            existente.pais === localidad.pais
        )
      );

      // Si hay localidades para insertar, hacerlo
      if (localidadesAFaltantes.length > 0) {
        const { error: errorInsertar } = await supabase
          .from('localidades')
          .insert(localidadesAFaltantes);

        if (errorInsertar) throw errorInsertar;

        toast({
          title: "Éxito",
          description: `Se han creado ${localidadesAFaltantes.length} localidades básicas`,
        });
      } else {
        console.log('Todas las localidades básicas ya existen');
      }
    } catch (error) {
      console.error('Error al insertar localidades básicas:', error);
      toast({
        title: "Error",
        description: "Error al crear las localidades básicas",
        variant: "destructive",
      });
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);

    try {
      // Intentar insertar localidades básicas si no existen
      await insertarLocalidadesBasicas();

      // Cargar orígenes y destinos
      const { data: origenesDestinosData, error: origenesDestinosError } = await supabase
        .from('origenes_destinos')
        .select('*')
        .eq('activo', true)
        .order('pais', { ascending: true })
        .order('ciudad', { ascending: true });
      
      if (origenesDestinosError) {
        console.error("Error al cargar orígenes y destinos:", origenesDestinosError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los orígenes y destinos",
          variant: "destructive",
        });
        return;
      }

      if (!origenesDestinosData || origenesDestinosData.length === 0) {
        toast({
          title: "Error",
          description: "No hay orígenes y destinos disponibles en la base de datos",
          variant: "destructive",
        });
        return;
      }

      setOrigenesDestinos(origenesDestinosData);
      
      // Establecer valores predeterminados
      if (!formData.id_origen || formData.id_origen === 0) {
        const origenDefault = origenesDestinosData.find(od => od.tipo === 'origen' || od.tipo === 'ambos');
        if (origenDefault) {
          setFormData(prev => ({ 
            ...prev, 
            id_origen: origenDefault.id_origen_destino 
          }));
        }
      }
      
      if (!formData.id_destino || formData.id_destino === 0) {
        const destinoDefault = origenesDestinosData.find(od => od.tipo === 'destino' || od.tipo === 'ambos');
        if (destinoDefault) {
          setFormData(prev => ({ 
            ...prev, 
            id_destino: destinoDefault.id_origen_destino
          }));
        }
      }

      // Cargar localidades
      const { data: localidadesData, error: localidadesError } = await supabase
        .from('localidades')
        .select('*')
        .order('nombre');
      
      if (localidadesError) {
        console.error("Error al cargar localidades:", localidadesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar las localidades",
          variant: "destructive",
        });
        return;
      }

      if (!localidadesData || localidadesData.length === 0) {
        toast({
          title: "Error",
          description: "No hay localidades disponibles en la base de datos",
          variant: "destructive",
        });
        return;
      }

      if (localidadesData) {
        setLocalidades(localidadesData.reduce((acc, loc) => {
          acc[loc.id_localidad] = loc;
          return acc;
        }, {} as Record<number, Localidad>));
      }

      // Cargar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .eq('estado', 'activo')
        .order('razon_social');
      
      if (clientesError) {
        console.error("Error al cargar clientes:", clientesError);
      } else if (clientesData) {
        setClientes(clientesData);
      }

      // Cargar conductores disponibles
      const { data: conductoresData, error: conductoresError } = await supabase
        .from('choferes')
        .select('*')
        .order('nombre_completo');

      if (conductoresError) throw conductoresError;

      // Obtener los IDs de los conductores que tienen viajes asignados en estado "en_ruta" o "planificado"
      const { data: viajesActivos, error: viajesError } = await supabase
        .from('viajes')
        .select('id_chofer')
        .in('estado', ['en_ruta', 'planificado']);

      if (viajesError) throw viajesError;

      // Filtrar los conductores disponibles
      const conductoresOcupados = new Set(viajesActivos?.map(v => v.id_chofer) || []);
      const conductoresDisponibles = conductoresData?.filter(
        conductor => !conductoresOcupados.has(conductor.id_chofer)
      ) || [];

      setConductores(conductoresDisponibles);

      // Cargar vehículos
      const { data: vehiculosData, error: vehiculosError } = await supabase
        .from('flota')
        .select('*')
        .eq('estado', 'activo')
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
        .eq('estado', 'activo')
        .order('patente');
      
      if (semirremolquesError) {
        console.error("Error al cargar semirremolques:", semirremolquesError);
      } else if (semirremolquesData) {
        setSemirremolques(semirremolquesData);
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      toast({
        title: "Error",
        description: "Error al cargar los datos iniciales",
        variant: "destructive",
      });
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    // Convertir a número si es necesario
    const processedValue = ['id_origen', 'id_destino', 'id_cliente', 'id_chofer', 'id_flota', 'id_semirremolque'].includes(field)
      ? Number(value)
      : value;

    // Asegurar que el tipo de viaje sea correcto
    if (field === 'tipo_viaje' && (value === 'ida' || value === 'vuelta')) {
      console.log('Cambiando tipo de viaje a:', value);
      setFormData(prev => ({ ...prev, [field]: value as 'ida' | 'vuelta' }));
      
      // Resetear origen y destino cuando cambia el tipo de viaje
      const origenesChile = origenesDestinos.filter(od => od.pais === 'Chile');
      const destinosArgentina = origenesDestinos.filter(od => od.pais === 'Argentina');
      
      console.log('Orígenes Chile:', origenesChile);
      console.log('Destinos Argentina:', destinosArgentina);
      
      if (value === 'ida') {
        // Para viajes de ida: origen en Chile, destino en Argentina
        setFormData(prev => ({
          ...prev,
          id_origen: origenesChile[0]?.id_origen_destino || 0,
          id_destino: destinosArgentina[0]?.id_origen_destino || 0
        }));
      } else {
        // Para viajes de vuelta: origen en Argentina, destino en Chile
        setFormData(prev => ({
          ...prev,
          id_origen: destinosArgentina[0]?.id_origen_destino || 0,
          id_destino: origenesChile[0]?.id_origen_destino || 0
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: processedValue }));
    }
    
    // Limpiar errores al editar
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Si se cambia el tipo de viaje, actualizar las localidades disponibles
    if (field === 'tipo_viaje' && (value === 'ida' || value === 'vuelta')) {
      console.log('Tipo de viaje cambiado a:', value);
      const etapas = getEtapasByTipoViaje(value as 'ida' | 'vuelta');
      console.log('Etapas disponibles para el nuevo tipo de viaje:', etapas);
    }
    
    // Si se seleccionó un conductor, buscar su vehículo y semirremolque asociados
    if (field === 'id_chofer') {
      try {
        setIsLoading(true);
        
        // Si hay un conductor (valor diferente de 0), establecer estado "en_ruta", de lo contrario "planificado"
        const nuevoEstado = typeof processedValue === 'number' && processedValue > 0 ? "en_ruta" : "planificado";
        setFormData(prev => ({ ...prev, estado: nuevoEstado as "incidente" | "cancelado" | "planificado" | "en_ruta" | "realizado" }));
        console.log(`🔄 Estado actualizado automáticamente a: ${nuevoEstado}`);
        
        if (typeof processedValue === 'number' && processedValue > 0) {
          // Buscar el conductor seleccionado para mostrar su nombre en los logs
          const conductorSeleccionado = conductores.find(c => c.id_chofer === processedValue);
          console.log(`🔄 Se seleccionó al conductor: ${conductorSeleccionado?.nombre_completo || 'Desconocido'} (ID: ${processedValue})`);
          console.log("🔄 Buscando vehículo y semirremolque asociados...");
          
          const { vehiculo, semirremolque } = await fetchDriverVehicleInfo(processedValue);
          
          if (vehiculo) {
            console.log(`✅ Se asignó automáticamente el vehículo: ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`);
            setFormData(prev => ({ 
              ...prev, 
              id_flota: vehiculo.id_flota 
            }));
          } else {
            console.log("⚠️ No se encontró vehículo asignado al conductor - No se realizó asignación automática");
            // Limpiar el campo de vehículo si no hay ninguno asignado
            setFormData(prev => ({ 
              ...prev, 
              id_flota: undefined
            }));
          }
          
          if (semirremolque) {
            console.log(`✅ Se asignó automáticamente el semirremolque: ${semirremolque.patente}`);
            setFormData(prev => ({ 
              ...prev, 
              id_semirremolque: semirremolque.id_semirremolque 
            }));
          } else {
            console.log("⚠️ No se encontró semirremolque asociado - No se realizó asignación automática");
            // Limpiar el campo de semirremolque si no hay ninguno asignado
            setFormData(prev => ({ 
              ...prev, 
              id_semirremolque: undefined
            }));
          }
        } else {
          // Si se deseleccionó el conductor, limpiar vehículo y semirremolque
          setFormData(prev => ({ 
            ...prev, 
            id_flota: undefined,
            id_semirremolque: undefined
          }));
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
    if (!date) return;
    
    // Preservar la hora actual al establecer la nueva fecha
    const newDate = new Date(date);
    newDate.setHours(new Date().getHours());
    newDate.setMinutes(new Date().getMinutes());
    
    setSalidaDate(newDate);
    setFormData(prev => ({ ...prev, fecha_salida_programada: newDate.toISOString() }));
    
    // Si la fecha de llegada es anterior a la nueva fecha de salida, actualizarla
    if (llegadaDate < newDate) {
      const newLlegadaDate = new Date(newDate);
      newLlegadaDate.setDate(newLlegadaDate.getDate() + 1);
      setLlegadaDate(newLlegadaDate);
      setFormData(prev => ({ ...prev, fecha_llegada_programada: newLlegadaDate.toISOString() }));
    }
    
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
    if (!date) return;
    
    // Preservar la hora actual al establecer la nueva fecha
    const newDate = new Date(date);
    newDate.setHours(new Date().getHours());
    newDate.setMinutes(new Date().getMinutes());
    
    setLlegadaDate(newDate);
    setFormData(prev => ({ ...prev, fecha_llegada_programada: newDate.toISOString() }));
    
    // Limpiar errores al editar
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
    
    if (new Date(formData.fecha_llegada_programada) <= new Date(formData.fecha_salida_programada)) {
      errors.fecha_llegada_programada = "La fecha de llegada debe ser posterior a la de salida";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const crearEtapasIniciales = async (idViaje: number) => {
    try {
      console.log('Iniciando creación de etapas para viaje ID:', idViaje);
      console.log('Tipo de viaje:', formData.tipo_viaje);
      
      const etapasBase = getEtapasByTipoViaje(formData.tipo_viaje as 'ida' | 'vuelta');
      console.log('Etapas base obtenidas:', etapasBase);

      // Obtener los orígenes y destinos seleccionados
      const origenSeleccionado = origenesDestinos.find(od => od.id_origen_destino === formData.id_origen);
      const destinoSeleccionado = origenesDestinos.find(od => od.id_origen_destino === formData.id_destino);

      console.log('Origen seleccionado:', origenSeleccionado);
      console.log('Destino seleccionado:', destinoSeleccionado);

      if (!origenSeleccionado || !destinoSeleccionado) {
        throw new Error('No se encontraron los orígenes y destinos seleccionados');
      }

      // Función auxiliar para obtener o crear localidad
      const obtenerOCrearLocalidad = async (datos: { nombre: string; ciudad: string; pais: string; tipo: string }) => {
        // Primero intentar obtener la localidad existente
        const { data: localidadExistente, error: errorBusqueda } = await supabase
          .from('localidades')
          .select('*')
          .eq('nombre', datos.nombre)
          .eq('ciudad', datos.ciudad)
          .eq('pais', datos.pais)
          .single();

        if (errorBusqueda && errorBusqueda.code !== 'PGRST116') { // PGRST116 es el código para "no se encontró"
          throw new Error(`Error al buscar localidad: ${errorBusqueda.message}`);
        }

        if (localidadExistente) {
          console.log('Localidad existente encontrada:', localidadExistente);
          return localidadExistente;
        }

        // Si no existe, crear la nueva localidad
        console.log('Creando nueva localidad:', datos);
        const { data: nuevaLocalidad, error: errorCreacion } = await supabase
          .from('localidades')
          .insert([datos])
          .select()
          .single();

        if (errorCreacion) {
          throw new Error(`Error al crear localidad: ${errorCreacion.message}`);
        }

        return nuevaLocalidad;
      };

      // Obtener o crear localidad origen
      console.log('Procesando localidad origen...');
      const localidadOrigen = await obtenerOCrearLocalidad({
        nombre: origenSeleccionado.nombre,
        ciudad: origenSeleccionado.ciudad,
        pais: origenSeleccionado.pais,
        tipo: formData.tipo_viaje === 'ida' ? 'puerto' : 'cliente'
      });

      // Obtener o crear localidad destino
      console.log('Procesando localidad destino...');
      const localidadDestino = await obtenerOCrearLocalidad({
        nombre: destinoSeleccionado.nombre,
        ciudad: destinoSeleccionado.ciudad,
        pais: destinoSeleccionado.pais,
        tipo: formData.tipo_viaje === 'ida' ? 'cliente' : 'puerto'
      });

      console.log('Creando etapas con las localidades procesadas...');
      const nuevasEtapas = etapasBase.map((etapa) => {
        console.log('Procesando etapa:', etapa.nombre);
        
        // Determinar la localidad según el tipo de etapa y el tipo de viaje
        let idLocalidad: number;
        
        if (etapa.requiere_localidad) {
          switch (etapa.tipo_localidad) {
            case 'puerto':
              idLocalidad = formData.tipo_viaje === 'ida' ? localidadOrigen.id_localidad : localidadDestino.id_localidad;
              console.log(`Etapa ${etapa.nombre}: usando localidad puerto ID ${idLocalidad}`);
              break;
            case 'aduana':
              idLocalidad = formData.tipo_viaje === 'ida' ? localidadOrigen.id_localidad : localidadDestino.id_localidad;
              console.log(`Etapa ${etapa.nombre}: usando localidad aduana ID ${idLocalidad}`);
              break;
            case 'cliente':
              idLocalidad = formData.tipo_viaje === 'ida' ? localidadDestino.id_localidad : localidadOrigen.id_localidad;
              console.log(`Etapa ${etapa.nombre}: usando localidad cliente ID ${idLocalidad}`);
              break;
            case 'deposito':
              idLocalidad = formData.tipo_viaje === 'ida' ? localidadDestino.id_localidad : localidadOrigen.id_localidad;
              console.log(`Etapa ${etapa.nombre}: usando localidad depósito ID ${idLocalidad}`);
              break;
            default:
              throw new Error(`Tipo de localidad no válido: ${etapa.tipo_localidad}`);
          }
        } else {
          idLocalidad = localidadDestino.id_localidad;
          console.log(`Etapa ${etapa.nombre}: usando localidad por defecto ID ${idLocalidad}`);
        }

        return {
          id_viaje: idViaje,
          id_localidad: idLocalidad,
          tipo_etapa: etapa.id,
          estado: 'pendiente',
          fecha_programada: new Date().toISOString(),
          observaciones: '',
          creado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        };
      });

      console.log('Etapas a insertar:', nuevasEtapas);
      const { error: errorEtapas } = await supabase
        .from('etapas_viaje')
        .insert(nuevasEtapas);

      if (errorEtapas) {
        console.error('Error al insertar etapas:', errorEtapas);
        throw new Error(`Error al insertar etapas: ${errorEtapas.message}`);
      }

      console.log('Etapas creadas exitosamente');
      toast({
        title: "Éxito",
        description: "Etapas del viaje creadas correctamente.",
      });
    } catch (error: any) {
      console.error('Error detallado al crear etapas iniciales:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron crear las etapas iniciales del viaje.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar campos requeridos
      if (!formData.id_origen || !formData.id_destino) {
        toast({
          title: "Error",
          description: "Debes seleccionar origen y destino",
          variant: "destructive",
        });
        return;
      }

      // Verificar que las localidades existan en origenes_destinos
      const { data: origenesDestinosExistentes, error: errorOrigenesDestinos } = await supabase
        .from('origenes_destinos')
        .select('id_origen_destino')
        .in('id_origen_destino', [formData.id_origen, formData.id_destino]);

      if (errorOrigenesDestinos) {
        throw errorOrigenesDestinos;
      }

      if (!origenesDestinosExistentes || origenesDestinosExistentes.length !== 2) {
        toast({
          title: "Error",
          description: "Las localidades seleccionadas no existen en la base de datos",
          variant: "destructive",
        });
        return;
      }

      // Crear el viaje
      const { data: viaje, error: errorViaje } = await supabase
        .from('viajes')
        .insert([{
          id_cliente: formData.id_cliente,
          id_chofer: formData.id_chofer,
          id_flota: formData.id_flota,
          id_semirremolque: formData.id_semirremolque,
          id_origen: formData.id_origen,
          id_destino: formData.id_destino,
          tipo_viaje: formData.tipo_viaje,
          estado: "planificado",
          prioridad: formData.prioridad,
          fecha_salida_programada: formData.fecha_salida_programada,
          fecha_llegada_programada: formData.fecha_llegada_programada,
          contenedor: formData.contenedor,
          nro_guia: formData.nro_guia,
          nro_control: formData.nro_control,
          factura: formData.factura,
          empresa: formData.empresa,
          observaciones: formData.observaciones
        }])
        .select()
        .single();

      if (errorViaje) throw errorViaje;

      // Crear las etapas iniciales
      if (viaje) {
        await crearEtapasIniciales(viaje.id_viaje);
      }

      // Guardar los documentos
      if (documentos.length > 0) {
        const documentosConViajeId = documentos.map(doc => ({
          ...doc,
          id_viaje: viaje.id_viaje
        }));

        const { error: documentosError } = await supabase
          .from('documentos_viaje')
          .insert(documentosConViajeId);

        if (documentosError) throw documentosError;
      }

      toast({
        title: "Éxito",
        description: "Viaje creado correctamente",
      });

      onOpenChange(false);
      if (typeof onViajeCreated === 'function') {
        await onViajeCreated();
      }
    } catch (error: any) {
      console.error('Error al guardar viaje:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el viaje",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Usar el primer y segundo elemento de localidades, o el primero dos veces si solo hay uno
    const resetOrigin = origenesDestinos.length > 0 ? origenesDestinos[0].id_origen_destino : 0;
    const resetDestination = origenesDestinos.length > 1 ? origenesDestinos[1].id_origen_destino : resetOrigin;
    
    setFormData({
      tipo_viaje: "ida" as const,
      fecha_salida_programada: new Date().toISOString(),
      fecha_llegada_programada: addHours(new Date(), 48).toISOString(),
      id_origen: resetOrigin,
      id_destino: resetDestination,
      estado: "planificado",
      prioridad: "media",
    });
    setSalidaDate(new Date());
    setLlegadaDate(addHours(new Date(), 48));
    setValidationErrors({});
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; className: string }> = {
      planificado: {
        label: "Planificado",
        className: "bg-gray-300 text-gray-800 hover:bg-gray-400"
      },
      en_ruta: {
        label: "En Ruta",
        className: "bg-sky-400 text-white hover:bg-sky-500"
      },
      realizado: {
        label: "Realizado",
        className: "bg-green-500 text-white hover:bg-green-600"
      },
      incidente: {
        label: "Incidente",
        className: "bg-yellow-400 text-gray-800 hover:bg-yellow-500"
      },
      cancelado: {
        label: "Cancelado",
        className: "bg-red-500 text-white hover:bg-red-600"
      }
    };

    const estadoConfig = estados[estado] || estados.planificado;

    return (
      <Badge className={estadoConfig.className}>
        {estadoConfig.label}
      </Badge>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadDocument = async () => {
    if (!numeroDocumento.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa el número del documento",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      let publicUrl = null;

      // Si hay un archivo seleccionado, subirlo
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `temp/${tipoDocumento}_${Date.now()}.${fileExt}`;
        const filePath = `documentos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        // Obtener la URL pública del archivo
        const { data: { publicUrl: url } } = supabase.storage
          .from('documentos')
          .getPublicUrl(filePath);

        publicUrl = url;
      }

      // Crear el documento temporal con un ID más pequeño
      const nuevoDocumento: DocumentoViaje = {
        id_documento: Math.floor(Math.random() * 1000000), // ID temporal más pequeño
        id_viaje: 0, // Se actualizará cuando se cree el viaje
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        url_documento: publicUrl,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };

      // Agregar a la lista de documentos
      setDocumentos(prev => [...prev, nuevoDocumento]);

      toast({
        title: "Documento registrado",
        description: "El documento se ha registrado correctamente",
      });

      // Limpiar el formulario
      setSelectedFile(null);
      setNumeroDocumento("");
      setTipoDocumento('guia');

    } catch (error: any) {
      console.error("Error al registrar documento:", error);
      toast({
        title: "Error",
        description: error.message || "Error al registrar el documento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) handleReset();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Viaje</DialogTitle>
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
                    disabled={isLoading || Object.keys(localidades).length === 0}
                  >
                    <SelectTrigger className={validationErrors.id_origen ? "border-destructive" : ""}>
                      <SelectValue placeholder={Object.keys(localidades).length === 0 ? "Cargando orígenes..." : "Seleccionar origen"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(localidades)
                        .filter(loc => formData.tipo_viaje === 'ida' ? loc.pais === 'Chile' : loc.pais === 'Argentina')
                        .map((origen) => (
                          <SelectItem 
                            key={origen.id_localidad} 
                            value={origen.id_localidad.toString()}
                          >
                            {origen.nombre}, {origen.pais}
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
                    disabled={isLoading || Object.keys(localidades).length === 0}
                  >
                    <SelectTrigger className={validationErrors.id_destino ? "border-destructive" : ""}>
                      <SelectValue placeholder={Object.keys(localidades).length === 0 ? "Cargando destinos..." : "Seleccionar destino"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(localidades)
                        .filter(loc => formData.tipo_viaje === 'ida' ? loc.pais === 'Argentina' : loc.pais === 'Chile')
                        .map((destino) => (
                          <SelectItem 
                            key={destino.id_localidad} 
                            value={destino.id_localidad.toString()}
                          >
                            {destino.nombre}, {destino.pais}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.id_destino && (
                    <p className="text-destructive text-xs">{validationErrors.id_destino}</p>
                  )}
                </div>
              </div>
              
              {/* Fechas */}
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
                        {cliente.razon_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Estado y Prioridad */}
              <div className="grid grid-cols-2 gap-4">
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
            </TabsContent>
            
            {/* Pestaña de Documentos */}
            <TabsContent value="documentos" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Formulario de subida */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-medium">Registrar nuevo documento</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo_documento">Tipo de documento</Label>
                      <Select
                        value={tipoDocumento}
                        onValueChange={(value: 'guia' | 'factura' | 'control') => setTipoDocumento(value)}
                        disabled={isUploading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guia">Guía</SelectItem>
                          <SelectItem value="factura">Factura</SelectItem>
                          <SelectItem value="control">Control</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="numero_documento">Número de documento</Label>
                      <Input
                        id="numero_documento"
                        value={numeroDocumento}
                        onChange={(e) => setNumeroDocumento(e.target.value)}
                        placeholder="Ingresa el número del documento"
                        disabled={isUploading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="archivo">Archivo (opcional)</Label>
                    <Input
                      id="archivo"
                      type="file"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </div>

                  <Button
                    onClick={handleUploadDocument}
                    disabled={!numeroDocumento.trim() || isUploading}
                    className="w-full"
                  >
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploading ? "Registrando..." : "Registrar documento"}
                  </Button>
                </div>

                {/* Lista de documentos */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Documentos registrados</h3>
                  
                  {documentos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay documentos registrados para este viaje.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {documentos.map((doc) => (
                        <div
                          key={doc.id_documento}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium capitalize">
                              {doc.tipo_documento}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {doc.numero_documento}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Registrado el {format(new Date(doc.creado_en), "dd/MM/yyyy HH:mm", { locale: es })}
                            </p>
                          </div>
                          
                          {doc.url_documento && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => doc.url_documento && window.open(doc.url_documento, '_blank')}
                            >
                              Ver documento
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              Guardar Viaje
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 