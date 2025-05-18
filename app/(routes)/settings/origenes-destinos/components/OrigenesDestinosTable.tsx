import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface OrigenDestino {
  id_origen_destino: number;
  nombre: string;
  ciudad: string;
  pais: string;
  tipo: 'origen' | 'destino' | 'ambos';
  activo: boolean;
}

export function OrigenesDestinosTable() {
  const { toast } = useToast();
  const [origenesDestinos, setOrigenesDestinos] = useState<OrigenDestino[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrigenDestino | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ciudad: '',
    pais: '',
    tipo: 'origen' as 'origen' | 'destino' | 'ambos',
  });

  useEffect(() => {
    fetchOrigenesDestinos();
  }, []);

  const fetchOrigenesDestinos = async () => {
    try {
      const { data, error } = await supabase
        .from('origenes_destinos')
        .select('*')
        .order('pais', { ascending: true })
        .order('ciudad', { ascending: true });

      if (error) throw error;
      setOrigenesDestinos(data || []);
    } catch (error) {
      console.error('Error al cargar orígenes y destinos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los orígenes y destinos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('origenes_destinos')
          .update(formData)
          .eq('id_origen_destino', editingItem.id_origen_destino);

        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Origen/Destino actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from('origenes_destinos')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Origen/Destino creado correctamente",
        });
      }

      setIsDialogOpen(false);
      fetchOrigenesDestinos();
    } catch (error) {
      console.error('Error al guardar origen/destino:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el origen/destino",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;

    try {
      const { error } = await supabase
        .from('origenes_destinos')
        .delete()
        .eq('id_origen_destino', id);

      if (error) throw error;
      toast({
        title: "Éxito",
        description: "Origen/Destino eliminado correctamente",
      });
      fetchOrigenesDestinos();
    } catch (error) {
      console.error('Error al eliminar origen/destino:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el origen/destino",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: OrigenDestino) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      ciudad: item.ciudad,
      pais: item.pais,
      tipo: item.tipo,
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormData({
      nombre: '',
      ciudad: '',
      pais: '',
      tipo: 'origen',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Origen/Destino
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : origenesDestinos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No hay orígenes o destinos registrados
                </TableCell>
              </TableRow>
            ) : (
              origenesDestinos.map((item) => (
                <TableRow key={item.id_origen_destino}>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>{item.ciudad}</TableCell>
                  <TableCell>{item.pais}</TableCell>
                  <TableCell className="capitalize">{item.tipo}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id_origen_destino)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Nuevo'} Origen/Destino
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>Nombre</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label>Ciudad</label>
              <Input
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label>País</label>
              <Input
                value={formData.pais}
                onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label>Tipo</label>
              <Select
                value={formData.tipo}
                onValueChange={(value: 'origen' | 'destino' | 'ambos') =>
                  setFormData({ ...formData, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="origen">Origen</SelectItem>
                  <SelectItem value="destino">Destino</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 