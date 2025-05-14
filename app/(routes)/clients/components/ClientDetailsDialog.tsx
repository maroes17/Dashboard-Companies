import { Cliente } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, MapPin, Phone, Calendar, FileText } from "lucide-react";

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Cliente | null;
}

export function ClientDetailsDialog({
  open,
  onOpenChange,
  client,
}: ClientDetailsDialogProps) {
  if (!client) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {client.razon_social}
            {client.nombre_fantasia && (
              <span className="ml-2 text-muted-foreground font-normal text-base">
                ({client.nombre_fantasia})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Estado */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Estado:</span>
            <Badge
              variant={
                client.estado === "activo"
                  ? "success"
                  : client.estado === "inactivo"
                  ? "destructive"
                  : "outline"
              }
            >
              {client.estado || "activo"}
            </Badge>
          </div>

          {/* RUT */}
          {client.rut && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">RUT:</span>
              <span className="text-sm">{client.rut}</span>
            </div>
          )}

          {/* Información de contacto */}
          <div className="border rounded-md p-4 space-y-3">
            <h3 className="font-medium text-sm mb-2">Información de Contacto</h3>
            
            {/* Dirección */}
            {client.direccion && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">{client.direccion}</p>
                  {(client.ciudad || client.pais) && (
                    <p className="text-sm text-muted-foreground">
                      {[client.ciudad, client.pais].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Teléfono */}
            {client.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.telefono}</span>
              </div>
            )}
            
            {/* Email */}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.email}</span>
              </div>
            )}
          </div>

          {/* Contacto principal */}
          {(client.contacto_principal || client.telefono_contacto || client.email_contacto) && (
            <div className="border rounded-md p-4 space-y-3">
              <h3 className="font-medium text-sm mb-2">Contacto Principal</h3>
              
              {client.contacto_principal && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{client.contacto_principal}</span>
                </div>
              )}
              
              {client.telefono_contacto && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.telefono_contacto}</span>
                </div>
              )}
              
              {client.email_contacto && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.email_contacto}</span>
                </div>
              )}
            </div>
          )}

          {/* Fechas y notas */}
          <div className="border rounded-md p-4 space-y-3">
            <h3 className="font-medium text-sm mb-2">Información Adicional</h3>
            
            {/* Fecha de creación */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">Fecha de registro: </span>
                <span className="text-sm">{formatDate(client.creado_en)}</span>
              </div>
            </div>
            
            {/* Observaciones */}
            {client.observaciones && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-sm font-medium">Observaciones:</span>
                  <p className="text-sm mt-1">{client.observaciones}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 