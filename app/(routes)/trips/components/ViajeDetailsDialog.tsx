import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, MapPin, Truck, User, Calendar, CheckCircle, 
  AlertTriangle, Building, PackageOpen, Image, Package 
} from "lucide-react";
import { 
  supabase, 
  Viaje, 
  EtapaViaje, 
  IncidenteViaje, 
  Cliente, 
  Localidad, 
  Driver, 
  Fleet, 
  Semirremolque,
  TipoEtapa,
  getEtapasByTipoViaje
} from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ResolveIncidenteDialog } from "./ResolveIncidenteDialog";

interface ViajeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viaje: Viaje;
  localidades: Record<number, Localidad>;
  clientes: Record<number, Cliente>;
  conductores: Record<number, Driver>;
  vehiculos: Record<number, Fleet>;
  semirremolques: Record<number, Semirremolque>;
  onRegisterIncidente: (viaje: Viaje) => void;
  onResolveIncidente: (viaje: Viaje, incidente: any) => void;
  onEtapasUpdated: () => Promise<void>;
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

export function ViajeDetailsDialog({
  open,
  onOpenChange,
  viaje,
  localidades,
  clientes,
  conductores,
  vehiculos,
  semirremolques,
  onRegisterIncidente,
  onResolveIncidente,
  onEtapasUpdated,
}: ViajeDetailsDialogProps) {
  const { toast } = useToast();
  const [etapas, setEtapas] = useState<(EtapaViaje & { localidad?: Localidad })[]>([]);
  const [incidentes, setIncidentes] = useState<IncidenteViaje[]>([]);
  const [origen, setOrigen] = useState<Localidad | null>(null);
  const [destino, setDestino] = useState<Localidad | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [conductor, setConductor] = useState<Driver | null>(null);
  const [vehiculo, setVehiculo] = useState<Fleet | null>(null);
  const [semirremolque, setSemirremolque] = useState<Semirremolque | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [showEtapasDialog, setShowEtapasDialog] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoViaje[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<'guia' | 'factura' | 'control'>('guia');
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [selectedIncidente, setSelectedIncidente] = useState<IncidenteViaje | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  useEffect(() => {
    if (open && viaje) {
      console.log('🔄 Diálogo abierto, cargando datos para viaje:', viaje.id_viaje);
      loadViajeDetails();
      loadIncidentes();
      fetchDocumentos();
    }
  }, [open, viaje]);

  const loadViajeDetails = async () => {
    if (!viaje) return;
    
    setIsLoading(true);
    
    try {
      // Cargar todas las consultas en paralelo
      const [
        { data: etapasData, error: etapasError },
        { data: incidentesData, error: incidentesError },
        { data: clienteData, error: clienteError },
        { data: conductorData, error: conductorError },
        { data: vehiculoData, error: vehiculoError },
        { data: semirremolqueData, error: semirremolqueError }
      ] = await Promise.all([
        supabase
          .from('etapas_viaje')
          .select(`
            *,
            localidades(*)
          `)
          .eq('id_viaje', viaje.id_viaje)
          .order('creado_en', { ascending: true }),
        supabase
          .from('incidentes_viaje')
          .select('*')
          .eq('id_viaje', viaje.id_viaje)
          .order('fecha_inicio', { ascending: false }),
        viaje.id_cliente ? supabase
          .from('clientes')
          .select('*')
          .eq('id_cliente', viaje.id_cliente)
          .single() : Promise.resolve({ data: null, error: null }),
        viaje.id_chofer ? supabase
          .from('choferes')
          .select('*')
          .eq('id_chofer', viaje.id_chofer)
          .single() : Promise.resolve({ data: null, error: null }),
        viaje.id_flota ? supabase
          .from('flota')
          .select('*')
          .eq('id_flota', viaje.id_flota)
          .single() : Promise.resolve({ data: null, error: null }),
        viaje.id_semirremolque ? supabase
          .from('semirremolques')
          .select('*')
          .eq('id_semirremolque', viaje.id_semirremolque)
          .single() : Promise.resolve({ data: null, error: null })
      ]);

      // Manejar errores
      if (etapasError) throw etapasError;
      if (incidentesError) throw incidentesError;
      if (clienteError) throw clienteError;
      if (conductorError) throw conductorError;
      if (vehiculoError) throw vehiculoError;
      if (semirremolqueError) throw semirremolqueError;

      // Actualizar estados
      if (etapasData) {
        setEtapas(etapasData);
        
        // Obtener origen y destino de las etapas
        const primeraEtapa = etapasData[0];
        const ultimaEtapa = etapasData[etapasData.length - 1];
        
        if (primeraEtapa?.localidades) {
          setOrigen(primeraEtapa.localidades);
        }
        
        if (ultimaEtapa?.localidades) {
          setDestino(ultimaEtapa.localidades);
        }
      }
      
      if (incidentesData) {
        setIncidentes(incidentesData);
      }
      
      if (clienteData) {
        setCliente(clienteData);
      }
      
      if (conductorData) {
        setConductor(conductorData);
      }
      
      if (vehiculoData) {
        setVehiculo(vehiculoData);
      }
      
      if (semirremolqueData) {
        setSemirremolque(semirremolqueData);
      }

    } catch (error) {
      console.error('Error al cargar detalles del viaje:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del viaje.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadIncidentes = async () => {
    if (!viaje) return;
    
    try {
      console.log('🔄 Iniciando carga de incidentes para viaje:', viaje.id_viaje);
      
      // Primero verificar si hay incidentes en la tabla
      const { count, error: countError } = await supabase
        .from('incidentes_viaje')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Error al contar incidentes:', countError);
      } else {
        console.log('📊 Total de incidentes en la tabla:', count);
      }
      
      // Luego obtener los incidentes del viaje
      const { data: incidentesData, error: incidentesError } = await supabase
        .from('incidentes_viaje')
        .select('*')
        .eq('id_viaje', viaje.id_viaje)
        .order('fecha_inicio', { ascending: false });
      
      if (incidentesError) {
        console.error('❌ Error al cargar incidentes:', incidentesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los incidentes del viaje.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Incidentes cargados:', incidentesData);
      console.log('🔍 Consulta SQL:', `SELECT * FROM incidentes_viaje WHERE id_viaje = ${viaje.id_viaje} ORDER BY fecha_inicio DESC`);
      
      if (incidentesData && incidentesData.length > 0) {
        console.log('📝 Número de incidentes encontrados:', incidentesData.length);
        setIncidentes(incidentesData);
      } else {
        console.log('ℹ️ No se encontraron incidentes para el viaje');
        setIncidentes([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar incidentes:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los incidentes.",
        variant: "destructive",
      });
    }
  };

  const getEstadoClassName = (estado: string) => {
    switch (estado) {
      case 'planificado': return 'bg-gray-300 text-gray-800';
      case 'en_ruta': return 'bg-sky-400 text-white';
      case 'realizado': return 'bg-green-500 text-white';
      case 'incidente': return 'bg-amber-500 text-white';
      case 'cancelado': return 'bg-red-500 text-white';
      default: return 'bg-gray-300 text-gray-800';
    }
  };

  const getPrioridadClassName = (prioridad: string) => {
    switch (prioridad) {
      case 'baja': return 'bg-blue-500';
      case 'media': return 'bg-green-500';
      case 'alta': return 'bg-amber-500';
      case 'urgente': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEstadoEtapaClassName = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-gray-500';
      case 'en_proceso': return 'bg-amber-500';
      case 'completada': return 'bg-green-500';
      case 'cancelada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getIncidenteClassName = (estado: string) => {
    switch (estado) {
      case 'reportado': return 'bg-red-500';
      case 'en_atencion': return 'bg-amber-500';
      case 'resuelto': return 'bg-green-500';
      case 'escalado': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatFecha = (fecha: string | undefined) => {
    if (!fecha) return 'No definida';
    return format(new Date(fecha), "dd/MM/yyyy HH:mm", { locale: es });
  };

  const getConductorInfo = () => {
    if (!viaje.id_chofer) return "No asignado";
    const conductor = conductores[viaje.id_chofer];
    return conductor ? conductor.nombre_completo : "Conductor no encontrado";
  };

  const getVehiculoInfo = () => {
    if (!viaje.id_flota) return "No asignado";
    const vehiculo = vehiculos[viaje.id_flota];
    return vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})` : "Vehículo no encontrado";
  };

  const getSemirremolqueInfo = () => {
    if (!viaje.id_semirremolque) return "No asignado";
    const semirremolque = semirremolques[viaje.id_semirremolque];
    return semirremolque ? `${semirremolque.patente} ${semirremolque.marca ? `(${semirremolque.marca})` : ''}` : "Semirremolque no encontrado";
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

  useEffect(() => {
    if (open && viaje) {
      console.log('🔄 Diálogo abierto, cargando datos para viaje:', viaje.id_viaje);
      loadViajeDetails();
      loadIncidentes();
      fetchDocumentos();
    }
  }, [open, viaje]);

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

  const getEtapaConfig = (tipoEtapa: string): TipoEtapa | undefined => {
    const etapas = getEtapasByTipoViaje(viaje?.tipo_viaje as 'ida' | 'vuelta');
    return etapas.find(etapa => etapa.id === tipoEtapa);
  };

  const handleEtapaCheck = async (etapa: EtapaViaje, checked: boolean) => {
    try {
      const nuevoEstado = checked ? 'completada' : 'pendiente';
      console.log('🔄 Actualizando estado de la etapa:', {
        etapaId: etapa.id_etapa,
        tipoEtapa: etapa.tipo_etapa,
        nuevoEstado,
        checked
      });

      // Actualizar el estado de la etapa
      const { error } = await supabase
        .from('etapas_viaje')
        .update({
          estado: nuevoEstado,
          fecha_realizada: checked ? new Date().toISOString() : null,
          actualizado_en: new Date().toISOString()
        })
        .eq('id_etapa', etapa.id_etapa);

      if (error) throw error;

      // Obtener todas las etapas ordenadas
      const { data: etapasOrdenadas, error: errorOrden } = await supabase
        .from('etapas_viaje')
        .select('id_etapa, tipo_etapa, estado')
        .eq('id_viaje', viaje.id_viaje)
        .order('creado_en', { ascending: true });

      if (errorOrden) throw errorOrden;

      const primeraEtapa = etapasOrdenadas?.[0];
      const todasCompletadas = etapasOrdenadas?.every(e => e.estado === 'completada');

      console.log('📊 Estado de las etapas:', {
        totalEtapas: etapasOrdenadas?.length,
        etapasCompletadas: etapasOrdenadas?.filter(e => e.estado === 'completada').length,
        todasCompletadas,
        esPrimeraEtapa: primeraEtapa && etapa.id_etapa === primeraEtapa.id_etapa,
        etapaActual: etapa.tipo_etapa
      });

      let estadoActualizado = false;

      // Primero verificar si todas las etapas están completadas
      if (todasCompletadas && etapasOrdenadas && etapasOrdenadas.length > 0) {
        console.log('🔄 Todas las etapas completadas, actualizando estado a "realizado"');
        
        const { error: viajeError } = await supabase
          .from('viajes')
          .update({
            estado: 'realizado',
            actualizado_en: new Date().toISOString()
          })
          .eq('id_viaje', viaje.id_viaje);

        if (viajeError) throw viajeError;
        estadoActualizado = true;
      }
      // Si no están todas completadas, verificar si es la primera etapa
      else if (checked && etapa.tipo_etapa === 'retiro_contenedor') {
        console.log('🔄 Primera etapa (retiro de contenedor) completada, actualizando estado a "en_ruta"');
        
        const { error: viajeError } = await supabase
          .from('viajes')
          .update({
            estado: 'en_ruta',
            actualizado_en: new Date().toISOString()
          })
          .eq('id_viaje', viaje.id_viaje);

        if (viajeError) throw viajeError;
        estadoActualizado = true;
      }

      // Recargar los datos
      await loadViajeDetails();
      
      // Si el estado del viaje se actualizó, forzar la actualización de la vista
      if (estadoActualizado) {
        // Obtener el viaje actualizado
        const { data: viajeActualizado, error: viajeError } = await supabase
          .from('viajes')
          .select('*')
          .eq('id_viaje', viaje.id_viaje)
          .single();

        if (viajeError) throw viajeError;

        // Actualizar el objeto viaje con los nuevos datos
        Object.assign(viaje, viajeActualizado);
      }

      // Notificar el cambio
      await onEtapasUpdated();

      toast({
        title: "Éxito",
        description: `Etapa ${checked ? 'completada' : 'pendiente'} correctamente.`,
      });
    } catch (error) {
      console.error('Error al actualizar etapa:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la etapa.",
        variant: "destructive",
      });
    }
  };

  const handleResolveIncidente = (incidente: IncidenteViaje) => {
    setSelectedIncidente(incidente);
    setShowResolveDialog(true);
  };

  const handleIncidenteResolved = async () => {
    try {
      // Recargar los incidentes
      await loadIncidentes();
      
      // Obtener el viaje actualizado
      const { data: viajeActualizado, error: viajeError } = await supabase
        .from('viajes')
        .select('*')
        .eq('id_viaje', viaje.id_viaje)
        .single();

      if (viajeError) {
        console.error('❌ Error al obtener viaje actualizado:', viajeError);
        throw viajeError;
      }

      // Actualizar el objeto viaje con los nuevos datos
      if (viajeActualizado) {
        Object.assign(viaje, viajeActualizado);
      }

      // Notificar el cambio
      await onEtapasUpdated();
    } catch (error) {
      console.error('❌ Error al actualizar estado del viaje:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del viaje.",
        variant: "destructive",
      });
    }
  };

  const handleLocalidadChange = async (etapa: EtapaViaje, idLocalidad: number) => {
    try {
      const { error } = await supabase
        .from('etapas_viaje')
        .update({
          id_localidad: idLocalidad,
          actualizado_en: new Date().toISOString()
        })
        .eq('id_etapa', etapa.id_etapa);

      if (error) throw error;

      // Actualizar el estado local
      setEtapas(prevEtapas => 
        prevEtapas.map(e => 
          e.id_etapa === etapa.id_etapa 
            ? { ...e, id_localidad: idLocalidad, localidad: localidades[idLocalidad] }
            : e
        )
      );

      toast({
        title: "Éxito",
        description: "Localidad actualizada correctamente",
      });
    } catch (error) {
      console.error('Error al actualizar localidad:', error);
      toast({
        title: "Error",
        description: "Error al actualizar la localidad",
        variant: "destructive",
      });
    }
  };

  if (!viaje) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Viaje #{viaje.nro_control || viaje.id_viaje}
              <Badge className={`capitalize ml-2 ${getEstadoClassName(viaje.estado)}`}>
                {viaje.estado.replace('_', ' ')}
              </Badge>
              <Badge className={`capitalize ml-1 ${getPrioridadClassName(viaje.prioridad)}`}>
                {viaje.prioridad}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            <Tabs 
              defaultValue="info" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="etapas">Etapas</TabsTrigger>
                <TabsTrigger value="incidentes">Incidentes</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
              </TabsList>
              
              {/* Pestaña de Información */}
              <TabsContent value="info" className="space-y-4 mt-4">
                {/* Origen y Destino */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> Origen
                    </h3>
                    <p className="text-sm">
                      {origen ? `${origen.nombre}, ${origen.pais}` : 'No especificado'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> Destino
                    </h3>
                    <p className="text-sm">
                      {destino ? `${destino.nombre}, ${destino.pais}` : 'No especificado'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Fechas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Salida Programada
                    </h3>
                    <p className="text-sm">{formatFecha(viaje.fecha_salida_programada)}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Llegada Programada
                    </h3>
                    <p className="text-sm">{formatFecha(viaje.fecha_llegada_programada)}</p>
                  </div>
                </div>
                
                {(viaje.fecha_salida_real || viaje.fecha_llegada_real) && (
                  <div className="grid grid-cols-2 gap-4">
                    {viaje.fecha_salida_real && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Salida Real
                        </h3>
                        <p className="text-sm">{formatFecha(viaje.fecha_salida_real)}</p>
                      </div>
                    )}
                    {viaje.fecha_llegada_real && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Llegada Real
                        </h3>
                        <p className="text-sm">{formatFecha(viaje.fecha_llegada_real)}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <Separator />
                
                {/* Información del Cliente */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Cliente</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Razón Social:</span> {clientes[viaje.id_cliente || 0]?.razon_social || "No asignado"}</p>
                    <p><span className="font-medium">CUIT:</span> {clientes[viaje.id_cliente || 0]?.cuit || "No disponible"}</p>
                    <p><span className="font-medium">Contacto:</span> {clientes[viaje.id_cliente || 0]?.contacto_principal || "No disponible"}</p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Equipo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <User className="h-4 w-4" /> Conductor
                    </h3>
                    <p className="text-sm">
                      {getConductorInfo()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <Truck className="h-4 w-4" /> Vehículo
                    </h3>
                    <p className="text-sm">
                      {getVehiculoInfo()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <Package className="h-4 w-4" /> Semirremolque
                    </h3>
                    <p className="text-sm">
                      {getSemirremolqueInfo()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <PackageOpen className="h-4 w-4" /> Contenedor
                    </h3>
                    <p className="text-sm font-mono">
                      {viaje.contenedor?.toUpperCase() || 'No especificado'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Guía y Factura */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <FileText className="h-4 w-4" /> Número de Guía
                    </h3>
                    <p className="text-sm">
                      {viaje.nro_guia || 'No registrado'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <FileText className="h-4 w-4" /> Factura
                    </h3>
                    <p className="text-sm">
                      {viaje.factura || 'No registrada'}
                    </p>
                  </div>
                </div>
                
                {/* Observaciones */}
                {viaje.notas && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Observaciones</h3>
                    <p className="text-sm">{viaje.notas}</p>
                  </div>
                )}
                
                <Separator />
                
                {/* Fechas de creación/actualización */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Creado: {formatFecha(viaje.creado_en)}</p>
                  <p>Última actualización: {formatFecha(viaje.actualizado_en)}</p>
                </div>
              </TabsContent>
              
              {/* Pestaña de Etapas */}
              <TabsContent value="etapas" className="space-y-4 mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : etapas.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No hay etapas registradas para este viaje.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {etapas.map((etapa) => {
                      const etapaInfo = getEtapaConfig(etapa.tipo_etapa);
                      const isCompleted = etapa.estado === 'completada';
                      const fechaRealizada = etapa.fecha_realizada 
                        ? format(new Date(etapa.fecha_realizada), "dd/MM/yyyy HH:mm", { locale: es })
                        : null;

                      return (
                        <div
                          key={etapa.id_etapa}
                          className={cn(
                            "p-4 rounded-lg border transition-colors",
                            isCompleted ? "bg-green-50 border-green-200" : "bg-white"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`etapa-${etapa.id_etapa}`}
                              checked={isCompleted}
                              onCheckedChange={(checked) => handleEtapaCheck(etapa, checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`etapa-${etapa.id_etapa}`}
                                className="text-base font-medium cursor-pointer"
                              >
                                {etapaInfo?.nombre}
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {etapaInfo?.descripcion}
                              </p>
                              {etapaInfo?.requiere_localidad && (
                                <div className="mt-2">
                                  <Select
                                    value={etapa.id_localidad?.toString()}
                                    onValueChange={(value) => handleLocalidadChange(etapa, parseInt(value))}
                                    disabled={isCompleted}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Seleccionar localidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(() => {
                                        console.log('Localidades disponibles:', Object.values(localidades));
                                        console.log('Tipo de viaje:', viaje.tipo_viaje);
                                        console.log('Tipo de etapa:', etapa.tipo_etapa);
                                        console.log('Configuración de etapa:', etapaInfo);

                                        const localidadesFiltradas = Object.values(localidades)
                                          .filter(localidad => {
                                            console.log('Evaluando localidad:', {
                                              nombre: localidad.nombre,
                                              es_puerto: localidad.es_puerto,
                                              es_aduana: localidad.es_aduana,
                                              es_deposito_contenedores: localidad.es_deposito_contenedores
                                            });

                                            // Para la etapa de retiro de contenedor en viajes de IDA
                                            if (etapa.tipo_etapa === 'retiro_contenedor' && viaje.tipo_viaje === 'ida') {
                                              const esValida = localidad.es_puerto === true;
                                              console.log('Filtro retiro_contenedor IDA:', { nombre: localidad.nombre, esValida });
                                              return esValida;
                                            }
                                            // Para la etapa de retiro de contenedor en viajes de VUELTA
                                            if (etapa.tipo_etapa === 'retiro_contenedor' && viaje.tipo_viaje === 'vuelta') {
                                              const esValida = localidad.es_deposito_contenedores === true;
                                              console.log('Filtro retiro_contenedor VUELTA:', { nombre: localidad.nombre, esValida });
                                              return esValida;
                                            }
                                            // Para la etapa de despacho a depósito en viajes de IDA
                                            if (etapa.tipo_etapa === 'despacho_deposito' && viaje.tipo_viaje === 'ida') {
                                              const esValida = localidad.es_deposito_contenedores === true;
                                              console.log('Filtro despacho_deposito:', { nombre: localidad.nombre, esValida });
                                              return esValida;
                                            }
                                            // Para otras etapas, usar el tipo de localidad definido en la configuración
                                            if (etapaInfo?.tipo_localidad) {
                                              let esValida = false;
                                              switch (etapaInfo.tipo_localidad) {
                                                case 'puerto':
                                                  esValida = localidad.es_puerto === true;
                                                  break;
                                                case 'aduana':
                                                  esValida = localidad.es_aduana === true;
                                                  break;
                                                case 'deposito':
                                                  esValida = localidad.es_deposito_contenedores === true;
                                                  break;
                                                case 'cliente':
                                                  esValida = !localidad.es_puerto && !localidad.es_aduana && !localidad.es_deposito_contenedores;
                                                  break;
                                                default:
                                                  esValida = true;
                                              }
                                              console.log('Filtro por tipo_localidad:', { 
                                                nombre: localidad.nombre, 
                                                tipo: etapaInfo.tipo_localidad,
                                                esValida 
                                              });
                                              return esValida;
                                            }
                                            return true;
                                          });

                                        console.log('Localidades filtradas:', localidadesFiltradas);

                                        if (localidadesFiltradas.length === 0) {
                                          console.warn('No se encontraron localidades para el tipo de etapa:', {
                                            tipo_etapa: etapa.tipo_etapa,
                                            tipo_viaje: viaje.tipo_viaje,
                                            tipo_localidad: etapaInfo?.tipo_localidad
                                          });
                                        }

                                        return localidadesFiltradas.map(localidad => (
                                          <SelectItem 
                                            key={localidad.id_localidad} 
                                            value={localidad.id_localidad.toString()}
                                          >
                                            {localidad.nombre}, {localidad.pais}
                                          </SelectItem>
                                        ));
                                      })()}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              {fechaRealizada && (
                                <p className="text-xs text-green-600 mt-2">
                                  Completada el {fechaRealizada}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              {/* Pestaña de Incidentes */}
              <TabsContent value="incidentes" className="space-y-4 mt-4">
                {/* Botón para registrar incidente (solo visible si el viaje está en ruta) */}
                {viaje.estado === 'en_ruta' && onRegisterIncidente && (
                  <div className="mb-4">
                    <Button 
                      onClick={() => onRegisterIncidente(viaje)}
                      className="w-full"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Registrar nuevo incidente
                    </Button>
                  </div>
                )}
                
                {incidentes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No hay incidentes registrados para este viaje.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {incidentes.map((incidente) => (
                      <div 
                        key={incidente.id_incidente}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-medium flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="capitalize">{incidente.tipo_incidente.replace('_', ' ')}</span>
                          </h3>
                          <Badge className={`${getIncidenteClassName(incidente.estado)}`}>
                            {incidente.estado.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-sm">{incidente.descripcion}</p>
                        
                        {/* Foto del incidente si existe */}
                        {incidente.url_foto && (
                          <div className="mt-2">
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                              <img
                                src={incidente.url_foto}
                                alt="Foto del incidente"
                                className="object-cover w-full h-full"
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <div>
                            <p>Inicio: {formatFecha(incidente.fecha_inicio)}</p>
                          </div>
                          
                          {incidente.fecha_resolucion && (
                            <div>
                              <p>Resolución: {formatFecha(incidente.fecha_resolucion)}</p>
                            </div>
                          )}
                        </div>
                        
                        {incidente.acciones_tomadas && (
                          <div className="mt-2">
                            <h4 className="text-xs font-medium">Acciones tomadas:</h4>
                            <p className="text-xs">{incidente.acciones_tomadas}</p>
                          </div>
                        )}
                        
                        {/* Botón para resolver incidente si está pendiente o en proceso */}
                        {incidente.estado !== 'resuelto' && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveIncidente(incidente)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolver
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
          </ScrollArea>
          
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedIncidente && (
        <ResolveIncidenteDialog
          open={showResolveDialog}
          onOpenChange={setShowResolveDialog}
          incidente={selectedIncidente}
          onIncidenteResolved={handleIncidenteResolved}
        />
      )}
    </>
  );
} 