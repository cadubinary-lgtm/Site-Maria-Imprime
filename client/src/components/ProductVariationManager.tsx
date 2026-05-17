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
function DraggableVariationItem({ vt, isSelected, onSelect, onDelete, onToggleRequired, onEditName }: any) {
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
          <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-grab active:cursor-grabbing" />
          <div>
            <h4 className="font-semibold">{vt.name}</h4>
            <p className="text-sm text-gray-600">
              {vt.isRequired ? "Obrigatório" : "Opcional"} • Ordem: {vt.order}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEditName(vt.id, vt.name);
            }}
            className="bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(vt.id);
            }}
            className="bg-green-50 border-green-300 hover:bg-green-100"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Opções
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleRequired(vt.id, vt.isRequired);
            }}
            className={vt.isRequired ? "bg-blue-50 border-blue-300" : "bg-gray-50"}
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
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductVariationManager() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [editingVariationType, setEditingVariationType] = useState<number | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [editingVariationNameId, setEditingVariationNameId] = useState<number | null>(null);
  const [editingVariationName, setEditingVariationName] = useState("");

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

  // Form states
  const [newVariationTypeName, setNewVariationTypeName] = useState("");
  const [newVariationTypeRequired, setNewVariationTypeRequired] = useState(true);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  const [editingOptionName, setEditingOptionName] = useState("");
  const [editingOptionPrice, setEditingOptionPrice] = useState("");

  const handleAddVariationType = async () => {
    if (!selectedProductId || !newVariationTypeName) {
      toast.error("Selecione um produto e preencha o nome da variação");
      return;
    }

    try {
      await createVariationTypeMutation.mutateAsync({
        productId: selectedProductId,
        name: newVariationTypeName,
        type: "material" as const,
        isRequired: newVariationTypeRequired,
      });

      toast.success("Tipo de variação adicionado!");
      setNewVariationTypeName("");
      setNewVariationTypeRequired(true);
      if (selectedProductId) {
        await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao adicionar tipo de variação");
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

      toast.success(!currentRequired ? "Marcado como Obrigatório" : "Marcado como Opcional");
      if (selectedProductId) {
        await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
        refetchVariationTypes();
      }
    } catch (error) {
      toast.error("Erro ao atualizar tipo de variação");
      console.error(error);
    }
  };

  const handleEditVariationName = (id: number, currentName: string) => {
    setEditingVariationNameId(id);
    setEditingVariationName(currentName);
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
        await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
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

    if (over && active.id !== over.id) {
      const oldIndex = variationTypes.findIndex((vt: VariationType) => vt.id === active.id);
      const newIndex = variationTypes.findIndex((vt: VariationType) => vt.id === over.id);

      const newOrder = arrayMove(variationTypes, oldIndex, newIndex);
      
      try {
        // Atualizar ordem no backend
        const updates = newOrder.map((vt: VariationType, index: number) => ({
          id: vt.id,
          order: index + 1,
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

      {/* Main Layout: 2 Areas */}
      {selectedProductId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ÁREA 1: Gerenciar Variações (2 colunas) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tipos de Variações Cadastrados do Produto</CardTitle>
              <CardDescription>
                Adicione, edite, remova ou reordene tipos de variações e suas opções
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            {/* Add New Variation Type */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-4">Adicionar Novo Tipo de Variação</h3>
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
                          onEditName={handleEditVariationName}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={handleSaveVariationName}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={updateVariationTypeMutation.isPending}
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

            {/* Options for Selected Variation Type */}
            {editingVariationType && !editingVariationNameId && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold">
                  Opções para "{variationTypes.find((vt: VariationType) => vt.id === editingVariationType)?.name}"
                </h3>

                {/* Add New Option */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-4">Adicionar Nova Opção</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="optionName">Nome da Opção</Label>
                      <Input
                        id="optionName"
                        placeholder="Ex: Vinil Brilho, Acabamento Fosco"
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="optionPrice">Modificador de Preço (R$)</Label>
                      <Input
                        id="optionPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newOptionPrice}
                        onChange={(e) => setNewOptionPrice(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAddOption}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={createVariationOptionMutation.isPending}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Edit Option Modal */}
                {editingOptionId && (
                  <div className="border rounded-lg p-4 bg-blue-50 space-y-4">
                    <h4 className="font-semibold">Editar Opção</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="editOptionName">Nome da Opção</Label>
                        <Input
                          id="editOptionName"
                          value={editingOptionName}
                          onChange={(e) => setEditingOptionName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editOptionPrice">Modificador de Preço (R$)</Label>
                        <Input
                          id="editOptionPrice"
                          type="number"
                          step="0.01"
                          value={editingOptionPrice}
                          onChange={(e) => setEditingOptionPrice(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <Button
                          onClick={handleUpdateOption}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-2">
                  {!variationTypes.find((vt: VariationType) => vt.id === editingVariationType)?.options || variationTypes.find((vt: VariationType) => vt.id === editingVariationType)?.options.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhuma opção cadastrada</p>
                  ) : (
                    <div className="grid gap-2">
                      {variationTypes.find((vt: VariationType) => vt.id === editingVariationType)?.options?.map((option: any) => (
                        <div
                          key={option.id}
                          className="border rounded-lg p-3 flex justify-between items-center bg-white hover:bg-gray-50"
                        >
                          <div>
                            <h5 className="font-medium">{option.name}</h5>
                            <p className="text-sm text-gray-600">
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
              </div>
            )}
          </CardContent>
          </Card>

          {/* ÁREA 2: Tipos Globais Disponíveis (1 coluna) */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Tipos Disponíveis no Sistema</CardTitle>
              <CardDescription>
                Selecione para adicionar ao produto
              </CardDescription>
            </CardHeader>
            <CardContent>

            <div className="space-y-3">
              {globalVariationTypes.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum tipo global disponível</p>
              ) : (
                globalVariationTypes.map((globalType: any) => {
                  const isLinked = variationTypes.some((vt: VariationType) => vt.id === globalType.id);
                  return (
                    <div
                      key={globalType.id}
                      className="border rounded-lg p-3 flex justify-between items-center bg-white hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{globalType.name}</h4>
                        <p className="text-sm text-gray-600">{globalType.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isLinked}
                          onChange={async (e) => {
                            if (!selectedProductId) return;
                            
                            try {
                              if (e.target.checked) {
                                // Vincular tipo
                                await linkVariationTypeMutation.mutateAsync({
                                  productId: selectedProductId,
                                  variationTypeId: globalType.id,
                                  isRequired: true,
                                  order: 0,
                                });
                                toast.success(`${globalType.name} vinculado com sucesso`);
                              } else {
                                // Desvincular tipo
                                await unlinkVariationTypeMutation.mutateAsync({
                                  productId: selectedProductId,
                                  variationTypeId: globalType.id,
                                });
                                toast.success(`${globalType.name} desvinculado com sucesso`);
                              }
                              // Invalidar cache
                              await utils.variations.getByProduct.invalidate({ productId: selectedProductId });
                              refetchVariationTypes();
                            } catch (error) {
                              toast.error(`Erro ao ${e.target.checked ? 'vincular' : 'desvincular'} ${globalType.name}`);
                              console.error(error);
                            }
                          }}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
