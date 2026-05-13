import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";

/**
 * ========================================
 * ADMIN PRODUCT ATTRIBUTES LINKER V2
 * ========================================
 * 
 * Centraliza vínculo + precificação em uma única interface
 * 
 * Funcionalidades:
 * ✅ Vincular atributo a produto
 * ✅ Definir preço no vínculo (não no atributo global)
 * ✅ Editar precificação
 * ✅ Desvinc ular atributo
 * ✅ Suporte a múltiplos tipos de cálculo
 * ✅ Impacto em prazo e peso
 */

interface ProductAttributeWithPricing {
  id: number;
  productId: number;
  attributeId: number;
  priceModifier: number | string;
  calculationType: "fixed" | "percentage" | "multiplier" | "per_sqm" | "per_quantity";
  timeModifier: number | string;
  weightModifier: number | string;
  isActive: boolean;
  priority: number | string;
  attribute?: {
    id: number;
    name: string;
    type: string;
  };
}

interface PricingFormData {
  priceModifier: number;
  calculationType: "fixed" | "percentage" | "multiplier" | "per_sqm" | "per_quantity";
  timeModifier: number;
  weightModifier: number;
  isActive: boolean;
  priority: number;
}

export default function AdminProductAttributesLinkerV2() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedAttributeId, setSelectedAttributeId] = useState<number | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<ProductAttributeWithPricing | null>(null);
  
  const [formData, setFormData] = useState<PricingFormData>({
    priceModifier: 0,
    calculationType: "fixed",
    timeModifier: 0,
    weightModifier: 0,
    isActive: true,
    priority: 0,
  });

  // Queries
  const { data: products, isLoading: productsLoading } = trpc.products.getAll.useQuery();
  const { data: attributes, isLoading: attributesLoading } = trpc.attributes.listAttributes.useQuery();
  const { data: productAttributes, refetch: refetchProductAttributes } = trpc.attributes.getProductAttributes.useQuery(
    selectedProductId || 0,
    { enabled: !!selectedProductId }
  );

  // Mutations
  const linkMutation = trpc.attributes.linkAttributeToProduct.useMutation({
    onSuccess: () => {
      toast.success("Atributo vinculado com sucesso!");
      setIsLinkDialogOpen(false);
      setSelectedAttributeId(null);
      setFormData({
        priceModifier: 0,
        calculationType: "fixed",
        timeModifier: 0,
        weightModifier: 0,
        isActive: true,
        priority: 0,
      });
      refetchProductAttributes();
    },
    onError: (error) => {
      toast.error(`Erro ao vincular: ${error.message}`);
    },
  });

  const updatePriceMutation = trpc.attributes.updateAttributePrice.useMutation({
    onSuccess: () => {
      toast.success("Precificação atualizada com sucesso!");
      setIsEditDialogOpen(false);
      setEditingAttribute(null);
      refetchProductAttributes();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const unlinkMutation = trpc.attributes.unlinkAttributeFromProduct.useMutation({
    onSuccess: () => {
      toast.success("Atributo desvinculado com sucesso!");
      refetchProductAttributes();
    },
    onError: (error) => {
      toast.error(`Erro ao desvinc ular: ${error.message}`);
    },
  });

  // Handlers
  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    setSelectedAttributeId(null);
  };

  const handleOpenLinkDialog = () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto primeiro");
      return;
    }
    setFormData({
      priceModifier: 0,
      calculationType: "fixed",
      timeModifier: 0,
      weightModifier: 0,
      isActive: true,
      priority: 0,
    });
    setIsLinkDialogOpen(true);
  };

  const handleLinkAttribute = () => {
    if (!selectedProductId || !selectedAttributeId) {
      toast.error("Selecione produto e atributo");
      return;
    }

    linkMutation.mutate({
      productId: selectedProductId,
      attributeId: selectedAttributeId,
      priceModifier: formData.priceModifier,
      calculationType: formData.calculationType,
      timeModifier: formData.timeModifier,
      weightModifier: formData.weightModifier,
      isActive: formData.isActive,
      priority: formData.priority,
    });
  };

  const handleOpenEditDialog = (attribute: ProductAttributeWithPricing) => {
    setEditingAttribute(attribute);
    setFormData({
      priceModifier: Number(attribute.priceModifier) || 0,
      calculationType: attribute.calculationType,
      timeModifier: Number(attribute.timeModifier) || 0,
      weightModifier: Number(attribute.weightModifier) || 0,
      isActive: attribute.isActive,
      priority: Number(attribute.priority) || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePrice = () => {
    if (!editingAttribute) return;

    updatePriceMutation.mutate({
      productAttributeId: editingAttribute.id,
      priceModifier: formData.priceModifier,
      calculationType: formData.calculationType,
      timeModifier: formData.timeModifier,
      weightModifier: formData.weightModifier,
      isActive: formData.isActive,
      priority: formData.priority,
    });
  };

  const handleUnlink = (productAttributeId: number) => {
    if (confirm("Tem certeza que deseja desvinc ular este atributo?")) {
      unlinkMutation.mutate(productAttributeId);
    }
  };

  const getCalculationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fixed: "Valor Fixo (R$)",
      percentage: "Percentual (%)",
      multiplier: "Multiplicador (x)",
      per_sqm: "Por m²",
      per_quantity: "Por Quantidade",
    };
    return labels[type] || type;
  };

  const getAttributeName = (attributeId: number) => {
    return attributes?.find((a: any) => a.id === attributeId)?.name || `Atributo #${attributeId}`;
  };

  const getLinkedAttributeNames = () => {
    return productAttributes?.map((pa: any) => pa.attributeId) || [];
  };

  const availableAttributes = attributes?.filter(
    (a: any) => !getLinkedAttributeNames().includes(a.id)
  ) || [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Vincular Atributos com Precificação</h1>
        <p className="text-gray-600 mt-2">
          Centralize a precificação no vínculo produto ↔ atributo. Cada produto pode ter preços diferentes para o mesmo atributo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Seleção de Produto */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
            <CardDescription>Selecione um produto para gerenciar seus atributos</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products && products.length > 0 ? (
                  products.map((product: any) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(product.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedProductId === product.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm opacity-75">{product.sku}</div>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500">Nenhum produto encontrado</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna 2: Atributos Vinculados */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Atributos Vinculados</CardTitle>
              <CardDescription>
                {selectedProductId ? `Gerenciar atributos de ${products?.find((p: any) => p.id === selectedProductId)?.name}` : "Selecione um produto"}
              </CardDescription>
            </div>
            <Button
              onClick={handleOpenLinkDialog}
              disabled={!selectedProductId}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Vincular
            </Button>
          </CardHeader>
          <CardContent>
            {!selectedProductId ? (
              <p className="text-gray-500 text-center py-8">Selecione um produto para ver seus atributos</p>
            ) : productAttributes && productAttributes.length > 0 ? (
              <div className="space-y-3">
                {productAttributes.map((attr: ProductAttributeWithPricing) => (
                  <div key={attr.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">{getAttributeName(attr.attributeId)}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          {getCalculationTypeLabel(attr.calculationType)}: {attr.priceModifier}
                        </div>
                        <div>
                          Prazo: {Number(attr.timeModifier) > 0 ? `+${attr.timeModifier}h` : "Sem impacto"}
                        </div>
                        <div>
                          Peso: {Number(attr.weightModifier) > 0 ? `+${attr.weightModifier}kg` : "Sem impacto"}
                        </div>
                        <div>
                          Status: {attr.isActive ? "✅ Ativo" : "❌ Inativo"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditDialog(attr)}
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnlink(attr.id)}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum atributo vinculado. Clique em "Vincular" para adicionar.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Vincular Novo Atributo */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Novo Atributo</DialogTitle>
            <DialogDescription>
              Configure o preço e impactos para este atributo neste produto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Seleção de Atributo */}
            <div>
              <Label htmlFor="attribute-select">Atributo</Label>
              <Select value={selectedAttributeId?.toString() || ""} onValueChange={(v) => setSelectedAttributeId(Number(v))}>
                <SelectTrigger id="attribute-select">
                  <SelectValue placeholder="Selecione um atributo" />
                </SelectTrigger>
                <SelectContent>
                  {availableAttributes.map((attr: any) => (
                    <SelectItem key={attr.id} value={attr.id.toString()}>
                      {attr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Cálculo */}
            <div>
              <Label htmlFor="calc-type">Tipo de Cálculo</Label>
              <Select value={formData.calculationType} onValueChange={(v: any) => setFormData({ ...formData, calculationType: v })}>
                <SelectTrigger id="calc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="multiplier">Multiplicador (x)</SelectItem>
                  <SelectItem value="per_sqm">Por m²</SelectItem>
                  <SelectItem value="per_quantity">Por Quantidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Modificador de Preço */}
            <div>
              <Label htmlFor="price">Modificador de Preço</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.priceModifier}
                onChange={(e) => setFormData({ ...formData, priceModifier: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            {/* Modificador de Prazo */}
            <div>
              <Label htmlFor="time">Impacto no Prazo (horas)</Label>
              <Input
                id="time"
                type="number"
                value={formData.timeModifier}
                onChange={(e) => setFormData({ ...formData, timeModifier: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            {/* Modificador de Peso */}
            <div>
              <Label htmlFor="weight">Impacto no Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weightModifier}
                onChange={(e) => setFormData({ ...formData, weightModifier: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            {/* Prioridade */}
            <div>
              <Label htmlFor="priority">Prioridade (ordem de exibição)</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkAttribute} disabled={linkMutation.isPending || !selectedAttributeId}>
              {linkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Precificação */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Precificação</DialogTitle>
            <DialogDescription>
              Atualize o preço e impactos para {editingAttribute && getAttributeName(editingAttribute.attributeId)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo de Cálculo */}
            <div>
              <Label htmlFor="edit-calc-type">Tipo de Cálculo</Label>
              <Select value={formData.calculationType} onValueChange={(v: any) => setFormData({ ...formData, calculationType: v })}>
                <SelectTrigger id="edit-calc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="multiplier">Multiplicador (x)</SelectItem>
                  <SelectItem value="per_sqm">Por m²</SelectItem>
                  <SelectItem value="per_quantity">Por Quantidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Modificador de Preço */}
            <div>
              <Label htmlFor="edit-price">Modificador de Preço</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.priceModifier}
                onChange={(e) => setFormData({ ...formData, priceModifier: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            {/* Modificador de Prazo */}
            <div>
              <Label htmlFor="edit-time">Impacto no Prazo (horas)</Label>
              <Input
                id="edit-time"
                type="number"
                value={formData.timeModifier}
                onChange={(e) => setFormData({ ...formData, timeModifier: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            {/* Modificador de Peso */}
            <div>
              <Label htmlFor="edit-weight">Impacto no Peso (kg)</Label>
              <Input
                id="edit-weight"
                type="number"
                step="0.01"
                value={formData.weightModifier}
                onChange={(e) => setFormData({ ...formData, weightModifier: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            {/* Prioridade */}
            <div>
              <Label htmlFor="edit-priority">Prioridade (ordem de exibição)</Label>
              <Input
                id="edit-priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePrice} disabled={updatePriceMutation.isPending}>
              {updatePriceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
