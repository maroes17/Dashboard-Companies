import { useCallback } from 'react';
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Viaje, Localidad, Cliente } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parseISO } from 'date-fns';

// Configuración del localizador para el español
const locales = {
  'es': es,
};

// Configuración para react-big-calendar con date-fns
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Estilos para los eventos según el estado
const eventStyleGetter = (event: any) => {
  let backgroundColor = '#3182ce';  // Azul por defecto (planificado)
  
  switch (event.estado) {
    case 'planificado':
      backgroundColor = '#3182ce'; // Azul
      break;
    case 'en_ruta':
      backgroundColor = '#38a169'; // Verde
      break;
    case 'incidente':
      backgroundColor = '#d69e2e'; // Amarillo
      break;
    case 'realizado':
      backgroundColor = '#2f855a'; // Verde oscuro
      break;
    case 'cancelado':
      backgroundColor = '#e53e3e'; // Rojo
      break;
    default:
      backgroundColor = '#718096'; // Gris
  }
  
  return {
    style: {
      backgroundColor,
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0',
      display: 'block',
      padding: '2px 5px',
    }
  };
};

interface ViajeCalendarProps {
  viajes: Viaje[];
  localidades: Record<number, Localidad>;
  clientes: Record<number, Cliente>;
  onViewDetails: (viaje: Viaje) => void;
}

export const ViajeCalendar = ({ viajes, localidades, clientes, onViewDetails }: ViajeCalendarProps) => {
  // Transformar viajes al formato necesario para el calendario
  const events = viajes.map(viaje => {
    const origenNombre = localidades[viaje.id_origen]?.nombre || 'Origen desconocido';
    const destinoNombre = localidades[viaje.id_destino]?.nombre || 'Destino desconocido';
    const clienteNombre = viaje.id_cliente && clientes[viaje.id_cliente]?.razon_social || '';
    
    return {
      id: viaje.id_viaje,
      title: `Viaje #${viaje.nro_control || viaje.id_viaje} - ${origenNombre} a ${destinoNombre}`,
      start: parseISO(viaje.fecha_salida_programada),
      end: parseISO(viaje.fecha_llegada_programada),
      estado: viaje.estado,
      prioridad: viaje.prioridad,
      cliente: clienteNombre,
      origen: origenNombre,
      destino: destinoNombre,
      viaje: viaje, // Guardar el viaje completo para poder pasar al onViewDetails
    };
  });

  // Manejar clic en evento
  const handleSelectEvent = useCallback(
    (event: any) => {
      onViewDetails(event.viaje);
    },
    [onViewDetails]
  );

  // Componente personalizado para eventos
  const EventComponent = ({ event }: any) => (
    <div>
      <div className="text-xs font-semibold">{event.title}</div>
      {event.cliente && <div className="text-xs">{event.cliente}</div>}
    </div>
  );

  return (
    <Card className="p-4">
      <Calendar
        culture='es'
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        components={{
          event: EventComponent
        }}
        views={['month', 'week', 'day', 'agenda']}
        defaultView={Views.MONTH}
        messages={{
          today: 'Hoy',
          previous: 'Anterior',
          next: 'Siguiente',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          agenda: 'Agenda',
          date: 'Fecha',
          time: 'Hora',
          event: 'Evento',
          allDay: 'Todo el día',
          noEventsInRange: 'No hay viajes en este rango de fechas',
        }}
      />
    </Card>
  );
}; 