import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface ProductDeliveryOption {
  id: number;
  productId: number;
  name: string;
  daysToDeliver: number;
  pricePerM2: string | number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductDeliveryManagerProps {
  productId: number;
}

export function ProductDeliveryManager({ productId }: ProductDeliveryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<ProductDeliveryOption | null>(null);
  const [formData, setFormData] = useState({ name: '', daysToDeliver: '', pricePerM2: '' });

  const utils = trpc.useUtils();
  const { data: options = [], isLoading } = trpc.deliveryOptions.getByProduct.useQuery({ productId });
  const createMutation = trpc.deliveryOptions.create.useMutation();
  const updateMutation = trpc.deliveryOptions.update.useMutation();
  const deleteMutation = trpc.deliveryOptions.delete.useMutation();
  const reorderMutation = trpc.deliveryOptions.reorder.useMutation();

  const handleAddClick = () => {
    setEditingOption(null);
    setFormData({ name: '', daysToDeliver: '', pricePerM2: '' });
    setIsOpen(true);
  };

  const handleEditClick = (option: ProductDeliveryOption) => {
    setEditingOption(option);
    setFormData({
      name: option.name,
      daysToDeliver: option.daysToDeliver.toString(),
      pricePerM2: option.pricePerM2.toString(),
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do prazo é obrigatório');
      return;
    }
    if (!formData.daysToDeliver || parseInt(formData.daysToDeliver) < 0) {
      toast.error('Dias úteis deve ser um número válido');
      return;
    }
    if (!formData.pricePerM2 || parseFloat(formData.pricePerM2) < 0) {
      toast.error('Preço por m² deve ser um número válido');
      return;
    }

    try {
      if (editingOption) {
        await updateMutation.mutateAsync({
          id: editingOption.id,
          name: formData.name,
          daysToDeliver: parseInt(formData.daysToDeliver),
          pricePerM2: parseFloat(formData.pricePerM2),
        });
        toast.success('Prazo atualizado com sucesso!');
      } else {
        await createMutation.mutateAsync({
          productId,
          name: formData.name,
          daysToDeliver: parseInt(formData.daysToDeliver),
          pricePerM2: parseFloat(formData.pricePerM2),
        });
        toast.success('Prazo adicionado com sucesso!');
      }
      setIsOpen(false);
      await utils.deliveryOptions.getByProduct.invalidate({ productId });
    } catch (error) {
      toast.error('Erro ao salvar prazo');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este prazo?')) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success('Prazo deletado com sucesso!');
      await utils.deliveryOptions.getByProduct.invalidate({ productId });
    } catch (error) {
      toast.error('Erro ao deletar prazo');
      console.error(error);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === options.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newOrder = [...options];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

    try {
      await reorderMutation.mutateAsync({
        updates: newOrder.map((opt, i) => ({
          id: opt.id,
          order: i,
        })),
      });
      await utils.deliveryOptions.getByProduct.invalidate({ productId });
      toast.success('Ordem atualizada!');
    } catch (error) {
      toast.error('Erro ao reordenar prazos');
      console.error(error);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Prazos de Produção</CardTitle>
          <CardDescription>Gerencie os prazos de entrega e preços adicionais</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Prazo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOption ? 'Editar Prazo' : 'Novo Prazo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Prazo</Label>
                <Input
                  id="name"
                  placeholder="Ex: Prazo Normal, 24 Horas, Mesmo Dia"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="days">Dias Úteis</Label>
                <Input
                  id="days"
                  type="number"
                  placeholder="Ex: 5"
                  value={formData.daysToDeliver}
                  onChange={(e) => setFormData({ ...formData, daysToDeliver: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price">Preço Adicional por m²</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 10.00"
                  value={formData.pricePerM2}
                  onChange={(e) => setFormData({ ...formData, pricePerM2: e.target.value })}
                />
              </div>
              <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700">
                {editingOption ? 'Atualizar' : 'Criar'} Prazo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500">Carregando prazos...</p>
        ) : options.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhum prazo cadastrado. Clique em "Novo Prazo" para adicionar.</p>
        ) : (
          <div className="space-y-3">
            {options.map((option: ProductDeliveryOption, index: number) => (
              <div key={option.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{option.name}</h3>
                    <p className="text-sm text-gray-600">
                      {option.daysToDeliver} dias úteis • R$ {parseFloat(option.pricePerM2.toString()).toFixed(2)}/m²
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReorder(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-600 hover:bg-gray-100"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReorder(index, 'down')}
                      disabled={index === options.length - 1}
                      className="text-gray-600 hover:bg-gray-100"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(option)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(option.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
