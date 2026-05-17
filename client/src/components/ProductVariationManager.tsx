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
import { X, Plus, Edit2, Trash2, GripVertical, ChevronDown } from "lucide-react";
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

// Draggable item component para variações do produto
function DraggableProductVariationItem({ vt, isSelected, onSelect, onDelete, onToggleRequired, onEditName }: any) {
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
      className={`border rounded-lg p-4 cursor-pointer transition ${
        isSelected
          ? "bg-orange-50 border-orange-300"
          : "bg-white hover:bg-gray-50"
      } ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1" {...attributes} {...listeners}>
          <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-grab active:cursor-grabbing flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold">{vt.name}</h4>
            <p className="text-sm text-gray-600">
              {vt.isRequired ? "🔴 Obrigatório" : "⚪ Opcional"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleRequired(vt.id, vt.isRequired);
            }}
            className={vt.isRequired ? "bg-red-50 border-red-300 hover:bg-red-100" : "bg-gray-50"}
          >
            {vt.isRequired ? "Obrigatório" : "Opcional"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(vt.id);
            }}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Item para variações disponíveis do sistema
function SystemVariationItem({ globalType, isLinked, onAdd }: any) {
  return (
    <div className="border rounded-lg p-3 flex justify-between items-center bg-white hover:bg-gray-50 transition">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{globalType.name}</h4>
        <p className="text-xs text-gray-500">{globalType.description || "Sem descrição"}</p>
      </div>
      {!isLinked && (
        <Button
          size="sm"
          onClick={onAdd}
          className="bg-green-600 hover:bg-green-700 text-white ml-2"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      )}
      {isLinked && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
          ✓ Vinculado
        </span>
      )}
    </div>
  );
}

export function ProductVariationManager() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [editingVariationType, setEditingVariationType] = useState<number | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [expandedVariationType, setExpandedVariationType] = useState<number | null>(null);

  // Fetch all products
  const { data: products = [] } = trpc.products.getAll.useQuery();

  // Fetch variation types for selected product
  const { data: variationTypes = [], refetch: refetchVariationTypes } = trpc.variations.getByProduct.useQuery(
    { productId: selectedProductId || 0 },
    { enabled: !!selectedProductId }
  );

  // Fetch global variation types
  const { data: globalVariationTypes = [] } = trpc.adminVariations.getGlobal.useQuery();

  // Get utils for invalidation
  const utils = trpc.useUtils();

  // Mutations
  const createVariationOptionMutation = trpc.adminVariations.createOption.useMutation();
  const deleteVariationTypeMutation = trpc.adminVariations.deleteType.useMutation();
  const deleteVariationOptionMutation = trpc.adminVariations.deleteOption.useMutation();
  const updateVariationOptionMutation = trpc.adminVariations.updateOption.useMutation();
  const updateVariationTypeMutation = trpc.adminVariations.updateType.useMutation();
  const reorderVariationTypesMutation = trpc.adminVariations.reorderTypes.useMutation();
  const linkVariationTypeMutation = trpc.adminVariations.linkType.useMutation();
  const unlinkVariationTypeMutation = trpc.adminVariations.unlinkType.useMutation();

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form states
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  const [editingOptionName, setEditingOptionName] = useState("");
  const [editingOptionPrice, setEditingOptionPrice] = useState("");

  const handleAddOption = async () => {
    if (!editingVariationType || !newOptionName) {
      toast.error("Preencha o nome da opção");
      return;
    }

    try {
      await createVariationOptionMutation.mutateAsync({
        variationTypeId: editingVariationType,
        name: newOptionName,
        priceModifier: (parseFloat(newOptionPrice) || 0).toString(),
      });

      toast.success("Opção adicionada!");
      setNewOptionName("");
      setNewOptionPrice("");
      if (selectedProductId) {
        await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
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
      if (selectedProductId) {
        await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao remover tipo de variação");
      console.error(error);
    }
  };

  const handleDeleteOption = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover esta opção?")) return;

    try {
      await deleteVariationOptionMutation.mutateAsync({ id });
      toast.success("Opção removida!");
      if (selectedProductId) {
        await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao remover opção");
      console.error(error);
    }
  };

  const handleUpdateOption = async () => {
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

      toast.success("Opção atualizada!");
      setEditingOptionId(null);
      setEditingOptionName("");
      setEditingOptionPrice("");
      if (selectedProductId) {
        await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao atualizar opção");
      console.error(error);
    }
  };

  const handleToggleRequired = async (id: number, currentRequired: boolean) => {
    try {
      await updateVariationTypeMutation.mutateAsync({
        id,
        isRequired: !currentRequired,
      });

      toast.success("Tipo de variação atualizado!");
      if (selectedProductId) {
        await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao atualizar tipo de variação");
      console.error(error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedVariationTypes.findIndex((vt: VariationType) => vt.id === active.id);
      const newIndex = sortedVariationTypes.findIndex((vt: VariationType) => vt.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(sortedVariationTypes, oldIndex, newIndex);

        try {
          const updates = newOrder.map((vt: VariationType, index: number) => ({
            id: vt.id,
            order: index,
          }));

          await reorderVariationTypesMutation.mutateAsync({ updates });
          toast.success("Ordem atualizada!");

          if (selectedProductId) {
            await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
            refetchVariationTypes();
          }
        } catch (error) {
          toast.error("Erro ao reordenar variações");
          console.error(error);
        }
      }
    }
  };

  const handleAddVariationFromSystem = async (globalTypeId: number) => {
    if (!selectedProductId) {
      toast.error("Selecione um produto primeiro");
      return;
    }

    try {
      await linkVariationTypeMutation.mutateAsync({
        productId: selectedProductId,
        variationTypeId: globalTypeId,
      });

      toast.success("Tipo de variação adicionado ao produto!");
      if (selectedProductId) {
        await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao adicionar tipo de variação");
      console.error(error);
    }
  };

  const sortedVariationTypes = [...variationTypes].sort((a: VariationType, b: VariationType) =>
    (a.order || 0) - (b.order || 0)
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Product Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione um Produto</CardTitle>
          <CardDescription>Escolha o produto para gerenciar suas variações</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedProductId?.toString() || ""}
            onValueChange={(value) => {
              setSelectedProductId(parseInt(value));
              setEditingVariationType(null);
              setExpandedVariationType(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um produto..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product: any) => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Main Layout: 2 Areas */}
      {selectedProductId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ÁREA 1: Variações do Produto */}
          <Card className="lg:col-span-1">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
              <CardTitle className="text-lg">Tipos de Variações Cadastrados</CardTitle>
              <CardDescription>
                Arraste para reordenar • Clique para editar opções
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {variationTypes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-2">Nenhum tipo de variação cadastrado</p>
                  <p className="text-gray-400 text-xs">Adicione tipos disponíveis na área ao lado →</p>
                </div>
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
                    <div className="space-y-3">
                      {sortedVariationTypes.map((vt: VariationType) => (
                        <div key={vt.id} className="space-y-2">
                          <DraggableProductVariationItem
                            vt={vt}
                            isSelected={expandedVariationType === vt.id}
                            onSelect={() => setExpandedVariationType(expandedVariationType === vt.id ? null : vt.id)}
                            onDelete={handleDeleteVariationType}
                            onToggleRequired={handleToggleRequired}
                          />

                          {/* Expandable Options Section */}
                          {expandedVariationType === vt.id && (
                            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50 ml-4 space-y-3">
                              <h5 className="font-semibold text-sm text-gray-900">
                                Opções para "{vt.name}"
                              </h5>

                              {/* Add New Option */}
                              <div className="bg-white rounded-lg p-3 border border-orange-100 space-y-2">
                                <h6 className="text-xs font-semibold text-gray-700">Adicionar Opção</h6>
                                <div className="grid grid-cols-1 gap-2">
                                  <Input
                                    placeholder="Nome da opção"
                                    value={newOptionName}
                                    onChange={(e) => setNewOptionName(e.target.value)}
                                    size={1}
                                    className="text-sm"
                                  />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Modificador (R$)"
                                    value={newOptionPrice}
                                    onChange={(e) => setNewOptionPrice(e.target.value)}
                                    size={1}
                                    className="text-sm"
                                  />
                                  <Button
                                    onClick={handleAddOption}
                                    className="w-full bg-green-600 hover:bg-green-700 h-8 text-sm"
                                    disabled={createVariationOptionMutation.isPending}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Adicionar
                                  </Button>
                                </div>
                              </div>

                              {/* Options List */}
                              <div className="space-y-2">
                                {!vt.options || vt.options.length === 0 ? (
                                  <p className="text-xs text-gray-500">Nenhuma opção cadastrada</p>
                                ) : (
                                  vt.options.map((option: any) => (
                                    <div
                                      key={option.id}
                                      className="bg-white rounded-lg p-2 flex justify-between items-center text-sm border border-orange-100"
                                    >
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{option.name}</p>
                                        <p className="text-xs text-gray-600">
                                          +R$ {parseFloat(option.priceModifier).toFixed(2)}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingOptionId(option.id);
                                            setEditingOptionName(option.name);
                                            setEditingOptionPrice(option.priceModifier);
                                          }}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Edit2 className="w-3 h-3 text-blue-500" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteOption(option.id)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Edit Option Modal */}
                              {editingOptionId && (
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 space-y-2">
                                  <h6 className="text-xs font-semibold text-gray-700">Editar Opção</h6>
                                  <Input
                                    value={editingOptionName}
                                    onChange={(e) => setEditingOptionName(e.target.value)}
                                    size={1}
                                    className="text-sm"
                                    placeholder="Nome"
                                  />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editingOptionPrice}
                                    onChange={(e) => setEditingOptionPrice(e.target.value)}
                                    size={1}
                                    className="text-sm"
                                    placeholder="Modificador"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleUpdateOption}
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 h-8 text-sm"
                                      disabled={updateVariationOptionMutation.isPending}
                                    >
                                      Salvar
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setEditingOptionId(null);
                                        setEditingOptionName("");
                                        setEditingOptionPrice("");
                                      }}
                                      variant="outline"
                                      className="flex-1 h-8 text-sm"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* ÁREA 2: Variações Disponíveis no Sistema */}
          <Card className="lg:col-span-1">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
              <CardTitle className="text-lg">Tipos Disponíveis no Sistema</CardTitle>
              <CardDescription>
                Clique em "Adicionar" para vincular ao produto
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {globalVariationTypes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Nenhum tipo disponível no sistema</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {globalVariationTypes.map((globalType: any) => {
                    const isLinked = variationTypes.some((vt: VariationType) => vt.id === globalType.id);
                    return (
                      <SystemVariationItem
                        key={globalType.id}
                        globalType={globalType}
                        isLinked={isLinked}
                        onAdd={() => handleAddVariationFromSystem(globalType.id)}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
