import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Viaje, Localidad, Cliente, Driver, Fleet, Semirremolque } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Building, Package, Truck, User } from 'lucide-react';

interface ViajeTableProps {
  viajes: Viaje[];
  localidades: Record<number, Localidad>;
  clientes: Record<number, Cliente>;
  conductores: Record<number, Driver>;
  vehiculos: Record<number, Fleet>;
  semirremolques: Record<number, Semirremolque>;
  onViewDetails: (viaje: Viaje) => void;
  onEditViaje: (viaje: Viaje) => void;
  onDeleteViaje: (viaje: Viaje) => void;
}

export const ViajeTable = ({ 
  viajes, 
  localidades, 
  clientes,
  conductores,
  vehiculos,
  semirremolques,
  onViewDetails,
  onEditViaje,
  onDeleteViaje,
}: ViajeTableProps) => {
  
  // Función para obtener la clase de estado
  const getEstadoClassName = (estado: string) => {
    switch (estado) {
      case 'planificado': return 'bg-blue-500';
      case 'en_ruta': return 'bg-green-500';
      case 'incidente': return 'bg-amber-500';
      case 'realizado': return 'bg-green-700';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Función para obtener la clase de prioridad
  const getPrioridadClassName = (prioridad: string) => {
    switch (prioridad) {
      case 'baja': return 'bg-blue-500';
      case 'media': return 'bg-green-500';
      case 'alta': return 'bg-amber-500';
      case 'urgente': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full caption-bottom text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b">
            <th className="h-12 px-4 text-left align-middle font-medium">ID/Control</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Tipo</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Origen - Destino</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Fechas</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Cliente</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Equipo</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Estado</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Prioridad</th>
            <th className="h-12 px-4 text-center align-middle font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {viajes.map((viaje) => (
            <tr key={viaje.id_viaje} className="border-b hover:bg-muted/50">
              <td className="p-4 align-middle font-medium">
                #{viaje.nro_control || viaje.id_viaje}
              </td>
              <td className="p-4 align-middle">
                {viaje.tipo_viaje === 'ida' ? "Ida ➡️" : "Vuelta ⬅️"}
              </td>
              <td className="p-4 align-middle">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-blue-500" />
                    <span>{localidades[viaje.id_origen]?.nombre || "Origen desconocido"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-red-500" />
                    <span>{localidades[viaje.id_destino]?.nombre || "Destino desconocido"}</span>
                  </div>
                </div>
              </td>
              <td className="p-4 align-middle">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>Salida: {format(new Date(viaje.fecha_salida_programada), "dd/MM/yyyy", { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>Hora: {format(new Date(viaje.fecha_salida_programada), "HH:mm", { locale: es })}</span>
                  </div>
                </div>
              </td>
              <td className="p-4 align-middle">
                {viaje.id_cliente && clientes[viaje.id_cliente] ? (
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    <span className="truncate max-w-[150px]" title={clientes[viaje.id_cliente].razon_social}>
                      {clientes[viaje.id_cliente].razon_social}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No especificado</span>
                )}
              </td>
              <td className="p-4 align-middle">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-xs">
                    <User className="h-3 w-3" />
                    <span>{viaje.id_chofer ? conductores[viaje.id_chofer]?.nombre_completo || "Chofer no encontrado" : "Sin chofer"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Truck className="h-3 w-3" />
                    <span>{viaje.id_flota ? vehiculos[viaje.id_flota]?.patente || "Vehículo no encontrado" : "Sin vehículo"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Package className="h-3 w-3" />
                    <span>{viaje.id_semirremolque ? semirremolques[viaje.id_semirremolque]?.patente || "Semirremolque no encontrado" : "Sin semirremolque"}</span>
                  </div>
                </div>
              </td>
              <td className="p-4 align-middle">
                <Badge className={getEstadoClassName(viaje.estado)}>
                  {viaje.estado.replace('_', ' ')}
                </Badge>
              </td>
              <td className="p-4 align-middle">
                <Badge className={getPrioridadClassName(viaje.prioridad)}>
                  {viaje.prioridad}
                </Badge>
              </td>
              <td className="p-4 align-middle">
                <div className="flex justify-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onViewDetails(viaje)}
                    title="Ver detalles"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEditViaje(viaje)}
                    title="Editar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDeleteViaje(viaje)}
                    title="Eliminar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </Button>
                </div>
              </td>
            </tr>
          ))}

          {viajes.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center">
                <div className="flex flex-col items-center justify-center py-4">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No se encontraron viajes</h3>
                  <p className="text-muted-foreground mt-1">
                    No hay viajes que coincidan con los criterios de búsqueda.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}; 