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
import { X, Plus, Edit2, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
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
  calculationType?: string;
}

const CALC_TYPE_OPTIONS = [
  { value: "unit", label: "Unidade" },
  { value: "m2", label: "m² (Metro Quadrado)" },
  { value: "linear", label: "Metro Linear" },
  { value: "package", label: "Pacote" },
];

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
  const reorderOptionsMutation = trpc.adminVariations.reorderOptions.useMutation();
  const linkGlobalMutation = trpc.adminVariations.linkGlobal.useMutation();
  const syncGlobalOptionsMutation = trpc.adminVariations.syncGlobalOptions.useMutation();
  const syncGlobalNameMutation = trpc.adminVariations.syncGlobalName.useMutation();

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
  const [globalOptionCalcTypes, setGlobalOptionCalcTypes] = useState<Record<number, string>>({});
  const [editingOptionName, setEditingOptionName] = useState("");
  const [editingOptionPrice, setEditingOptionPrice] = useState("");
  const [editingOptionCalcType, setEditingOptionCalcType] = useState("unit");

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
        calculationType: "unit",
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

    const calcType = globalOptionCalcTypes[variationId] || "unit";
    try {
      await createVariationOptionMutation.mutateAsync({
        variationTypeId: variationId,
        name,
        priceModifier: (parseFloat(price) || 0).toString(),
        calculationType: calcType as any,
      });

      // Propagar a nova opção para todas as cópias vinculadas ao produto
      await syncGlobalOptionsMutation.mutateAsync({ globalVariationId: variationId });

      toast.success("Opção adicionada e sincronizada com os produtos vinculados!");
      setGlobalOptionNames((prev) => ({ ...prev, [variationId]: "" }));
      setGlobalOptionPrices((prev) => ({ ...prev, [variationId]: "" }));
      setGlobalOptionCalcTypes((prev) => ({ ...prev, [variationId]: "unit" }));
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

  const handleMoveVariationType = async (list: VariationType[], vtId: number, direction: "up" | "down") => {
    const idx = list.findIndex((vt) => vt.id === vtId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === list.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const reordered = [...list];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const updates = reordered.map((vt, i) => ({ id: vt.id, order: i }));
    try {
      await reorderVariationTypesMutation.mutateAsync({ updates });
      await invalidateBoth();
    } catch (error) {
      toast.error("Erro ao reordenar variações");
      console.error(error);
    }
  };

  const handleMoveOption = async (options: any[], optionId: number, direction: "up" | "down", globalVariationId?: number) => {
    const idx = options.findIndex((o: any) => o.id === optionId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === options.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const reordered = [...options];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const updates = reordered.map((o: any, i: number) => ({ id: o.id, order: i }));
    try {
      await reorderOptionsMutation.mutateAsync({ updates });
      if (globalVariationId) {
        await syncGlobalOptionsMutation.mutateAsync({ globalVariationId });
      }
      await invalidateBoth();
    } catch (error) {
      toast.error("Erro ao reordenar opções");
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
        calculationType: editingOptionCalcType as any,
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

      // Verificar se a variação editada é global (está na lista global)
      const isGlobal = globalVariationTypes.some((vt: any) => vt.id === editingNameId);
      if (isGlobal) {
        // Propagar o novo nome para todas as cópias vinculadas ao produto
        await syncGlobalNameMutation.mutateAsync({
          globalVariationId: editingNameId,
          newName: editingNameValue,
        });
      }

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
    </div>
  );
}
