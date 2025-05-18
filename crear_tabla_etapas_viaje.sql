-- Crear tabla de etapas de viaje
CREATE TABLE IF NOT EXISTS etapas_viaje (
    id_etapa SERIAL PRIMARY KEY,
    id_viaje INTEGER NOT NULL REFERENCES viajes(id_viaje) ON DELETE CASCADE,
    id_localidad INTEGER NOT NULL REFERENCES localidades(id_localidad),
    tipo_etapa TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'en_proceso', 'completada', 'cancelada')),
    fecha_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_realizada TIMESTAMP WITH TIME ZONE,
    observaciones TEXT,
    localidad_temporal JSONB,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_etapas_viaje_id_viaje ON etapas_viaje(id_viaje);
CREATE INDEX IF NOT EXISTS idx_etapas_viaje_id_localidad ON etapas_viaje(id_localidad);
CREATE INDEX IF NOT EXISTS idx_etapas_viaje_estado ON etapas_viaje(estado);

-- Crear función para actualizar actualizado_en
CREATE OR REPLACE FUNCTION actualizar_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar actualizado_en
CREATE TRIGGER trigger_actualizar_actualizado_en
    BEFORE UPDATE ON etapas_viaje
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_actualizado_en();

-- Agregar políticas RLS
ALTER TABLE etapas_viaje ENABLE ROW LEVEL SECURITY;

-- Política para lectura
CREATE POLICY "Permitir lectura de etapas de viaje"
    ON etapas_viaje
    FOR SELECT
    USING (true);

-- Política para inserción
CREATE POLICY "Permitir inserción de etapas de viaje"
    ON etapas_viaje
    FOR INSERT
    WITH CHECK (true);

-- Política para actualización
CREATE POLICY "Permitir actualización de etapas de viaje"
    ON etapas_viaje
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para eliminación
CREATE POLICY "Permitir eliminación de etapas de viaje"
    ON etapas_viaje
    FOR DELETE
    USING (true); 