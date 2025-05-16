-- Eliminar la tabla etapas_viaje si existe
DROP TABLE IF EXISTS etapas_viaje;

-- Crear la tabla etapas_viaje con la relación correcta
CREATE TABLE etapas_viaje (
    id_etapa SERIAL PRIMARY KEY,
    id_viaje INTEGER NOT NULL REFERENCES viajes(id_viaje),
    id_localidad INTEGER NOT NULL REFERENCES localidades(id_localidad),
    tipo_etapa VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    fecha_programada TIMESTAMP WITH TIME ZONE,
    fecha_realizada TIMESTAMP WITH TIME ZONE,
    observaciones TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear el trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION actualizar_timestamp_etapas_viaje()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_etapas_viaje
    BEFORE UPDATE ON etapas_viaje
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_etapas_viaje(); 