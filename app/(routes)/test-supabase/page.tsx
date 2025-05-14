"use client";

import { useState, useEffect } from "react";
import { testSupabaseConnection, testRawQuery } from "@/lib/testSupabase";

export default function TestSupabasePage() {
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Probar conexión y listar tablas
      const connResult = await testSupabaseConnection();
      setConnectionResult(connResult);
      
      // Probar consulta SQL
      const sqlResult = await testRawQuery();
      setQueryResult(sqlResult);
    } catch (err: any) {
      console.error("Error en las pruebas:", err);
      setError(err.message || "Ocurrió un error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Prueba de Conexión a Supabase</h1>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-6 hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? "Probando..." : "Ejecutar Pruebas"}
      </button>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded text-red-700">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Conexión y Lista de Tablas</h2>
          {connectionResult ? (
            <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[300px]">
              <pre>{JSON.stringify(connectionResult, null, 2)}</pre>
            </div>
          ) : loading ? (
            <p>Cargando...</p>
          ) : (
            <p>Haz clic en "Ejecutar Pruebas" para ver los resultados.</p>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Resultado de Consulta SQL</h2>
          {queryResult ? (
            <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[300px]">
              <pre>{JSON.stringify(queryResult, null, 2)}</pre>
            </div>
          ) : loading ? (
            <p>Cargando...</p>
          ) : (
            <p>Haz clic en "Ejecutar Pruebas" para ver los resultados.</p>
          )}
        </div>
      </div>
    </div>
  );
} 