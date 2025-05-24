"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Trip } from "@/lib/types/trips";
import { AssignDriverDialog } from "./AssignDriverDialog";

interface CreateTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTripDialog({ open, onOpenChange, onSuccess }: CreateTripDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const [localidades, setLocalidades] = useState<Array<{ id_localidad: number; nombre: string }>>([]);
  const [clientes, setClientes] = useState<Array<{ id_cliente: number; razon_social: string }>>([]);
  const [formData, setFormData] = useState<Partial<Trip>>({
    tipo: 'ida',
    estado: 'pendiente',
    fecha_salida: new Date().toISOString().split('T')[0],
    fecha_llegada: new Date().toISOString().split('T')[0],
    id_cliente: 0,
    origen: '',
    destino: '',
    empresa: '',
    contenedor: '',
    nro_guia: '',
    factura: '',
    prioridad: 'media'
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Resetear el formulario cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setFormData({
        tipo: 'ida',
        estado: 'pendiente',
        fecha_salida: new Date().toISOString().split('T')[0],
        fecha_llegada: new Date().toISOString().split('T')[0],
        id_cliente: 0,
        origen: '',
        destino: '',
        empresa: '',
        contenedor: '',
        nro_guia: '',
        factura: '',
        prioridad: 'media'
      });
      fetchRelatedData();
    }
  }, [open]);

  const fetchRelatedData = async () => {
    try {
      // Cargar localidades
      const { data: localidadesData, error: localidadesError } = await supabase
        .from('localidades')
        .select('id_localidad, nombre')
        .order('nombre');

      if (localidadesError) throw localidadesError;
      setLocalidades(localidadesData || []);

      // Cargar clientes activos
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id_cliente, razon_social')
        .eq('estado', 'activo')
        .order('razon_social');

      if (clientesError) throw clientesError;
      setClientes(clientesData || []);
    } catch (error: any) {
      console.error('Error al cargar datos relacionados:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Validar campos requeridos
      const errors: Record<string, string> = {};
      
      if (!formData.tipo) {
        errors.tipo = 'El tipo de viaje es requerido';
      }
      
      if (!formData.origen) {
        errors.origen = 'El origen es requerido';
      }
      
      if (!formData.fecha_salida) {
        errors.fecha_salida = 'La fecha de salida es requerida';
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Crear el viaje en la base de datos
      const { data: viajeData, error } = await supabase
        .from('viajes')
        .insert({
          tipo_viaje: formData.tipo,
          estado: 'pendiente',
          fecha_salida_programada: formData.fecha_salida || new Date().toISOString(),
          fecha_llegada_programada: formData.fecha_llegada || new Date().toISOString(),
          id_origen: parseInt(formData.origen || '0'),
          id_destino: parseInt(formData.destino || '0'),
          id_cliente: formData.id_cliente,
          contenedor: formData.contenedor || '',
          nro_guia: formData.nro_guia || '',
          empresa: formData.empresa || '',
          factura: formData.factura || '',
          prioridad: formData.prioridad || 'media'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Convertir el viaje creado al formato Trip
      const trip: Partial<Trip> = {
        id_viaje: viajeData.id_viaje,
        tipo: viajeData.tipo_viaje as 'ida' | 'vuelta',
        estado: 'pendiente',
        fecha_salida: viajeData.fecha_salida_programada,
        fecha_llegada: viajeData.fecha_llegada_programada,
        origen: viajeData.id_origen.toString(),
        destino: viajeData.id_destino.toString(),
        id_cliente: viajeData.id_cliente || 0,
        contenedor: viajeData.contenedor,
        nro_guia: viajeData.nro_guia,
        empresa: viajeData.empresa,
        factura: viajeData.factura,
        prioridad: viajeData.prioridad || 'media'
      };

      // Abrir el diálogo de asignación de conductor
      setFormData(trip);
      setIsAssignDriverOpen(true);
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error al crear viaje:', error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al crear el viaje.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignDriverSuccess = async (updatedTrip: Partial<Trip>) => {
    try {
      setIsLoading(true);

      // Actualizar el viaje con la información del conductor
      const { error: updateError } = await supabase
        .from('viajes')
        .update({
          id_chofer: updatedTrip.conductor_id,
          id_flota: updatedTrip.vehiculo_id,
          id_semirremolque: updatedTrip.semirremolque_id,
          estado: 'en_ruta'
        })
        .eq('id_viaje', updatedTrip.id_viaje);

      if (updateError) throw updateError;

      toast({
        title: "Viaje creado",
        description: "El viaje ha sido creado y el conductor asignado exitosamente.",
      });

      setIsAssignDriverOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error al asignar conductor:', error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al asignar el conductor.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nuevo Viaje</DialogTitle>
            <DialogDescription>
              Ingresa la información general del viaje. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Información Básica</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="flex items-center gap-1">
                    Tipo de Viaje
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value as 'ida' | 'vuelta' })}
                  >
                    <SelectTrigger className={validationErrors.tipo ? "border-destructive" : ""}>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ida">Viaje de Ida</SelectItem>
                      <SelectItem value="vuelta">Viaje de Vuelta</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.tipo && (
                    <p className="text-sm text-destructive">{validationErrors.tipo}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_cliente">Cliente</Label>
                  <Select
                    value={formData.id_cliente?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, id_cliente: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id_cliente} value={cliente.id_cliente.toString()}>
                          {cliente.razon_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Ubicaciones */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Ubicaciones</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origen" className="flex items-center gap-1">
                    Origen
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.origen}
                    onValueChange={(value) => setFormData({ ...formData, origen: value })}
                  >
                    <SelectTrigger className={validationErrors.origen ? "border-destructive" : ""}>
                      <SelectValue placeholder="Seleccionar origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {localidades.map((localidad) => (
                        <SelectItem key={localidad.id_localidad} value={localidad.id_localidad.toString()}>
                          {localidad.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.origen && (
                    <p className="text-sm text-destructive">{validationErrors.origen}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destino">Destino</Label>
                  <Select
                    value={formData.destino}
                    onValueChange={(value) => setFormData({ ...formData, destino: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {localidades.map((localidad) => (
                        <SelectItem key={localidad.id_localidad} value={localidad.id_localidad.toString()}>
                          {localidad.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Fechas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_salida" className="flex items-center gap-1">
                    Fecha de Salida
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fecha_salida"
                    type="date"
                    value={formData.fecha_salida || ''}
                    onChange={(e) => setFormData({ ...formData, fecha_salida: e.target.value })}
                    className={validationErrors.fecha_salida ? "border-destructive" : ""}
                  />
                  {validationErrors.fecha_salida && (
                    <p className="text-sm text-destructive">{validationErrors.fecha_salida}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_llegada">Fecha de Llegada</Label>
                  <Input
                    id="fecha_llegada"
                    type="date"
                    value={formData.fecha_llegada || ''}
                    onChange={(e) => setFormData({ ...formData, fecha_llegada: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Documentos */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Documentos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contenedor">Contenedor</Label>
                  <Input
                    id="contenedor"
                    value={formData.contenedor || ''}
                    onChange={(e) => setFormData({ ...formData, contenedor: e.target.value })}
                    placeholder="Ingrese el número de contenedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nro_guia">Número de Guía</Label>
                  <Input
                    id="nro_guia"
                    value={formData.nro_guia || ''}
                    onChange={(e) => setFormData({ ...formData, nro_guia: e.target.value })}
                    placeholder="Ingrese el número de guía"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa || ''}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Ingrese el nombre de la empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="factura">Factura</Label>
                  <Input
                    id="factura"
                    value={formData.factura || ''}
                    onChange={(e) => setFormData({ ...formData, factura: e.target.value })}
                    placeholder="Ingrese el número de factura"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Creando..." : "Siguiente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AssignDriverDialog
        trip={formData}
        open={isAssignDriverOpen}
        onOpenChange={setIsAssignDriverOpen}
        onSuccess={handleAssignDriverSuccess}
      />
    </>
  );
} 