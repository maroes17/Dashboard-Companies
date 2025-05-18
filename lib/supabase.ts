"use client";

import { createClient } from '@supabase/supabase-js';

// Estas URLs deben provenir de variables de entorno en producción
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqgftaqljwxyizdutvqh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZ2Z0YXFsand4eWl6ZHV0dnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDc1NDYsImV4cCI6MjA2MjY4MzU0Nn0.Il_1YjbplVzWS5OVJjE664dWcfxHIWTziBfV9Uwc3vk';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Driver = {
  id_chofer: number;
  nombre_completo: string;
  documento_identidad: string;
  tipo_licencia?: string;
  vencimiento_licencia?: string; // Formato ISO YYYY-MM-DD
  telefono?: string;
  email?: string;
  nacionalidad?: string;
  direccion?: string;
  fecha_nacimiento?: string; // Formato ISO YYYY-MM-DD
  fecha_ingreso?: string; // Formato ISO YYYY-MM-DD
  contacto_emergencia?: string;
  estado?: 'activo' | 'inactivo' | 'suspendido';
  observaciones?: string;
  creado_en: string; // Timestamp ISO
};

export type Fleet = {
  id_flota: number;
  tipo: string;
  categoria?: string;
  subcategoria?: string;
  patente: string;
  nro_chasis?: string;
  marca: string;
  modelo: string;
  anio?: number;
  capacidad?: string;
  estado: 'activo' | 'inactivo' | 'mantenimiento' | 'en_reparacion' | 'dado_de_baja';
  fecha_ingreso: string; // Formato ISO YYYY-MM-DD
  id_chofer_asignado?: number;
  km_actual?: number;
  km_ultimo_servicio?: number;
  km_proximo_servicio?: number;
  fecha_ultima_mantencion?: string; // Formato ISO YYYY-MM-DD
  fecha_proximo_mantenimiento?: string; // Formato ISO YYYY-MM-DD
  vencimiento_revision_tecnica?: string; // Formato ISO YYYY-MM-DD
  vencimiento_permiso_circulacion?: string; // Formato ISO YYYY-MM-DD
  vencimiento_seguro?: string; // Formato ISO YYYY-MM-DD
  consumo_promedio?: number;
  origen?: string;
  observaciones?: string;
  creado_en: string; // Timestamp ISO
  actualizado_en: string; // Timestamp ISO
};

export type FleetEvent = {
  id_evento: number;
  id_flota: number;
  // cambio_estado_manual también se usa para registrar asignaciones de choferes
  tipo_evento: 'mantenimiento_programado' | 'mantenimiento_correctivo' | 'incidente' | 'accidente' | 'revision' | 'reparacion' | 'actualizacion_km' | 'cambio_estado_manual';
  fecha_inicio: string; // Timestamp ISO
  fecha_fin?: string; // Timestamp ISO
  kilometraje?: number;
  descripcion?: string;
  estado_resultante?: 'activo' | 'inactivo' | 'mantenimiento' | 'en_reparacion' | 'dado_de_baja';
  resuelto: boolean;
  id_responsable?: number;
  creado_por?: number;
  creado_en: string; // Timestamp ISO
};

export type FleetMaintenance = {
  id_mantenimiento: number;
  id_flota: number;
  tipo_mantenimiento: 'preventivo' | 'correctivo' | 'revision';
  fecha_programada: string; // Formato ISO YYYY-MM-DD
  km_programado?: number;
  fecha_realizado?: string; // Formato ISO YYYY-MM-DD
  km_realizado?: number;
  costo?: number;
  descripcion?: string;
  estado: 'programado' | 'en_proceso' | 'completado' | 'cancelado';
  notas_tecnico?: string;
  id_responsable?: number;
  creado_en: string; // Timestamp ISO
};

export type Vehicle = {
  id: string;
  plate: string;
  model: string;
  year: number;
  status: 'active' | 'maintenance' | 'inactive';
  driver_id?: string;
  created_at: string;
};

