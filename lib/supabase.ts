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