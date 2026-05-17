'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Edit2, Trash2, GripVertical, Move } from "lucide-react";
import { toast } from "sonner";
import { useState } from 'react';

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

// Draggable global type component com controles completos
function DraggableGlobalType({ globalType, isLinked, onEdit, onToggleRequired, onDelete, onSelectOptions }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: `global-${globalType.id}`,
    data: { type: 'global-type', globalType }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 cursor-move transition ${
        isLinked ? 'bg-green-50 border-green-300 opacity-50' : 'bg-white hover:bg-blue-50 hover:border-blue-300'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1">
          <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-grab active:cursor-grabbing" />
          <div>
            <h4 className="font-semibold">{globalType.name}</h4>
            <p className="text-sm text-gray-600">
              {globalType.isRequired ? "Obrigatório" : "Opcional"} • Ordem: {globalType.order || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">{globalType.description}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(globalType.id, globalType.name)}
            className="text-yellow-500 hover:text-yellow-700"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectOptions(globalType.id)}
            className="text-green-500 hover:text-green-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleRequired(globalType.id, globalType.isRequired)}
            className={globalType.isRequired ? "text-blue-500 hover:text-blue-700" : "text-red-500 hover:text-red-700"}
          >
            {globalType.isRequired ? "Obrigatório" : "Opcional"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(globalType.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Draggable variation item component
function DraggableVariationItem({ vt, isSelected, onSelect, onDelete, onToggleRequired, onEditName }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: vt.id,
    data: { type: 'product-variation', variation: vt }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 cursor-move transition ${
        isSelected ? 'bg-yellow-50 border-yellow-300' : 'bg-white hover:bg-gray-50'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1">
          <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-grab active:cursor-grabbing" />
          <div>
            <h4 className="font-semibold">{vt.name}</h4>
            <p className="text-sm text-gray-600">
              {vt.isRequired ? "Obrigatório" : "Opcional"} • Ordem: {vt.order || 0}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditName(vt.id, vt.name)}
            className="text-yellow-500 hover:text-yellow-700"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(vt.id)}
            className="text-green-500 hover:text-green-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleRequired(vt.id, vt.isRequired)}
            className={vt.isRequired ? "text-blue-500 hover:text-blue-700" : "text-red-500 hover:text-red-700"}
          >
            {vt.isRequired ? "Obrigatório" : "Opcional"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(vt.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Dropzone component para receber drops da coluna 2
function GlobalTypesDropZone({ children }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'global-types-dropzone'
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 transition ${
        isOver ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
      }`}
    >
      {children}
    </div>
  );
}

export function ProductVariationManager() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [editingVariationType, setEditingVariationType] = useState<number | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [editingVariationNameId, setEditingVariationNameId] = useState<number | null>(null);
  const [editingVariationName, setEditingVariationName] = useState("");
  const [newVariationTypeName, setNewVariationTypeName] = useState("");
  const [newVariationTypeRequired, setNewVariationTypeRequired] = useState(true);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  const [editingOptionName, setEditingOptionName] = useState("");
  const [editingOptionPrice, setEditingOptionPrice] = useState("");

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
  const createVariationTypeMutation = trpc.adminVariations.createType.useMutation();
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

  // Handlers
  const handleAddVariationType = async () => {
    if (!selectedProductId || !newVariationTypeName) {
      toast.error("Preencha o nome da variação");
      return;
    }

    try {
      await createVariationTypeMutation.mutateAsync({
        productId: selectedProductId,
        name: newVariationTypeName,
        type: "material",
        isRequired: newVariationTypeRequired,
      });

      toast.success("Variação criada!");
      setNewVariationTypeName("");
      setNewVariationTypeRequired(true);
      if (selectedProductId) {
        if (selectedProductId) await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao criar variação");
      console.error(error);
    }
  };

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
        if (selectedProductId) await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao adicionar opção");
      console.error(error);
    }
  };

  const handleDeleteVariationType = async (id: number) => {
    try {
      await deleteVariationTypeMutation.mutateAsync({ id });
      toast.success("Variação deletada!");
      if (selectedProductId) {
        if (selectedProductId) await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao deletar variação");
      console.error(error);
    }
  };

  const handleDeleteOption = async (id: number) => {
    try {
      await deleteVariationOptionMutation.mutateAsync({ id });
      toast.success("Opção deletada!");
      if (selectedProductId) {
        if (selectedProductId) await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao deletar opção");
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
        if (selectedProductId) await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
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

      toast.success("Status atualizado!");
      if (selectedProductId) {
        if (selectedProductId) await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    }
  };

  const handleEditVariationName = (id: number, name: string) => {
    setEditingVariationNameId(id);
    setEditingVariationName(name);
  };

  const handleSaveVariationName = async () => {
    if (!editingVariationNameId || !editingVariationName) {
      toast.error("Preencha o nome da variação");
      return;
    }

    try {
      await updateVariationTypeMutation.mutateAsync({
        id: editingVariationNameId,
        name: editingVariationName,
      });

      toast.success("Nome da variação atualizado!");
      setEditingVariationNameId(null);
      setEditingVariationName("");
      if (selectedProductId) {
        if (selectedProductId) await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao atualizar nome da variação");
      console.error(error);
    }
  };

  const handleCancelEditVariationName = () => {
    setEditingVariationNameId(null);
    setEditingVariationName("");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Drag-drop para desvincular (coluna 1 → coluna 2)
    if (active.data.current?.type === 'product-variation' && over.id === 'global-types-dropzone') {
      const variationId = active.id as number;
      try {
        await unlinkVariationTypeMutation.mutateAsync({
          productId: selectedProductId!,
          variationTypeId: variationId,
        });
        toast.success('Variação desvinculada!');
        if (selectedProductId) await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      } catch (error) {
        toast.error('Erro ao desvincular variação');
        console.error(error);
      }
      return;
    }

    // Drag-drop para vincular (coluna 2 → coluna 1)
    if (active.data.current?.type === 'global-type' && over.id === 'product-variations-list') {
      const globalType = active.data.current.globalType;
      if (!selectedProductId) {
        toast.error('Selecione um produto primeiro');
        return;
      }

      try {
        const isAlreadyLinked = variationTypes.some((vt: VariationType) => vt.id === globalType.id);
        if (isAlreadyLinked) {
          toast.info(`${globalType.name} já está vinculado ao produto`);
          return;
        }

        await linkVariationTypeMutation.mutateAsync({
          productId: selectedProductId,
          variationTypeId: globalType.id,
          isRequired: true,
          order: variationTypes.length,
        });

        toast.success(`${globalType.name} adicionado com sucesso!`);
        if (selectedProductId) await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        await refetchVariationTypes();
      } catch (error) {
        toast.error(`Erro ao adicionar ${globalType.name}`);
        console.error(error);
      }
      return;
    }

    // Drag-drop dentro da coluna 1 (reordenar)
    if (active.id !== over.id && active.data.current?.type === 'product-variation' && over.data.current?.type === 'product-variation') {
      const oldIndex = variationTypes.findIndex((vt: VariationType) => vt.id === active.id);
      const newIndex = variationTypes.findIndex((vt: VariationType) => vt.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(variationTypes, oldIndex, newIndex);

        try {
          const updates = newOrder.map((vt: VariationType, index: number) => ({
            id: vt.id,
            order: index,
          }));

          await reorderVariationTypesMutation.mutateAsync({ updates });
          toast.success('Ordem atualizada!');

          if (selectedProductId) {
            if (selectedProductId) await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
            refetchVariationTypes();
          }
        } catch (error) {
          toast.error('Erro ao reordenar variações');
          console.error(error);
        }
      }
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
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um produto..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product: any) => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.name} (ID: {product.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Main Layout with Unified DnD Context */}
      {selectedProductId && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ÁREA 1: Gerenciar Variações */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tipos de Variações Cadastrados do Produto</CardTitle>
                <CardDescription>
                  Adicione, edite, remova ou reordene tipos de variações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Variation Type */}
                <div className="border rounded-lg p-4 bg-orange-50">
                  <h3 className="font-semibold mb-4 text-orange-900">Adicionar Novo Tipo de Variação</h3>
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

                {/* Variation Types List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">Variações Vinculadas (Arraste para reordenar)</h3>
                  {variationTypes.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">Nenhum tipo de variação cadastrado</p>
                      <p className="text-gray-400 text-xs mt-1">Crie um novo tipo acima ou arraste um da coluna ao lado →</p>
                    </div>
                  ) : (
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
                            onEditName={handleEditVariationName}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>

                {/* Edit Variation Name */}
                {editingVariationNameId && (
                  <div className="border-t pt-6 space-y-4 bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold">Editar Nome da Variação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="editVariationName">Novo Nome</Label>
                        <Input
                          id="editVariationName"
                          value={editingVariationName}
                          onChange={(e) => setEditingVariationName(e.target.value)}
                          className="mt-1"
                          placeholder="Digite o novo nome da variação"
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <Button
                          onClick={handleSaveVariationName}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                        >
                          Salvar
                        </Button>
                        <Button
                          onClick={handleCancelEditVariationName}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Options */}
                {editingVariationType && (
                  <div className="border-t pt-6 space-y-4 bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold">Editar Opções da Variação</h3>

                    {/* Add New Option */}
                    <div className="border rounded-lg p-3 bg-white">
                      <h4 className="font-medium text-sm mb-3">Adicionar Nova Opção</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          placeholder="Nome da opção"
                          value={newOptionName}
                          onChange={(e) => setNewOptionName(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Preço modificador"
                          value={newOptionPrice}
                          onChange={(e) => setNewOptionPrice(e.target.value)}
                        />
                        <Button
                          onClick={handleAddOption}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={createVariationOptionMutation.isPending}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    </div>

                    {/* Edit Option */}
                    {editingOptionId && (
                      <div className="border rounded-lg p-3 bg-blue-50">
                        <h4 className="font-medium text-sm mb-3">Editar Opção</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            placeholder="Nome da opção"
                            value={editingOptionName}
                            onChange={(e) => setEditingOptionName(e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Preço modificador"
                            value={editingOptionPrice}
                            onChange={(e) => setEditingOptionPrice(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleUpdateOption}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              disabled={updateVariationOptionMutation.isPending}
                            >
                              Salvar
                            </Button>
                            <Button
                              onClick={() => setEditingOptionId(null)}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* List Options */}
                    {variationTypes.find((vt: VariationType) => vt.id === editingVariationType)?.options && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Opções Existentes</h4>
                        {variationTypes.find((vt: VariationType) => vt.id === editingVariationType)?.options?.map((option: VariationOption) => (
                          <div key={option.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div>
                              <p className="font-medium text-sm">{option.name}</p>
                              <p className="text-xs text-gray-600">Preço: +R$ {option.priceModifier}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingOptionId(option.id);
                                  setEditingOptionName(option.name);
                                  setEditingOptionPrice(option.priceModifier.toString());
                                }}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOption(option.id)}
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
                )}
              </CardContent>
            </Card>

            {/* ÁREA 2: Tipos Globais Disponíveis */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Tipos Disponíveis no Sistema</CardTitle>
                <CardDescription>
                  Arraste para adicionar ao produto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GlobalTypesDropZone>
                  <p className="text-xs text-gray-500 mb-3">💡 Arraste variações aqui para desvincular</p>
                  {globalVariationTypes.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhum tipo global disponível</p>
                  ) : (
                    <SortableContext
                      items={globalVariationTypes.map((gt: any) => `global-${gt.id}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {globalVariationTypes.map((globalType: any) => {
                          const isLinked = variationTypes.some((vt: VariationType) => vt.id === globalType.id);
                          return (
                            <DraggableGlobalType
                              key={globalType.id}
                              globalType={globalType}
                              isLinked={isLinked}
                              onEdit={(id: number, name: string) => {
                                setEditingVariationNameId(id);
                                setEditingVariationName(name);
                              }}
                              onSelectOptions={(id: number) => {
                                setEditingVariationType(id);
                              }}
                              onToggleRequired={(id: number, isRequired: boolean) => {
                                handleToggleRequired(id, isRequired);
                              }}
                              onDelete={(id: number) => {
                                handleDeleteVariationType(id);
                              }}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  )}
                </GlobalTypesDropZone>
              </CardContent>
            </Card>
          </div>
        </DndContext>
      )}
    </div>
  );
}
