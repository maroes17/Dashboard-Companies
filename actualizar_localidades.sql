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

-- Insertar las nuevas localidades y guardar el mapeo
WITH nuevas_localidades AS (
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
    ON CONFLICT (ciudad, pais) DO NOTHING
    RETURNING id_localidad, nombre, tipo, ciudad, pais
)
INSERT INTO localidades_mapping (id_localidad_new, nombre, tipo, ciudad, pais)
SELECT id_localidad, nombre, tipo, ciudad, pais FROM nuevas_localidades;

-- Actualizar el mapeo con los IDs antiguos
UPDATE localidades_mapping lm
SET id_localidad_old = lb.id_localidad
FROM localidades_backup lb
WHERE lb.nombre = lm.nombre
AND lb.tipo = lm.tipo
AND lb.ciudad = lm.ciudad
AND lb.pais = lm.pais;

-- Actualizar las referencias en etapas_viaje
UPDATE etapas_viaje ev
SET id_localidad = lm.id_localidad_new
FROM localidades_mapping lm
WHERE ev.id_localidad = lm.id_localidad_old;

-- Actualizar las referencias en viajes
UPDATE viajes v
SET id_origen = lm.id_localidad_new
FROM localidades_mapping lm
WHERE v.id_origen = lm.id_localidad_old;

UPDATE viajes v
SET id_destino = lm.id_localidad_new
FROM localidades_mapping lm
WHERE v.id_destino = lm.id_localidad_old;

-- Eliminar las localidades antiguas que ya no están referenciadas
DELETE FROM localidades 
WHERE id_localidad IN (
    SELECT id_localidad_old 
    FROM localidades_mapping
    WHERE id_localidad_old IS NOT NULL
);

-- Limpiar tablas temporales
DROP TABLE IF EXISTS localidades_mapping;
DROP TABLE IF EXISTS localidades_backup; 