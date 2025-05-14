// Script para probar la conexión con Supabase y crear la tabla polizas 
// Copia este script y ejecútalo en la consola del navegador en tu app

(async function() {
  try {
    console.log('Iniciando prueba de conexión a Supabase y creación de tabla polizas...');

    // Obtener el cliente Supabase desde la instancia global
    const { supabase } = window;
    
    if (!supabase) {
      console.error('No se pudo encontrar la instancia de Supabase. Asegúrate de ejecutar este script desde la aplicación.');
      return;
    }

    // Probar la conexión obteniendo la lista de tablas
    console.log('Obteniendo lista de tablas...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error('Error al obtener tablas:', tablesError);
      console.log('Intentando consulta alternativa...');
      
      // Intentar una consulta directa a una tabla conocida
      const { data: fleetData, error: fleetError } = await supabase
        .from('flota')
        .select('count(*)', { count: 'exact' });
      
      if (fleetError) {
        console.error('Error al consultar tabla flota:', fleetError);
      } else {
        console.log('Consulta a flota exitosa:', fleetData);
      }
    } else {
      console.log('Tablas encontradas:', tables);
      
      // Verificar si la tabla polizas existe
      const polizasTable = tables.find(t => t.tablename === 'polizas');
      console.log('¿Existe la tabla polizas?', Boolean(polizasTable));
    }
    
    // Intentar crear la tabla polizas directamente usando la función RPC
    console.log('Intentando crear la tabla polizas...');
    const createResult = await supabase.rpc('create_polizas_table');
    console.log('Resultado de la creación:', createResult);
    
    // Intentar una consulta simple a la tabla polizas
    console.log('Intentando consultar la tabla polizas...');
    const { data: testData, error: testError } = await supabase
      .from('polizas')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('Error al consultar polizas:', testError);
      console.error('Detalles del error:', JSON.stringify(testError));
    } else {
      console.log('Consulta exitosa a polizas:', testData);
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
})(); 