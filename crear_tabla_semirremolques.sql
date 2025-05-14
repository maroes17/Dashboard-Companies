-- Crear tabla para semirremolques
CREATE TABLE IF NOT EXISTS semirremolques (
  id_semirremolque SERIAL PRIMARY KEY,
  patente TEXT NOT NULL,
  nro_genset TEXT,
  tipo TEXT,
  marca TEXT,
  modelo TEXT,
  anio INT,
  estado TEXT NOT NULL CHECK (estado IN ('activo', 'inactivo', 'mantenimiento', 'en_reparacion', 'dado_de_baja')),
  fecha_ingreso DATE,
  fecha_ultima_revision DATE,
  vencimiento_revision_tecnica DATE,
  observaciones TEXT,
  asignado_a_flota_id INT REFERENCES flota(id_flota) ON DELETE SET NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir RLS (Row Level Security)
ALTER TABLE semirremolques ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso
CREATE POLICY "Todos pueden ver semirremolques" 
  ON semirremolques FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar semirremolques" 
  ON semirremolques FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar semirremolques" 
  ON semirremolques FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar semirremolques" 
  ON semirremolques FOR DELETE USING (auth.role() = 'authenticated');

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_semirremolques_patente ON semirremolques(patente);
CREATE INDEX idx_semirremolques_estado ON semirremolques(estado);
CREATE INDEX idx_semirremolques_asignado_a_flota_id ON semirremolques(asignado_a_flota_id); 