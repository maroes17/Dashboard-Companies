-- Crear una función RPC para crear la tabla semirremolques
CREATE OR REPLACE FUNCTION create_semirremolques_table()
RETURNS text AS $$
BEGIN
  -- Crear la tabla semirremolques si no existe
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
  DROP POLICY IF EXISTS "Todos pueden ver semirremolques" ON semirremolques;
  CREATE POLICY "Todos pueden ver semirremolques" 
    ON semirremolques FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar semirremolques" ON semirremolques;
  CREATE POLICY "Usuarios autenticados pueden insertar semirremolques" 
    ON semirremolques FOR INSERT WITH CHECK (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar semirremolques" ON semirremolques;
  CREATE POLICY "Usuarios autenticados pueden actualizar semirremolques" 
    ON semirremolques FOR UPDATE USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar semirremolques" ON semirremolques;
  CREATE POLICY "Usuarios autenticados pueden eliminar semirremolques" 
    ON semirremolques FOR DELETE USING (auth.role() = 'authenticated');

  -- Crear índices para mejorar el rendimiento
  DROP INDEX IF EXISTS idx_semirremolques_patente;
  CREATE INDEX idx_semirremolques_patente ON semirremolques(patente);
  
  DROP INDEX IF EXISTS idx_semirremolques_estado;
  CREATE INDEX idx_semirremolques_estado ON semirremolques(estado);
  
  DROP INDEX IF EXISTS idx_semirremolques_asignado_a_flota_id;
  CREATE INDEX idx_semirremolques_asignado_a_flota_id ON semirremolques(asignado_a_flota_id);

  RETURN 'Tabla semirremolques creada correctamente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 