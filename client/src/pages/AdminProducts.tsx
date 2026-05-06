import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const SEGMENTS = [
  { id: "alimentacao", label: "Alimentação" },
  { id: "beleza", label: "Beleza & Saúde" },
  { id: "varejo", label: "Varejo" },
  { id: "servicos", label: "Serviços" },
];

export default function AdminProducts() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    segment: "alimentacao",
    imageUrl: "",
  });

  const { data: products, isLoading, refetch } = trpc.products.getAll.useQuery();
  const updateProductMutation = trpc.admin.updateProduct.useMutation();
  const deleteProductMutation = trpc.admin.deleteProduct.useMutation();

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      segment: product.segment,
      imageUrl: product.imageUrl || "",
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      await updateProductMutation.mutateAsync({
        id: editingId,
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        segment: editForm.segment as "alimentacao" | "beleza" | "varejo" | "servicos",
        imageUrl: editForm.imageUrl,
      });

      toast.success("Produto atualizado com sucesso!");
      setEditingId(null);
      refetch();
    } catch (error) {
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
        ) : (
          <div className="grid gap-6">
            {products.map((product: any) => (
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
                        <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded capitalize">
                          {product.segment}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                      <Dialog>
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
                        <DialogContent>
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
                              <Label htmlFor="edit-segment">Segmento</Label>
                              <Select
                                value={editForm.segment}
                                onValueChange={(value) =>
                                  setEditForm({ ...editForm, segment: value })
                                }
                              >
                                <SelectTrigger id="edit-segment">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SEGMENTS.map((seg) => (
                                    <SelectItem key={seg.id} value={seg.id}>
                                      {seg.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                              disabled={updateProductMutation.isPending}
                            >
                              {updateProductMutation.isPending ? (
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
