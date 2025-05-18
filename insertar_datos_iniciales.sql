-- Insertar localidades básicas
INSERT INTO localidades (nombre, tipo, ciudad, pais, es_puerto, es_aduana, es_deposito_contenedores)
VALUES 
    ('Puerto Central - San Antonio', 'puerto', 'San Antonio', 'Chile', TRUE, FALSE, FALSE),
    ('Puerto STI - San Antonio', 'puerto', 'San Antonio', 'Chile', TRUE, FALSE, FALSE),
    ('Puerto Valparaiso', 'puerto', 'Valparaíso', 'Chile', TRUE, FALSE, FALSE),
    ('San Antonio', 'aduana', 'San Antonio', 'Chile', FALSE, TRUE, TRUE),
    ('Valparaíso', 'aduana', 'Valparaíso', 'Chile', FALSE, TRUE, TRUE),
    ('Los Andes', 'aduana', 'Los Andes', 'Chile', FALSE, TRUE, FALSE),
    ('Uspallata', 'aduana', 'Uspallata', 'Argentina', FALSE, TRUE, FALSE),
    ('Victoria', 'aduana', 'Victoria', 'Argentina', FALSE, TRUE, FALSE),
    ('Rosario', 'deposito', 'Rosario', 'Argentina', FALSE, FALSE, TRUE),
    ('San Lorenzo', 'deposito', 'San Lorenzo', 'Argentina', FALSE, FALSE, TRUE),
    ('Mar del Plata', 'cliente', 'Mar del Plata', 'Argentina', FALSE, FALSE, FALSE),
    ('Santa Fe', 'cliente', 'Santa Fe', 'Argentina', FALSE, FALSE, FALSE),
    ('Córdoba', 'cliente', 'Córdoba', 'Argentina', FALSE, FALSE, FALSE),
    ('Buenos Aires', 'cliente', 'Buenos Aires', 'Argentina', FALSE, FALSE, FALSE),
    ('Mendoza', 'cliente', 'Mendoza', 'Argentina', FALSE, FALSE, FALSE)
ON CONFLICT (nombre, ciudad, pais) DO UPDATE 
SET 
    tipo = EXCLUDED.tipo,
    es_puerto = EXCLUDED.es_puerto,
    es_aduana = EXCLUDED.es_aduana,
    es_deposito_contenedores = EXCLUDED.es_deposito_contenedores,
    actualizado_en = CURRENT_TIMESTAMP;