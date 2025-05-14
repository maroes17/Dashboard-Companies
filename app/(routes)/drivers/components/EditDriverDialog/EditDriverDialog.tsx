"use client";

import { useState, useEffect } from "react";
import { Driver } from "@/lib/supabase";
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

interface EditDriverDialogProps {
  driver: Driver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedDriver: Driver) => void;
}

export function EditDriverDialog({ driver, open, onOpenChange, onSave }: EditDriverDialogProps) {
  const [formData, setFormData] = useState<Omit<Driver, 'id_chofer' | 'creado_en'>>({
    nombre_completo: "",
    documento_identidad: "",
    tipo_licencia: "",
    vencimiento_licencia: "",
    telefono: "",
    email: "",
    nacionalidad: "",
    direccion: "",
    fecha_nacimiento: "",
    fecha_ingreso: "",
    contacto_emergencia: "",
    estado: "activo",
    observaciones: "",
  });

  // Cargar los datos del chofer cuando cambie el driver seleccionado o se abra el diálogo
  useEffect(() => {
    if (driver && open) {
      setFormData({
        nombre_completo: driver.nombre_completo,
        documento_identidad: driver.documento_identidad,
        tipo_licencia: driver.tipo_licencia || "",
        vencimiento_licencia: driver.vencimiento_licencia || "",
        telefono: driver.telefono || "",
        email: driver.email || "",
        nacionalidad: driver.nacionalidad || "",
        direccion: driver.direccion || "",
        fecha_nacimiento: driver.fecha_nacimiento || "",
        fecha_ingreso: driver.fecha_ingreso || "",
        contacto_emergencia: driver.contacto_emergencia || "",
        estado: driver.estado || "activo",
        observaciones: driver.observaciones || "",
      });
    }
  }, [driver, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!driver) return;
    
    // Crear objeto actualizado manteniendo id y creado_en originales
    const updatedDriver: Driver = {
      id_chofer: driver.id_chofer,
      creado_en: driver.creado_en,
      ...formData,
    };
    
    onSave(updatedDriver);
  };

  if (!driver) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Chofer</DialogTitle>
            <DialogDescription>
              Modifica la información del chofer en el sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="nombre_completo">Nombre Completo</Label>
              <Input
                id="nombre_completo"
                name="nombre_completo"
                placeholder="Nombre y apellidos"
                value={formData.nombre_completo}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="documento_identidad">Documento de Identidad</Label>
                <Input
                  id="documento_identidad"
                  name="documento_identidad"
                  placeholder="12345678-9"
                  value={formData.documento_identidad}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nacionalidad">Nacionalidad</Label>
                <Input
                  id="nacionalidad"
                  name="nacionalidad"
                  value={formData.nacionalidad}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
                <Input
                  id="fecha_ingreso"
                  name="fecha_ingreso"
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  placeholder="+56 9 XXXX XXXX"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                placeholder="Dirección completa"
                value={formData.direccion}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="contacto_emergencia">Contacto de Emergencia</Label>
              <Input
                id="contacto_emergencia"
                name="contacto_emergencia"
                placeholder="Nombre y teléfono de contacto"
                value={formData.contacto_emergencia}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo_licencia">Tipo de Licencia</Label>
                <Select 
                  value={formData.tipo_licencia} 
                  onValueChange={(value) => handleSelectChange("tipo_licencia", value)}
                >
                  <SelectTrigger id="tipo_licencia">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A-1">A-1</SelectItem>
                    <SelectItem value="A-2">A-2</SelectItem>
                    <SelectItem value="A-3">A-3</SelectItem>
                    <SelectItem value="A-4">A-4</SelectItem>
                    <SelectItem value="A-5">A-5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vencimiento_licencia">Vencimiento Licencia</Label>
                <Input
                  id="vencimiento_licencia"
                  name="vencimiento_licencia"
                  type="date"
                  value={formData.vencimiento_licencia}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estado">Estado</Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value) => handleSelectChange("estado", value as "activo" | "inactivo" | "suspendido")}
                >
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                placeholder="Observaciones adicionales"
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 