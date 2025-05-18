-- Primero eliminamos la restricción existente si existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_ciudad_pais'
    ) THEN
        ALTER TABLE localidades 
        DROP CONSTRAINT unique_ciudad_pais;
    END IF;
END $$;

-- Creamos una nueva restricción que permita múltiples localidades en la misma ciudad
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'localidades_nombre_ciudad_pais_key'
    ) THEN
        ALTER TABLE localidades 
        ADD CONSTRAINT localidades_nombre_ciudad_pais_key 
        UNIQUE (nombre, ciudad, pais);
    END IF;
END $$;

-- Insertar localidades específicas para viajes de vuelta
INSERT INTO localidades (nombre, tipo, ciudad, pais)
VALUES 
    ('Capitán Cortés', 'deposito', 'Buenos Aires', 'Argentina'),
    ('Hiperbaires', 'deposito', 'Buenos Aires', 'Argentina'),
    ('Mar Pacífico', 'deposito', 'Mendoza', 'Argentina')
ON CONFLICT (nombre, ciudad, pais) DO NOTHING; 