import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GripVertical, Trash2, Edit2, Plus } from "lucide-react";

export interface DeliveryOptionForCreation {
  id: string; // Temporário (uuid ou timestamp)
  name: string;
  daysToDeliver: number;
  pricePerM2: number;
  isActive: boolean;
  order: number;
}

interface DeliveryOptionsCreatorProps {
  options: DeliveryOptionForCreation[];
  onOptionsChange: (options: DeliveryOptionForCreation[]) => void;
  calculationType?: string;
}

export function DeliveryOptionsCreator({
  options,
  onOptionsChange,
  calculationType,
}: DeliveryOptionsCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    daysToDeliver: 5,
    pricePerM2: 0,
    isActive: true,
  });

  const handleAddOption = () => {
    if (!formData.name.trim()) {
      alert("Nome do prazo é obrigatório");
      return;
    }

    if (editingId) {
      // Editar
      const updated = options.map((opt) =>
        opt.id === editingId
          ? { ...opt, ...formData }
          : opt
      );
      onOptionsChange(updated);
      setEditingId(null);
    } else {
      // Criar novo
      const newOption: DeliveryOptionForCreation = {
        id: `temp-${Date.now()}-${Math.random()}`,
        ...formData,
        order: options.length,
      };
      onOptionsChange([...options, newOption]);
    }

    setFormData({
      name: "",
      daysToDeliver: 5,
      pricePerM2: 0,
      isActive: true,
    });
    setIsOpen(false);
  };

  const handleEditOption = (option: DeliveryOptionForCreation) => {
    setEditingId(option.id);
    setFormData({
      name: option.name,
      daysToDeliver: option.daysToDeliver,
      pricePerM2: option.pricePerM2,
      isActive: option.isActive,
    });
    setIsOpen(true);
  };

  const handleDeleteOption = (id: string) => {
    if (confirm("Tem certeza que deseja remover este prazo?")) {
      onOptionsChange(options.filter((opt) => opt.id !== id));
    }
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updated = [...options];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    updated.forEach((opt, idx) => {
      opt.order = idx;
    });
    onOptionsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-bold">Prazos de Produção</Label>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: "",
                  daysToDeliver: 5,
                  pricePerM2: 0,
                  isActive: true,
                });
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo Prazo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Prazo" : "Novo Prazo"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Prazo Normal"
                />
              </div>
              <div>
                <Label htmlFor="days">Dias Úteis *</Label>
                <Input
                  id="days"
                  type="number"
                  value={formData.daysToDeliver}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daysToDeliver: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="price">Valor Adicional por m² (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.pricePerM2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricePerM2: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="active">Ativo</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddOption}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {options.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
          <p className="text-gray-500 text-sm">
            Nenhum prazo configurado. Clique em "Novo Prazo" para adicionar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => (
            <Card key={option.id} className="p-3">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{option.name}</p>
                  <p className="text-xs text-gray-600">
                    {option.daysToDeliver} dias úteis • R$ {option.pricePerM2.toFixed(2)}/m²
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditOption(option)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteOption(option.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
