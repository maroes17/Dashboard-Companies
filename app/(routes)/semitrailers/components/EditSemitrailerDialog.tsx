"use client";

import { useState, useEffect } from "react";
import { Semirremolque } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface EditSemitrailerDialogProps {
  semitrailer: Semirremolque | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (semitrailer: Semirremolque) => Promise<void>;
}

export function EditSemitrailerDialog({
  semitrailer,
  open,
  onOpenChange,
  onSave
}: EditSemitrailerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Campos del formulario
  const [patente, setPatente] = useState("");
  const [nroGenset, setNroGenset] = useState("");
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState<number | undefined>(undefined);
  const [estado, setEstado] = useState<string>("activo");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [fechaUltimaRevision, setFechaUltimaRevision] = useState("");
  const [vencimientoRevisionTecnica, setVencimientoRevisionTecnica] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Cargar datos del semirremolque cuando cambia
  useEffect(() => {
    if (semitrailer && open) {
      setPatente(semitrailer.patente || "");
      setNroGenset(semitrailer.nro_genset || "");
      setTipo(semitrailer.tipo || "");
      setMarca(semitrailer.marca || "");
      setModelo(semitrailer.modelo || "");
      setAnio(semitrailer.anio);
      setEstado(semitrailer.estado || "activo");
      setFechaIngreso(semitrailer.fecha_ingreso || "");
      setFechaUltimaRevision(semitrailer.fecha_ultima_revision || "");
      setVencimientoRevisionTecnica(semitrailer.vencimiento_revision_tecnica || "");
      setObservaciones(semitrailer.observaciones || "");
    }
  }, [semitrailer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!semitrailer) {
      setError('No se encontró el semirremolque a editar');
      setIsSubmitting(false);
      return;
    }

    try {
      // Validar campos requeridos
      if (!patente || !tipo || !marca || !modelo || !anio) {
        throw new Error('Por favor complete todos los campos requeridos');
      }

      // Validar año
      const currentYear = new Date().getFullYear();
      if (anio < 1900 || anio > currentYear) {
        throw new Error(`El año debe estar entre 1900 y ${currentYear}`);
      }

      // Validar fechas
      if (fechaUltimaRevision && vencimientoRevisionTecnica) {
        const ultimaRevision = new Date(fechaUltimaRevision);
        const vencimiento = new Date(vencimientoRevisionTecnica);
        
        if (ultimaRevision > vencimiento) {
          throw new Error('La fecha de última revisión no puede ser posterior al vencimiento de la revisión técnica');
        }
      }

      // Actualizar el semirremolque
      const updatedSemitrailer: Semirremolque = {
        id_semirremolque: semitrailer.id_semirremolque,
        patente: patente.toUpperCase(),
        nro_genset: nroGenset.trim() || undefined,
        tipo: tipo.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: anio,
        estado: estado as any,
        fecha_ingreso: fechaIngreso || semitrailer.fecha_ingreso,
        fecha_ultima_revision: fechaUltimaRevision || undefined,
        vencimiento_revision_tecnica: vencimientoRevisionTecnica || undefined,
        observaciones: observaciones.trim() || undefined,
        actualizado_en: new Date().toISOString(),
        creado_en: semitrailer.creado_en,
        asignado_a_flota_id: semitrailer.asignado_a_flota_id
      };

      await onSave(updatedSemitrailer);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al actualizar semirremolque:', error);
      setError(error.message || 'Error al actualizar el semirremolque');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!semitrailer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Semirremolque</DialogTitle>
          <DialogDescription>
            Modifica los datos del semirremolque. Los campos con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {/* Patente */}
            <div className="space-y-2">
              <Label htmlFor="patente" className="font-medium">
                Patente *
              </Label>
              <Input
                id="patente"
                value={patente}
                onChange={(e) => setPatente(e.target.value)}
                placeholder="Ej: AB1234"
                className="uppercase"
              />
            </div>
            
            {/* Número de Genset */}
            <div className="space-y-2">
              <Label htmlFor="nro_genset" className="font-medium">
                Nº Genset
              </Label>
              <Input
                id="nro_genset"
                value={nroGenset}
                onChange={(e) => setNroGenset(e.target.value)}
                placeholder="Número de Genset"
              />
            </div>
            
            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo" className="font-medium">
                Tipo
              </Label>
              <Input
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ej: Refrigerado"
              />
            </div>
            
            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="marca" className="font-medium">
                Marca
              </Label>
              <Input
                id="marca"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ej: Randon"
              />
            </div>
            
            {/* Modelo */}
            <div className="space-y-2">
              <Label htmlFor="modelo" className="font-medium">
                Modelo
              </Label>
              <Input
                id="modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ej: SR"
              />
            </div>
            
            {/* Año */}
            <div className="space-y-2">
              <Label htmlFor="anio" className="font-medium">
                Año
              </Label>
              <Input
                id="anio"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={anio || ''}
                onChange={(e) => setAnio(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ej: 2023"
              />
            </div>
            
            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado" className="font-medium">
                Estado *
              </Label>
              <Select
                value={estado}
                onValueChange={setEstado}
              >
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="mantenimiento">En Mantenimiento</SelectItem>
                  <SelectItem value="en_reparacion">En Reparación</SelectItem>
                  <SelectItem value="dado_de_baja">Dado de Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Fecha de Ingreso */}
            <div className="space-y-2">
              <Label htmlFor="fecha_ingreso" className="font-medium">
                Fecha de Ingreso
              </Label>
              <Input
                id="fecha_ingreso"
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
              />
            </div>
            
            {/* Fecha última revisión */}
            <div className="space-y-2">
              <Label htmlFor="fecha_ultima_revision" className="font-medium">
                Fecha última revisión
              </Label>
              <Input
                id="fecha_ultima_revision"
                type="date"
                value={fechaUltimaRevision}
                onChange={(e) => setFechaUltimaRevision(e.target.value)}
              />
            </div>
            
            {/* Vencimiento revisión técnica */}
            <div className="space-y-2">
              <Label htmlFor="vencimiento_revision_tecnica" className="font-medium">
                Vencimiento Revisión Técnica
              </Label>
              <Input
                id="vencimiento_revision_tecnica"
                type="date"
                value={vencimientoRevisionTecnica}
                onChange={(e) => setVencimientoRevisionTecnica(e.target.value)}
              />
            </div>
          </div>
          
          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones" className="font-medium">
              Observaciones
            </Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones adicionales sobre el semirremolque"
              rows={3}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !patente.trim()}
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 