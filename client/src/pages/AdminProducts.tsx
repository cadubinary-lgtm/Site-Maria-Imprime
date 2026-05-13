import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Edit2, Trash2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import MultiSegmentSelector from "@/components/MultiSegmentSelector";

export default function AdminProducts() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    segmentIds: [] as number[],
  });

  const { data: products, isLoading, refetch } = trpc.products.getAll.useQuery();
  const { data: productSegments } = trpc.productSegments.getProductSegments.useQuery(
    editingId || 0,
    { enabled: !!editingId }
  );
  const updateProductMutation = trpc.admin.updateProduct.useMutation();
  const updateSegmentsMutation = trpc.productSegments.updateSegments.useMutation();
  const deleteProductMutation = trpc.admin.deleteProduct.useMutation();

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
    setEditForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      imageUrl: product.imageUrl || "",
      segmentIds: [],
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      // Atualizar dados básicos do produto (sem segmento único)
      await updateProductMutation.mutateAsync({
        id: editingId,
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        segment: "alimentacao", // Valor padrão, será ignorado
        imageUrl: editForm.imageUrl,
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

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;

    try {
      await deleteProductMutation.mutateAsync({ id });
      toast.success("Produto removido com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao remover produto");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Produtos</h1>
          </div>
          <Link href="/admin">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </Link>
        </div>
      </header>

      {/* Products List */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Search Bar */}
        <div className="mb-8">
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
            <p className="text-sm text-gray-600 mt-2">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
            </p>
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
              <Card key={product.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
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
                    <div className="flex gap-2 justify-end">
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
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
