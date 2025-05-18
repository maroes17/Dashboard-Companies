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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, Viaje, EtapaViaje, ETAPAS_VIAJE_IDA, ETAPAS_VIAJE_VUELTA, Localidad, TipoEtapa } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EtapasViajeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viaje: Viaje;
  onEtapasUpdated: () => Promise<void>;
  localidades: Record<number, Localidad>;
}

export function EtapasViajeDialog({
  open,
  onOpenChange,
  viaje,
  onEtapasUpdated,
  localidades,
}: EtapasViajeDialogProps) {
  const { toast } = useToast();
  const [etapas, setEtapas] = useState<(EtapaViaje & { localidad?: Localidad })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadEtapas();
    }
  }, [open, viaje]);

  const loadEtapas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('etapas_viaje')
        .select(`
          *,
          localidad:localidades(*)
        `)
        .eq('id_viaje', viaje.id_viaje)
        .order('creado_en', { ascending: true });

      if (error) throw error;

      if (data) {
        setEtapas(data);
      } else {
        await crearEtapasIniciales();
      }
    } catch (error) {
      console.error('Error al cargar etapas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las etapas del viaje.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const crearEtapasIniciales = async () => {
    try {
      const etapasBase = viaje.tipo_viaje === 'ida' ? ETAPAS_VIAJE_IDA : ETAPAS_VIAJE_VUELTA;
      const nuevasEtapas = etapasBase.map((etapa: TipoEtapa) => {
        // Si es un viaje de vuelta y tiene localidades específicas, usar la primera localidad por defecto
        if (viaje.tipo_viaje === 'vuelta' && etapa.localidades_especificas && etapa.localidades_especificas.length > 0) {
          const localidadDefault = etapa.localidades_especificas[0];
          return {
            id_viaje: viaje.id_viaje,
            id_localidad: 0, // Se asignará cuando se guarde en la base de datos
            tipo_etapa: etapa.id,
            estado: 'pendiente',
            fecha_programada: new Date().toISOString(),
            observaciones: '',
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString(),
            localidad_temporal: localidadDefault // Guardamos la información de la localidad temporalmente
          };
        }

        // Para viajes de ida o etapas sin localidades específicas, usar la lógica original
        let idLocalidad: number;
        switch (etapa.tipo_localidad) {
          case 'puerto':
            idLocalidad = viaje.tipo_viaje === 'ida' ? viaje.id_origen : viaje.id_destino;
            break;
          case 'aduana':
            idLocalidad = viaje.tipo_viaje === 'ida' ? viaje.id_origen : viaje.id_destino;
            break;
          case 'cliente':
            idLocalidad = viaje.tipo_viaje === 'ida' ? viaje.id_destino : viaje.id_origen;
            break;
          case 'deposito':
            idLocalidad = viaje.tipo_viaje === 'ida' ? viaje.id_destino : viaje.id_origen;
            break;
          default:
            idLocalidad = viaje.id_destino;
        }

        return {
          id_viaje: viaje.id_viaje,
          id_localidad: idLocalidad,
          tipo_etapa: etapa.id,
          estado: 'pendiente',
          fecha_programada: new Date().toISOString(),
          observaciones: '',
          creado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        };
      });

      const { data, error } = await supabase
        .from('etapas_viaje')
        .insert(nuevasEtapas)
        .select();

      if (error) {
        console.error('Error al crear etapas iniciales:', error);
        toast({
          title: "Error",
          description: "No se pudieron crear las etapas iniciales.",
          variant: "destructive",
        });
      } else {
        await loadEtapas();
      }
    } catch (error) {
      console.error('Error al crear etapas iniciales:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear las etapas iniciales.",
        variant: "destructive",
      });
    }
  };

  const getLocalidadesDisponibles = (etapa: EtapaViaje) => {
    const etapaInfo = getEtapaConfig(etapa.tipo_etapa);
    
    if (!etapaInfo) return [];

    console.log('Tipo de viaje:', viaje.tipo_viaje);
    console.log('Etapa info:', etapaInfo);

    // Para viajes de vuelta, usar las localidades específicas definidas
    if (viaje.tipo_viaje === 'vuelta' && etapaInfo.localidades_especificas) {
      console.log('Usando localidades específicas para viaje de vuelta:', etapaInfo.localidades_especificas);
      return etapaInfo.localidades_especificas.map(loc => ({
        id_localidad: 0,
        nombre: `${loc.nombre} - ${loc.ciudad}`,
        tipo: etapaInfo.tipo_localidad || 'cliente',
        ciudad: loc.ciudad,
        pais: loc.pais,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      }));
    }

    // Para viajes de ida, usar las localidades de la base de datos
    const localidadesFiltradas = Object.values(localidades).filter(localidad => 
      localidad.tipo === etapaInfo.tipo_localidad
    );
    console.log('Usando localidades de la base de datos:', localidadesFiltradas);
    return localidadesFiltradas;
  };

  const getEtapaConfig = (tipoEtapa: string): TipoEtapa | undefined => {
    const etapas = viaje.tipo_viaje === 'vuelta' ? ETAPAS_VIAJE_VUELTA : ETAPAS_VIAJE_IDA;
    const etapa = etapas.find(e => e.id === tipoEtapa);
    console.log('Buscando configuración de etapa:', { tipoEtapa, tipoViaje: viaje.tipo_viaje, etapa });
    return etapa;
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
        tipoPrimeraEtapa: primeraEtapa?.tipo_etapa
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
      // Si no están todas completadas, verificar si es la primera etapa (retiro de contenedor)
      else if (checked && primeraEtapa && etapa.id_etapa === primeraEtapa.id_etapa && etapa.tipo_etapa === 'retiro_contenedor') {
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
      await loadEtapas();
      
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

  const handleLocalidadChange = async (etapa: EtapaViaje, nuevaLocalidadId: number | string) => {
    try {
      const etapaInfo = getEtapaConfig(etapa.tipo_etapa);
      console.log('Cambiando localidad:', { etapa, nuevaLocalidadId, etapaInfo });
      
      // Si es un viaje de vuelta y tiene localidades específicas
      if (viaje.tipo_viaje === 'vuelta' && etapaInfo?.localidades_especificas) {
        // Buscar la localidad seleccionada en las localidades específicas
        const localidadSeleccionada = etapaInfo.localidades_especificas.find(
          loc => `${loc.nombre} - ${loc.ciudad}` === nuevaLocalidadId
        );

        if (localidadSeleccionada) {
          console.log('Localidad específica seleccionada:', localidadSeleccionada);
          // Actualizar la etapa con la información de la localidad temporal
          const { error } = await supabase
            .from('etapas_viaje')
            .update({
              localidad_temporal: localidadSeleccionada,
              actualizado_en: new Date().toISOString()
            })
            .eq('id_etapa', etapa.id_etapa);

          if (error) throw error;
        }
      } else {
        // Para viajes de ida o etapas sin localidades específicas, usar la lógica original
        const { error } = await supabase
          .from('etapas_viaje')
          .update({
            id_localidad: nuevaLocalidadId,
            actualizado_en: new Date().toISOString()
          })
          .eq('id_etapa', etapa.id_etapa);

        if (error) throw error;
      }

      await loadEtapas();
    } catch (error) {
      console.error('Error al actualizar localidad:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la localidad de la etapa.",
        variant: "destructive",
      });
    }
  };

  const handleEtapaStatusChange = async (etapaId: number, nuevoEstado: string) => {
    try {
      // Actualizar el estado de la etapa
      const { error: errorEtapa } = await supabase
        .from('etapas_viaje')
        .update({ 
          estado: nuevoEstado,
          actualizado_en: new Date().toISOString()
        })
        .eq('id_etapa', etapaId);

      if (errorEtapa) throw errorEtapa;

      // Si la etapa es la primera (retiro de contenedor) y se está completando
      const etapa = etapas.find(e => e.id_etapa === etapaId);
      if (etapa?.tipo_etapa === 'retiro_contenedor' && nuevoEstado === 'completada') {
        // Actualizar el estado del viaje a "en_ruta"
        const { error: errorViaje } = await supabase
          .from('viajes')
          .update({ 
            estado: 'en_ruta',
            actualizado_en: new Date().toISOString()
          })
          .eq('id_viaje', etapa.id_viaje);

        if (errorViaje) throw errorViaje;

        toast({
          title: "Estado actualizado",
          description: "La etapa y el estado del viaje han sido actualizados.",
        });
      } else {
        toast({
          title: "Estado actualizado",
          description: "El estado de la etapa ha sido actualizado.",
        });
      }

      // Recargar las etapas
      await loadEtapas();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la etapa.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Etapas del Viaje - {viaje.tipo_viaje}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
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

                const localidadesDisponibles = getLocalidadesDisponibles(etapa);
                console.log('Localidades disponibles para etapa:', {
                  tipoEtapa: etapa.tipo_etapa,
                  tipoViaje: viaje.tipo_viaje,
                  localidades: localidadesDisponibles
                });

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
                              value={etapa.id_localidad?.toString() || etapa.localidad_temporal?.nombre}
                              onValueChange={(value) => handleLocalidadChange(etapa, value)}
                              disabled={isCompleted}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar localidad" />
                              </SelectTrigger>
                              <SelectContent>
                                {localidadesDisponibles.map(localidad => (
                                  <SelectItem 
                                    key={localidad.id_localidad || localidad.nombre} 
                                    value={localidad.id_localidad?.toString() || localidad.nombre}
                                  >
                                    {localidad.nombre}
                                  </SelectItem>
                                ))}
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
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 