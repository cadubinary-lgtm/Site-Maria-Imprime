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
// Usa render prop para passar o drag handle aos filhos
function SortableColumn({ id, order, children }: { id: string; order: number; children: (dragHandle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 10 : undefined,
    order,
  };
  const dragHandle = (
    <span
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 ml-auto pl-2 touch-none"
      title="Arrastar coluna"
    >
      <GripVertical className="w-4 h-4" />
    </span>
  );
  return (
    <div ref={setNodeRef} style={style} className="flex flex-col min-w-0 overflow-hidden">
      {children(dragHandle)}
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
  const [expandedCvId, setExpandedCvId] = useState<number | null>(null);
  const [expandedOffsetId, setExpandedOffsetId] = useState<number | null>(null);
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
    await utils.variationsOffset.getGlobal.invalidate();
    refetchOffsetVariationTypes();
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

  // ===== HOOKS INDEPENDENTES PARA VARIAÇÕES OFFSET (Coluna 5) =====
  const { data: offsetVariationTypes = [], refetch: refetchOffsetVariationTypes } = trpc.variationsOffset.getGlobal.useQuery();
  const createOffsetTypeMutation = trpc.variationsOffset.createType.useMutation();
  const createOffsetOptionMutation = trpc.variationsOffset.createOption.useMutation();
  const deleteOffsetTypeMutation = trpc.variationsOffset.deleteType.useMutation();
  const deleteOffsetOptionMutation = trpc.variationsOffset.deleteOption.useMutation();
  const updateOffsetOptionMutation = trpc.variationsOffset.updateOption.useMutation();
  const updateOffsetTypeMutation = trpc.variationsOffset.updateType.useMutation();
  const reorderOffsetTypesMutation = trpc.variationsOffset.reorderTypes.useMutation();
  const reorderOffsetOptionsMutation = trpc.variationsOffset.reorderOptions.useMutation();
  const linkOffsetMutation = trpc.variationsOffset.linkGlobal.useMutation();
  const syncOffsetOptionsMutation = trpc.variationsOffset.syncGlobalOptions.useMutation();
  const syncOffsetNameMutation = trpc.variationsOffset.syncGlobalName.useMutation();

  // ===== HOOKS INDEPENDENTES PARA VARIAÇÕES COMUNICAÇÃO VISUAL (Coluna 4) =====
  const { data: cvVariationTypes = [], refetch: refetchCvVariationTypes } = trpc.variationsCv.getGlobal.useQuery();
  const createCvTypeMutation = trpc.variationsCv.createType.useMutation();
  const deleteCvTypeMutation = trpc.variationsCv.deleteType.useMutation();
  const updateCvTypeMutation = trpc.variationsCv.updateType.useMutation();
  const reorderCvTypesMutation = trpc.variationsCv.reorderTypes.useMutation();
  const linkCvMutation = trpc.variationsCv.linkGlobal.useMutation();
  const createCvOptionMutation = trpc.variationsCv.createOption.useMutation();
  const deleteCvOptionMutation = trpc.variationsCv.deleteOption.useMutation();
  const updateCvOptionMutation = trpc.variationsCv.updateOption.useMutation();

  const handleAddCvVariationType = async () => {
    if (!newGlobalVariationTypeName.trim()) { toast.error("Preencha o nome da variação"); return; }
    try {
      await createCvTypeMutation.mutateAsync({ productId: null, type: 'material' as const, name: newGlobalVariationTypeName, isRequired: newGlobalVariationTypeRequired });
      toast.success("Tipo de variação CV criado!");
      setNewGlobalVariationTypeName("");
      setNewGlobalVariationTypeRequired(true);
      await utils.variationsCv.getGlobal.invalidate();
      refetchCvVariationTypes();
    } catch { toast.error("Erro ao criar variação CV"); }
  };

  const handleLinkCvVariation = async (cvVariationId: number) => {
    if (!selectedProductId) { toast.error("Selecione um produto"); return; }
    try {
      await linkCvMutation.mutateAsync({ globalVariationId: cvVariationId, productId: selectedProductId });
      toast.success("Variação CV vinculada ao produto!");
      await utils.variationsCv.getGlobal.invalidate();
      refetchCvVariationTypes();
      await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
      refetchVariationTypes();
    } catch { toast.error("Erro ao vincular variação CV"); }
  };

  const handleDeleteCvVariationType = async (id: number) => {
    if (!confirm("Excluir este tipo de variação CV?")) return;
    try {
      await deleteCvTypeMutation.mutateAsync({ id });
      toast.success("Tipo CV excluído");
      await utils.variationsCv.getGlobal.invalidate();
      refetchCvVariationTypes();
    } catch { toast.error("Erro ao excluir tipo CV"); }
  };

  const handleToggleCvRequired = async (id: number, current: boolean) => {
    try {
      await updateCvTypeMutation.mutateAsync({ id, isRequired: !current });
      await utils.variationsCv.getGlobal.invalidate();
      refetchCvVariationTypes();
    } catch { toast.error("Erro ao atualizar"); }
  };

  const handleMoveCvVariationType = async (list: VariationType[], id: number, dir: "up" | "down") => {
    const idx = list.findIndex(v => v.id === id);
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= list.length) return;
    const newOrder = arrayMove(list, idx, newIdx);
    try {
      await reorderCvTypesMutation.mutateAsync({ updates: newOrder.map((v, i) => ({ id: v.id, order: i })) });
      await utils.variationsCv.getGlobal.invalidate();
      refetchCvVariationTypes();
    } catch { toast.error("Erro ao reordenar"); }
  };

  // Drag & drop sensors
  // Sensors para o DndContext externo (arrastar colunas horizontalmente)
  const columnSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  // Sensors para o DndContext interno (reordenar variações verticalmente)
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
  // Estados independentes para Offset
  const [newOffsetVariationTypeName, setNewOffsetVariationTypeName] = useState('');
  const [newOffsetVariationTypeRequired, setNewOffsetVariationTypeRequired] = useState(true);
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

  // ===== HANDLERS PARA OFFSET (Coluna 5) =====
  const handleAddOffsetVariationType = async () => {
    if (!newOffsetVariationTypeName.trim()) return;
    try {
      await createOffsetTypeMutation.mutateAsync({ productId: null, type: "material", name: newOffsetVariationTypeName.trim(), isRequired: newOffsetVariationTypeRequired });
      setNewOffsetVariationTypeName('');
      await utils.variationsOffset.getGlobal.invalidate();
      refetchOffsetVariationTypes();
    } catch (error) { console.error('Erro ao criar tipo offset:', error); }
  };
  const handleEditOffsetName = async () => {
    if (!editingNameId || !editingNameValue.trim()) return;
    try {
      await updateOffsetTypeMutation.mutateAsync({ id: editingNameId, name: editingNameValue.trim() });
      await syncOffsetNameMutation.mutateAsync({ globalVariationId: editingNameId, newName: editingNameValue.trim() });
      setEditingNameId(null); setEditingNameValue('');
      await utils.variationsOffset.getGlobal.invalidate();
      refetchOffsetVariationTypes();
    } catch (error) { console.error('Erro ao editar nome offset:', error); }
  };
  const handleToggleOffsetRequired = async (id: number, isRequired: boolean) => {
    try {
      await updateOffsetTypeMutation.mutateAsync({ id, isRequired });
      await utils.variationsOffset.getGlobal.invalidate();
      refetchOffsetVariationTypes();
    } catch (error) { console.error('Erro ao atualizar obrigatório offset:', error); }
  };
  const handleMoveOffsetVariationType = async (types: VariationType[], id: number, direction: "up" | "down") => {
    const idx = types.findIndex(t => t.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= types.length) return;
    const updates = types.map((t, i) => {
      if (i === idx) return { id: t.id, order: newIdx };
      if (i === newIdx) return { id: t.id, order: idx };
      return { id: t.id, order: i };
    });
    try {
      await reorderOffsetTypesMutation.mutateAsync({ updates });
      await utils.variationsOffset.getGlobal.invalidate();
      refetchOffsetVariationTypes();
    } catch (error) { console.error('Erro ao reordenar offset:', error); }
  };
  const handleDeleteOffsetVariationType = async (id: number) => {
    if (!confirm('Excluir este tipo de variação offset?')) return;
    try {
      await deleteOffsetTypeMutation.mutateAsync({ id });
      await utils.variationsOffset.getGlobal.invalidate();
      refetchOffsetVariationTypes();
    } catch (error) { console.error('Erro ao excluir tipo offset:', error); }
  };
  const handleLinkOffsetVariation = async (globalVariationId: number) => {
    if (!selectedProductId) { toast.error("Selecione um produto"); return; }
    try {
      await linkOffsetMutation.mutateAsync({ globalVariationId, productId: selectedProductId });
      toast.success("Variação offset vinculada ao produto!");
      await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
      refetchVariationTypes();
    } catch (error) { toast.error("Erro ao vincular variação offset"); console.error(error); }
  };

  // Automaticamente mudar para aba de gerenciamento quando produto é selecionado
  const handleSelectProduct = (productId: number) => {
    setSelectedProductId(productId);
    setEditingVariationType(null);
    setActiveTab('manage');
  };

  const sortedVariationTypes = [...variationTypes].sort((a: VariationType, b: VariationType) => a.order - b.order);

  // Estado para ordem das colunas
  const [columnOrder, setColumnOrder] = useState(['segmentos', 'produtos', 'variacoes', 'tipos', 'tipos2']);
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
      <DndContext sensors={columnSensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 w-full p-4">

        {/* ── COLUNA 1: Segmentos ── */}
        <SortableColumn id="segmentos" order={columnOrder.indexOf("segmentos")}>{(dragHandle) => (
        <div className="flex flex-col border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-1">Segmentos</p>
              {dragHandle}
            </div>
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
        )}</SortableColumn>

        {/* ── COLUNA 2: Buscar e Listar Produtos ── */}
        <SortableColumn id="produtos" order={columnOrder.indexOf("produtos")}>{(dragHandle) => (
        <div className="flex flex-col border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-1">Produtos</p>
              {dragHandle}
            </div>
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
        )}</SortableColumn>

        {/* ── COLUNA 3: Gerenciar Variações do Produto ── */}
        <SortableColumn id="variacoes" order={columnOrder.indexOf("variacoes")}>{(dragHandle) => (
        <div className="flex flex-col border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-1">
                Variações do Produto
              {selectedProductId && (
                <span className="ml-2 text-pink-600 normal-case font-normal">
                  — {(products as any[]).find((p: any) => p.id === selectedProductId)?.name}
                </span>
              )}
              </p>
              {dragHandle}
            </div>
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
        )}</SortableColumn>

        {/* ── COLUNA 4: Tipos Cadastrados no Sistema (Global) ── */}
        <SortableColumn id="tipos" order={columnOrder.indexOf("tipos")}>{(dragHandle) => (
        <div className="flex flex-col border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex-1">🔧 Variações Comunicação Visual</p>
              {dragHandle}
            </div>
            {selectedProductId && (
              <p className="text-xs text-gray-500 mt-0.5">Clique em "Adicionar ao Produto" para vincular</p>
            )}
          </div>
          <div className="p-3 space-y-2">
            {cvVariationTypes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhuma variação cadastrada.<br/><span className="text-xs">Acesse Variações Comunicação Visual para criar.</span></p>
            ) : (
              <div className="space-y-2">
                {cvVariationTypes.map((vt: VariationType) => {
                  const isCvExpanded = expandedCvId === vt.id;
                  return (
                    <div key={vt.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition text-left"
                        onClick={() => setExpandedCvId(isCvExpanded ? null : vt.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`text-gray-400 text-xs transition-transform ${isCvExpanded ? "rotate-90" : ""}`}>▶</span>
                          <span className="font-medium text-sm text-gray-800">{vt.name}</span>
                          <span className="text-xs text-gray-400">({vt.options?.length ?? 0} opções)</span>
                        </div>
                      </button>
                      {isCvExpanded && (
                        <div className="border-t bg-gray-50 px-3 py-2 space-y-1">
                          {!vt.options || vt.options.length === 0 ? (
                            <p className="text-xs text-gray-400 py-1">Nenhuma opção cadastrada</p>
                          ) : (
                            vt.options.map((opt: any) => (
                              <div key={opt.id} className="flex items-center justify-between py-1 px-2 bg-white rounded border border-gray-100 text-xs text-gray-700">
                                <span>{opt.name}</span>
                                {parseFloat(opt.priceModifier ?? "0") !== 0 && (
                                  <span className="text-gray-400">+R$ {parseFloat(opt.priceModifier).toFixed(2)}</span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      {selectedProductId && (
                        <div className="px-3 pb-2 pt-1 border-t border-gray-100">
                          <Button
                            onClick={() => handleLinkCvVariation(vt.id)}
                            className="w-full border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 text-xs h-7"
                            size="sm"
                            disabled={linkCvMutation.isPending}
                          >
                            <Plus className="w-3 h-3 mr-1" />Adicionar ao Produto
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}</SortableColumn>

        <SortableColumn id="tipos2" order={columnOrder.indexOf("tipos2")}>{(dragHandle) => (
        <div className="flex flex-col border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex-1">🖨️ Variações Offset</p>
              {dragHandle}
            </div>
            {selectedProductId && (
              <p className="text-xs text-gray-500 mt-0.5">Clique em "Adicionar ao Produto" para vincular</p>
            )}
          </div>
          <div className="p-3 space-y-2">
            {offsetVariationTypes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhuma variação cadastrada.<br/><span className="text-xs">Acesse Variações Offset para criar.</span></p>
            ) : (
              <div className="space-y-2">
                {offsetVariationTypes.map((vt: VariationType) => {
                  const isOffsetExpanded = expandedOffsetId === vt.id;
                  return (
                    <div key={vt.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition text-left"
                        onClick={() => setExpandedOffsetId(isOffsetExpanded ? null : vt.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`text-gray-400 text-xs transition-transform ${isOffsetExpanded ? "rotate-90" : ""}`}>▶</span>
                          <span className="font-medium text-sm text-gray-800">{vt.name}</span>
                          <span className="text-xs text-gray-400">({vt.options?.length ?? 0} opções)</span>
                        </div>
                      </button>
                      {isOffsetExpanded && (
                        <div className="border-t bg-gray-50 px-3 py-2 space-y-1">
                          {!vt.options || vt.options.length === 0 ? (
                            <p className="text-xs text-gray-400 py-1">Nenhuma opção cadastrada</p>
                          ) : (
                            vt.options.map((opt: any) => (
                              <div key={opt.id} className="flex items-center justify-between py-1 px-2 bg-white rounded border border-gray-100 text-xs text-gray-700">
                                <span>{opt.name}</span>
                                {parseFloat(opt.priceModifier ?? "0") !== 0 && (
                                  <span className="text-gray-400">+R$ {parseFloat(opt.priceModifier).toFixed(2)}</span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      {selectedProductId && (
                        <div className="px-3 pb-2 pt-1 border-t border-gray-100">
                          <Button
                            onClick={() => handleLinkOffsetVariation(vt.id)}
                            className="w-full border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 text-xs h-7"
                            size="sm"
                            disabled={linkOffsetMutation.isPending}
                          >
                            <Plus className="w-3 h-3 mr-1" />Adicionar ao Produto
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}</SortableColumn>

          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
