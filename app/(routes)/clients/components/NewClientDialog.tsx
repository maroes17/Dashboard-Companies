import { useState } from "react";
import { Cliente } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface NewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (client: Omit<Cliente, 'id_cliente' | 'creado_en'>) => Promise<void>;
}

export function NewClientDialog({
  open,
  onOpenChange,
  onSave,
}: NewClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Cliente, 'id_cliente' | 'creado_en'>>({
    razon_social: "",
    rut: "",
    nombre_fantasia: "",
    direccion: "",
    ciudad: "",
    pais: "",
    telefono: "",
    email: "",
    contacto_principal: "",
    telefono_contacto: "",
    email_contacto: "",
    estado: "activo",
    observaciones: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores al editar
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar errores al editar
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.razon_social?.trim()) {
      errors.razon_social = "La razón social es obligatoria";
    }
    
    if (!formData.rut?.trim()) {
      errors.rut = "El RUT es obligatorio";
    } else if (!/^[0-9]{1,8}-[0-9kK]{1}$/.test(formData.rut)) {
      errors.rut = "Formato RUT inválido (ej: 12345678-9)";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "El formato del email no es válido";
    }
    
    if (formData.email_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contacto)) {
      errors.email_contacto = "El formato del email de contacto no es válido";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      // Convertir razón social a mayúsculas antes de guardar
      const clienteData = {
        ...formData,
        razon_social: formData.razon_social.toUpperCase()
      };
      
      await onSave(clienteData);
      handleReset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar cliente:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      razon_social: "",
      rut: "",
      nombre_fantasia: "",
      direccion: "",
      ciudad: "",
      pais: "",
      telefono: "",
      email: "",
      contacto_principal: "",
      telefono_contacto: "",
      email_contacto: "",
      estado: "activo",
      observaciones: "",
    });
    setValidationErrors({});
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) handleReset();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Razón Social */}
            <div className="space-y-2">
              <Label htmlFor="razon_social" className="flex items-center gap-1">
                Razón Social
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="razon_social"
                name="razon_social"
                value={formData.razon_social}
                onChange={handleInputChange}
                className={validationErrors.razon_social ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {validationErrors.razon_social && (
                <p className="text-destructive text-xs">{validationErrors.razon_social}</p>
              )}
            </div>

            {/* RUT */}
            <div className="space-y-2">
              <Label htmlFor="rut" className="flex items-center gap-1">
                RUT
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rut"
                name="rut"
                placeholder="12345678-9"
                value={formData.rut || ""}
                onChange={handleInputChange}
                className={validationErrors.rut ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {validationErrors.rut && (
                <p className="text-destructive text-xs">{validationErrors.rut}</p>
              )}
            </div>

            {/* Nombre Fantasía */}
            <div className="space-y-2">
              <Label htmlFor="nombre_fantasia">Nombre Fantasía</Label>
              <Input
                id="nombre_fantasia"
                name="nombre_fantasia"
                value={formData.nombre_fantasia || ""}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado || "activo"}
                onValueChange={(value) => handleSelectChange("estado", value)}
                disabled={isLoading}
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

          <div className="grid gap-4 md:grid-cols-2">
            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                value={formData.direccion || ""}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                name="ciudad"
                value={formData.ciudad || ""}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            {/* País */}
            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                name="pais"
                value={formData.pais || ""}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono || ""}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                className={validationErrors.email ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {validationErrors.email && (
                <p className="text-destructive text-xs">{validationErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Contacto Principal */}
            <div className="space-y-2">
              <Label htmlFor="contacto_principal">Contacto Principal</Label>
              <Input
                id="contacto_principal"
                name="contacto_principal"
                value={formData.contacto_principal || ""}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            {/* Teléfono de Contacto */}
            <div className="space-y-2">
              <Label htmlFor="telefono_contacto">Teléfono de Contacto</Label>
              <Input
                id="telefono_contacto"
                name="telefono_contacto"
                value={formData.telefono_contacto || ""}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            {/* Email de Contacto */}
            <div className="space-y-2">
              <Label htmlFor="email_contacto">Email de Contacto</Label>
              <Input
                id="email_contacto"
                name="email_contacto"
                type="email"
                value={formData.email_contacto || ""}
                onChange={handleInputChange}
                className={validationErrors.email_contacto ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {validationErrors.email_contacto && (
                <p className="text-destructive text-xs">{validationErrors.email_contacto}</p>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones || ""}
              onChange={handleInputChange}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 