import { useState } from "react";
import { IncidenteViaje } from "@/lib/supabase";
import { useSupabase } from "@/lib/supabase-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ResolveIncidenteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidente: IncidenteViaje;
  onIncidenteResolved: () => Promise<void>;
}

export function ResolveIncidenteDialog({
  open,
  onOpenChange,
  incidente,
  onIncidenteResolved,
}: ResolveIncidenteDialogProps) {
  const { toast } = useToast();
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [accionesTomadas, setAccionesTomadas] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      console.log('🔄 Resolviendo incidente:', incidente.id_incidente);
      
      // Actualizar el estado del incidente a "resuelto"
      const { error: incidenteError } = await supabase
        .from('incidentes_viaje')
        .update({
          estado: 'resuelto',
          fecha_resolucion: new Date().toISOString(),
          acciones_tomadas: accionesTomadas,
          actualizado_en: new Date().toISOString()
        })
        .eq('id_incidente', incidente.id_incidente);
      
      if (incidenteError) {
        console.error('❌ Error al resolver incidente:', incidenteError);
        throw incidenteError;
      }
      
      // Verificar si hay otros incidentes pendientes
      const { data: otrosIncidentes, error: otrosError } = await supabase
        .from('incidentes_viaje')
        .select('id_incidente')
        .eq('id_viaje', incidente.id_viaje)
        .neq('estado', 'resuelto');
      
      if (otrosError) {
        console.error('❌ Error al verificar otros incidentes:', otrosError);
        throw otrosError;
      }
      
      // Si no hay otros incidentes pendientes, actualizar el estado del viaje a "en_ruta"
      if (!otrosIncidentes || otrosIncidentes.length === 0) {
        console.log('🔄 No hay más incidentes pendientes, actualizando estado del viaje a "en_ruta"');
        
        const { error: viajeError } = await supabase
          .from('viajes')
          .update({
            estado: 'en_ruta',
            actualizado_en: new Date().toISOString()
          })
          .eq('id_viaje', incidente.id_viaje);
        
        if (viajeError) {
          console.error('❌ Error al actualizar estado del viaje:', viajeError);
          throw viajeError;
        }
      }
      
      toast({
        title: "Incidente resuelto",
        description: "El incidente ha sido resuelto correctamente.",
      });
      
      // Cerrar el diálogo
      onOpenChange(false);
      
      // Notificar el cambio
      await onIncidenteResolved();
    } catch (error) {
      console.error('❌ Error al resolver incidente:', error);
      toast({
        title: "Error",
        description: "No se pudo resolver el incidente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Resolver Incidente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acciones_tomadas">
              Acciones tomadas
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="acciones_tomadas"
              value={accionesTomadas}
              onChange={(e) => setAccionesTomadas(e.target.value)}
              placeholder="Describe las acciones tomadas para resolver el incidente..."
              rows={4}
              required
              disabled={isLoading}
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
            <Button type="submit" disabled={isLoading || !accionesTomadas.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resolver Incidente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 