import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
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

// Componente wrapper para colunas arrastáveis
function SortableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex flex-col min-w-0">
      {children}
    </div>
  );
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
        {/* Linha 1: drag handle + seta + nome */}
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
          </div>
          <div className={`transform transition-transform text-gray-500 text-xs ${isExpanded ? 'rotate-90' : ''}`}>▶</div>
          <h4 className="font-semibold text-sm flex-1 truncate">{vt.name}</h4>
        </div>
        {/* Linha 2: obrigatório + lixeira */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Obrigatório:</span>
            <RadioGroup
              value={vt.isRequired ? "sim" : "nao"}
              onValueChange={(value) => onToggleRequired(vt.id, value === "sim")}
              className="flex gap-2"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="sim" id={`required-sim-${vt.id}`} />
                <Label htmlFor={`required-sim-${vt.id}`} className="cursor-pointer text-xs">Sim</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="nao" id={`required-nao-${vt.id}`} />
                <Label htmlFor={`required-nao-${vt.id}`} className="cursor-pointer text-xs">Não</Label>
              </div>
            </RadioGroup>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(vt.id); }}
            className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
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

  // Fetch all segments for filter
  const { data: allSegments = [] } = trpc.segments.list.useQuery();
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);

  // Fetch product IDs for selected segment
  const { data: segmentProductIds } = trpc.products.getBySegmentId.useQuery(
    { segmentId: selectedSegmentId! },
    { enabled: selectedSegmentId !== null }
  );

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

  // Estado para ordem das colunas
  const [columnOrder, setColumnOrder] = useState(['segmentos', 'produtos', 'variacoes', 'tipos']);
  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumnOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
     {/* Layout Kanban: 4 colunas com drag-and-drop horizontal */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full p-4">

        {/* ── COLUNA 1: Segmentos ── */}
        <SortableColumn id="segmentos">
        <div className="flex flex-col border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden cursor-grab active:cursor-grabbing" style={{touchAction: 'none'}}>
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Segmentos</p>
          </div>
          <div className="p-3 space-y-1">
            <button
              onClick={() => setSelectedSegmentId(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                selectedSegmentId === null ? "bg-pink-50 text-pink-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Todos
            </button>
            {(allSegments as any[]).map((seg: any) => (
              <button
                key={seg.id}
                onClick={() => setSelectedSegmentId(seg.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                  selectedSegmentId === seg.id ? "bg-pink-50 text-pink-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {seg.name}
              </button>
            ))}
          </div>
        </div>
        </SortableColumn>

        {/* ── COLUNA 2: Buscar e Listar Produtos ── */}
        <SortableColumn id="produtos">
        <div className="flex flex-col border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Produtos</p>
          </div>
          <div className="p-3">
            <Input
              placeholder="Buscar produto..."
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
            />
          </div>
          <div className="px-3 pb-3 space-y-2">
            {(products as any[])
              .filter((p: any) => {
                const matchSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase());
                const matchSegment = selectedSegmentId === null || (segmentProductIds ?? []).includes(p.id);
                return matchSearch && matchSegment;
              })
              .map((product: any) => (
                <Button
                  key={product.id}
                  onClick={() => handleSelectProduct(product.id)}
                  variant={selectedProductId === product.id ? "default" : "outline"}
                  className="w-full justify-start text-sm"
                >
                  {product.name}
                </Button>
              ))}
            {(products as any[]).filter((p: any) => {
              const matchSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase());
              const selectedSeg = (allSegments as any[]).find((s: any) => s.id === selectedSegmentId);
              const matchSegment2 = selectedSegmentId === null || (segmentProductIds ?? []).includes(p.id);
              return matchSearch && matchSegment2;
            }).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum produto encontrado</p>
            )}
          </div>
        </div>
        </SortableColumn>

        {/* ── COLUNA 3: Gerenciar Variações do Produto ── */}
        <SortableColumn id="variacoes">
        <div className="flex flex-col border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Variações do Produto
              {selectedProductId && (
                <span className="ml-2 text-pink-600 normal-case font-normal">
                  — {(products as any[]).find((p: any) => p.id === selectedProductId)?.name}
                </span>
              )}
            </p>
          </div>
          <div className="p-3">
            {!selectedProductId ? (
              <p className="text-sm text-gray-400 text-center py-8">Selecione um produto na coluna ao lado</p>
            ) : variationTypes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhum tipo de variação cadastrado para este produto</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-2">Arraste para reordenar</p>
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
              </div>
            )}
          </div>
        </div>
        </SortableColumn>

        {/* ── COLUNA 4: Tipos Cadastrados no Sistema (Global) ── */}
        <SortableColumn id="tipos">
        <div className="flex flex-col border-2 border-purple-200 rounded-xl shadow-sm bg-purple-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-purple-200 bg-purple-100">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">📚 Tipos no Sistema</p>
            {selectedProductId && (
              <p className="text-xs text-purple-600 mt-0.5">Clique em "Adicionar ao Produto" para vincular</p>
            )}
          </div>
          <div className="p-3 space-y-4">
            {/* Formulário Adicionar Novo Tipo Global */}
            <div className="border rounded-lg p-3 bg-white">
              <h3 className="font-semibold text-sm mb-3">Adicionar Novo Tipo Global</h3>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="globalVariationType" className="text-xs">Nome da Variação</Label>
                  <Input
                    id="globalVariationType"
                    placeholder="Ex: Material, Acabamento..."
                    value={newGlobalVariationTypeName}
                    onChange={(e) => setNewGlobalVariationTypeName(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="globalRequired" className="text-xs">Obrigatório?</Label>
                  <Select
                    value={newGlobalVariationTypeRequired ? "true" : "false"}
                    onValueChange={(value) => setNewGlobalVariationTypeRequired(value === "true")}
                  >
                    <SelectTrigger id="globalRequired" className="mt-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddGlobalVariationType}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
                  disabled={createVariationTypeMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Tipo Global
                </Button>
              </div>
            </div>

            {/* Lista de Tipos Globais */}
            {globalVariationTypes.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Nenhuma variação global cadastrada.</p>
            ) : (
              <div className="grid gap-3">
                {globalVariationTypes.map((vt: VariationType) => {
                  const isExpanded = expandedGlobalVariationId === vt.id;
                  return (
                    <div key={vt.id} className="border rounded-lg bg-white overflow-hidden">
                     <div
                        onClick={() => editingNameId === vt.id ? undefined : setExpandedGlobalVariationId(isExpanded ? null : vt.id)}
                        className={`p-4 hover:bg-purple-50 transition ${editingNameId === vt.id ? '' : 'cursor-pointer'}`}
                      >
                        {/* Linha 1: seta + nome */}
                        <div className="flex items-center gap-2">
                          <div className={`transform transition-transform text-purple-700 text-xs ${isExpanded ? 'rotate-90' : ''}`}>▶</div>
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
                                className="font-semibold text-purple-900 h-8 text-sm"
                              />
                              <Button size="sm" onClick={handleEditName} className="bg-blue-600 hover:bg-blue-700 h-8" disabled={updateVariationTypeMutation.isPending}>Salvar</Button>
                              <Button size="sm" variant="outline" onClick={() => { setEditingNameId(null); setEditingNameValue(''); }} className="h-8"><X className="w-3 h-3" /></Button>
                            </div>
                          ) : (
                            <h4 className="font-semibold text-purple-900 text-sm flex-1">{vt.name}</h4>
                          )}
                        </div>
                        {/* Linha 2: info + ações */}
                        <div className="mt-2 pt-2 border-t border-purple-100 space-y-2" onClick={(e) => e.stopPropagation()}>
                          <p className="text-xs text-gray-500">{vt.isRequired ? "Obrigatório" : "Opcional"} • {vt.options?.length || 0} opções</p>
                          <div className="flex flex-wrap gap-1">
                            {editingNameId !== vt.id && (
                              <Button variant="outline" size="sm" onClick={() => { setEditingNameId(vt.id); setEditingNameValue(vt.name); }} className="bg-blue-50 border-blue-300 hover:bg-blue-100 text-xs h-7">
                                <Edit2 className="w-3 h-3 mr-1" />Editar Nome
                              </Button>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Obrig.:</span>
                              <RadioGroup value={vt.isRequired ? "sim" : "nao"} onValueChange={(value) => handleToggleRequired(vt.id, value === "sim")} className="flex gap-2">
                                <div className="flex items-center space-x-1"><RadioGroupItem value="sim" id={`global-required-sim-${vt.id}`} /><Label htmlFor={`global-required-sim-${vt.id}`} className="cursor-pointer text-xs">Sim</Label></div>
                                <div className="flex items-center space-x-1"><RadioGroupItem value="nao" id={`global-required-nao-${vt.id}`} /><Label htmlFor={`global-required-nao-${vt.id}`} className="cursor-pointer text-xs">Não</Label></div>
                              </RadioGroup>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleMoveVariationType(globalVariationTypes as VariationType[], vt.id, "up")} disabled={(globalVariationTypes as VariationType[]).findIndex(g => g.id === vt.id) === 0 || reorderVariationTypesMutation.isPending} className="text-gray-400 hover:text-gray-700 h-7 w-7 p-0"><ChevronUp className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleMoveVariationType(globalVariationTypes as VariationType[], vt.id, "down")} disabled={(globalVariationTypes as VariationType[]).findIndex(g => g.id === vt.id) === (globalVariationTypes as VariationType[]).length - 1 || reorderVariationTypesMutation.isPending} className="text-gray-400 hover:text-gray-700 h-7 w-7 p-0"><ChevronDown className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteVariationType(vt.id)} className="text-red-500 hover:text-red-700 h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button>
                          </div>
                          {selectedProductId && (
                            <Button onClick={() => handleLinkGlobalVariation(vt.id)} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-7" size="sm" disabled={linkGlobalMutation.isPending}>
                              <Plus className="w-3 h-3 mr-1" />Adicionar ao Produto
                            </Button>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-4 space-y-4">
                          <div>
                            <h5 className="font-semibold text-sm mb-3">Opções ({vt.options?.length || 0})</h5>
                            {!vt.options || vt.options.length === 0 ? (
                              <p className="text-gray-500 text-sm">Nenhuma opção cadastrada</p>
                            ) : (
                              <div className="space-y-2">
                                {vt.options.map((option: any) => (
                                  <div key={option.id} className="border rounded-lg bg-white overflow-hidden">
                                    {editingOptionId === option.id ? (
                                      <div className="p-3 bg-yellow-50 border-yellow-300">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                          <div>
                                            <Label className="text-xs">Nome</Label>
                                            <Input
                                              autoFocus
                                              value={editingOptionName}
                                              onChange={(e) => setEditingOptionName(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdateOption(vt.id);
                                                if (e.key === 'Escape') { setEditingOptionId(null); setEditingOptionName(""); setEditingOptionPrice(""); setEditingOptionCalcType("unit"); }
                                              }}
                                              className="mt-1 text-sm h-8"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Preço (R$)</Label>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              value={editingOptionPrice}
                                              onChange={(e) => setEditingOptionPrice(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdateOption(vt.id);
                                                if (e.key === 'Escape') { setEditingOptionId(null); setEditingOptionName(""); setEditingOptionPrice(""); setEditingOptionCalcType("unit"); }
                                              }}
                                              className="mt-1 text-sm h-8"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Tipo de Cobrança</Label>
                                            <Select value={editingOptionCalcType} onValueChange={setEditingOptionCalcType}>
                                              <SelectTrigger className="mt-1 text-sm h-8">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {CALC_TYPE_OPTIONS.map(o => (
                                                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="flex items-end gap-1">
                                            <Button
                                              size="sm"
                                              onClick={() => handleUpdateOption(vt.id)}
                                              className="flex-1 bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                                              disabled={updateVariationOptionMutation.isPending}
                                            >
                                              Salvar
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => { setEditingOptionId(null); setEditingOptionName(""); setEditingOptionPrice(""); setEditingOptionCalcType("unit"); }}
                                              className="h-8 px-2"
                                            >
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-3 flex justify-between items-center hover:bg-gray-50 transition">
                                        <div>
                                          <h6 className="font-medium text-sm">{option.name}</h6>
                                          <p className="text-xs text-gray-600">
                                            +R$ {parseFloat(option.priceModifier).toFixed(2)}
                                            {" · "}
                                            {CALC_TYPE_OPTIONS.find(c => c.value === (option.calculationType || "unit"))?.label ?? "Unidade"}
                                          </p>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleMoveOption(vt.options ?? [], option.id, "up", vt.id)}
                                            disabled={(vt.options ?? []).indexOf(option) === 0 || reorderOptionsMutation.isPending}
                                            className="text-gray-400 hover:text-gray-700 px-1"
                                            title="Mover para cima"
                                          >
                                            <ChevronUp className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleMoveOption(vt.options ?? [], option.id, "down", vt.id)}
                                            disabled={(vt.options ?? []).indexOf(option) === (vt.options ?? []).length - 1 || reorderOptionsMutation.isPending}
                                            className="text-gray-400 hover:text-gray-700 px-1"
                                            title="Mover para baixo"
                                          >
                                            <ChevronDown className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setEditingOptionId(option.id);
                                              setEditingOptionName(option.name);
                                              setEditingOptionPrice(option.priceModifier);
                                              setEditingOptionCalcType(option.calculationType || "unit");
                                            }}
                                            className="text-blue-500 hover:text-blue-700"
                                            title="Editar"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteOption(option.id, vt.id)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Remover"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="border-t pt-4">
                            <h5 className="font-semibold text-sm mb-3">Adicionar Nova Opção</h5>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                              <div>
                                <Label className="text-xs">Tipo de Cobrança</Label>
                                <Select
                                  value={globalOptionCalcTypes[vt.id] || "unit"}
                                  onValueChange={(val) =>
                                    setGlobalOptionCalcTypes((prev) => ({ ...prev, [vt.id]: val }))
                                  }
                                >
                                  <SelectTrigger className="mt-1 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CALC_TYPE_OPTIONS.map(o => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
          </div>
        </div>
        </SortableColumn>

          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
