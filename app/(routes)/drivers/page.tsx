"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Driver } from "@/lib/supabase";
import { DriversList } from "./components/DriversList";
import { NewDriverDialog } from "./components/NewDriverDialog";

// Datos de muestra - Reemplazar con llamadas a Supabase
const SAMPLE_DRIVERS: Driver[] = [
  {
    id: "1",
    name: "Carlos Martínez",
    phone: "+56 9 8765 4321",
    email: "carlos.martinez@example.com",
    status: "active",
    license_number: "12345678",
    created_at: "2023-01-15"
  },
  {
    id: "2",
    name: "Miguel González",
    phone: "+56 9 8765 1234",
    email: "miguel.gonzalez@example.com",
    status: "active",
    license_number: "87654321",
    created_at: "2023-02-20"
  },
  {
    id: "3",
    name: "José Rodríguez",
    phone: "+56 9 7654 3210",
    email: "jose.rodriguez@example.com",
    status: "inactive",
    license_number: "23456789",
    created_at: "2023-03-10"
  },
  {
    id: "4",
    name: "Alejandro López",
    phone: "+56 9 6543 2109",
    email: "alejandro.lopez@example.com",
    status: "active",
    license_number: "98765432",
    created_at: "2023-04-05"
  }
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>(SAMPLE_DRIVERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewDriverDialogOpen, setIsNewDriverDialogOpen] = useState(false);

  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            placeholder="Buscar chofer..."
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
      
      <DriversList drivers={filteredDrivers} />
      
      <NewDriverDialog 
        open={isNewDriverDialogOpen} 
        onOpenChange={setIsNewDriverDialogOpen}
        onSave={addDriver}
      />
    </div>
  );
} 