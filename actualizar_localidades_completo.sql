-- Crear tabla temporal para backup
CREATE TABLE IF NOT EXISTS localidades_backup AS 
SELECT * FROM localidades;

-- Crear tabla temporal para mapeo de IDs
CREATE TABLE IF NOT EXISTS localidades_mapping (
    id_localidad_old INTEGER,
    id_localidad_new INTEGER,
    nombre VARCHAR(255),
    tipo VARCHAR(50),
    ciudad VARCHAR(255),
    pais VARCHAR(100)
);

-- Actualizar las referencias en etapas_viaje y viajes para mantener las localidades existentes
UPDATE etapas_viaje ev
SET id_localidad = (
    SELECT MIN(id_localidad) 
    FROM localidades l 
    WHERE l.ciudad = (SELECT ciudad FROM localidades WHERE id_localidad = ev.id_localidad)
    AND l.pais = (SELECT pais FROM localidades WHERE id_localidad = ev.id_localidad)
)
WHERE EXISTS (
    SELECT 1 
    FROM localidades l 
    WHERE l.id_localidad = ev.id_localidad
);

UPDATE viajes v
SET id_origen = (
    SELECT MIN(id_localidad) 
    FROM localidades l 
    WHERE l.ciudad = (SELECT ciudad FROM localidades WHERE id_localidad = v.id_origen)
    AND l.pais = (SELECT pais FROM localidades WHERE id_localidad = v.id_origen)
)
WHERE EXISTS (
    SELECT 1 
    FROM localidades l 
    WHERE l.id_localidad = v.id_origen
);

UPDATE viajes v
SET id_destino = (
    SELECT MIN(id_localidad) 
    FROM localidades l 
    WHERE l.ciudad = (SELECT ciudad FROM localidades WHERE id_localidad = v.id_destino)
    AND l.pais = (SELECT pais FROM localidades WHERE id_localidad = v.id_destino)
)
WHERE EXISTS (
    SELECT 1 
    FROM localidades l 
    WHERE l.id_localidad = v.id_destino
);

-- Eliminar duplicados manteniendo el registro con el ID más bajo
DELETE FROM localidades a
USING localidades b
WHERE a.ciudad = b.ciudad 
AND a.pais = b.pais 
AND a.id_localidad > b.id_localidad;

-- Agregar restricción única para ciudad y pais
ALTER TABLE localidades
ADD CONSTRAINT unique_ciudad_pais UNIQUE (ciudad, pais);

-- Insertar las nuevas localidades
INSERT INTO localidades (nombre, tipo, ciudad, pais)
VALUES 
    ('San Antonio', 'puerto', 'San Antonio', 'Chile'),
    ('Valparaíso', 'puerto', 'Valparaíso', 'Chile'),
    ('Los Andes', 'aduana', 'Los Andes', 'Chile'),
    ('Uspallata', 'aduana', 'Uspallata', 'Argentina'),
    ('Victoria', 'aduana', 'Victoria', 'Argentina'),
    ('Mar del Plata', 'cliente', 'Mar del Plata', 'Argentina'),
    ('Santa Fe', 'cliente', 'Santa Fe', 'Argentina'),
    ('Córdoba', 'cliente', 'Córdoba', 'Argentina'),
    ('Buenos Aires', 'cliente', 'Buenos Aires', 'Argentina'),
    ('Rosario', 'cliente', 'Rosario', 'Argentina'),
    ('Mendoza', 'cliente', 'Mendoza', 'Argentina')
ON CONFLICT (ciudad, pais) DO NOTHING;

-- Limpiar tablas temporales
DROP TABLE IF EXISTS localidades_mapping;
DROP TABLE IF EXISTS localidades_backup; 