-- Actualizar la tabla de clientes para hacer el campo RUT obligatorio
ALTER TABLE clientes 
  ALTER COLUMN rut SET NOT NULL;

-- Añadir mensaje explicativo
COMMENT ON COLUMN clientes.rut IS 'RUT del cliente (obligatorio). Formato: 12345678-9'; 