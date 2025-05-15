import { useState, useEffect } from "react";
import { supabase, IncidenteViaje } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Image } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ResolveIncidenteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidente: IncidenteViaje | null;
  viajeId: number;
  onIncidenteResolved: () => Promise<void>;
}

export function ResolveIncidenteDialog({
  open,
  onOpenChange,
  incidente,
  viajeId,
  onIncidenteResolved,
}: ResolveIncidenteDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accionesTomadas, setAccionesTomadas] = useState("");
  const [validationError, setValidationError] = useState("");

  // Resetear cuando cambia el incidente o se abre el diálogo
  useEffect(() => {
    if (open && incidente) {
      setAccionesTomadas("");
      setValidationError("");
    }
  }, [open, incidente]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAccionesTomadas(e.target.value);
    if (validationError) {
      setValidationError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accionesTomadas.trim()) {
      toast({
        title: "Error",
        description: "Por favor, describe las acciones tomadas para resolver el incidente.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Actualizar el incidente
      const { error: incidenteError } = await supabase
        .from('incidentes_viaje')
        .update({
          estado: 'resuelto',
          acciones_tomadas: accionesTomadas,
          fecha_resolucion: new Date().toISOString(),
        })
        .eq('id_incidente', incidente?.id_incidente);
      
      if (incidenteError) throw incidenteError;
      
      // Actualizar el estado del viaje a "en_ruta"
        const { error: viajeError } = await supabase
          .from('viajes')
          .update({ estado: 'en_ruta' })
          .eq('id_viaje', viajeId);
        
        if (viajeError) throw viajeError;
      
      toast({
        title: "Incidente resuelto",
        description: "El incidente ha sido marcado como resuelto correctamente.",
      });
      
      onOpenChange(false);
      await onIncidenteResolved();
    } catch (error: any) {
      console.error("Error al resolver incidente:", error);
      toast({
        title: "Error al resolver",
        description: error.message || "Ocurrió un error al resolver el incidente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear fecha
  const formatFecha = (fecha: string | undefined) => {
    if (!fecha) return 'No definida';
    return format(new Date(fecha), "dd/MM/yyyy HH:mm", { locale: es });
  };

  if (!incidente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Resolver Incidente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del incidente */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Detalles del incidente</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Tipo:</span> {incidente.tipo_incidente}</p>
              <p><span className="font-medium">Descripción:</span> {incidente.descripcion}</p>
              <p><span className="font-medium">Fecha de inicio:</span> {format(new Date(incidente.fecha_inicio), "dd/MM/yyyy HH:mm", { locale: es })}</p>
            </div>
          </div>

          {/* Foto del incidente si existe */}
          {incidente.url_foto && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Foto del incidente</h3>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <img
                  src={incidente.url_foto}
                  alt="Foto del incidente"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Formulario de resolución */}
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acciones_tomadas">
                Acciones tomadas para resolver el incidente
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="acciones_tomadas"
              value={accionesTomadas}
                onChange={(e) => setAccionesTomadas(e.target.value)}
                placeholder="Describe las acciones tomadas para resolver el incidente..."
              disabled={isLoading}
                className="min-h-[100px]"
            />
          </div>

            <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Marcar como resuelto
            </Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 