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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";
import { Building2, FileText } from "lucide-react";

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

interface EditViajeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viaje: Viaje | null;
  onSave: (viaje: Viaje) => Promise<void>;
  localidades?: Record<string, Localidad>;
}

export function EditViajeDialog({
  open,
  onOpenChange,
  viaje,
  onSave,
  localidades = {},
}: EditViajeDialogProps) {
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
      fetchDocumentos();
    }
  }, [open, viaje]);

  const fetchInitialData = async () => {
    setIsLoading(true);

    try {
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

      // Cargar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('razon_social');

      if (clientesError) throw clientesError;
      setClientes(clientesData || []);

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
        .in('estado', ['en_ruta', 'planificado'])
        .neq('id_viaje', viaje?.id_viaje || 0); // Excluir el viaje actual si estamos editando

      if (viajesError) throw viajesError;

      // Filtrar los conductores disponibles
      const conductoresOcupados = new Set(viajesActivos?.map(v => v.id_chofer) || []);
      const conductoresDisponibles = conductoresData?.filter(
        conductor => !conductoresOcupados.has(conductor.id_chofer)
      ) || [];

      // Si estamos editando un viaje, incluir el conductor actual si existe
      if (viaje?.id_chofer) {
        const conductorActual = conductoresData?.find(c => c.id_chofer === viaje.id_chofer);
        if (conductorActual && !conductoresDisponibles.some(c => c.id_chofer === conductorActual.id_chofer)) {
          conductoresDisponibles.push(conductorActual);
        }
      }

      setConductores(conductoresDisponibles);

      // Cargar vehículos
      const { data: vehiculosData, error: vehiculosError } = await supabase
        .from('flota')
        .select('*')
        .order('patente');

      if (vehiculosError) throw vehiculosError;
      setVehiculos(vehiculosData || []);

      // Cargar semirremolques
      const { data: semirremolquesData, error: semirremolquesError } = await supabase
        .from('semirremolques')
        .select('*')
        .order('patente');

      if (semirremolquesError) throw semirremolquesError;
      setSemirremolques(semirremolquesData || []);

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocumentos = async () => {
    if (!viaje) return;

    try {
      const { data: documentosData, error: documentosError } = await supabase
        .from('documentos_viaje')
        .select('*')
        .eq('id_viaje', viaje.id_viaje)
        .order('creado_en', { ascending: false });

      if (documentosError) {
        console.error("Error al cargar documentos:", documentosError);
        return;
      }

      setDocumentos(documentosData || []);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadDocument = async () => {
    if (!viaje) return;
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
        const fileName = `${viaje.id_viaje}/${tipoDocumento}_${Date.now()}.${fileExt}`;
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

      // Guardar el registro en la tabla documentos_viaje
      const { error: dbError } = await supabase
        .from('documentos_viaje')
        .insert({
          id_viaje: viaje.id_viaje,
          tipo_documento: tipoDocumento,
          numero_documento: numeroDocumento,
          url_documento: publicUrl
        });

      if (dbError) throw dbError;

      // Actualizar la lista de documentos
      await fetchDocumentos();

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

    // Asegurar que el tipo de viaje sea correcto
    if (field === 'tipo_viaje' && (value === 'ida' || value === 'vuelta')) {
      console.log('Cambiando tipo de viaje a:', value);
      const localidadesArray = Object.values(localidades);
      const origenesChile = localidadesArray.filter(loc => loc.pais === 'Chile');
      const destinosArgentina = localidadesArray.filter(loc => loc.pais === 'Argentina');
      const nuevoOrigen = value === 'ida' ? origenesChile[0]?.id_localidad : destinosArgentina[0]?.id_localidad;
      const nuevoDestino = value === 'ida' ? destinosArgentina[0]?.id_localidad : origenesChile[0]?.id_localidad;
      
      setFormData(prev => {
        if (!prev) return null;
        
        return { 
          ...prev, 
          [field]: value as 'ida' | 'vuelta',
          id_origen: nuevoOrigen || 0,
          id_destino: nuevoDestino || 0
        };
      });
    } else {
      setFormData(prev => {
        if (!prev) return null;
        return { ...prev, [field]: processedValue };
      });
    }
    
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
        
        if (typeof processedValue === 'number' && processedValue > 0) {
          // Buscar el conductor seleccionado para mostrar su nombre en los logs
          const conductorSeleccionado = conductores.find(c => c.id_chofer === processedValue);
          console.log(`🔄 Se seleccionó al conductor: ${conductorSeleccionado?.nombre_completo || 'Desconocido'} (ID: ${processedValue})`);
          console.log("🔄 Buscando vehículo y semirremolque asociados...");
          
          const { vehiculo, semirremolque } = await fetchDriverVehicleInfo(processedValue);
          
          if (vehiculo) {
            console.log(`✅ Se asignó automáticamente el vehículo: ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`);
            setFormData(prev => {
              if (!prev) return null;
              return { ...prev, id_flota: vehiculo.id_flota };
            });
          } else {
            console.log("⚠️ No se encontró vehículo asignado al conductor - No se realizó asignación automática");
            // Limpiar el campo de vehículo si no hay ninguno asignado
            setFormData(prev => {
              if (!prev) return null;
              return { ...prev, id_flota: undefined };
            });
          }
          
          if (semirremolque) {
            console.log(`✅ Se asignó automáticamente el semirremolque: ${semirremolque.patente}`);
            setFormData(prev => {
              if (!prev) return null;
              return { ...prev, id_semirremolque: semirremolque.id_semirremolque };
            });
          } else {
            console.log("⚠️ No se encontró semirremolque asociado - No se realizó asignación automática");
            // Limpiar el campo de semirremolque si no hay ninguno asignado
            setFormData(prev => {
              if (!prev) return null;
              return { ...prev, id_semirremolque: undefined };
            });
          }
        } else {
          // Si se deseleccionó el conductor, limpiar vehículo y semirremolque
          setFormData(prev => {
            if (!prev) return null;
            return { 
              ...prev, 
              id_flota: undefined,
              id_semirremolque: undefined
            };
          });
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

    // Si la fecha de llegada es anterior o igual a la nueva fecha de salida, actualizarla automáticamente (+1 día)
    if (llegadaDate && llegadaDate <= date) {
      const nuevaLlegada = new Date(date);
      nuevaLlegada.setDate(nuevaLlegada.getDate() + 1);
      setLlegadaDate(nuevaLlegada);
      setFormData(prev => prev ? { ...prev, fecha_llegada_programada: nuevaLlegada.toISOString() } : null);
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
    if (!formData) return;

    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Por favor, corrige los errores en el formulario",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
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

      // Actualizar el viaje
      const { error: errorViaje } = await supabase
        .from('viajes')
        .update({
          id_cliente: formData.id_cliente,
          id_chofer: formData.id_chofer,
          id_flota: formData.id_flota,
          id_semirremolque: formData.id_semirremolque,
          id_origen: formData.id_origen,
          id_destino: formData.id_destino,
          tipo_viaje: formData.tipo_viaje,
          estado: formData.estado,
          prioridad: formData.prioridad,
          fecha_salida_programada: formData.fecha_salida_programada,
          fecha_llegada_programada: formData.fecha_llegada_programada,
          fecha_salida_real: formData.fecha_salida_real,
          fecha_llegada_real: formData.fecha_llegada_real,
          contenedor: formData.contenedor,
          nro_guia: formData.nro_guia,
          nro_control: formData.nro_control,
          factura: formData.factura,
          empresa: formData.empresa,
          observaciones: formData.observaciones,
          actualizado_en: new Date().toISOString()
        })
        .eq('id_viaje', formData.id_viaje);

      if (errorViaje) throw errorViaje;

      // Guardar los documentos
      if (documentos.length > 0) {
        const documentosConViajeId = documentos.map(doc => ({
          ...doc,
          id_viaje: formData.id_viaje
        }));

        const { error: documentosError } = await supabase
          .from('documentos_viaje')
          .insert(documentosConViajeId);

        if (documentosError) throw documentosError;
      }

      toast({
        title: "Éxito",
        description: "Viaje actualizado correctamente",
      });

      onOpenChange(false);
      if (typeof onSave === 'function') {
        await onSave(formData);
      }
    } catch (error: any) {
      console.error('Error al actualizar viaje:', error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el viaje",
        variant: "destructive",
      });
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
                    disabled={isLoading || !localidades || Object.keys(localidades).length === 0}
                  >
                    <SelectTrigger className={validationErrors.id_origen ? "border-destructive" : ""}>
                      <SelectValue placeholder={!localidades || Object.keys(localidades).length === 0 ? "Cargando orígenes..." : "Seleccionar origen"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(localidades || {})
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
                    disabled={isLoading || !localidades || Object.keys(localidades).length === 0}
                  >
                    <SelectTrigger className={validationErrors.id_destino ? "border-destructive" : ""}>
                      <SelectValue placeholder={!localidades || Object.keys(localidades).length === 0 ? "Cargando destinos..." : "Seleccionar destino"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(localidades || {})
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
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {clientes.find(c => c.id_cliente === formData.id_cliente)?.razon_social || 'No seleccionado'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {(() => {
                      const cliente = clientes.find(c => c.id_cliente === formData.id_cliente);
                      if (!cliente) return 'No seleccionado';
                      
                      // Si el país es Chile, mostrar RUT, si es Argentina mostrar CUIT
                      if (cliente.pais?.toLowerCase() === 'chile') {
                        return cliente.rut || 'No disponible';
                      } else if (cliente.pais?.toLowerCase() === 'argentina') {
                        return cliente.cuit || 'No disponible';
                      }
                      
                      // Si no se puede determinar el país, mostrar ambos si están disponibles
                      return cliente.rut || cliente.cuit || 'No disponible';
                    })()}
                  </span>
                </div>
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
              Actualizar Viaje
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 