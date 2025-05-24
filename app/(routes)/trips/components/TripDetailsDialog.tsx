"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Trip, TripIncident } from "@/lib/types/trips";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface TripDetailsDialogProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TripWithDetails extends Trip {
  chofer?: {
    id_chofer: number;
    nombre_completo: string;
    documento_identidad: string;
    tipo_licencia?: string;
    vencimiento_licencia?: string;
    telefono?: string;
    email?: string;
    estado?: 'activo' | 'inactivo' | 'suspendido';
  };
  flota?: {
    id_flota: number;
    patente: string;
    marca: string;
    modelo: string;
  };
  semirremolque?: {
    id_semirremolque: number;
    patente: string;
    tipo: string;
  };
}

interface TripIncidentWithDetails extends TripIncident {
  fecha_incidente: string;
  severidad: 'baja' | 'media' | 'alta';
  descripcion: string;
  acciones_tomadas?: string;
}

// Función de utilidad para formatear fechas de manera segura
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'No definida';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return format(date, "PPP", { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Error al formatear fecha';
  }
};

export function TripDetailsDialog({ trip, open, onOpenChange }: TripDetailsDialogProps) {
  const [tripDetails, setTripDetails] = useState<TripWithDetails | null>(null);
  const [incidents, setIncidents] = useState<TripIncidentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientes, setClientes] = useState<Record<number, { razon_social: string }>>({});
  const [localidades, setLocalidades] = useState<Record<number, { nombre: string }>>({});

  useEffect(() => {
    if (trip) {
      fetchTripDetails();
      fetchRelatedData();
    }
  }, [trip]);

  const fetchRelatedData = async () => {
    try {
      // Cargar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id_cliente, razon_social')
        .eq('estado', 'activo');

      if (clientesError) throw clientesError;
      const clientesMap = (clientesData || []).reduce((acc, cliente) => {
        acc[cliente.id_cliente] = cliente;
        return acc;
      }, {} as Record<number, { razon_social: string }>);
      setClientes(clientesMap);

      // Cargar localidades
      const { data: localidadesData, error: localidadesError } = await supabase
        .from('localidades')
        .select('id_localidad, nombre');

      if (localidadesError) throw localidadesError;
      const localidadesMap = (localidadesData || []).reduce((acc, localidad) => {
        acc[localidad.id_localidad] = localidad;
        return acc;
      }, {} as Record<number, { nombre: string }>);
      setLocalidades(localidadesMap);
    } catch (error: any) {
      console.error('Error al cargar datos relacionados:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos relacionados.",
        variant: "destructive",
      });
    }
  };

  const fetchTripDetails = async () => {
    if (!trip) return;

    setIsLoading(true);
    try {
      // Obtener detalles del viaje con información relacionada
      const { data: tripData, error: tripError } = await supabase
        .from('viajes')
        .select(`
          *,
          chofer:choferes!id_chofer(id_chofer, nombre_completo, documento_identidad, tipo_licencia, vencimiento_licencia, telefono, email, estado),
          flota:flota!id_flota(id_flota, patente, marca, modelo),
          semirremolque:semirremolques!id_semirremolque(id_semirremolque, patente, tipo)
        `)
        .eq('id_viaje', trip.id_viaje)
        .single();

      if (tripError) {
        console.error('Error al cargar detalles del viaje:', tripError);
        throw tripError;
      }

      if (!tripData) {
        throw new Error('No se encontraron datos del viaje');
      }

      // Obtener incidentes del viaje
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('incidentes_viaje')
        .select('*')
        .eq('id_viaje', trip.id_viaje)
        .order('fecha_inicio', { ascending: false });

      if (incidentsError) {
        console.error('Error al cargar incidentes:', incidentsError);
        throw incidentsError;
      }

      setTripDetails(tripData);
      setIncidents(incidentsData || []);
    } catch (error: any) {
      console.error('Error al cargar detalles del viaje:', error);
      const errorMessage = error.message || 'Error desconocido al cargar los detalles del viaje';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!trip || !tripDetails) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planificacion':
        return 'bg-yellow-500';
      case 'en_ruta':
        return 'bg-blue-500';
      case 'incidente':
        return 'bg-red-500';
      case 'completado':
        return 'bg-green-500';
      case 'cancelado':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalles del Viaje</span>
            <Badge className={getStatusColor(tripDetails.estado)}>
              {tripDetails.estado.replace('_', ' ').toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="general" className="w-full">
            <TabsList>
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="incidentes">Incidentes</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Viaje</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-semibold">Cliente:</span> {tripDetails.id_cliente ? clientes[tripDetails.id_cliente]?.razon_social || 'No especificado' : 'No especificado'}
                    </div>
                    <div>
                      <span className="font-semibold">Origen:</span> {localidades[parseInt(tripDetails.origen)]?.nombre || 'No especificado'}
                    </div>
                    <div>
                      <span className="font-semibold">Destino:</span> {localidades[parseInt(tripDetails.destino)]?.nombre || 'No especificado'}
                    </div>
                    <div>
                      <span className="font-semibold">Fecha de Salida:</span>{' '}
                      {formatDate(tripDetails.fecha_salida)}
                    </div>
                    <div>
                      <span className="font-semibold">Fecha de Llegada:</span>{' '}
                      {formatDate(tripDetails.fecha_llegada)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalles del Transporte</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-semibold">Conductor:</span>{' '}
                      {tripDetails.chofer ? `${tripDetails.chofer.nombre_completo}` : 'No asignado'}
                    </div>
                    <div>
                      <span className="font-semibold">Vehículo:</span>{' '}
                      {tripDetails.flota ? `${tripDetails.flota.marca} ${tripDetails.flota.modelo} (${tripDetails.flota.patente})` : 'No asignado'}
                    </div>
                    <div>
                      <span className="font-semibold">Semirremolque:</span>{' '}
                      {tripDetails.semirremolque ? `${tripDetails.semirremolque.tipo} (${tripDetails.semirremolque.patente})` : 'No asignado'}
                    </div>
                    <div>
                      <span className="font-semibold">Contenedor:</span> {tripDetails.contenedor}
                    </div>
                    <div>
                      <span className="font-semibold">Número de Guía:</span> {tripDetails.nro_guia}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="incidentes">
              <Card>
                <CardHeader>
                  <CardTitle>Incidentes Registrados</CardTitle>
                </CardHeader>
                <CardContent>
                  {incidents.length === 0 ? (
                    <p className="text-gray-500">No hay incidentes registrados para este viaje.</p>
                  ) : (
                    <div className="space-y-4">
                      {incidents.map((incident) => (
                        <Card key={incident.id_incidente}>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="font-semibold">
                                  {formatDate(incident.fecha_incidente)}
                                </span>
                                <Badge variant={incident.severidad === 'alta' ? 'destructive' : 'default'}>
                                  {incident.severidad.toUpperCase()}
                                </Badge>
                              </div>
                              <p>{incident.descripcion}</p>
                              {incident.acciones_tomadas && (
                                <div>
                                  <span className="font-semibold">Acciones tomadas:</span>
                                  <p>{incident.acciones_tomadas}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos">
              <Card>
                <CardHeader>
                  <CardTitle>Documentos del Viaje</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">No hay documentos disponibles para este viaje.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
} 