export type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  driver_id: string;
  vehicle_id?: string;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
};

export type Advance = {
  id: string;
  amount: number;
  description: string;
  date: string;
  driver_id: string;
  status: 'pending' | 'settled' | 'cancelled';
  created_at: string;
};

export type Trip = {
  id: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  driver_id: string;
  vehicle_id: string;
  created_at: string;
};

export type Semirremolque = {
  id_semirremolque: number;
  patente: string;
  nro_genset?: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  estado: 'activo' | 'inactivo' | 'mantenimiento' | 'en_reparacion' | 'dado_de_baja';
  fecha_ingreso?: string;
  fecha_ultima_revision?: string;
  vencimiento_revision_tecnica?: string;
  observaciones?: string;
  asignado_a_flota_id?: number;
  creado_en: string;
  actualizado_en?: string;
};

export type Poliza = {
  id_poliza: number;
  aplica_a: 'flota' | 'semirremolque';
  patente: string;
  aseguradora?: string;
  nro_poliza?: string;
  vigencia_desde?: string; // Formato ISO YYYY-MM-DD
  vigencia_hasta?: string; // Formato ISO YYYY-MM-DD
  importe_pagado?: number;
  fecha_pago?: string; // Formato ISO YYYY-MM-DD
  estado?: 'vigente' | 'vencida' | 'renovada' | 'cancelada';
  observaciones?: string;
  creado_en: string; // Timestamp ISO
};

export type Cliente = {
  id_cliente: number;
  razon_social: string;
  rut?: string;
  cuit?: string;
  nombre_fantasia?: string;
  direccion: string;
  ciudad?: string;
  pais?: string;
  telefono: string;
  email: string;
  contacto_principal?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  estado?: 'activo' | 'inactivo';
  observaciones?: string;
  creado_en: string;
  actualizado_en: string;
};

// Tipo para localidades
export type Localidad = {
  id_localidad: number;
  nombre: string;
  tipo: 'puerto' | 'aduana' | 'cliente' | 'deposito';
  direccion?: string;
  ciudad?: string;
  pais?: string;
  es_puerto: boolean;
  es_aduana: boolean;
  es_deposito_contenedores: boolean;
  creado_en: string;
  actualizado_en: string;
};

// Tipo para viajes
export type Viaje = {
  id_viaje: number;
  id_cliente?: number;
  id_chofer?: number;
  id_flota?: number;
  id_semirremolque?: number;
  id_origen: number;
  id_destino: number;
  tipo_viaje: string;
  estado: 'planificado' | 'en_ruta' | 'realizado' | 'incidente' | 'cancelado';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fecha_salida_programada: string;
  fecha_llegada_programada: string;
  fecha_salida_real?: string;
  fecha_llegada_real?: string;
  contenedor?: string;
  nro_guia?: string;
  nro_control?: number;
  factura?: string;
  empresa?: string;
  notas?: string;
  observaciones?: string;
  creado_en: string;
  actualizado_en: string;
};

// Tipo para etapas
export type TipoEtapa = {
  id: string;
  nombre: string;
  descripcion: string;
  orden: number;
  tipo_viaje: 'ida' | 'vuelta';
  requiere_localidad: boolean;
  tipo_localidad?: 'puerto' | 'aduana' | 'cliente' | 'deposito';
  localidades_especificas?: Array<{
    nombre: string;
    ciudad: string;
    pais: string;
  }>;
};

