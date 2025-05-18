-- Primero, crear una tabla temporal para las localidades que queremos mantener
CREATE TEMP TABLE localidades_temp (
    nombre VARCHAR(255),
    tipo VARCHAR(50),
    ciudad VARCHAR(255),
    pais VARCHAR(255)
);

-- Insertar solo las localidades que queremos mantener
INSERT INTO localidades_temp (nombre, tipo, ciudad, pais) VALUES
    -- Chile
    ('San Antonio', 'puerto', 'San Antonio', 'Chile'),
    ('Valparaíso', 'puerto', 'Valparaíso', 'Chile'),
    ('Los Andes', 'cliente', 'Los Andes', 'Chile'),
    
    -- Argentina
    ('Buenos Aires', 'cliente', 'Buenos Aires', 'Argentina'),
    ('Córdoba', 'cliente', 'Córdoba', 'Argentina'),
    ('Mendoza', 'cliente', 'Mendoza', 'Argentina'),
    ('Rosario', 'cliente', 'Rosario', 'Argentina'),
    ('Santa Fe', 'cliente', 'Santa Fe', 'Argentina'),
    ('Mar del Plata', 'cliente', 'Mar del Plata', 'Argentina'),
    ('Victoria', 'cliente', 'Victoria', 'Argentina');

-- Crear una tabla temporal para mapear los IDs antiguos a los nuevos
CREATE TEMP TABLE mapeo_localidades (
    id_antiguo INTEGER,
    id_nuevo INTEGER
);

-- Insertar las localidades nuevas y guardar el mapeo
WITH nuevas_localidades AS (
    INSERT INTO localidades (nombre, tipo, ciudad, pais)
    SELECT nombre, tipo, ciudad, pais
    FROM localidades_temp
    ON CONFLICT (nombre, ciudad, pais) DO NOTHING
    RETURNING id_localidad, nombre, ciudad, pais
)
INSERT INTO mapeo_localidades (id_antiguo, id_nuevo)
SELECT l.id_localidad, nl.id_localidad
FROM localidades l
JOIN nuevas_localidades nl ON l.nombre = nl.nombre 
    AND l.ciudad = nl.ciudad 
    AND l.pais = nl.pais;

-- Actualizar las referencias en etapas_viaje
UPDATE etapas_viaje ev
SET id_localidad = ml.id_nuevo
FROM mapeo_localidades ml
WHERE ev.id_localidad = ml.id_antiguo;

-- Actualizar las referencias en viajes
UPDATE viajes v
SET id_origen = ml.id_nuevo
FROM mapeo_localidades ml
WHERE v.id_origen = ml.id_antiguo;

UPDATE viajes v
SET id_destino = ml.id_nuevo
FROM mapeo_localidades ml
WHERE v.id_destino = ml.id_antiguo;

-- Eliminar las localidades que no están en el mapeo
DELETE FROM localidades
WHERE id_localidad NOT IN (
    SELECT id_nuevo FROM mapeo_localidades
    UNION
    SELECT id_localidad FROM localidades_temp
);

-- Limpiar tablas temporales
DROP TABLE localidades_temp;
DROP TABLE mapeo_localidades; 