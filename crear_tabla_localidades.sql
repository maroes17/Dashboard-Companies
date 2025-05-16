-- Crear tabla de localidades
CREATE TABLE IF NOT EXISTS localidades (
    id_localidad SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('puerto', 'aduana', 'cliente', 'deposito')),
    direccion TEXT,
    ciudad TEXT,
    pais TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_localidades_tipo ON localidades(tipo);
CREATE INDEX IF NOT EXISTS idx_localidades_nombre ON localidades(nombre);

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
    BEFORE UPDATE ON localidades
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_actualizado_en();

-- Agregar políticas RLS
ALTER TABLE localidades ENABLE ROW LEVEL SECURITY;

-- Política para lectura
CREATE POLICY "Permitir lectura de localidades"
    ON localidades
    FOR SELECT
    USING (true);

-- Política para inserción
CREATE POLICY "Permitir inserción de localidades"
    ON localidades
    FOR INSERT
    WITH CHECK (true);

-- Política para actualización
CREATE POLICY "Permitir actualización de localidades"
    ON localidades
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para eliminación
CREATE POLICY "Permitir eliminación de localidades"
    ON localidades
    FOR DELETE
    USING (true); 