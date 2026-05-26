import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface VariationType {
  id: number;
  name: string;
  type: string;
  isRequired: boolean;
  order: number;
  options?: VariationOption[];
}

interface VariationOption {
  id: number;
  name: string;
  priceModifier: string | number;
}

// Draggable item component
function DraggableVariationItem({ vt, isSelected, onSelect, onDelete, onToggleRequired, onEdit, isExpanded, onToggleExpand }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: vt.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg overflow-hidden transition ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      {/* Header - Clicável para expandir/recolher */}
      <div
        onClick={() => onToggleExpand(isExpanded ? null : vt.id)}
        className={`p-4 cursor-pointer transition ${
          isExpanded
            ? "bg-orange-50 border-b border-orange-300"
            : "bg-white hover:bg-gray-50"
        }`}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div {...attributes} {...listeners}>
              <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-grab active:cursor-grabbing" />
            </div>
            <div className="flex items-center gap-2">
              <div className={`transform transition-transform text-gray-600 ${isExpanded ? 'rotate-90' : ''}`}>
                ▶
              </div>
              <div>
                <h4 className="font-semibold">{vt.name}</h4>
                <p className="text-sm text-gray-600">
                  {vt.isRequired ? "Obrigatório" : "Opcional"} • {vt.options?.length || 0} opções
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Obrigatório:</Label>
              <RadioGroup
                value={vt.isRequired ? "sim" : "nao"}
                onValueChange={(value) => {
                  onToggleRequired(vt.id, value === "sim");
                }}
                className="flex gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id={`required-sim-${vt.id}`} />
                  <Label htmlFor={`required-sim-${vt.id}`} className="cursor-pointer text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id={`required-nao-${vt.id}`} />
                  <Label htmlFor={`required-nao-${vt.id}`} className="cursor-pointer text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(vt.id);
              }}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content - Opções */}
      {isExpanded && (
        <div className="border-t bg-gray-50 p-4 space-y-3">
          <h5 className="font-semibold text-sm">Opções ({vt.options?.length || 0})</h5>
          {!vt.options || vt.options.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma opção vinculada. Adicione no sistema global.</p>
          ) : (
            <div className="space-y-2">
              {vt.options.map((option: any) => (
                <div
                  key={option.id}
                  className="border rounded-lg p-3 flex justify-between items-center bg-white hover:bg-gray-100 transition"
                >
                  <div>
                    <h6 className="font-medium text-sm">{option.name}</h6>
                    <p className="text-xs text-gray-600">
                      +R$ {parseFloat(option.priceModifier).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProductVariationManager() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [editingVariationType, setEditingVariationType] = useState<number | null>(null);
  const [editingGlobalVariationType, setEditingGlobalVariationType] = useState<number | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [expandedGlobalVariationId, setExpandedGlobalVariationId] = useState<number | null>(null);
  const [expandedProductVariationId, setExpandedProductVariationId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'manage'>('products');

  // Fetch all products
  const { data: products = [] } = trpc.products.getAll.useQuery();

  // Fetch variation types for selected product
  const { data: variationTypes = [], refetch: refetchVariationTypes } = trpc.variations.getByProduct.useQuery(
    { productId: selectedProductId || 0 },
    { enabled: !!selectedProductId }
  );

  // Fetch global variation types (productId = null)
  const { data: globalVariationTypes = [], refetch: refetchGlobalVariationTypes } = trpc.variations.getGlobal.useQuery();

  // Get utils for invalidation
  const utils = trpc.useUtils();

  // Helper: invalidar ambas as listas
  const invalidateBoth = async () => {
    await utils.variations.getGlobal.invalidate();
    refetchGlobalVariationTypes();
    if (selectedProductId) {
      await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
      refetchVariationTypes();
    }
  };

  // Mutations
  const createVariationTypeMutation = trpc.adminVariations.createType.useMutation();
  const createVariationOptionMutation = trpc.adminVariations.createOption.useMutation();
  const deleteVariationTypeMutation = trpc.adminVariations.deleteType.useMutation();
  const deleteVariationOptionMutation = trpc.adminVariations.deleteOption.useMutation();
  const updateVariationOptionMutation = trpc.adminVariations.updateOption.useMutation();
  const updateVariationTypeMutation = trpc.adminVariations.updateType.useMutation();
  const reorderVariationTypesMutation = trpc.adminVariations.reorderTypes.useMutation();
  const linkGlobalMutation = trpc.adminVariations.linkGlobal.useMutation();
  const syncGlobalOptionsMutation = trpc.adminVariations.syncGlobalOptions.useMutation();

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form states
  const [newVariationTypeName, setNewVariationTypeName] = useState("");
  const [newVariationTypeRequired, setNewVariationTypeRequired] = useState(true);
  const [newGlobalVariationTypeName, setNewGlobalVariationTypeName] = useState("");
  const [newGlobalVariationTypeRequired, setNewGlobalVariationTypeRequired] = useState(true);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  // Por variação global expandida: campos de nova opção separados
  const [globalOptionNames, setGlobalOptionNames] = useState<Record<number, string>>({});
  const [globalOptionPrices, setGlobalOptionPrices] = useState<Record<number, string>>({});
  const [editingOptionName, setEditingOptionName] = useState("");
  const [editingOptionPrice, setEditingOptionPrice] = useState("");

  // Adicionar opção a uma variação do produto (aba Gerenciar)
  const handleAddOption = async () => {
    const variationId = editingVariationType || editingGlobalVariationType;
    if (!variationId || !newOptionName) {
      toast.error("Preencha o nome da opção");
      return;
    }

    try {
      await createVariationOptionMutation.mutateAsync({
        variationTypeId: variationId,
        name: newOptionName,
        priceModifier: (parseFloat(newOptionPrice) || 0).toString(),
      });

      toast.success("Opção adicionada!");
      setNewOptionName("");
      setNewOptionPrice("");
      await invalidateBoth();
    } catch (error) {
      toast.error("Erro ao adicionar opção");
      console.error(error);
    }
  };

  // Adicionar opção diretamente a uma variação global (painel roxo)
  const handleAddGlobalOption = async (variationId: number) => {
    const name = globalOptionNames[variationId] || "";
    const price = globalOptionPrices[variationId] || "0";
    if (!name.trim()) {
      toast.error("Preencha o nome da opção");
      return;
    }

    try {
      await createVariationOptionMutation.mutateAsync({
        variationTypeId: variationId,
        name,
        priceModifier: (parseFloat(price) || 0).toString(),
      });

      // Propagar a nova opção para todas as cópias vinculadas ao produto
      await syncGlobalOptionsMutation.mutateAsync({ globalVariationId: variationId });

      toast.success("Opção adicionada e sincronizada com os produtos vinculados!");
      setGlobalOptionNames((prev) => ({ ...prev, [variationId]: "" }));
      setGlobalOptionPrices((prev) => ({ ...prev, [variationId]: "" }));
      // Invalidar ambas as listas para sincronizar
      await invalidateBoth();
    } catch (error) {
      toast.error("Erro ao adicionar opção");
      console.error(error);
    }
  };

  const handleDeleteVariationType = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este tipo de variação?")) return;

    try {
      await deleteVariationTypeMutation.mutateAsync({ id });
      toast.success("Tipo de variação removido!");
      setEditingVariationType(null);
      // Invalidar ambas as listas
      await invalidateBoth();
    } catch (error) {
      toast.error("Erro ao remover tipo de variação");
      console.error(error);
    }
  };

  const handleDeleteOption = async (id: number, globalVariationId?: number) => {
    if (!confirm("Tem certeza que deseja remover esta opção?")) return;

    try {
      await deleteVariationOptionMutation.mutateAsync({ id });
      // Se a opção pertence a uma variação global, propagar a exclusão para todas as cópias
      if (globalVariationId) {
        await syncGlobalOptionsMutation.mutateAsync({ globalVariationId });
      }
      toast.success("Opção removida!");
      // Invalidar ambas as listas
      await invalidateBoth();
    } catch (error) {
      toast.error("Erro ao remover opção");
      console.error(error);
    }
  };

  const handleUpdateOption = async (globalVariationId?: number) => {
    if (!editingOptionId || !editingOptionName) {
      toast.error("Preencha o nome da opção");
      return;
    }

    try {
      await updateVariationOptionMutation.mutateAsync({
        id: editingOptionId,
        name: editingOptionName,
        priceModifier: (parseFloat(editingOptionPrice) || 0).toString(),
      });

      // Se a opção pertence a uma variação global, propagar a atualização para todas as cópias
      if (globalVariationId) {
        await syncGlobalOptionsMutation.mutateAsync({ globalVariationId });
      }

      toast.success("Opção atualizada!");
      setEditingOptionId(null);
      setEditingOptionName("");
      setEditingOptionPrice("");
      // Invalidar ambas as listas
      await invalidateBoth();
    } catch (error) {
      toast.error("Erro ao atualizar opção");
      console.error(error);
    }
  };

  const handleEditName = async () => {
    if (!editingNameId || !editingNameValue) {
      toast.error("Preencha o novo nome");
      return;
    }

    try {
      await updateVariationTypeMutation.mutateAsync({
        id: editingNameId,
        name: editingNameValue,
      });

      toast.success("Nome atualizado!");
      setEditingNameId(null);
      setEditingNameValue("");
      // Invalidar ambas as listas
      await invalidateBoth();
    } catch (error) {
      toast.error("Erro ao atualizar nome");
      console.error(error);
    }
  };

  const handleToggleRequired = async (id: number, newRequired: boolean) => {
    try {
      await updateVariationTypeMutation.mutateAsync({
        id,
        isRequired: newRequired,
      });

      toast.success(newRequired ? "Marcado como Obrigatório" : "Marcado como Opcional");
      // Invalidar ambas as listas
      await invalidateBoth();
    } catch (error) {
      toast.error("Erro ao atualizar obrigatoriedade");
      console.error(error);
    }
  };

  // Adicionar variação ao produto selecionado (aba Gerenciar)
  const handleAddVariationType = async () => {
    if (!selectedProductId || !newVariationTypeName) {
      toast.error("Selecione um produto e preencha o nome da variação");
      return;
    }

    try {
      await createVariationTypeMutation.mutateAsync({
        productId: selectedProductId,
        type: 'material' as const,
        name: newVariationTypeName,
        isRequired: newVariationTypeRequired,
      });

      toast.success("Tipo de variação adicionado!");
      setNewVariationTypeName("");
      setNewVariationTypeRequired(true);
      await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
      refetchVariationTypes();
    } catch (error) {
      toast.error("Erro ao adicionar tipo de variação");
      console.error(error);
    }
  };

  // Adicionar variação GLOBAL (painel roxo) — productId = null
  const handleAddGlobalVariationType = async () => {
    if (!newGlobalVariationTypeName.trim()) {
      toast.error("Preencha o nome da variação");
      return;
    }

    try {
      await createVariationTypeMutation.mutateAsync({
        productId: null,
        type: 'material' as const,
        name: newGlobalVariationTypeName,
        isRequired: newGlobalVariationTypeRequired,
      });

      toast.success("Tipo de variação global criado!");
      setNewGlobalVariationTypeName("");
      setNewGlobalVariationTypeRequired(true);
      // Invalidar ambas as listas para sincronizar
      await invalidateBoth();
    } catch (error) {
      toast.error("Erro ao criar variação global");
      console.error(error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedVariationTypes.findIndex((vt: VariationType) => vt.id === active.id);
      const newIndex = sortedVariationTypes.findIndex((vt: VariationType) => vt.id === over.id);

      const newOrder = arrayMove(sortedVariationTypes, oldIndex, newIndex);
      const orderMap = newOrder.map((vt: VariationType, index: number) => ({
        id: vt.id,
        order: index,
      }));

      try {
        await reorderVariationTypesMutation.mutateAsync({ updates: orderMap });
        toast.success("Ordem atualizada!");
        if (selectedProductId) {
          await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
          refetchVariationTypes();
        }
      } catch (error) {
        toast.error("Erro ao reordenar");
        console.error(error);
      }
    }
  };

  const handleLinkGlobalVariation = async (globalVariationId: number) => {
    if (!selectedProductId) {
      toast.error("Selecione um produto");
      return;
    }

    try {
      await linkGlobalMutation.mutateAsync({
        globalVariationId,
        productId: selectedProductId,
      });

      toast.success("Variação vinculada ao produto!");
      await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
      refetchVariationTypes();
    } catch (error) {
      toast.error("Erro ao vincular variação");
      console.error(error);
    }
  };

  // Automaticamente mudar para aba de gerenciamento quando produto é selecionado
  const handleSelectProduct = (productId: number) => {
    setSelectedProductId(productId);
    setEditingVariationType(null);
    setActiveTab('manage');
  };

  const sortedVariationTypes = [...variationTypes].sort((a: VariationType, b: VariationType) => a.order - b.order);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'products' | 'manage')} className="w-full">
        <TabsList>
          <TabsTrigger value="products">Selecionar Produto</TabsTrigger>
          <TabsTrigger value="manage">Gerenciar Variações</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Produto</CardTitle>
              <CardDescription>
                Escolha um produto para gerenciar suas variações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productSearch">Buscar Produto</Label>
                <Input
                  id="productSearch"
                  placeholder="Digite o nome do produto..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid gap-2">
                {products
                  .filter((p: any) =>
                    p.name.toLowerCase().includes(productSearchQuery.toLowerCase())
                  )
                  .map((product: any) => (
                    <Button
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      variant={selectedProductId === product.id ? "default" : "outline"}
                      className="justify-start"
                    >
                      {product.name}
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          {!selectedProductId ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Selecione um produto na aba anterior para gerenciar variações</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Variações</CardTitle>
                <CardDescription>
                  Adicione, edite, remova ou reordene tipos de variações e suas opções
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Variation Type */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-4">Adicionar Novo Tipo de Variação</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="variationType">Nome da Variação</Label>
                        <Input
                          id="variationType"
                          placeholder="Ex: Material, Acabamento, Tamanho"
                          value={newVariationTypeName}
                          onChange={(e) => setNewVariationTypeName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="required">Obrigatório?</Label>
                        <Select
                          value={newVariationTypeRequired ? "true" : "false"}
                          onValueChange={(value) => setNewVariationTypeRequired(value === "true")}
                        >
                          <SelectTrigger id="required" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleAddVariationType}
                          className="w-full bg-orange-500 hover:bg-orange-600"
                          disabled={createVariationTypeMutation.isPending}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Variation Types List with Drag & Drop */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Tipos de Variações Cadastrados (Arraste para reordenar)</h3>
                  {variationTypes.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhum tipo de variação cadastrado</p>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={sortedVariationTypes.map((vt: VariationType) => vt.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="grid gap-3">
                          {sortedVariationTypes.map((vt: VariationType) => (
                            <DraggableVariationItem
                              key={vt.id}
                              vt={vt}
                              isSelected={editingVariationType === vt.id}
                              onSelect={setEditingVariationType}
                              onDelete={handleDeleteVariationType}
                              onToggleRequired={handleToggleRequired}
                              onEdit={(id: number, name: string) => {
                                setEditingNameId(id);
                                setEditingNameValue(name);
                              }}
                              isExpanded={expandedProductVariationId === vt.id}
                              onToggleExpand={setExpandedProductVariationId}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>

              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Global Variation Types - Accordion Area */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-900">📚 Tipos de Variações Cadastrados no Sistema</CardTitle>
          <CardDescription>
            Variações globais disponíveis para reutilizar em qualquer produto. Clique para expandir e visualizar opções.
            {selectedProductId && (
              <span className="ml-2 text-purple-700 font-medium">
                — Use o botão "Adicionar ao Produto" para vincular ao produto selecionado.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Global Variation Type */}
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-semibold mb-4">Adicionar Novo Tipo de Variação Global</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="globalVariationType">Nome da Variação</Label>
                  <Input
                    id="globalVariationType"
                    placeholder="Ex: Material, Acabamento, Tamanho"
                    value={newGlobalVariationTypeName}
                    onChange={(e) => setNewGlobalVariationTypeName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="globalRequired">Obrigatório?</Label>
                  <Select
                    value={newGlobalVariationTypeRequired ? "true" : "false"}
                    onValueChange={(value) => setNewGlobalVariationTypeRequired(value === "true")}
                  >
                    <SelectTrigger id="globalRequired" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddGlobalVariationType}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={createVariationTypeMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Tipo Global
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Global Variation Types List */}
          {globalVariationTypes.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma variação global cadastrada. Use o formulário acima para criar uma.</p>
          ) : (
            <div className="grid gap-3">
              {globalVariationTypes.map((vt: VariationType) => {
                const isExpanded = expandedGlobalVariationId === vt.id;
                return (
                  <div key={vt.id} className="border rounded-lg bg-white overflow-hidden">
                    {/* Header - Clicável para expandir/recolher */}
                    <div
                      onClick={() => editingNameId === vt.id ? undefined : setExpandedGlobalVariationId(isExpanded ? null : vt.id)}
                      className={`p-4 hover:bg-purple-50 transition flex justify-between items-start gap-4 ${editingNameId === vt.id ? '' : 'cursor-pointer'}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`transform transition-transform text-purple-900 ${isExpanded ? 'rotate-90' : ''}`}>
                            ►
                          </div>
                          {editingNameId === vt.id ? (
                            <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                autoFocus
                                value={editingNameValue}
                                onChange={(e) => setEditingNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditName();
                                  if (e.key === 'Escape') { setEditingNameId(null); setEditingNameValue(''); }
                                }}
                                className="font-semibold text-purple-900 h-8 text-base"
                              />
                              <Button size="sm" onClick={handleEditName} className="bg-blue-600 hover:bg-blue-700 h-8" disabled={updateVariationTypeMutation.isPending}>
                                Salvar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setEditingNameId(null); setEditingNameValue(''); }} className="h-8">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <h4 className="font-semibold text-purple-900">{vt.name}</h4>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 ml-6">
                          {vt.isRequired ? "Obrigatório" : "Opcional"} • {vt.options?.length || 0} opções
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {editingNameId !== vt.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingNameId(vt.id);
                            setEditingNameValue(vt.name);
                          }}
                          className="bg-blue-50 border-blue-300 hover:bg-blue-100"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Editar Nome
                        </Button>
                        )}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">Obrigatório:</Label>
                          <RadioGroup
                            value={vt.isRequired ? "sim" : "nao"}
                            onValueChange={(value) => {
                              handleToggleRequired(vt.id, value === "sim");
                            }}
                            className="flex gap-3"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id={`global-required-sim-${vt.id}`} />
                              <Label htmlFor={`global-required-sim-${vt.id}`} className="cursor-pointer text-sm">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao" id={`global-required-nao-${vt.id}`} />
                              <Label htmlFor={`global-required-nao-${vt.id}`} className="cursor-pointer text-sm">Não</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVariationType(vt.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {selectedProductId && (
                          <Button
                            onClick={() => handleLinkGlobalVariation(vt.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            size="sm"
                            disabled={linkGlobalMutation.isPending}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar ao Produto
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content - Opções */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4 space-y-4">
                        {/* Editar opção existente */}
                        {editingOptionId && (
                          <div className="border rounded-lg p-3 bg-yellow-50 border-yellow-300">
                            <h5 className="font-semibold text-sm mb-3">Editar Opção</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Nome</Label>
                                <Input
                                  value={editingOptionName}
                                  onChange={(e) => setEditingOptionName(e.target.value)}
                                  className="mt-1 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Preço (R$)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingOptionPrice}
                                  onChange={(e) => setEditingOptionPrice(e.target.value)}
                                  className="mt-1 text-sm"
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <Button
                                  onClick={() => handleUpdateOption(vt.id)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                                  disabled={updateVariationOptionMutation.isPending}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => { setEditingOptionId(null); setEditingOptionName(""); setEditingOptionPrice(""); }}
                                  className="text-sm"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <h5 className="font-semibold text-sm mb-3">Opções ({vt.options?.length || 0})</h5>
                          {!vt.options || vt.options.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhuma opção cadastrada</p>
                          ) : (
                            <div className="space-y-2">
                              {vt.options.map((option: any) => (
                                <div
                                  key={option.id}
                                  className="border rounded-lg p-3 flex justify-between items-center bg-white hover:bg-gray-100 transition"
                                >
                                  <div>
                                    <h6 className="font-medium text-sm">{option.name}</h6>
                                    <p className="text-xs text-gray-600">
                                      +R$ {parseFloat(option.priceModifier).toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingOptionId(option.id);
                                        setEditingOptionName(option.name);
                                        setEditingOptionPrice(option.priceModifier);
                                      }}
                                      className="text-blue-500 hover:text-blue-700"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteOption(option.id, vt.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Adicionar Nova Opção — campos independentes por variação */}
                        <div className="border-t pt-4">
                          <h5 className="font-semibold text-sm mb-3">Adicionar Nova Opção</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor={`global-option-name-${vt.id}`} className="text-xs">Nome</Label>
                              <Input
                                id={`global-option-name-${vt.id}`}
                                placeholder="Ex: Vinil Brilho"
                                value={globalOptionNames[vt.id] || ""}
                                onChange={(e) =>
                                  setGlobalOptionNames((prev) => ({ ...prev, [vt.id]: e.target.value }))
                                }
                                className="mt-1 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`global-option-price-${vt.id}`} className="text-xs">Preço (R$)</Label>
                              <Input
                                id={`global-option-price-${vt.id}`}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={globalOptionPrices[vt.id] || ""}
                                onChange={(e) =>
                                  setGlobalOptionPrices((prev) => ({ ...prev, [vt.id]: e.target.value }))
                                }
                                className="mt-1 text-sm"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                onClick={() => handleAddGlobalOption(vt.id)}
                                className="w-full bg-green-600 hover:bg-green-700 text-sm"
                                disabled={createVariationOptionMutation.isPending}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}


        </CardContent>
      </Card>
    </div>
  );
}
