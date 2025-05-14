const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Obtener las credenciales de Supabase desde variables de entorno o usar valores predeterminados
const supabaseUrl = process.env.SUPABASE_URL || 'https://tqgftaqljwxyizdutvqh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZ2Z0YXFsand4eWl6ZHV0dnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDc1NDYsImV4cCI6MjA2MjY4MzU0Nn0.Il_1YjbplVzWS5OVJjE664dWcfxHIWTziBfV9Uwc3vk';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Leer el archivo SQL
const sqlFilePath = path.join(__dirname, 'actualizar_tabla_clientes.sql');
const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

// Función para ejecutar la consulta SQL
async function executeSQL() {
  try {
    console.log('Ejecutando script SQL para actualizar la tabla de clientes...');
    
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

// Ejecutar el script principal
async function main() {
  await executeSQL();
}

main(); 