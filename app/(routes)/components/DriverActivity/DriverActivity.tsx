"use client";

import { Check, Map, Clock, Truck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomIcon } from "@/components/CustomIcon";
import { DriverActivityItemType, DriverActivityProps } from "./DriverActivity.types";

const DEFAULT_ACTIVITIES: DriverActivityItemType[] = [
  {
    id: "1",
    driverName: "Carlos Martínez",
    action: "Viaje completado",
    details: "Santiago - Concepción",
    time: "Hoy, 15:30",
    icon: Check,
    status: "success"
  },
  {
    id: "2",
    driverName: "Miguel González",
    action: "En ruta",
    details: "Rancagua - Santiago",
    time: "Hoy, 14:15",
    icon: Map,
    status: "inProgress"
  },
  {
    id: "3",
    driverName: "José Rodríguez",
    action: "Retraso reportado",
    details: "Desvío por obras en la ruta",
    time: "Hoy, 13:45",
    icon: Clock,
    status: "warning"
  },
  {
    id: "4",
    driverName: "Alejandro López",
    action: "Problema mecánico",
    details: "Requiere asistencia en Km 120",
    time: "Hoy, 11:20",
    icon: AlertCircle,
    status: "error"
  },
  {
    id: "5",
    driverName: "Roberto Silva",
    action: "Nuevo viaje asignado",
    details: "Santiago - Valparaíso",
    time: "Hoy, 09:00",
    icon: Truck,
    status: "info"
  }
];

const getStatusColor = (status: DriverActivityItemType['status']) => {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800";
    case "inProgress":
      return "bg-blue-100 text-blue-800";
    case "warning":
      return "bg-amber-100 text-amber-800";
    case "error":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

export function DriverActivity({ activities = DEFAULT_ACTIVITIES }: DriverActivityProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.map((activity) => (
        <div key={activity.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
              <activity.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{activity.driverName}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm font-medium">{activity.action}</p>
            <p className="text-xs text-muted-foreground">{activity.details}</p>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm">Ver detalles</Button>
          </div>
        </div>
      ))}
    </div>
  );
}