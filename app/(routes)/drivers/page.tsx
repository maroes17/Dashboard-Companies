"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Driver } from "@/lib/supabase";
import { DriversList } from "./components/DriversList";
import { NewDriverDialog } from "./components/NewDriverDialog";
import { DriverDetailsDialog } from "./components/DriverDetailsDialog";
import { EditDriverDialog } from "./components/EditDriverDialog";

// Datos de muestra - Reemplazar con llamadas a Supabase
const SAMPLE_DRIVERS: Driver[] = [
  {
    id_chofer: 1,
    nombre_completo: "Carlos Martínez",
    documento_identidad: "12345678-9",
    tipo_licencia: "A-4",
    vencimiento_licencia: "2025-12-31",
    telefono: "+56 9 8765 4321",
    email: "carlos.martinez@example.com",
    nacionalidad: "Chilena",
    direccion: "Av. Providencia 1234, Santiago",
    fecha_nacimiento: "1985-05-15",
    fecha_ingreso: "2023-01-15",
    contacto_emergencia: "Ana Martínez +56 9 8765 1111",
    estado: "activo",
    observaciones: "",
    creado_en: "2023-01-15T10:30:00Z"
  },
  {
    id_chofer: 2,
    nombre_completo: "Miguel González",
    documento_identidad: "87654321-5",
    tipo_licencia: "A-5",
    vencimiento_licencia: "2024-10-15",
    telefono: "+56 9 8765 1234",
    email: "miguel.gonzalez@example.com",
    nacionalidad: "Chilena",
    direccion: "Calle Los Leones 567, Providencia",
    fecha_nacimiento: "1982-08-20",
    fecha_ingreso: "2023-02-20",
    contacto_emergencia: "Carmen González +56 9 8888 2222",
    estado: "activo",
    observaciones: "Experiencia en rutas internacionales",
    creado_en: "2023-02-20T09:15:00Z"
  },
  {
    id_chofer: 3,
    nombre_completo: "José Rodríguez",
    documento_identidad: "23456789-1",
    tipo_licencia: "A-4",
    vencimiento_licencia: "2023-09-30",
    telefono: "+56 9 7654 3210",
    email: "jose.rodriguez@example.com",
    nacionalidad: "Argentina",
    direccion: "Camino El Algarrobo 123, Las Condes",
    fecha_nacimiento: "1979-11-05",
    fecha_ingreso: "2023-03-10",
    contacto_emergencia: "María Rodríguez +56 9 7777 3333",
    estado: "inactivo",
    observaciones: "Licencia próxima a vencer",
    creado_en: "2023-03-10T14:45:00Z"
  },
  {
    id_chofer: 4,
    nombre_completo: "Alejandro López",
    documento_identidad: "98765432-K",
    tipo_licencia: "A-5",
    vencimiento_licencia: "2026-05-20",
    telefono: "+56 9 6543 2109",
    email: "alejandro.lopez@example.com",
    nacionalidad: "Chilena",
    direccion: "Av. Apoquindo 7890, Las Condes",
    fecha_nacimiento: "1990-03-25",
    fecha_ingreso: "2023-04-05",
    contacto_emergencia: "Laura López +56 9 6666 4444",
    estado: "activo",
    observaciones: "",
    creado_en: "2023-04-05T11:20:00Z"
  }
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>(SAMPLE_DRIVERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewDriverDialogOpen, setIsNewDriverDialogOpen] = useState(false);
  
  // Estado para manejo de detalles
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Estado para manejo de edición
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const filteredDrivers = drivers.filter(driver => 
    driver.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.documento_identidad.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDetailsDialogOpen(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDriver = (updatedDriver: Driver) => {
    setDrivers(prev => 
      prev.map(driver => 
        driver.id_chofer === updatedDriver.id_chofer ? updatedDriver : driver
      )
    );
    setIsEditDialogOpen(false);
  };

  const addDriver = (newDriver: Driver) => {
    setDrivers(prev => [...prev, newDriver]);
    setIsNewDriverDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Choferes</h2>
          <p className="text-muted-foreground">Gestiona los choferes de la empresa</p>
        </div>
        <Button onClick={() => setIsNewDriverDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Chofer
        </Button>
      </div>
      
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, documento o email..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-1.5">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>
      
      <DriversList 
        drivers={filteredDrivers} 
        onViewDetails={handleViewDetails}
        onEditDriver={handleEditDriver}
      />
      
      {/* Diálogos */}
      <NewDriverDialog 
        open={isNewDriverDialogOpen} 
        onOpenChange={setIsNewDriverDialogOpen}
        onSave={addDriver}
      />
      
      <DriverDetailsDialog
        driver={selectedDriver}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
      
      <EditDriverDialog
        driver={editingDriver}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateDriver}
      />
    </div>
  );
} 