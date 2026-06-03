'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

interface ProductLogisticsTabProps {
  productId: number;
}

export function ProductLogisticsTab({ productId }: ProductLogisticsTabProps) {
  const { data: product, isLoading: productLoading } = trpc.products.getById.useQuery({ id: productId });
  const { data: carriers, isLoading: carriersLoading } = trpc.logistics.carriers.list.useQuery();
  
  const [weight, setWeight] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [length, setLength] = useState('');
  const [selectedCarriers, setSelectedCarriers] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const updateProductMutation = trpc.admin.updateProduct.useMutation();

  // Sincronizar dados do produto
  useEffect(() => {
    if (product) {
      setWeight((product as any).weight?.toString() || '');
      setWidth((product as any).width?.toString() || '');
      setHeight((product as any).height?.toString() || '');
      setLength((product as any).length?.toString() || '');
      setSelectedCarriers((product as any).allowedCarrierIds || []);
    }
  }, [product]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProductMutation.mutateAsync({
        id: productId,
        weight: weight ? parseFloat(weight) : undefined,
        width: width ? parseFloat(width) : undefined,
        height: height ? parseFloat(height) : undefined,
        length: length ? parseFloat(length) : undefined,
        allowedCarrierIds: selectedCarriers,
      } as any);
      toast.success('Informações logísticas salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar informações logísticas');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCarrierToggle = (carrierId: number) => {
    setSelectedCarriers((prev) =>
      prev.includes(carrierId)
        ? prev.filter((id) => id !== carrierId)
        : [...prev, carrierId]
    );
  };

  if (productLoading || carriersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const allCarriers = (carriers ?? []) as any[];

  return (
    <div className="space-y-6">
      {/* Dimensões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Dimensões e Peso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                placeholder="Ex: 0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="width">Largura (cm)</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                placeholder="Ex: 20"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                placeholder="Ex: 30"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="length">Comprimento (cm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                placeholder="Ex: 10"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transportadoras Permitidas */}
      <Card>
        <CardHeader>
          <CardTitle>Transportadoras Permitidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {allCarriers.length > 0 ? (
            <div className="space-y-2">
              {allCarriers.map((carrier: any) => (
                <div key={carrier.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`carrier-${carrier.id}`}
                    checked={selectedCarriers.includes(carrier.id)}
                    onCheckedChange={() => handleCarrierToggle(carrier.id)}
                  />
                  <Label htmlFor={`carrier-${carrier.id}`} className="font-normal cursor-pointer">
                    {carrier.name}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma transportadora cadastrada</p>
          )}
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-orange-500 hover:bg-orange-600"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          'Salvar Informações Logísticas'
        )}
      </Button>
    </div>
  );
}
