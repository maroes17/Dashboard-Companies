"use client";

import { useState } from "react";
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
import { AlertCircle } from "lucide-react";

interface NewDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (driver: Driver) => void;
}

// Lista de nacionalidades disponibles
const NACIONALIDADES = ["Chilena", "Argentina", "Brasileña"];

export function NewDriverDialog({ open, onOpenChange, onSave }: NewDriverDialogProps) {
  const [formData, setFormData] = useState({
    nombre_completo: "",
    documento_identidad: "",
    tipo_licencia: "",
    vencimiento_licencia: "",
    telefono: "",
    email: "",
    nacionalidad: "Chilena",
    direccion: "",
    fecha_nacimiento: "",
    fecha_ingreso: new Date().toISOString().split('T')[0], // Fecha actual como valor predeterminado
    contacto_emergencia: "",
    estado: "activo" as "activo" | "inactivo" | "suspendido",
    observaciones: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Limpiar el error cuando el usuario comienza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Limpiar el error cuando el usuario selecciona un valor
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validar campos obligatorios
    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = "El nombre completo es obligatorio";
    }
    
    if (!formData.documento_identidad.trim()) {
      newErrors.documento_identidad = "El documento de identidad es obligatorio";
    }
    
    if (!formData.nacionalidad.trim()) {
      newErrors.nacionalidad = "La nacionalidad es obligatoria";
    }
    
    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = "La fecha de nacimiento es obligatoria";
    }
    
    if (!formData.tipo_licencia) {
      newErrors.tipo_licencia = "El tipo de licencia es obligatorio";
    }
    
    if (!formData.vencimiento_licencia) {
      newErrors.vencimiento_licencia = "El vencimiento de licencia es obligatorio";
    }
    
    if (!formData.estado) {
      newErrors.estado = "El estado es obligatorio";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }
    
    // En una implementación real, esto se enviaría a Supabase
    const newDriver: Driver = {
      id_chofer: Date.now(), // En realidad esto lo generaría Supabase
      ...formData,
      creado_en: new Date().toISOString(),
    };
    
    onSave(newDriver);
    
    // Resetear el formulario
    setFormData({
      nombre_completo: "",
      documento_identidad: "",
      tipo_licencia: "",
      vencimiento_licencia: "",
      telefono: "",
      email: "",
      nacionalidad: "Chilena",
      direccion: "",
      fecha_nacimiento: "",
      fecha_ingreso: new Date().toISOString().split('T')[0],
      contacto_emergencia: "",
      estado: "activo",
      observaciones: "",
    });
    setErrors({});
    setSubmitted(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nuevo Chofer</DialogTitle>
            <DialogDescription>
              Completa la información para registrar un nuevo chofer en el sistema.
              Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="nombre_completo" className="flex items-center">
                Nombre Completo <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="nombre_completo"
                name="nombre_completo"
                placeholder="Nombre y apellidos"
                value={formData.nombre_completo}
                onChange={handleChange}
                className={errors.nombre_completo ? "border-red-500" : ""}
              />
              {errors.nombre_completo && (
                <div className="text-red-500 text-xs flex items-center mt-1">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {errors.nombre_completo}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="documento_identidad" className="flex items-center">
                  Documento de Identidad <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="documento_identidad"
                  name="documento_identidad"
                  placeholder="12345678-9"
                  value={formData.documento_identidad}
                  onChange={handleChange}
                  className={errors.documento_identidad ? "border-red-500" : ""}
                />
                {errors.documento_identidad && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.documento_identidad}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nacionalidad" className="flex items-center">
                  Nacionalidad <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select 
                  value={formData.nacionalidad} 
                  onValueChange={(value) => handleSelectChange("nacionalidad", value)}
                >
                  <SelectTrigger 
                    id="nacionalidad"
                    className={errors.nacionalidad ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Seleccionar nacionalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {NACIONALIDADES.map((nacionalidad) => (
                      <SelectItem key={nacionalidad} value={nacionalidad}>
                        {nacionalidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nacionalidad && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.nacionalidad}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha_nacimiento" className="flex items-center">
                  Fecha de Nacimiento <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  className={errors.fecha_nacimiento ? "border-red-500" : ""}
                />
                {errors.fecha_nacimiento && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.fecha_nacimiento}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fecha_ingreso" className="flex items-center">
                  Fecha de Ingreso <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="fecha_ingreso"
                  name="fecha_ingreso"
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={handleChange}
                  className={errors.fecha_ingreso ? "border-red-500" : ""}
                />
                {errors.fecha_ingreso && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.fecha_ingreso}
                  </div>
                )}
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
                <Label htmlFor="tipo_licencia" className="flex items-center">
                  Tipo de Licencia <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select 
                  value={formData.tipo_licencia} 
                  onValueChange={(value) => handleSelectChange("tipo_licencia", value)}
                >
                  <SelectTrigger 
                    id="tipo_licencia"
                    className={errors.tipo_licencia ? "border-red-500" : ""}
                  >
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
                {errors.tipo_licencia && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.tipo_licencia}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vencimiento_licencia" className="flex items-center">
                  Vencimiento Licencia <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="vencimiento_licencia"
                  name="vencimiento_licencia"
                  type="date"
                  value={formData.vencimiento_licencia}
                  onChange={handleChange}
                  className={errors.vencimiento_licencia ? "border-red-500" : ""}
                />
                {errors.vencimiento_licencia && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.vencimiento_licencia}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estado" className="flex items-center">
                  Estado <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value) => handleSelectChange("estado", value as "activo" | "inactivo" | "suspendido")}
                >
                  <SelectTrigger 
                    id="estado"
                    className={errors.estado ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
                {errors.estado && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.estado}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                placeholder="Información adicional relevante sobre el chofer"
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>
          
          {submitted && Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Por favor, corrige los siguientes errores:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Chofer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 