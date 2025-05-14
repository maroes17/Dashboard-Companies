import { supabase } from './supabase';

// Función para probar la conexión a Supabase y listar todas las tablas
export async function testSupabaseConnection() {
  console.log('Probando conexión a Supabase...');
  
  try {
    // Intentar listar las tablas de manera directa
    const { data: tablesAlt, error: tablesAltError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesAltError) {
      console.error('Error al listar tablas:', tablesAltError);
      
      // Último intento: consulta directa
      const { data: directTables, error: directError } = await supabase
        .from('choferes')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.error('Error en consulta directa:', directError);
        return { error: directError };
      }
      
      return { tablas: ['choferes'] };
    }
    
    console.log('Tablas disponibles:', tablesAlt);
    
    // Intentar consultar la tabla 'choferes'
    const { data: choferes, error: choferesError } = await supabase
      .from('choferes')
      .select('*');
    
    if (choferesError) {
      console.error('Error al consultar tabla choferes:', choferesError);
      return { tables: tablesAlt, error: choferesError };
    }
    
    console.log('Datos de choferes:', choferes);
    return { tables: tablesAlt, choferes };
  } catch (error) {
    console.error('Error en la prueba de conexión:', error);
    return { error };
  }
}

// Función para probar una consulta SQL directa
export async function testRawQuery() {
  try {
    // Consulta directa a la tabla choferes
    const { data, error } = await supabase
      .from('choferes')
      .select('*');
    
    if (error) {
      console.error('Error en consulta a choferes:', error);
      return { error };
    }
    
    console.log('Datos de choferes (consulta directa):', data);
    
    // Probar si hay problemas con RLS
    const { count, error: countError } = await supabase
      .from('choferes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error al contar choferes:', countError);
      return { data, countError };
    }
    
    console.log('Conteo de choferes:', count);
    
    return { data, count };
  } catch (error) {
    console.error('Error en la consulta directa:', error);
    return { error };
  }
} 