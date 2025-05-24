"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Fleet } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EditVehicleDialogProps {
  vehicle: Fleet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vehicle: Fleet) => void;
}

// Definir las opciones dependientes
const vehicleOptions = {
  tipos: ["Camión", "Camioneta"],
  categorias: ["Camión Rígido", "Camión Articulado"],
  subcategorias: ["Camión Rígido", "Tractocamión", "Camión con Remolque"],
  marcasPorTipo: {
    "Camión": ["Freightliner", "International", "Kenworth", "Mack Trucks"],
    "Camioneta": ["Pegeout"]
  },
  modelosPorMarca: {
    "Freightliner": ["CASC 125", "Agrosy"],
    "International": ["7600", "9800", "9200", "Prostar"],
    "Kenworth": ["T800"],
    "Mack Trucks": ["CXU613E"],
    "Pegeout": ["v700 city", "v1000"]
  }
};

export function EditVehicleDialog({ vehicle, open, onOpenChange, onSave }: EditVehicleDialogProps) {
  const [formData, setFormData] = useState({
    tipo: "",
    categoria: "",
    subcategoria: "",
    patente: "",
    nro_chasis: "",
    marca: "",
    modelo: "",
    anio: "",
    capacidad: "",
    estado: "activo" as "activo" | "inactivo" | "mantenimiento" | "en_reparacion" | "dado_de_baja",
    fecha_ingreso: "",
    km_actual: "",
    km_ultimo_servicio: "",
    km_proximo_servicio: "",
    fecha_ultima_mantencion: "",
    fecha_proximo_mantenimiento: "",
    vencimiento_revision_tecnica: "",
    vencimiento_permiso_circulacion: "",
    vencimiento_seguro: "",
    consumo_promedio: "",
    origen: "",
    observaciones: "",
  });

  // Estado para las opciones disponibles dependientes
  const [availableMarcas, setAvailableMarcas] = useState<string[]>([]);
  const [availableModelos, setAvailableModelos] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar los datos del vehículo cuando cambie o se abra el diálogo
  useEffect(() => {
    if (vehicle && open) {
      setFormData({
        tipo: vehicle.tipo,
        categoria: vehicle.categoria || "",
        subcategoria: vehicle.subcategoria || "",
        patente: vehicle.patente,
        nro_chasis: vehicle.nro_chasis || "",
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        anio: vehicle.anio ? vehicle.anio.toString() : "",
        capacidad: vehicle.capacidad || "",
        estado: vehicle.estado,
        fecha_ingreso: vehicle.fecha_ingreso || "",
        km_actual: vehicle.km_actual ? vehicle.km_actual.toString() : "",
        km_ultimo_servicio: vehicle.km_ultimo_servicio ? vehicle.km_ultimo_servicio.toString() : "",
        km_proximo_servicio: vehicle.km_proximo_servicio ? vehicle.km_proximo_servicio.toString() : "",
        fecha_ultima_mantencion: vehicle.fecha_ultima_mantencion || "",
        fecha_proximo_mantenimiento: vehicle.fecha_proximo_mantenimiento || "",
        vencimiento_revision_tecnica: vehicle.vencimiento_revision_tecnica || "",
        vencimiento_permiso_circulacion: vehicle.vencimiento_permiso_circulacion || "",
        vencimiento_seguro: vehicle.vencimiento_seguro || "",
        consumo_promedio: vehicle.consumo_promedio ? vehicle.consumo_promedio.toString() : "",
        origen: vehicle.origen || "",
        observaciones: vehicle.observaciones || "",
      });
      setErrors({});
    }
  }, [vehicle, open]);

  // Actualizar marcas disponibles cuando cambia el tipo
  useEffect(() => {
    if (formData.tipo) {
      const marcas = vehicleOptions.marcasPorTipo[formData.tipo as keyof typeof vehicleOptions.marcasPorTipo] || [];
      setAvailableMarcas(marcas);
    } else {
      setAvailableMarcas([]);
    }
  }, [formData.tipo]);

  // Actualizar modelos disponibles cuando cambia la marca
  useEffect(() => {
    if (formData.marca) {
      const modelos = vehicleOptions.modelosPorMarca[formData.marca as keyof typeof vehicleOptions.modelosPorMarca] || [];
      setAvailableModelos(modelos);
    } else {
      setAvailableModelos([]);
    }
  }, [formData.marca]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validar campos obligatorios
    if (!formData.patente.trim()) {
      newErrors.patente = "La patente es obligatoria";
    }
    
    if (!formData.marca.trim()) {
      newErrors.marca = "La marca es obligatoria";
    }
    
    if (!formData.modelo.trim()) {
      newErrors.modelo = "El modelo es obligatorio";
    }
    
    if (!formData.tipo.trim()) {
      newErrors.tipo = "El tipo de vehículo es obligatorio";
    }
    
    if (!formData.estado) {
      newErrors.estado = "El estado es obligatorio";
    }
    
    // Validación para campos numéricos
    if (formData.anio.trim() && isNaN(Number(formData.anio))) {
      newErrors.anio = "El año debe ser un número";
    }
    
    if (formData.km_actual.trim() && isNaN(Number(formData.km_actual))) {
      newErrors.km_actual = "El kilometraje actual debe ser un número";
    }
    
    if (formData.km_ultimo_servicio.trim() && isNaN(Number(formData.km_ultimo_servicio))) {
      newErrors.km_ultimo_servicio = "El kilometraje del último servicio debe ser un número";
    }
    
    if (formData.km_proximo_servicio.trim() && isNaN(Number(formData.km_proximo_servicio))) {
      newErrors.km_proximo_servicio = "El kilometraje del próximo servicio debe ser un número";
    }
    
    if (formData.consumo_promedio.trim() && isNaN(Number(formData.consumo_promedio))) {
      newErrors.consumo_promedio = "El consumo promedio debe ser un número";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicle) return;
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }
    
    // Crear objeto actualizado manteniendo id y creado_en originales
    const updatedVehicle: Fleet = {
      id_flota: vehicle.id_flota,
      patente: formData.patente,
      marca: formData.marca,
      modelo: formData.modelo,
      tipo: formData.tipo,
      categoria: formData.categoria || undefined,
      subcategoria: formData.subcategoria || undefined,
      nro_chasis: formData.nro_chasis || undefined,
      anio: formData.anio ? Number(formData.anio) : undefined,
      capacidad: formData.capacidad || undefined,
      estado: formData.estado,
      fecha_ingreso: formData.fecha_ingreso,
      km_actual: formData.km_actual ? Number(formData.km_actual) : undefined,
      km_ultimo_servicio: formData.km_ultimo_servicio ? Number(formData.km_ultimo_servicio) : undefined,
      km_proximo_servicio: formData.km_proximo_servicio ? Number(formData.km_proximo_servicio) : undefined,
      fecha_ultima_mantencion: formData.fecha_ultima_mantencion || undefined,
      fecha_proximo_mantenimiento: formData.fecha_proximo_mantenimiento || undefined,
      vencimiento_revision_tecnica: formData.vencimiento_revision_tecnica || undefined,
      vencimiento_permiso_circulacion: formData.vencimiento_permiso_circulacion || undefined,
      vencimiento_seguro: formData.vencimiento_seguro || undefined,
      consumo_promedio: formData.consumo_promedio ? Number(formData.consumo_promedio) : undefined,
      origen: formData.origen || undefined,
      observaciones: formData.observaciones || undefined,
      creado_en: vehicle.creado_en,
      actualizado_en: new Date().toISOString()
    };
    
    onSave(updatedVehicle);
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Vehículo</DialogTitle>
            <DialogDescription>
              Modifica la información del vehículo {vehicle.patente}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Sección: Información principal */}
            <h3 className="text-lg font-medium border-b pb-2">Información Principal</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo" className="flex items-center">
                  Tipo <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(value) => handleSelectChange("tipo", value)}
                >
                  <SelectTrigger 
                    id="tipo"
                    className={errors.tipo ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleOptions.tipos.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipo && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.tipo}
                  </div>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="patente" className="flex items-center">
                  Patente <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="patente"
                  name="patente"
                  value={formData.patente}
                  onChange={handleChange}
                  className={errors.patente ? "border-red-500" : ""}
                />
                {errors.patente && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.patente}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="marca" className="flex items-center">
                  Marca <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select 
                  value={formData.marca} 
                  onValueChange={(value) => handleSelectChange("marca", value)}
                  disabled={!formData.tipo}
                >
                  <SelectTrigger 
                    id="marca"
                    className={errors.marca ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMarcas.map(marca => (
                      <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.marca && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.marca}
                  </div>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="modelo" className="flex items-center">
                  Modelo <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select 
                  value={formData.modelo} 
                  onValueChange={(value) => handleSelectChange("modelo", value)}
                  disabled={!formData.marca}
                >
                  <SelectTrigger 
                    id="modelo"
                    className={errors.modelo ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Seleccionar modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModelos.map(modelo => (
                      <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.modelo && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.modelo}
                  </div>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="anio">
                  Año
                </Label>
                <Input
                  id="anio"
                  name="anio"
                  value={formData.anio}
                  onChange={handleChange}
                  className={errors.anio ? "border-red-500" : ""}
                />
                {errors.anio && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.anio}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nro_chasis">
                  Número de Chasis
                </Label>
                <Input
                  id="nro_chasis"
                  name="nro_chasis"
                  value={formData.nro_chasis}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="categoria">
                  Categoría
                </Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value) => handleSelectChange("categoria", value)}
                >
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleOptions.categorias.map(categoria => (
                      <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="subcategoria">
                  Subcategoría
                </Label>
                <Select 
                  value={formData.subcategoria} 
                  onValueChange={(value) => handleSelectChange("subcategoria", value)}
                >
                  <SelectTrigger id="subcategoria">
                    <SelectValue placeholder="Seleccionar subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleOptions.subcategorias.map(subcategoria => (
                      <SelectItem key={subcategoria} value={subcategoria}>{subcategoria}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="capacidad">
                  Capacidad
                </Label>
                <Input
                  id="capacidad"
                  name="capacidad"
                  value={formData.capacidad}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="origen">
                  Origen
                </Label>
                <Input
                  id="origen"
                  name="origen"
                  value={formData.origen}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="estado" className="flex items-center">
                  Estado <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value) => handleSelectChange("estado", value as any)}
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
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="en_reparacion">En Reparación</SelectItem>
                    <SelectItem value="dado_de_baja">Dado de Baja</SelectItem>
                  </SelectContent>
                </Select>
                {errors.estado && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.estado}
                  </div>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="fecha_ingreso">
                  Fecha de Ingreso
                </Label>
                <Input
                  id="fecha_ingreso"
                  name="fecha_ingreso"
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            {/* Sección: Kilometraje y mantenimiento */}
            <h3 className="text-lg font-medium border-b pb-2 mt-4">Kilometraje y Mantenimiento</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="km_actual">
                  Kilometraje Actual
                </Label>
                <Input
                  id="km_actual"
                  name="km_actual"
                  value={formData.km_actual}
                  onChange={handleChange}
                  className={errors.km_actual ? "border-red-500" : ""}
                />
                {errors.km_actual && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.km_actual}
                  </div>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="km_ultimo_servicio">
                  Km Último Servicio
                </Label>
                <Input
                  id="km_ultimo_servicio"
                  name="km_ultimo_servicio"
                  value={formData.km_ultimo_servicio}
                  onChange={handleChange}
                  className={errors.km_ultimo_servicio ? "border-red-500" : ""}
                />
                {errors.km_ultimo_servicio && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.km_ultimo_servicio}
                  </div>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="km_proximo_servicio">
                  Km Próximo Servicio
                </Label>
                <Input
                  id="km_proximo_servicio"
                  name="km_proximo_servicio"
                  value={formData.km_proximo_servicio}
                  onChange={handleChange}
                  className={errors.km_proximo_servicio ? "border-red-500" : ""}
                />
                {errors.km_proximo_servicio && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.km_proximo_servicio}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha_ultima_mantencion">
                  Fecha Última Mantención
                </Label>
                <Input
                  id="fecha_ultima_mantencion"
                  name="fecha_ultima_mantencion"
                  type="date"
                  value={formData.fecha_ultima_mantencion}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="fecha_proximo_mantenimiento">
                  Fecha Próximo Mantenimiento
                </Label>
                <Input
                  id="fecha_proximo_mantenimiento"
                  name="fecha_proximo_mantenimiento"
                  type="date"
                  value={formData.fecha_proximo_mantenimiento}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="consumo_promedio">
                  Consumo Promedio (km/l)
                </Label>
                <Input
                  id="consumo_promedio"
                  name="consumo_promedio"
                  value={formData.consumo_promedio}
                  onChange={handleChange}
                  className={errors.consumo_promedio ? "border-red-500" : ""}
                />
                {errors.consumo_promedio && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.consumo_promedio}
                  </div>
                )}
              </div>
            </div>
            
            {/* Sección: Documentos */}
            <h3 className="text-lg font-medium border-b pb-2 mt-4">Documentos</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vencimiento_revision_tecnica">
                  Vencimiento Revisión Técnica
                </Label>
                <Input
                  id="vencimiento_revision_tecnica"
                  name="vencimiento_revision_tecnica"
                  type="date"
                  value={formData.vencimiento_revision_tecnica}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="vencimiento_permiso_circulacion">
                  Vencimiento Permiso Circulación
                </Label>
                <Input
                  id="vencimiento_permiso_circulacion"
                  name="vencimiento_permiso_circulacion"
                  type="date"
                  value={formData.vencimiento_permiso_circulacion}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="vencimiento_seguro">
                  Vencimiento Seguro
                </Label>
                <Input
                  id="vencimiento_seguro"
                  name="vencimiento_seguro"
                  type="date"
                  value={formData.vencimiento_seguro}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            {/* Sección: Observaciones */}
            <div className="grid grid-cols-1 gap-2 mt-4">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 