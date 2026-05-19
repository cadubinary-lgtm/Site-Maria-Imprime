import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductDeliveryManager } from './ProductDeliveryManager';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  segment: string;
  imageUrl: string | null;
}

interface AdminEditProductProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminEditProduct({ product, isOpen, onClose }: AdminEditProductProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    segment: product?.segment || '',
  });

  const updateMutation = trpc.admin.updateProduct.useMutation();

  const handleSave = async () => {
    if (!product) return;

    try {
      await updateMutation.mutateAsync({
        id: product.id,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        segment: formData.segment as any,
      });
      toast.success('Produto atualizado com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao atualizar produto');
      console.error(error);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produto: {product.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="prazos">Prazos de Produção</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="segment">Segmento</Label>
                <Input
                  id="segment"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                Salvar Alterações
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="prazos">
            <ProductDeliveryManager productId={product.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
