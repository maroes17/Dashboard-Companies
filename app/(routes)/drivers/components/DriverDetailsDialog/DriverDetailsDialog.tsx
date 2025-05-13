"use client";

import { Driver } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Mail, MapPin, Phone, User, FileText, AlertCircle, Clock } from "lucide-react";

interface DriverDetailsDialogProps {
  driver: Driver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriverDetailsDialog({ driver, open, onOpenChange }: DriverDetailsDialogProps) {
  if (!driver) return null;

  // Función para formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No disponible";
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  // Función para calcular la edad
  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return "No disponible";
    
    const birthDate = new Date(birthDateString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} años`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Chofer</DialogTitle>
          <DialogDescription>
            Información completa del chofer registrado en el sistema.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Personal</h3>
            <div className="grid grid-cols-1 gap-3 pl-1">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-base">{driver.nombre_completo}</div>
                  <div className="text-sm text-muted-foreground">
                    Documento: {driver.documento_identidad}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nacionalidad: {driver.nacionalidad}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nacimiento: {formatDate(driver.fecha_nacimiento)} ({calculateAge(driver.fecha_nacimiento)})
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Correo electrónico</div>
                  <div className="text-sm">{driver.email || "No registrado"}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Teléfono</div>
                  <div className="text-sm">{driver.telefono || "No registrado"}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Dirección</div>
                  <div className="text-sm">{driver.direccion || "No registrada"}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Información Laboral */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Laboral</h3>
            <div className="grid grid-cols-1 gap-3 pl-1">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Fecha de Ingreso</div>
                  <div className="text-sm">{formatDate(driver.fecha_ingreso)}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Tipo de Licencia</div>
                  <div className="text-sm">{driver.tipo_licencia || "No registrado"}</div>
                  <div className="text-sm text-muted-foreground">
                    Vencimiento: {formatDate(driver.vencimiento_licencia)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Contacto de Emergencia</div>
                  <div className="text-sm">{driver.contacto_emergencia || "No registrado"}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Registro en el sistema</div>
                  <div className="text-sm">{new Date(driver.creado_en).toLocaleString("es-CL")}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Observaciones */}
          {driver.observaciones && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Observaciones</h3>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm">
                {driver.observaciones}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 