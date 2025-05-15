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
  Semirremolque 
} from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
}: ViajeDetailsDialogProps) {
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

  useEffect(() => {
    if (open && viaje) {
      loadViajeDetails();
    }
  }, [open, viaje]);

  useEffect(() => {
    if (open && viaje && activeTab === "incidentes") {
      loadIncidentes();
    }
  }, [open, viaje, activeTab]);

  const loadViajeDetails = async () => {
    if (!viaje) return;
    
    setIsLoading(true);
    
    try {
      // Cargar etapas
      const { data: etapasData } = await supabase
        .from('etapas_viaje')
        .select(`
          *,
          localidad:localidades(*)
        `)
        .eq('id_viaje', viaje.id_viaje)
        .order('fecha_programada');
      
      if (etapasData) {
        setEtapas(etapasData);
      }
      
      // Cargar incidentes con orden descendente por fecha
      const { data: incidentesData, error: incidentesError } = await supabase
        .from('incidentes_viaje')
        .select('*')
        .eq('id_viaje', viaje.id_viaje)
        .order('fecha_inicio', { ascending: false });
      
      if (incidentesError) {
        console.error('Error al cargar incidentes:', incidentesError);
      }
      
      if (incidentesData) {
        console.log('Incidentes cargados:', incidentesData); // Debug
        setIncidentes(incidentesData);
      }
      
      // Cargar origen
      if (viaje.id_origen) {
        const { data: origenData } = await supabase
          .from('localidades')
          .select('*')
          .eq('id_localidad', viaje.id_origen)
          .single();
        
        if (origenData) {
          setOrigen(origenData);
        }
      }
      
      // Cargar destino
      if (viaje.id_destino) {
        const { data: destinoData } = await supabase
          .from('localidades')
          .select('*')
          .eq('id_localidad', viaje.id_destino)
          .single();
        
        if (destinoData) {
          setDestino(destinoData);
        }
      }
      
      // Cargar cliente
      if (viaje.id_cliente) {
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('*')
          .eq('id_cliente', viaje.id_cliente)
          .single();
        
        if (clienteData) {
          setCliente(clienteData);
        }
      }
      
      // Cargar conductor
      if (viaje.id_chofer) {
        const { data: conductorData } = await supabase
          .from('choferes')
          .select('*')
          .eq('id_chofer', viaje.id_chofer)
          .single();
        
        if (conductorData) {
          setConductor(conductorData);
        }
      }
      
      // Cargar vehículo
      if (viaje.id_flota) {
        const { data: vehiculoData } = await supabase
          .from('flota')
          .select('*')
          .eq('id_flota', viaje.id_flota)
          .single();
        
        if (vehiculoData) {
          setVehiculo(vehiculoData);
        }
      }
      
      // Cargar semirremolque
      if (viaje.id_semirremolque) {
        const { data: semirremolqueData } = await supabase
          .from('semirremolques')
          .select('*')
          .eq('id_semirremolque', viaje.id_semirremolque)
          .single();
        
        if (semirremolqueData) {
          setSemirremolque(semirremolqueData);
        }
      }
    } catch (error) {
      console.error('Error al cargar detalles del viaje:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadIncidentes = async () => {
    if (!viaje) return;
    
    try {
      console.log('Cargando incidentes para viaje:', viaje.id_viaje);
      
      const { data: incidentesData, error: incidentesError } = await supabase
        .from('incidentes_viaje')
        .select('*')
        .eq('id_viaje', viaje.id_viaje)
        .order('fecha_inicio', { ascending: false });
      
      if (incidentesError) {
        console.error('Error al cargar incidentes:', incidentesError);
        return;
      }
      
      console.log('Respuesta de incidentes:', incidentesData);
      
      if (incidentesData) {
        setIncidentes(incidentesData);
      } else {
        console.log('No se encontraron incidentes');
        setIncidentes([]);
      }
    } catch (error) {
      console.error('Error al cargar incidentes:', error);
    }
  };

  const getEstadoClassName = (estado: string) => {
    switch (estado) {
      case 'planificado': return 'bg-blue-500';
      case 'en_ruta': return 'bg-green-500';
      case 'incidente': return 'bg-amber-500';
      case 'realizado': return 'bg-green-700';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
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

  if (!viaje) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="etapas">Etapas</TabsTrigger>
              <TabsTrigger value="incidentes">Incidentes</TabsTrigger>
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
                  <p><span className="font-medium">Contacto:</span> {clientes[viaje.id_cliente || 0]?.contacto || "No disponible"}</p>
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
                  <p className="text-sm">
                    {viaje.contenedor || 'No especificado'}
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
              {etapas.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay etapas registradas para este viaje.
                </p>
              ) : (
                <div className="space-y-4">
                  {etapas.map((etapa) => (
                    <div 
                      key={etapa.id_etapa}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-medium capitalize">
                          {etapa.tipo_etapa.replace('_', ' ')}
                        </h3>
                        <Badge className={`${getEstadoEtapaClassName(etapa.estado)}`}>
                          {etapa.estado.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {etapa.localidad ? 
                            `${etapa.localidad.nombre}, ${etapa.localidad.pais}` : 
                            'Localidad no especificada'
                          }
                        </div>
                        
                        <div className="flex justify-between mt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Programada</p>
                            <p className="text-xs font-medium">
                              {formatFecha(etapa.fecha_programada)}
                            </p>
                          </div>
                          
                          {etapa.fecha_realizada && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Realizada</p>
                              <p className="text-xs font-medium">
                                {formatFecha(etapa.fecha_realizada)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {etapa.observaciones && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {etapa.observaciones}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
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
                      
                      {/* Botón para resolver incidente si está reportado o en atención */}
                      {onResolveIncidente && ['reportado', 'en_atencion'].includes(incidente.estado) && (
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResolveIncidente(viaje, incidente)}
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
          </Tabs>
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 