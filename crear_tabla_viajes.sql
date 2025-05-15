-- Agregar columna id_chofer a la tabla viajes
ALTER TABLE viajes
ADD COLUMN id_chofer INTEGER REFERENCES choferes(id_chofer);

-- Agregar columna id_flota a la tabla viajes
ALTER TABLE viajes
ADD COLUMN id_flota INTEGER REFERENCES flota(id_flota);

-- Agregar columna id_semirremolque a la tabla viajes
ALTER TABLE viajes
ADD COLUMN id_semirremolque INTEGER REFERENCES semirremolques(id_semirremolque); 