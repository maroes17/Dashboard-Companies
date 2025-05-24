"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, PlusCircle, FilterX, Building2, Phone, Mail, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Cliente, supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCardSkeleton } from "./components/ClientCardSkeleton";
import { ClientFilterDialog } from "./components/ClientFilterDialog";
import { ClientDetailsDialog } from "./components/ClientDetailsDialog";
import { NewClientDialog } from "./components/NewClientDialog";
import { EditClientDialog } from "./components/EditClientDialog";
import { ConfirmActionDialog } from "./components/ConfirmActionDialog";

// Definir la interfaz ClientFilter
interface ClientFilter {
  estado?: string[];
  ciudad?: string[];
  pais?: string[];
}

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  
  // Estado para manejo de detalles
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Estado para manejo de edición
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estado para manejo de filtros
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ClientFilter>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Estado para manejo de eliminación
  const [deleteClient, setDeleteClient] = useState<Cliente | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Cargar datos desde Supabase
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      
      // Cargar datos de clientes
      const { data, error } = await supabase
        .from('clientes')
        .select('*');
      
      if (error) {
        console.error('Error al cargar clientes:', error);
        toast({
          title: "Error al cargar datos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No se encontraron clientes en la respuesta');
        setClients([]);
        setIsLoading(false);
        return;
      }
      
      // Convertir los datos al formato Cliente
      const formattedData: Cliente[] = data.map(item => ({
        id_cliente: item.id_cliente,
        razon_social: item.razon_social,
        rut: item.rut,
        nombre_fantasia: item.nombre_fantasia,
        direccion: item.direccion,
        ciudad: item.ciudad,
        pais: item.pais,
        telefono: item.telefono,
        email: item.email,
        contacto_principal: item.contacto_principal,
        telefono_contacto: item.telefono_contacto,
        email_contacto: item.email_contacto,
        estado: item.estado,
        observaciones: item.observaciones,
        creado_en: item.creado_en
      }));
      
      setClients(formattedData);
    } catch (error) {
      console.error('Error inesperado:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los datos de clientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado combinado (búsqueda + filtros)
  const filteredClients = clients.filter(client => {
    // Primero aplicar búsqueda de texto
    const matchesSearch = searchQuery.trim() === "" || 
      client.razon_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.nombre_fantasia && client.nombre_fantasia.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.rut && client.rut.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.contacto_principal && client.contacto_principal.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    // Luego aplicar filtros adicionales
    let matches = true;
    
    // Filtrar por estado
    if (activeFilters.estado && activeFilters.estado.length > 0) {
      matches = matches && Boolean(client.estado && activeFilters.estado.includes(client.estado));
    }
    
    // Filtrar por ciudad
    if (activeFilters.ciudad && activeFilters.ciudad.length > 0) {
      matches = matches && Boolean(client.ciudad && activeFilters.ciudad.includes(client.ciudad));
    }
    
    // Filtrar por país
    if (activeFilters.pais && activeFilters.pais.length > 0) {
      matches = matches && Boolean(client.pais && activeFilters.pais.includes(client.pais));
    }
    
    return matches;
  });

  const handleViewDetails = (client: Cliente) => {
    setSelectedClient(client);
    setIsDetailsDialogOpen(true);
  };

  const handleEditClient = (client: Cliente) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClient = (client: Cliente) => {
    setDeleteClient(client);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteClient = async () => {
    if (!deleteClient) return;

    try {
      setIsDeleteLoading(true);

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id_cliente', deleteClient.id_cliente);

      if (error) {
        throw error;
      }

      // Actualizar la lista localmente
      setClients(prev => prev.filter(c => c.id_cliente !== deleteClient.id_cliente));

      toast({
        title: "Cliente eliminado",
        description: `${deleteClient.razon_social} ha sido eliminado permanentemente.`,
      });

      // Cerrar el diálogo
      setIsDeleteDialogOpen(false);
      setDeleteClient(null);

    } catch (error: any) {
      console.error("Error al eliminar cliente:", error);
      toast({
        title: "Error al eliminar",
        description: error.message || "Ocurrió un error al eliminar el cliente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleApplyFilters = (filters: ClientFilter) => {
    setActiveFilters(filters);
    setHasActiveFilters(
      Boolean(
        (filters.estado && filters.estado.length > 0) ||
        (filters.ciudad && filters.ciudad.length > 0) ||
        (filters.pais && filters.pais.length > 0)
      )
    );
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setHasActiveFilters(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    
    if (activeFilters.estado && activeFilters.estado.length > 0) count++;
    if (activeFilters.ciudad && activeFilters.ciudad.length > 0) count++;
    if (activeFilters.pais && activeFilters.pais.length > 0) count++;
    
    return count;
  };

  const addClient = async (newClient: Omit<Cliente, 'id_cliente' | 'creado_en'>) => {
    try {
      // Preparar datos para insertar en Supabase
      const { data, error } = await supabase
        .from('clientes')
        .insert([newClient])
        .select();

      if (error) throw error;

      // Añadir el nuevo cliente al estado local con el ID generado
      if (data && data.length > 0) {
        const insertedClient: Cliente = {
          ...data[0],
          id_cliente: data[0].id_cliente,
          creado_en: data[0].creado_en
        };
        setClients(prev => [...prev, insertedClient]);
      }

      toast({
        title: "Cliente agregado",
        description: `${newClient.razon_social} ha sido agregado correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al agregar cliente:', error);
      toast({
        title: "Error al agregar",
        description: error.message || "No se pudo agregar el cliente",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    }
  };

  const updateClient = async (updatedClient: Cliente) => {
    try {
      // Extraer el id_cliente para la condición y quitar del objeto a actualizar
      const { id_cliente, creado_en, ...clientData } = updatedClient;

      const { error } = await supabase
        .from('clientes')
        .update(clientData)
        .eq('id_cliente', id_cliente);

      if (error) throw error;

      // Actualizar el estado local
      setClients(prev => 
        prev.map(c => 
          c.id_cliente === updatedClient.id_cliente ? updatedClient : c
        )
      );

      toast({
        title: "Cliente actualizado",
        description: `${updatedClient.razon_social} ha sido actualizado correctamente.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error al actualizar cliente:', error);
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el cliente",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
        <Button 
          className="bg-primary" 
          onClick={() => setIsNewClientDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, RUT o contacto..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          onClick={() => setIsFilterDialogOpen(true)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 h-5">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            title="Limpiar filtros"
          >
            <FilterX className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <ClientCardSkeleton key={index} />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <p className="text-lg text-muted-foreground">
            {clients.length === 0
              ? "No hay clientes registrados en el sistema."
              : "No se encontraron clientes con los criterios de búsqueda."}
          </p>
          {clients.length === 0 && (
            <Button 
              onClick={() => setIsNewClientDialogOpen(true)}
              className="bg-primary"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card 
              key={client.id_cliente}
              className="overflow-hidden transition-all hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{client.razon_social}</CardTitle>
                    {client.nombre_fantasia && (
                      <CardDescription className="text-sm">{client.nombre_fantasia}</CardDescription>
                    )}
                  </div>
                  <Badge 
                    variant={client.estado === 'activo' ? 'success' : client.estado === 'inactivo' ? 'destructive' : 'outline'}
                  >
                    {client.estado || 'activo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  {client.rut && (
                    <div className="text-sm">
                      <span className="font-medium">RUT: </span>
                      {client.rut}
                    </div>
                  )}
                  
                  {client.direccion && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p>{client.direccion}</p>
                        {(client.ciudad || client.pais) && (
                          <p>{[client.ciudad, client.pais].filter(Boolean).join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {client.contacto_principal && (
                    <div className="text-sm font-medium">
                      {client.contacto_principal}
                    </div>
                  )}
                  
                  {client.telefono_contacto && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {client.telefono_contacto}
                    </div>
                  )}
                  
                  {client.email_contacto && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{client.email_contacto}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(client)}
                >
                  Ver detalles
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClient(client)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => handleDeleteClient(client)}
                  >
                    Eliminar
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Componentes de diálogo */}
      <ClientFilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Diálogo para agregar nuevo cliente */}
      <NewClientDialog
        open={isNewClientDialogOpen}
        onOpenChange={setIsNewClientDialogOpen}
        onSave={addClient}
      />

      {/* Diálogo de detalles de cliente */}
      <ClientDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        client={selectedClient}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Eliminar Cliente"
        description={`¿Estás seguro de que deseas eliminar el cliente "${deleteClient?.razon_social}"? Esta acción no se puede deshacer.`}
        actionText="Eliminar"
        actionVariant="destructive"
        onConfirm={confirmDeleteClient}
        isLoading={isDeleteLoading}
      />

      {/* Diálogo de edición de cliente */}
      <EditClientDialog
        client={editingClient}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={updateClient}
      />
    </div>
  );
} 