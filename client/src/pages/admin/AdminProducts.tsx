import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Edit2, Trash2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import MultiSegmentSelector from "@/components/MultiSegmentSelector";
import { DeliveryOptionsManager } from "@/components/DeliveryOptionsManager";

export default function AdminProducts() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    segmentIds: [] as number[],
    calculationType: "unidade",
    pricePerM2: "",
    minWidth: "",
    maxWidth: "",
    minHeight: "",
    maxHeight: "",
  });

  const { data: products, isLoading, refetch } = trpc.products.getAll.useQuery();
  const { data: productSegments } = trpc.productSegments.getProductSegments.useQuery(
    editingId || 0,
    { enabled: !!editingId }
  );
  const updateProductMutation = trpc.admin.updateProduct.useMutation();
  const updateSegmentsMutation = trpc.productSegments.updateSegments.useMutation();
  const utils = trpc.useUtils();
  const deleteProductMutation = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      utils.products.getAll.invalidate();
    },
  });
  const deleteMultipleProductsMutation = trpc.admin.deleteMultipleProducts.useMutation({
    onSuccess: () => {
      utils.products.getAll.invalidate();
    },
  });

  // Atualizar segmentos quando carrega produto
  useEffect(() => {
    if (productSegments) {
      setEditForm((prev) => ({
        ...prev,
        segmentIds: productSegments.map((s) => s.id),
      }));
    }
  }, [productSegments]);

  // Memoizar handler para evitar loop infinito
  const handleSegmentsChange = useCallback((segmentIds: number[]) => {
    setEditForm((prev) => ({ ...prev, segmentIds }));
  }, []);

  // Filtrar produtos por nome
  const filteredProducts = products?.filter((product: any) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    // Não inicializar segmentIds aqui - deixar o useEffect carregar
    setEditForm((prev) => ({
      ...prev,
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      imageUrl: product.imageUrl || "",
      calculationType: product.calculationType || "unidade",
      pricePerM2: product.pricePerM2 ? product.pricePerM2.toString() : "",
      minWidth: product.minWidth ? product.minWidth.toString() : "",
      maxWidth: product.maxWidth ? product.maxWidth.toString() : "",
      minHeight: product.minHeight ? product.minHeight.toString() : "",
      maxHeight: product.maxHeight ? product.maxHeight.toString() : "",
      // segmentIds será preenchido pelo useEffect quando productSegments carregar
    }));
  };

  const handleSave = async () => {
    if (!editingId) return;

    // Validações obrigatórias
    if (!editForm.name.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }
    
    if (!editForm.price || parseFloat(editForm.price as any) <= 0) {
      toast.error("Preço é obrigatório e deve ser maior que 0");
      return;
    }
    
    if ((editForm as any).calculationType === "m2") {
      if (!(editForm as any).pricePerM2 || parseFloat((editForm as any).pricePerM2) <= 0) {
        toast.error("Preço por m² é obrigatório e deve ser maior que 0");
        return;
      }
      if (!(editForm as any).minWidth || parseFloat((editForm as any).minWidth) <= 0) {
        toast.error("Largura mínima é obrigatória e deve ser maior que 0");
        return;
      }
      if (!(editForm as any).maxWidth || parseFloat((editForm as any).maxWidth) <= 0) {
        toast.error("Largura máxima é obrigatória e deve ser maior que 0");
        return;
      }
      if (!(editForm as any).minHeight || parseFloat((editForm as any).minHeight) <= 0) {
        toast.error("Altura mínima é obrigatória e deve ser maior que 0");
        return;
      }
      if (!(editForm as any).maxHeight || parseFloat((editForm as any).maxHeight) <= 0) {
        toast.error("Altura máxima é obrigatória e deve ser maior que 0");
        return;
      }
      if (parseFloat((editForm as any).minWidth) >= parseFloat((editForm as any).maxWidth)) {
        toast.error("Largura máxima deve ser maior que a mínima");
        return;
      }
      if (parseFloat((editForm as any).minHeight) >= parseFloat((editForm as any).maxHeight)) {
        toast.error("Altura máxima deve ser maior que a mínima");
        return;
      }
    }

    try {
      // Atualizar dados básicos do produto (sem segmento único)
      await updateProductMutation.mutateAsync({
        id: editingId,
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        segment: "alimentacao", // Valor padrão, será ignorado
        imageUrl: editForm.imageUrl,
        calculationType: (editForm as any).calculationType,
        pricePerM2: (editForm as any).calculationType === "m2" ? (editForm as any).pricePerM2 : undefined,
        minWidth: (editForm as any).calculationType === "m2" ? (editForm as any).minWidth : undefined,
        maxWidth: (editForm as any).calculationType === "m2" ? (editForm as any).maxWidth : undefined,
        minHeight: (editForm as any).calculationType === "m2" ? (editForm as any).minHeight : undefined,
        maxHeight: (editForm as any).calculationType === "m2" ? (editForm as any).maxHeight : undefined,
      });

      // Atualizar múltiplos segmentos
      await updateSegmentsMutation.mutateAsync({
        productId: editingId,
        segmentIds: editForm.segmentIds,
      });

      toast.success("Produto atualizado com sucesso!");
      setEditingId(null);
      refetch();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao atualizar produto");
    }
  };

  const handleToggleProduct = (id: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p: any) => p.id)));
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedProducts.size === 0) {
      toast.error("Selecione pelo menos um produto");
      return;
    }

    if (!confirm(`Tem certeza que deseja remover ${selectedProducts.size} produto(s)? Esta ação não pode ser desfeita.`)) return;

    try {
      await deleteMultipleProductsMutation.mutateAsync({ ids: Array.from(selectedProducts) });
      toast.success(`${selectedProducts.size} produto(s) removido(s) com sucesso!`);
      setSelectedProducts(new Set());
    } catch (error) {
      toast.error("Erro ao remover produtos");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;

    try {
      // Optimistic update: remover da lista imediatamente
      utils.products.getAll.setData(undefined, (old: any) =>
        old ? old.filter((p: any) => p.id !== id) : old
      );
      await deleteProductMutation.mutateAsync({ id });
      toast.success("Produto removido com sucesso!");
    } catch (error) {
      // Reverter em caso de erro
      utils.products.getAll.invalidate();
      toast.error("Erro ao remover produto");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar and Bulk Actions */}
      <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Bulk Actions Bar */}
          {filteredProducts.length > 0 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-600">
                  {selectedProducts.size > 0
                    ? `${selectedProducts.size} produto(s) selecionado(s)`
                    : "Selecionar produtos"}
                </span>
              </div>
              {selectedProducts.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteMultiple}
                  disabled={deleteMultipleProductsMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteMultipleProductsMutation.isPending ? "Removendo..." : `Remover ${selectedProducts.size}`}
                </Button>
              )}
            </div>
        )}
      </div>

      {!products || products.length === 0 ? (
        <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">Nenhum produto criado ainda</p>
              <Link href="/admin">
                <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
                  Criar Primeiro Produto
                </Button>
              </Link>
            </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">Nenhum produto encontrado com "{searchQuery}"</p>
              <Button
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="mt-4 text-orange-500 hover:text-orange-600"
              >
                Limpar busca
              </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredProducts.map((product: any) => (
              <Card key={product.id} className={selectedProducts.has(product.id) ? "border-orange-500 bg-orange-50" : ""}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                    {/* Checkbox */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleToggleProduct(product.id)}
                        className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                      />
                    </div>

                    {/* Product Image */}
                    <div>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">Sem imagem</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="md:col-span-2">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <div className="flex gap-4">
                        <span className="text-sm font-semibold text-gray-900">
                          R$ {parseFloat(product.price.toString()).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end md:col-span-1">
                      <Dialog open={editingId === product.id} onOpenChange={(open) => !open && setEditingId(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Editar Produto</DialogTitle>
                            <DialogDescription>
                              Atualize as informações do produto
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-name">Nome</Label>
                              <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, name: e.target.value })
                                }
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-description">Descrição</Label>
                              <Textarea
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, description: e.target.value })
                                }
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-price">Preço (R$)</Label>
                              <Input
                                id="edit-price"
                                type="number"
                                step="0.01"
                                value={editForm.price}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, price: e.target.value })
                                }
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-calculationType">Tipo de Cobrança</Label>
                              <Select
                                value={(editForm as any).calculationType || "unidade"}
                                onValueChange={(value) =>
                                  setEditForm({ ...editForm, calculationType: value } as any)
                                }
                              >
                                <SelectTrigger id="edit-calculationType">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unidade">Unidade</SelectItem>
                                  <SelectItem value="m2">m²</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {(editForm as any).calculationType === "m2" && (
                              <>
                                <div>
                                  <Label htmlFor="edit-pricePerM2">Preço por m² (R$)</Label>
                                  <Input
                                    id="edit-pricePerM2"
                                    type="number"
                                    step="0.01"
                                    value={(editForm as any).pricePerM2 || ""}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, pricePerM2: e.target.value } as any)
                                    }
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor="edit-minWidth">Largura Mín (m)</Label>
                                    <Input
                                      id="edit-minWidth"
                                      type="number"
                                      step="0.01"
                                      value={(editForm as any).minWidth || ""}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, minWidth: e.target.value } as any)
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-maxWidth">Largura Máx (m)</Label>
                                    <Input
                                      id="edit-maxWidth"
                                      type="number"
                                      step="0.01"
                                      value={(editForm as any).maxWidth || ""}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, maxWidth: e.target.value } as any)
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor="edit-minHeight">Altura Mín (m)</Label>
                                    <Input
                                      id="edit-minHeight"
                                      type="number"
                                      step="0.01"
                                      value={(editForm as any).minHeight || ""}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, minHeight: e.target.value } as any)
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-maxHeight">Altura Máx (m)</Label>
                                    <Input
                                      id="edit-maxHeight"
                                      type="number"
                                      step="0.01"
                                      value={(editForm as any).maxHeight || ""}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, maxHeight: e.target.value } as any)
                                      }
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            {editingId && (
                              <DeliveryOptionsManager
                                productId={editingId}
                                calculationType={(editForm as any).calculationType || "m2"}
                              />
                            )}

                            <div>
                              <Label>Segmentos</Label>
                              <MultiSegmentSelector
                                productId={editingId || 0}
                                selectedSegmentIds={editForm.segmentIds}
                                onSegmentsChange={handleSegmentsChange}
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-imageUrl">URL da Imagem</Label>
                              <Input
                                id="edit-imageUrl"
                                value={editForm.imageUrl}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, imageUrl: e.target.value })
                                }
                              />
                            </div>

                            <Button
                              onClick={handleSave}
                              className="w-full bg-orange-500 hover:bg-orange-600"
                              disabled={updateProductMutation.isPending || updateSegmentsMutation.isPending}
                            >
                              {updateProductMutation.isPending || updateSegmentsMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                "Salvar Alterações"
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteProductMutation.isPending}
                        title="Remover este produto individualmente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
      )}
    </div>
  );
}
