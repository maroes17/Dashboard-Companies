import { Localidad } from "@/lib/supabase";

// Datos de muestra para localidades en caso de que falle la carga desde la base de datos
export const mockLocalidades: Localidad[] = [
  {
    id_localidad: 1,
    nombre: "Santiago",
    pais: "Chile",
    es_puerto: false,
    es_aduana: false,
    es_deposito_contenedores: false,
    creado_en: new Date().toISOString()
  },
  {
    id_localidad: 2,
    nombre: "Buenos Aires",
    pais: "Argentina",
    es_puerto: false,
    es_aduana: true,
    es_deposito_contenedores: false,
    creado_en: new Date().toISOString()
  },
  {
    id_localidad: 3,
    nombre: "Valparaíso",
    pais: "Chile",
    es_puerto: true,
    es_aduana: true,
    es_deposito_contenedores: true,
    creado_en: new Date().toISOString()
  },
  {
    id_localidad: 4,
    nombre: "Mendoza",
    pais: "Argentina",
    es_puerto: false,
    es_aduana: true,
    es_deposito_contenedores: false,
    creado_en: new Date().toISOString()
  },
  {
    id_localidad: 5,
    nombre: "San Antonio",
    pais: "Chile",
    es_puerto: true,
    es_aduana: true,
    es_deposito_contenedores: true,
    creado_en: new Date().toISOString()
  },
  {
    id_localidad: 6,
    nombre: "Córdoba",
    pais: "Argentina",
    es_puerto: false,
    es_aduana: false,
    es_deposito_contenedores: false,
    creado_en: new Date().toISOString()
  },
  {
    id_localidad: 7,
    nombre: "Santa Fe",
    pais: "Argentina",
    es_puerto: false,
    es_aduana: false,
    es_deposito_contenedores: false,
    creado_en: new Date().toISOString()
  },
  {
    id_localidad: 8,
    nombre: "Rosario",
    pais: "Argentina",
    es_puerto: true,
    es_aduana: false,
    es_deposito_contenedores: true,
    creado_en: new Date().toISOString()
  },
  {
    id_localidad: 9,
    nombre: "San Lorenzo",
    pais: "Argentina",
    es_puerto: true,
    es_aduana: false,
    es_deposito_contenedores: true,
    creado_en: new Date().toISOString()
  },
  {
    id_localidad: 10,
    nombre: "Entre Ríos",
    pais: "Argentina",
    es_puerto: false,
    es_aduana: false,
    es_deposito_contenedores: false,
    creado_en: new Date().toISOString()
  },
  {
    id_localidad: 11,
    nombre: "Mar del Plata",
    pais: "Argentina",
    es_puerto: true,
    es_aduana: false,
    es_deposito_contenedores: false,
    creado_en: new Date().toISOString()
  }
]; 