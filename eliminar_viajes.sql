-- Primero eliminar registros relacionados (si existen)
DELETE FROM incidentes_viaje;
DELETE FROM etapas_viaje;
DELETE FROM documentos_viaje;

-- Luego eliminar los viajes
DELETE FROM viajes;

-- Reiniciar la secuencia del ID (opcional, pero recomendado)
ALTER SEQUENCE viajes_id_viaje_seq RESTART WITH 1; 