// Función para obtener las etapas según el tipo de viaje
export const getEtapasByTipoViaje = (tipo_viaje: 'ida' | 'vuelta'): TipoEtapa[] => {
  if (tipo_viaje === 'ida') {
    return [
      {
        id: 'retiro_contenedor',
        nombre: 'Retiro de Contenedor',
        descripcion: 'Retiro de contenedor con carga',
        orden: 1,
        tipo_viaje: 'ida',
        requiere_localidad: true,
        tipo_localidad: 'puerto'
      },
      {
        id: 'aduana',
        nombre: 'Aduana',
        descripcion: 'Espera y trámites en aduana',
        orden: 2,
        tipo_viaje: 'ida',
        requiere_localidad: true,
        tipo_localidad: 'aduana'
      },
      {
        id: 'tramites_puerto_seco',
        nombre: 'Trámites Puerto Seco',
        descripcion: 'Espera de instrucciones del cliente para entrega',
        orden: 3,
        tipo_viaje: 'ida',
        requiere_localidad: false
      },
      {
        id: 'entrega_carga',
        nombre: 'Entrega de Carga',
        descripcion: 'Entrega de la carga al cliente',
        orden: 4,
        tipo_viaje: 'ida',
        requiere_localidad: true,
        tipo_localidad: 'cliente'
      },
      {
        id: 'despacho_deposito',
        nombre: 'Despacho de Contenedor a Depósito',
        descripcion: 'Entrega de contenedor vacío a depósito',
        orden: 5,
        tipo_viaje: 'ida',
        requiere_localidad: true,
        tipo_localidad: 'deposito'
      }
    ];
  }
  return [
    {
      id: 'retiro_contenedor',
      nombre: 'Retiro de Contenedor',
      descripcion: 'Retiro de contenedor vacío',
      orden: 1,
      tipo_viaje: 'vuelta',
      requiere_localidad: true,
      tipo_localidad: 'deposito'
    },
    {
      id: 'carga_cliente',
      nombre: 'Carga en Cliente',
      descripcion: 'Se carga el contenedor con producto',
      orden: 2,
      tipo_viaje: 'vuelta',
      requiere_localidad: true,
      tipo_localidad: 'cliente'
    },
    {
      id: 'aduana',
      nombre: 'Aduana',
      descripcion: 'Tramites y documentos aduana',
      orden: 3,
      tipo_viaje: 'vuelta',
      requiere_localidad: true,
      tipo_localidad: 'aduana'
    },
    {
      id: 'descarga_puerto',
      nombre: 'Descarga en Puerto',
      descripcion: 'Entrega de contenedor con carga a puerto',
      orden: 4,
      tipo_viaje: 'vuelta',
      requiere_localidad: true,
      tipo_localidad: 'puerto'
    }
  ];
};

// Tipo para etapas de viaje
export type EtapaViaje = {
  id_etapa: number;
  id_viaje: number;
  id_localidad: number;
  tipo_etapa: string;
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
  fecha_programada: string;
  fecha_realizada?: string;
  observaciones?: string;
  creado_en: string;
  actualizado_en: string;
  localidad_temporal?: {
    nombre: string;
    ciudad: string;
    pais: string;
  };
};

// Tipo para incidentes de viaje
export type IncidenteViaje = {
  id_incidente: number;
  id_viaje: number;
  tipo_incidente: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_resolucion?: string;
  estado: 'pendiente' | 'en_proceso' | 'resuelto';
  acciones_tomadas?: string;
  resuelto_por?: string;
  url_foto?: string;
  creado_en: string;
  actualizado_en: string;
};

// Tipo para documentos de viaje
export type DocumentoViaje = {
  id_documento: number;
  id_viaje: number;
  tipo_documento: string;
  nombre_archivo: string;
  url_archivo: string;
  fecha_emision?: string; // Timestamp ISO
  fecha_vencimiento?: string; // Timestamp ISO
  observaciones?: string;
  creado_por?: number;
  creado_en: string; // Timestamp ISO
};

export type Chofer = {
  id_chofer: number;
  nombre: string;
  apellido: string;
  dni: string;
  licencia: string;
  telefono: string;
  email: string;
  estado: 'activo' | 'inactivo';
  creado_en: string;
  actualizado_en: string;
}; 