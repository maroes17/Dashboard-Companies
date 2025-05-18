-- Tabla de localidades
CREATE TABLE IF NOT EXISTS localidades (
    id_localidad SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('puerto', 'aduana', 'cliente', 'deposito')),
    direccion TEXT,
    ciudad VARCHAR(255),
    pais VARCHAR(100),
    es_puerto BOOLEAN DEFAULT FALSE,
    es_aduana BOOLEAN DEFAULT FALSE,
    es_deposito_contenedores BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de viajes
CREATE TABLE IF NOT EXISTS viajes (
    id_viaje SERIAL PRIMARY KEY,
    nro_control VARCHAR(50) UNIQUE,
    tipo_viaje VARCHAR(50) NOT NULL CHECK (tipo_viaje IN ('ida', 'vuelta')),
    id_origen INTEGER REFERENCES localidades(id_localidad),
    id_destino INTEGER REFERENCES localidades(id_localidad),
    id_cliente INTEGER REFERENCES clientes(id_cliente),
    id_chofer INTEGER REFERENCES choferes(id_chofer),
    id_flota INTEGER REFERENCES flota(id_flota),
    id_semirremolque INTEGER REFERENCES semirremolques(id_semirremolque),
    fecha_salida_programada TIMESTAMP WITH TIME ZONE,
    fecha_llegada_programada TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(50) NOT NULL DEFAULT 'planificado' CHECK (estado IN ('planificado', 'en_ruta', 'realizado', 'incidente', 'cancelado')),
    prioridad VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    contenedor VARCHAR(50),
    nro_guia VARCHAR(50),
    factura VARCHAR(50),
    notas TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de etapas de viaje
CREATE TABLE IF NOT EXISTS etapas_viaje (
    id_etapa SERIAL PRIMARY KEY,
    id_viaje INTEGER REFERENCES viajes(id_viaje) ON DELETE CASCADE,
    tipo_etapa VARCHAR(50) NOT NULL,
    id_localidad INTEGER REFERENCES localidades(id_localidad),
    orden INTEGER NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completada', 'cancelada')),
    fecha_programada TIMESTAMP WITH TIME ZONE,
    fecha_real TIMESTAMP WITH TIME ZONE,
    notas TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de incidentes de viaje
CREATE TABLE IF NOT EXISTS incidentes_viaje (
    id_incidente SERIAL PRIMARY KEY,
    id_viaje INTEGER REFERENCES viajes(id_viaje) ON DELETE CASCADE,
    tipo_incidente VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_proceso', 'resuelto', 'cerrado')),
    fecha_incidente TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    solucion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de documentos de viaje
CREATE TABLE IF NOT EXISTS documentos_viaje (
    id_documento SERIAL PRIMARY KEY,
    id_viaje INTEGER REFERENCES viajes(id_viaje) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) NOT NULL CHECK (tipo_documento IN ('guia', 'factura', 'control')),
    numero_documento VARCHAR(50) NOT NULL,
    url_documento TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_viajes_tipo_viaje ON viajes(tipo_viaje);
CREATE INDEX IF NOT EXISTS idx_viajes_estado ON viajes(estado);
CREATE INDEX IF NOT EXISTS idx_viajes_fecha_salida ON viajes(fecha_salida_programada);
CREATE INDEX IF NOT EXISTS idx_etapas_viaje_id_viaje ON etapas_viaje(id_viaje);
CREATE INDEX IF NOT EXISTS idx_incidentes_viaje_id_viaje ON incidentes_viaje(id_viaje);
CREATE INDEX IF NOT EXISTS idx_documentos_viaje_id_viaje ON documentos_viaje(id_viaje);

-- Eliminar función existente y todos sus triggers dependientes
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Crear función para actualizar actualizado_en
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers
CREATE TRIGGER update_localidades_updated_at
    BEFORE UPDATE ON localidades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viajes_updated_at
    BEFORE UPDATE ON viajes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_etapas_viaje_updated_at
    BEFORE UPDATE ON etapas_viaje
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidentes_viaje_updated_at
    BEFORE UPDATE ON incidentes_viaje
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentos_viaje_updated_at
    BEFORE UPDATE ON documentos_viaje
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();