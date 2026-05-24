import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { GripVertical, Trash2, Edit2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface DeliveryOption {
  id: number;
  productId: number;
  name: string;
  daysToDeliver: number;
  pricePerM2: number;
  isActive: boolean;
  order: number;
}

interface DeliveryOptionsManagerProps {
  productId: number;
  calculationType?: string;
}

export function DeliveryOptionsManager({ productId, calculationType }: DeliveryOptionsManagerProps) {

  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    daysToDeliver: 5,
    pricePerM2: 0,
    isActive: true,
  });

  // Buscar prazos
  const { data: deliveryOptions, isLoading } = trpc.deliveryOptions.getByProduct.useQuery(
    { productId },
    { enabled: calculationType === "m2" }
  );

  useEffect(() => {
    if (deliveryOptions) {
      setOptions(deliveryOptions as DeliveryOption[]);
    }
  }, [deliveryOptions]);

  // Criar prazo
  const createMutation = trpc.deliveryOptions.create.useMutation({
    onSuccess: () => {
      alert("Prazo criado com sucesso!");
      setFormData({ name: "", daysToDeliver: 5, pricePerM2: 0, isActive: true });
      setIsOpen(false);
      // Recarregar
      const newOption = {
        id: Date.now(),
        productId,
        ...formData,
        order: options.length,
      };
      setOptions([...options, newOption]);
    },
    onError: (error) => {
      alert(`Erro ao criar prazo: ${error.message}`);
    },
  });

  // Atualizar prazo
  const updateMutation = trpc.deliveryOptions.update.useMutation({
    onSuccess: () => {
      alert("Prazo atualizado com sucesso!");
      setEditingId(null);
      setFormData({ name: "", daysToDeliver: 5, pricePerM2: 0, isActive: true });
      setIsOpen(false);
    },
    onError: (error) => {
      alert(`Erro ao atualizar prazo: ${error.message}`);
    },
  });

  // Deletar prazo
  const deleteMutation = trpc.deliveryOptions.delete.useMutation({
    onSuccess: () => {
      alert("Prazo deletado com sucesso!");
      setOptions(options.filter(o => o.id !== editingId));
    },
    onError: (error) => {
      alert(`Erro ao deletar prazo: ${error.message}`);
    },
  });

  // Reordenar prazos
  const reorderMutation = trpc.deliveryOptions.reorder.useMutation({
    onError: (error) => {
      alert(`Erro ao reordenar: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
      });
    } else {
      createMutation.mutate({
        productId,
        ...formData,
        order: options.length,
      });
    }
  };

  const handleEdit = (option: DeliveryOption) => {
    setEditingId(option.id);
    setFormData({
      name: option.name,
      daysToDeliver: option.daysToDeliver,
      pricePerM2: option.pricePerM2,
      isActive: option.isActive,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este prazo?")) {
      deleteMutation.mutate({ id });
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index - 1]] = [newOptions[index - 1], newOptions[index]];
    setOptions(newOptions);
    reorderMutation.mutate({
      updates: newOptions.map((opt, idx) => ({ id: opt.id, order: idx })),
    });
  };

  const moveDown = (index: number) => {
    if (index === options.length - 1) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    setOptions(newOptions);
    reorderMutation.mutate({
      updates: newOptions.map((opt, idx) => ({ id: opt.id, order: idx })),
    });
  };

  // Mostrar apenas se for m²
  if (calculationType !== "m2") {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Prazos de Produção</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", daysToDeliver: 5, pricePerM2: 0, isActive: true });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Prazo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Prazo" : "Novo Prazo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Prazo</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Normal, 24 Horas, Mesmo Dia"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Dias Úteis</label>
                <Input
                  type="number"
                  value={formData.daysToDeliver}
                  onChange={(e) => setFormData({ ...formData, daysToDeliver: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Valor Adicional por m²</label>
                <Input
                  type="number"
                  value={formData.pricePerM2}
                  onChange={(e) => setFormData({ ...formData, pricePerM2: parseFloat(e.target.value) })}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <label className="text-sm font-medium">Ativo</label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-gray-500">Carregando prazos...</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum prazo configurado. Clique em "Novo Prazo" para adicionar.</p>
        ) : (
          <div className="space-y-2">
            {options.map((option, index) => (
              <div
                key={option.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                <div className="flex-1">
                  <div className="font-medium">{option.name}</div>
                  <div className="text-sm text-gray-600">
                    {option.daysToDeliver} dias úteis • R$ {option.pricePerM2.toFixed(2)}/m²
                    {!option.isActive && " • Inativo"}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveDown(index)}
                    disabled={index === options.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(option)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(option.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
