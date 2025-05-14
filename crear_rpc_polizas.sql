-- Crear una función RPC para crear la tabla polizas
CREATE OR REPLACE FUNCTION create_polizas_table()
RETURNS text AS $$
BEGIN
  -- Crear la tabla polizas si no existe
  CREATE TABLE IF NOT EXISTS polizas (
    id_poliza SERIAL PRIMARY KEY,
    aplica_a TEXT CHECK (aplica_a IN ('flota', 'semirremolque')) NOT NULL,
    patente TEXT NOT NULL,
    aseguradora TEXT,
    nro_poliza TEXT,
    vigencia_desde DATE,
    vigencia_hasta DATE,
    importe_pagado DECIMAL,
    fecha_pago DATE,
    estado TEXT CHECK (estado IN ('vigente', 'vencida', 'renovada', 'cancelada')),
    observaciones TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
  );

  -- Añadir RLS (Row Level Security)
  ALTER TABLE polizas ENABLE ROW LEVEL SECURITY;

  -- Crear políticas de acceso
  DROP POLICY IF EXISTS "Todos pueden ver polizas" ON polizas;
  CREATE POLICY "Todos pueden ver polizas" 
    ON polizas FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar polizas" ON polizas;
  CREATE POLICY "Usuarios autenticados pueden insertar polizas" 
    ON polizas FOR INSERT WITH CHECK (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar polizas" ON polizas;
  CREATE POLICY "Usuarios autenticados pueden actualizar polizas" 
    ON polizas FOR UPDATE USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar polizas" ON polizas;
  CREATE POLICY "Usuarios autenticados pueden eliminar polizas" 
    ON polizas FOR DELETE USING (auth.role() = 'authenticated');

  -- Crear índices para mejorar el rendimiento
  DROP INDEX IF EXISTS idx_polizas_patente;
  CREATE INDEX idx_polizas_patente ON polizas(patente);
  
  DROP INDEX IF EXISTS idx_polizas_aplica_a;
  CREATE INDEX idx_polizas_aplica_a ON polizas(aplica_a);
  
  DROP INDEX IF EXISTS idx_polizas_estado;
  CREATE INDEX idx_polizas_estado ON polizas(estado);
  
  DROP INDEX IF EXISTS idx_polizas_vigencia_hasta;
  CREATE INDEX idx_polizas_vigencia_hasta ON polizas(vigencia_hasta);

  -- Añadir comentarios para documentar la tabla
  COMMENT ON TABLE polizas IS 'Tabla para almacenar pólizas de seguro de vehículos y semirremolques';
  COMMENT ON COLUMN polizas.id_poliza IS 'Identificador único de la póliza';
  COMMENT ON COLUMN polizas.aplica_a IS 'Indica si la póliza aplica a un vehículo de la flota o a un semirremolque';
  COMMENT ON COLUMN polizas.patente IS 'Patente del vehículo o semirremolque';
  COMMENT ON COLUMN polizas.aseguradora IS 'Nombre de la aseguradora';
  COMMENT ON COLUMN polizas.nro_poliza IS 'Número de póliza asignado por la aseguradora';
  COMMENT ON COLUMN polizas.vigencia_desde IS 'Fecha de inicio de vigencia de la póliza';
  COMMENT ON COLUMN polizas.vigencia_hasta IS 'Fecha de fin de vigencia de la póliza';
  COMMENT ON COLUMN polizas.importe_pagado IS 'Importe pagado por la póliza';
  COMMENT ON COLUMN polizas.fecha_pago IS 'Fecha en que se realizó el pago';
  COMMENT ON COLUMN polizas.estado IS 'Estado actual de la póliza: vigente, vencida, renovada o cancelada';
  COMMENT ON COLUMN polizas.observaciones IS 'Observaciones o notas adicionales sobre la póliza';
  COMMENT ON COLUMN polizas.creado_en IS 'Fecha y hora de creación del registro';

  RETURN 'Tabla polizas creada correctamente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 