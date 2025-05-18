-- Crear la tabla de orígenes y destinos
CREATE TABLE origenes_destinos (
    id_origen_destino SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    ciudad VARCHAR(255) NOT NULL,
    pais VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('origen', 'destino', 'ambos')),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, ciudad, pais)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_origenes_destinos_tipo ON origenes_destinos(tipo);
CREATE INDEX idx_origenes_destinos_activo ON origenes_destinos(activo);

-- Insertar datos iniciales
INSERT INTO origenes_destinos (nombre, ciudad, pais, tipo) VALUES
    -- Chile
    ('San Antonio', 'San Antonio', 'Chile', 'origen'),
    ('Valparaíso', 'Valparaíso', 'Chile', 'origen'),
    ('Los Andes', 'Los Andes', 'Chile', 'ambos'),
    
    -- Argentina
    ('Buenos Aires', 'Buenos Aires', 'Argentina', 'destino'),
    ('Córdoba', 'Córdoba', 'Argentina', 'destino'),
    ('Mendoza', 'Mendoza', 'Argentina', 'destino'),
    ('Rosario', 'Rosario', 'Argentina', 'destino'),
    ('Santa Fe', 'Santa Fe', 'Argentina', 'destino'),
    ('Mar del Plata', 'Mar del Plata', 'Argentina', 'destino'),
    ('Victoria', 'Victoria', 'Argentina', 'destino');

-- Crear función para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar automáticamente el timestamp
CREATE TRIGGER update_origenes_destinos_updated_at
    BEFORE UPDATE ON origenes_destinos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 