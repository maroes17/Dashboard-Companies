-- Actualizar los tipos de orígenes y destinos para que funcionen en ambos sentidos
UPDATE origenes_destinos
SET tipo = 'ambos'
WHERE nombre IN ('San Antonio', 'Valparaíso', 'Los Andes', 'Buenos Aires', 'Córdoba', 'Mendoza', 'Rosario', 'Santa Fe', 'Mar del Plata', 'Victoria');

-- Verificar que todos los registros estén activos
UPDATE origenes_destinos
SET activo = true; 