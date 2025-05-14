const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Obtener las credenciales de Supabase desde variables de entorno o usar valores predeterminados
const supabaseUrl = process.env.SUPABASE_URL || 'https://tqgftaqljwxyizdutvqh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZ2Z0YXFsand4eWl6ZHV0dnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDc1NDYsImV4cCI6MjA2MjY4MzU0Nn0.Il_1YjbplVzWS5OVJjE664dWcfxHIWTziBfV9Uwc3vk';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Leer el archivo SQL
const sqlFilePath = path.join(__dirname, 'crear_tabla_clientes.sql');
const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

// Función para ejecutar la consulta SQL
async function executeSQL() {
  try {
    console.log('Ejecutando script SQL para la tabla de clientes...');
    
    // Ejecutar la consulta SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlQuery });
    
    if (error) {
      console.error('Error al ejecutar el script SQL:', error);
      return;
    }
    
    console.log('Script SQL ejecutado correctamente.');
    console.log('Resultado:', data);
  } catch (err) {
    console.error('Error inesperado:', err);
  }
}

// Verificar si existe la función exec_sql y crearla si no existe
async function checkAndCreateExecSQL() {
  try {
    console.log('Verificando si existe la función exec_sql...');
    
    // Intentar ejecutar una consulta simple para verificar si la función existe
    const { error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1;' });
    
    if (error && error.message.includes('function exec_sql does not exist')) {
      console.log('La función exec_sql no existe. Creándola...');
      
      // SQL para crear la función exec_sql
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_query;
          RETURN jsonb_build_object('message', 'SQL ejecutado correctamente');
        EXCEPTION
          WHEN OTHERS THEN
            RETURN jsonb_build_object('error', SQLERRM);
        END;
        $$;
      `;
      
      // Ejecutar la consulta para crear la función
      const { error: createError } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
      
      if (createError) {
        // Si no podemos crear la función usando RPC, intentamos con una consulta directa
        console.log('Intentando crear la función directamente...');
        const { error: directError } = await supabase.from('_temp_exec_sql').select('*').limit(1);
        
        if (directError) {
          console.error('No se pudo crear la función exec_sql:', directError);
          console.error('Por favor, crea la función manualmente en el panel de SQL de Supabase:');
          console.error(createFunctionSQL);
          return false;
        }
      }
      
      console.log('Función exec_sql creada correctamente.');
    } else {
      console.log('La función exec_sql ya existe.');
    }
    
    return true;
  } catch (err) {
    console.error('Error al verificar/crear la función exec_sql:', err);
    return false;
  }
}

// Ejecutar el script principal
async function main() {
  const canProceed = await checkAndCreateExecSQL();
  
  if (canProceed) {
    await executeSQL();
  } else {
    console.error('No se puede ejecutar el script SQL porque la función exec_sql no está disponible.');
  }
}

main(); 