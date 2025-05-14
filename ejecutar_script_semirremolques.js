// Script para probar la conexión con Supabase y crear la tabla semirremolques 
// Copia este script y ejecútalo en la consola del navegador en tu app

(async function() {
  try {
    console.log('Iniciando prueba de conexión a Supabase...');

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
      
      // Verificar si la tabla semirremolques existe
      const semirremolqueTable = tables.find(t => t.tablename === 'semirremolques');
      console.log('¿Existe la tabla semirremolques?', Boolean(semirremolqueTable));
    }
    
    // Intentar crear la tabla semirremolques directamente
    console.log('Intentando crear la tabla semirremolques...');
    const createResult = await supabase.rpc('create_semirremolques_table');
    console.log('Resultado de la creación:', createResult);
    
    // Intentar una consulta simple a la tabla semirremolques
    console.log('Intentando consultar la tabla semirremolques...');
    const { data: testData, error: testError } = await supabase
      .from('semirremolques')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('Error al consultar semirremolques:', testError);
      console.error('Detalles del error:', JSON.stringify(testError));
    } else {
      console.log('Consulta exitosa a semirremolques:', testData);
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
})(); 