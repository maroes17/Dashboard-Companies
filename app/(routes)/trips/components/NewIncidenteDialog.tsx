import { useState, useRef, useEffect } from "react";
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
import { Loader2, ImagePlus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface NewIncidenteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viajeId: number;
  onIncidenteCreated: () => Promise<void>;
}

export function NewIncidenteDialog({
  open,
  onOpenChange,
  viajeId,
  onIncidenteCreated,
}: NewIncidenteDialogProps) {
  const { toast } = useToast();
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<IncidenteViaje>>({
    id_viaje: viajeId,
    tipo_incidente: "mecanico",
    descripcion: "",
    estado: "reportado",
    fecha_inicio: new Date().toISOString(),
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resetear cuando cambia el incidente o se abre el diálogo
  useEffect(() => {
    if (open) {
      setFormData({
        id_viaje: viajeId,
        tipo_incidente: "mecanico",
        descripcion: "",
        estado: "reportado",
        fecha_inicio: new Date().toISOString(),
      });
      setValidationErrors({});
      setPhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open, viajeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.tipo_incidente) {
      errors.tipo_incidente = "El tipo de incidente es obligatorio";
    }
    
    if (!formData.descripcion || formData.descripcion.trim() === "") {
      errors.descripcion = "La descripción es obligatoria";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadPhoto = async (incidenteId: number): Promise<string | null> => {
    if (!photo) return null;
    
    try {
      // Verificar el tipo y tamaño del archivo primero
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (photo.size > maxSize) {
        throw new Error('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(photo.type)) {
        throw new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG y GIF.');
      }

      const fileExt = photo.name.split('.').pop();
      const fileName = `incidente_${incidenteId}_${Date.now()}.${fileExt}`;
      
      // Intentar subir el archivo directamente
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('incidentes')
        .upload(fileName, photo, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error al subir archivo:', uploadError);
        if (uploadError.message.includes('bucket')) {
          throw new Error('El bucket "incidentes" no existe o no tienes permisos. Por favor, verifica la configuración en Supabase.');
        }
        throw new Error(`Error al subir archivo: ${uploadError.message}`);
      }

      if (!uploadData) {
        throw new Error('No se recibió confirmación de la subida');
      }
      
      // Obtener la URL pública
      const { data: urlData } = await supabase.storage
        .from('incidentes')
        .getPublicUrl(fileName);
      
      if (!urlData?.publicUrl) {
        throw new Error('No se pudo obtener la URL pública del archivo');
      }

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error al subir foto:', error);
      
      toast({
        title: "Error al subir foto",
        description: error.message || "No se pudo subir la fotografía del incidente.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      console.log('Creando incidente con datos:', formData);
      
      // Insertar el incidente en la base de datos
      const { data: incidenteData, error: incidenteError } = await supabase
        .from('incidentes_viaje')
        .insert([formData])
        .select()
        .single();
      
      if (incidenteError) {
        console.error('Error al crear incidente:', incidenteError);
        throw incidenteError;
      }
      
      console.log('Incidente creado:', incidenteData);
      
      if (incidenteData) {
        // Si hay una foto, subirla
        if (photo) {
          const photoUrl = await uploadPhoto(incidenteData.id_incidente);
          
          if (photoUrl) {
            // Actualizar el incidente con la URL de la foto
            const { error: updateError } = await supabase
              .from('incidentes_viaje')
              .update({ url_foto: photoUrl })
              .eq('id_incidente', incidenteData.id_incidente);
              
            if (updateError) {
              console.error('Error al actualizar URL de foto:', updateError);
            }
          }
        }
        
        // Actualizar el estado del viaje a "incidente"
        const { error: viajeError } = await supabase
          .from('viajes')
          .update({ estado: 'incidente' })
          .eq('id_viaje', viajeId);
          
        if (viajeError) {
          console.error('Error al actualizar estado del viaje:', viajeError);
        }
        
        toast({
          title: "Incidente registrado",
          description: "El incidente ha sido registrado correctamente.",
        });
        
        // Cerrar el diálogo y limpiar el formulario
        handleReset();
        onOpenChange(false);
        await onIncidenteCreated();
      }
    } catch (error: any) {
      console.error("Error al registrar incidente:", error);
      toast({
        title: "Error al registrar",
        description: error.message || "Ocurrió un error al registrar el incidente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      id_viaje: viajeId,
      tipo_incidente: "mecanico",
      descripcion: "",
      estado: "reportado",
      fecha_inicio: new Date().toISOString(),
    });
    setValidationErrors({});
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) handleReset();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Registrar Incidente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Incidente */}
          <div className="space-y-2">
            <Label htmlFor="tipo_incidente">
              Tipo de Incidente
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={formData.tipo_incidente}
              onValueChange={(value) => handleSelectChange('tipo_incidente', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de incidente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mecanico">Mecánico</SelectItem>
                <SelectItem value="trafico">Tráfico</SelectItem>
                <SelectItem value="climatico">Climático</SelectItem>
                <SelectItem value="seguridad">Seguridad</SelectItem>
                <SelectItem value="documentacion">Documentación</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.tipo_incidente && (
              <p className="text-sm text-destructive">{validationErrors.tipo_incidente}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">
              Descripción
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion || ""}
              onChange={handleInputChange}
              placeholder="Detalles del incidente..."
              rows={4}
              disabled={isLoading}
            />
            {validationErrors.descripcion && (
              <p className="text-sm text-destructive">{validationErrors.descripcion}</p>
            )}
          </div>

          {/* Foto */}
          <div className="space-y-2">
            <Label htmlFor="photo">Fotografía</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {photo ? "Cambiar foto" : "Agregar foto"}
              </Button>
              {photo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearPhoto}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </div>
            
            {photoPreview && (
              <div className="mt-2 relative">
                <img
                  src={photoPreview}
                  alt="Vista previa"
                  className="max-h-[200px] rounded-md border"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
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
              Registrar Incidente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 