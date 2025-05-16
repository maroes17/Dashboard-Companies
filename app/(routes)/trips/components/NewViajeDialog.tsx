import { useState, useEffect } from "react";
import { Viaje, Localidad, Cliente, Driver, Fleet, Semirremolque, supabase, ETAPAS_VIAJE_IDA, ETAPAS_VIAJE_VUELTA, TipoEtapa } from "@/lib/supabase";
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

export function NewViajeDialog({
  open,
  onOpenChange,
  onViajeCreated
}: NewViajeDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
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
    tipo_viaje: "ida",
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

  // Cargar datos iniciales al abrir el diálogo
  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open]);

  const insertarLocalidadesBasicas = async () => {
    try {
      // Verificar si ya existen localidades
      const { data: localidadesExistentes, error: errorVerificar } = await supabase
        .from('localidades')
        .select('id_localidad')
        .limit(1);

      if (errorVerificar) throw errorVerificar;

      // Si ya existen localidades, no hacer nada
      if (localidadesExistentes && localidadesExistentes.length > 0) {
        return;
      }

      // Insertar localidades básicas
      const localidadesBasicas = [
        // Puertos
        {
          nombre: 'Puerto Central',
          tipo: 'puerto',
          ciudad: 'San Antonio',
          pais: 'Chile'
        },
        {
          nombre: 'Puerto STI',
          tipo: 'puerto',
          ciudad: 'San Antonio',
          pais: 'Chile'
        },
        {
          nombre: 'Puerto Valparaíso',
          tipo: 'puerto',
          ciudad: 'Valparaíso',
          pais: 'Chile'
        },
        // Aduanas
        {
          nombre: 'Paso Fronterizo Los Libertadores',
          tipo: 'aduana',
          ciudad: 'Los Andes',
          pais: 'Chile'
        },
        {
          nombre: 'Uspallata',
          tipo: 'aduana',
          ciudad: 'Uspallata',
          pais: 'Argentina'
        },
        {
          nombre: 'Pino Hachado',
          tipo: 'aduana',
          ciudad: 'Victoria',
          pais: 'Argentina'
        },
        // Clientes
        {
          nombre: 'Mar del Plata',
          tipo: 'cliente',
          ciudad: 'Mar del Plata',
          pais: 'Argentina'
        },
        {
          nombre: 'Santa Fe',
          tipo: 'cliente',
          ciudad: 'Santa Fe',
          pais: 'Argentina'
        },
        {
          nombre: 'Córdoba',
          tipo: 'cliente',
          ciudad: 'Córdoba',
          pais: 'Argentina'
        },
        {
          nombre: 'Buenos Aires',
          tipo: 'cliente',
          ciudad: 'Buenos Aires',
          pais: 'Argentina'
        },
        {
          nombre: 'Rosario',
          tipo: 'cliente',
          ciudad: 'Rosario',
          pais: 'Argentina'
        },
        // Depósitos
        {
          nombre: 'Capitán Cortés',
          tipo: 'deposito',
          ciudad: 'Buenos Aires',
          pais: 'Argentina'
        },
        {
          nombre: 'Hiperbaires',
          tipo: 'deposito',
          ciudad: 'Buenos Aires',
          pais: 'Argentina'
        },
        {
          nombre: 'Mar Pacífico',
          tipo: 'deposito',
          ciudad: 'Mendoza',
          pais: 'Argentina'
        }
      ];

      const { error: errorInsertar } = await supabase
        .from('localidades')
        .insert(localidadesBasicas);

      if (errorInsertar) throw errorInsertar;

      toast({
        title: "Éxito",
        description: "Se han creado las localidades básicas",
      });
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

      setLocalidades(localidadesData);
      
      // Establecer valores predeterminados
      if (!formData.id_origen || formData.id_origen === 0) {
        setFormData(prev => ({ 
          ...prev, 
          id_origen: localidadesData[0].id_localidad 
        }));
      }
      
      if (!formData.id_destino || formData.id_destino === 0) {
        // Seleccionar un destino diferente al origen si es posible
        const destinoDefault = localidadesData.length > 1 ? 
          localidadesData[1].id_localidad : 
          localidadesData[0].id_localidad;
          
        setFormData(prev => ({ 
          ...prev, 
          id_destino: destinoDefault
        }));
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

      // Cargar conductores
      const { data: conductoresData, error: conductoresError } = await supabase
        .from('choferes')
        .select('*')
        .eq('estado', 'activo')
        .order('nombre_completo');
      
      if (conductoresError) {
        console.error("Error al cargar conductores:", conductoresError);
      } else if (conductoresData) {
        // Obtener los choferes que están en viajes en_ruta
        const { data: viajesEnRuta, error: viajesError } = await supabase
          .from('viajes')
          .select('id_chofer')
          .eq('estado', 'en_ruta');

        if (viajesError) {
          console.error("Error al cargar viajes en ruta:", viajesError);
        } else {
          // Crear un conjunto con los IDs de choferes ocupados
          const choferesOcupados = new Set(viajesEnRuta?.map(v => v.id_chofer));
          
          // Filtrar los choferes para excluir los que están en viajes en_ruta
          const choferesDisponibles = conductoresData.filter(chofer => !choferesOcupados.has(chofer.id_chofer));
          setConductores(choferesDisponibles);
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

    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
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
      const etapasBase = formData.tipo_viaje === 'ida' ? ETAPAS_VIAJE_IDA : ETAPAS_VIAJE_VUELTA;
      const nuevasEtapas = etapasBase.map((etapa: TipoEtapa) => {
        // Determinar la localidad según el tipo de etapa
        let idLocalidad: number;
        
        switch (etapa.tipo_localidad) {
          case 'puerto':
            idLocalidad = formData.tipo_viaje === 'ida' ? formData.id_origen : formData.id_destino;
            break;
          case 'aduana':
            idLocalidad = formData.tipo_viaje === 'ida' ? formData.id_origen : formData.id_destino;
            break;
          case 'cliente':
            idLocalidad = formData.tipo_viaje === 'ida' ? formData.id_destino : formData.id_origen;
            break;
          case 'deposito':
            idLocalidad = formData.tipo_viaje === 'ida' ? formData.id_destino : formData.id_origen;
            break;
          default:
            // Si no requiere localidad, usar la localidad de destino
            idLocalidad = formData.id_destino;
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

      const { error } = await supabase
        .from('etapas_viaje')
        .insert(nuevasEtapas);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Etapas del viaje creadas correctamente.",
      });
    } catch (error) {
      console.error('Error al crear etapas iniciales:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear las etapas iniciales del viaje.",
        variant: "destructive",
      });
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

      // Verificar que las localidades existan
      const { data: localidadesExistentes, error: errorLocalidades } = await supabase
        .from('localidades')
        .select('id_localidad')
        .in('id_localidad', [formData.id_origen, formData.id_destino]);

      if (errorLocalidades) {
        throw errorLocalidades;
      }

      if (!localidadesExistentes || localidadesExistentes.length !== 2) {
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
    const resetOrigin = localidades.length > 0 ? localidades[0].id_localidad : 0;
    const resetDestination = localidades.length > 1 ? localidades[1].id_localidad : resetOrigin;
    
    setFormData({
      tipo_viaje: "ida",
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