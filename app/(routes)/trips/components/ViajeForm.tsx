import { useState, useEffect } from "react";
import { supabase, ETAPAS_VIAJE_IDA, ETAPAS_VIAJE_VUELTA, Localidad, TipoEtapa } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export const crearEtapasAutomaticamente = async (idViaje: number, tipoViaje: 'ida' | 'vuelta', idOrigen: number, idDestino: number) => {
  try {
    // Obtener las localidades de origen y destino
    const { data: localidades, error: errorLocalidades } = await supabase
      .from('localidades')
      .select('*')
      .in('id_localidad', [idOrigen, idDestino]);

    if (errorLocalidades) throw errorLocalidades;

    const localidadOrigen = localidades?.find((l: Localidad) => l.id_localidad === idOrigen);
    const localidadDestino = localidades?.find((l: Localidad) => l.id_localidad === idDestino);

    if (!localidadOrigen || !localidadDestino) {
      throw new Error('No se encontraron las localidades de origen y destino');
    }

    const etapasBase = tipoViaje === 'ida' ? ETAPAS_VIAJE_IDA : ETAPAS_VIAJE_VUELTA;
    const etapas = etapasBase.map((etapa: TipoEtapa) => {
      // Determinar la localidad según el tipo de etapa
      let idLocalidad: number;
      
      switch (etapa.tipo_localidad) {
        case 'puerto':
          idLocalidad = tipoViaje === 'ida' ? idOrigen : idDestino;
          break;
        case 'aduana':
          idLocalidad = tipoViaje === 'ida' ? idOrigen : idDestino;
          break;
        case 'cliente':
          idLocalidad = tipoViaje === 'ida' ? idDestino : idOrigen;
          break;
        case 'deposito':
          idLocalidad = tipoViaje === 'ida' ? idDestino : idOrigen;
          break;
        default:
          // Si no hay tipo de localidad específico, usar la localidad de destino
          idLocalidad = tipoViaje === 'ida' ? idDestino : idOrigen;
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
      .insert(etapas);

    if (error) throw error;
  } catch (error) {
    console.error('Error al crear etapas automáticas:', error);
    throw error;
  }
};

interface ViajeFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  localidades: Record<number, Localidad>;
  clientes: Record<number, any>;
  conductores: Record<number, any>;
  vehiculos: Record<number, any>;
  semirremolques: Record<number, any>;
}

export function ViajeForm({
  onSubmit,
  isLoading,
  localidades,
  clientes,
  conductores,
  vehiculos,
  semirremolques,
}: ViajeFormProps) {
  const { toast } = useToast();
  const [choferes, setChoferes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id_origen: "",
    id_destino: "",
    id_cliente: "",
    id_chofer: "",
    id_flota: "",
    id_semirremolque: "",
    contenedor: "",
    nro_guia: "",
    factura: "",
    fecha_salida_programada: "",
    fecha_llegada_programada: "",
    prioridad: "normal",
    tipo_viaje: "ida",
    notas: "",
  });

  useEffect(() => {
    loadChoferes();
  }, []);

  const loadChoferes = async () => {
    try {
      // Primero obtenemos todos los choferes
      const { data: choferesData, error: choferesError } = await supabase
        .from('choferes')
        .select('*')
        .order('nombre_completo');

      if (choferesError) throw choferesError;

      // Luego obtenemos los viajes en_ruta
      const { data: viajesEnRuta, error: viajesError } = await supabase
        .from('viajes')
        .select('id_chofer')
        .eq('estado', 'en_ruta');

      if (viajesError) throw viajesError;

      // Creamos un conjunto con los IDs de choferes ocupados
      const choferesOcupados = new Set(viajesEnRuta?.map(v => v.id_chofer));

      // Filtramos los choferes para excluir los que están en viajes en_ruta
      const choferesDisponibles = choferesData?.filter(chofer => !choferesOcupados.has(chofer.id_chofer)) || [];

      setChoferes(choferesDisponibles);
    } catch (error) {
      console.error('Error al cargar choferes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los choferes disponibles.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="id_origen">Origen</Label>
          <Select
            value={formData.id_origen}
            onValueChange={(value) => setFormData(prev => ({ ...prev, id_origen: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar origen" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(localidades).map((localidad) => (
                <SelectItem key={localidad.id_localidad} value={localidad.id_localidad.toString()}>
                  {localidad.nombre}, {localidad.pais}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="id_destino">Destino</Label>
          <Select
            value={formData.id_destino}
            onValueChange={(value) => setFormData(prev => ({ ...prev, id_destino: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar destino" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(localidades).map((localidad) => (
                <SelectItem key={localidad.id_localidad} value={localidad.id_localidad.toString()}>
                  {localidad.nombre}, {localidad.pais}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="id_cliente">Cliente</Label>
        <Select
          value={formData.id_cliente}
          onValueChange={(value) => setFormData(prev => ({ ...prev, id_cliente: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(clientes).map((cliente) => (
              <SelectItem key={cliente.id_cliente} value={cliente.id_cliente.toString()}>
                {cliente.razon_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="id_chofer">Conductor</Label>
        <Select
          value={formData.id_chofer}
          onValueChange={(value) => setFormData(prev => ({ ...prev, id_chofer: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar conductor" />
          </SelectTrigger>
          <SelectContent>
            {choferes.map((chofer) => (
              <SelectItem key={chofer.id_chofer} value={chofer.id_chofer.toString()}>
                {chofer.nombre_completo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="id_flota">Vehículo</Label>
          <Select
            value={formData.id_flota}
            onValueChange={(value) => setFormData(prev => ({ ...prev, id_flota: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar vehículo" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(vehiculos).map((vehiculo) => (
                <SelectItem key={vehiculo.id_flota} value={vehiculo.id_flota.toString()}>
                  {vehiculo.marca} {vehiculo.modelo} ({vehiculo.patente})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="id_semirremolque">Semirremolque</Label>
          <Select
            value={formData.id_semirremolque}
            onValueChange={(value) => setFormData(prev => ({ ...prev, id_semirremolque: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar semirremolque" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(semirremolques).map((semirremolque) => (
                <SelectItem key={semirremolque.id_semirremolque} value={semirremolque.id_semirremolque.toString()}>
                  {semirremolque.patente} {semirremolque.marca ? `(${semirremolque.marca})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contenedor">Contenedor</Label>
          <Input
            id="contenedor"
            name="contenedor"
            value={formData.contenedor}
            onChange={handleChange}
            placeholder="Número de contenedor"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nro_guia">Número de Guía</Label>
          <Input
            id="nro_guia"
            name="nro_guia"
            value={formData.nro_guia}
            onChange={handleChange}
            placeholder="Número de guía"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fecha_salida_programada">Fecha de Salida</Label>
          <Input
            id="fecha_salida_programada"
            name="fecha_salida_programada"
            type="datetime-local"
            value={formData.fecha_salida_programada}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_llegada_programada">Fecha de Llegada</Label>
          <Input
            id="fecha_llegada_programada"
            name="fecha_llegada_programada"
            type="datetime-local"
            value={formData.fecha_llegada_programada}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prioridad">Prioridad</Label>
        <Select
          value={formData.prioridad}
          onValueChange={(value) => setFormData(prev => ({ ...prev, prioridad: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="baja">Baja</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo_viaje">Tipo de Viaje</Label>
        <Select
          value={formData.tipo_viaje}
          onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_viaje: value }))}
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

      <div className="space-y-2">
        <Label htmlFor="notas">Notas</Label>
        <Input
          id="notas"
          name="notas"
          value={formData.notas}
          onChange={handleChange}
          placeholder="Notas adicionales"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Creando viaje..." : "Crear viaje"}
      </Button>
    </form>
  );
} 