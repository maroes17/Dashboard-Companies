export type TripStatus = 'pendiente' | 'en_ruta' | 'completado' | 'incidente' | 'cancelado';

export interface Trip {
  id_viaje: number;
  fecha_salida: string;
  fecha_llegada: string;
  tipo: 'ida' | 'vuelta';
  id_cliente: number;
  origen: string;
  destino: string;
  empresa: string;
  conductor_id: number;
  vehiculo_id: number;
  semirremolque_id: number;
  contenedor: string;
  nro_guia: string;
  factura: string;
  estado: TripStatus;
  nro_control: number;
  creado_en: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
}

export interface TripWithDetails extends Trip {
  conductor?: {
    nombre: string;
    apellido: string;
    licencia: string;
  };
  vehiculo?: {
    patente: string;
    marca: string;
    modelo: string;
  };
  semirremolque?: {
    patente: string;
    tipo: string;
  };
}

export interface TripIncident {
  id_incidente: number;
  id_viaje: number;
  tipo_incidente: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_resolucion?: string;
  estado: 'reportado' | 'en_proceso' | 'resuelto';
  acciones_tomadas?: string;
  resuelto_por?: string;
  url_foto?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface TripReport {
  total_viajes: number;
  viajes_completados: number;
  viajes_en_ruta: number;
  viajes_con_incidentes: number;
  viajes_cancelados: number;
  viajes_por_conductor: {
    conductor_id: number;
    nombre: string;
    total_viajes: number;
  }[];
  viajes_por_vehiculo: {
    vehiculo_id: number;
    patente: string;
    total_viajes: number;
  }[];
  viajes_por_ruta: {
    origen: string;
    destino: string;
    total_viajes: number;
  }[];
} 