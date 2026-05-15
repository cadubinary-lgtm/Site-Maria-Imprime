import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface VariationType {
  id: number;
  name: string;
  type: string;
  isRequired: boolean;
  options?: VariationOption[];
}

interface VariationOption {
  id: number;
  name: string;
  priceModifier: string | number;
}

export function ProductVariationManager() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [editingVariationType, setEditingVariationType] = useState<number | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);

  // Fetch all products
  const { data: products = [] } = trpc.products.getAll.useQuery();

  // Fetch variation types for selected product
  const { data: variationTypes = [], refetch: refetchVariationTypes } = trpc.variations.getByProduct.useQuery(
    { productId: selectedProductId || 0 },
    { enabled: !!selectedProductId }
  );

  // Get utils for invalidation
  const utils = trpc.useUtils();

  // Mutations
  const createVariationTypeMutation = trpc.adminVariations.createType.useMutation();
  const createVariationOptionMutation = trpc.adminVariations.createOption.useMutation();
  const deleteVariationTypeMutation = trpc.adminVariations.deleteType.useMutation();
  const deleteVariationOptionMutation = trpc.adminVariations.deleteOption.useMutation();
  const updateVariationOptionMutation = trpc.adminVariations.updateOption.useMutation();

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

      {/* Variation Management */}
      {selectedProductId && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Variações</CardTitle>
            <CardDescription>
              Adicione, edite ou remova tipos de variações e suas opções
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

            {/* Variation Types List */}
            <div className="space-y-3">
              <h3 className="font-semibold">Tipos de Variações Cadastrados</h3>
              {variationTypes.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum tipo de variação cadastrado</p>
              ) : (
                <div className="grid gap-3">
                  {variationTypes.map((vt: VariationType) => (
                    <div
                      key={vt.id}
                      className={`border rounded-lg p-4 cursor-pointer transition ${
                        editingVariationType === vt.id
                          ? "bg-orange-50 border-orange-300"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      onClick={() => setEditingVariationType(vt.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{vt.name}</h4>
                          <p className="text-sm text-gray-600">
                            {vt.isRequired ? "Obrigatório" : "Opcional"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVariationType(vt.id);
                          }}
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

            {/* Options for Selected Variation Type */}
            {editingVariationType && (
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
      )}
    </div>
  );
}
