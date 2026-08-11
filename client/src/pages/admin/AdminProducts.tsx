import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Edit2, Trash2, Plus, Search, X, Package } from "lucide-react";
import { formatProductPrice } from "@/lib/productPrice";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import { ProductLogisticsTab } from "@/components/products/ProductLogisticsTab";
import { ProductImageUploader } from "@/components/products/ProductImageUploader";
import MultiSegmentSelector from "@/components/MultiSegmentSelector";
import { DeliveryOptionsManager, type DeliveryOptionData } from "@/components/products/DeliveryOptionsManager";

export default function AdminProducts() {
  const [, navigate] = useLocation();

  // ─── Estado de edição ─────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
  const [quickEditingId, setQuickEditingId] = useState<number | null>(null);
  const [quickPrice, setQuickPrice] = useState("");
  const [quickCalculationType, setQuickCalculationType] = useState("unidade");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    imageKey: "",
    galleryUrls: [] as string[],
    segmentIds: [] as number[],
    calculationType: "unidade",
    pricePerM2: "",
    minWidth: "",
    maxWidth: "",
    minHeight: "",
    maxHeight: "",
    specifications: [] as { label: string; value: string }[],
    tags: [] as string[],
    tagPosition: "top-right" as string,
  });

  // ─── Queries & Mutations ──────────────────────────────────────────────────
  const { data: products, isLoading, refetch } = trpc.products.getAll.useQuery();
  const { data: productSegments } = trpc.productSegments.getProductSegments.useQuery(
    editingId || 0,
    { enabled: !!editingId }
  );
  const { data: segmentsData, isLoading: segmentsLoading } = trpc.segments.getAll.useQuery();
  const { data: carriersData } = trpc.logistics.carriers.list.useQuery();

  const SEGMENTS = useMemo(() => {
    if (!segmentsData || segmentsData.length === 0) return [];
    return segmentsData.map((seg: any) => ({
      id: seg.slug,
      label: `${seg.icon || "📦"} ${seg.name}`,
    }));
  }, [segmentsData]);

  const updateProductMutation = trpc.admin.updateProduct.useMutation();
  const updateSegmentsMutation = trpc.productSegments.updateSegments.useMutation();
  const utils = trpc.useUtils();
  const deleteProductMutation = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => { utils.products.getAll.invalidate(); },
  });
  const deleteMultipleProductsMutation = trpc.admin.deleteMultipleProducts.useMutation({
    onSuccess: () => { utils.products.getAll.invalidate(); },
  });

  // ─── Sincronizar segmentos ao editar ─────────────────────────────────────
  useEffect(() => {
    if (productSegments) {
      setEditForm((prev) => ({
        ...prev,
        segmentIds: productSegments.map((s) => s.id),
      }));
    }
  }, [productSegments]);

  const handleSegmentsChange = useCallback((segmentIds: number[]) => {
    setEditForm((prev) => ({ ...prev, segmentIds }));
  }, []);

  // ─── Editar produto ───────────────────────────────────────────────────────
  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filteredProducts = products?.filter((product: any) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    let parsedGallery: string[] = [];
    try {
      if (product.galleryUrls) parsedGallery = JSON.parse(product.galleryUrls);
    } catch {}
    setEditForm((prev) => ({
      ...prev,
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      imageUrl: product.imageUrl || "",
      imageKey: product.imageKey || "",
      galleryUrls: parsedGallery,
      calculationType: product.calculationType || "unidade",
      pricePerM2: product.pricePerM2 ? product.pricePerM2.toString() : "",
      minWidth: product.minWidth ? product.minWidth.toString() : "",
      maxWidth: product.maxWidth ? product.maxWidth.toString() : "",
      minHeight: product.minHeight ? product.minHeight.toString() : "",
      maxHeight: product.maxHeight ? product.maxHeight.toString() : "",
      specifications: (() => {
        try { return product.specifications ? JSON.parse(product.specifications) : []; } catch { return []; }
      })(),
      tags: (() => {
        try { return product.tags ? JSON.parse(product.tags) : []; } catch { return []; }
      })(),
      tagPosition: product.tagPosition || "top-right",
    }));
  };

  const isMeasureBased = (calculationType: string) =>
    calculationType === "m2" || calculationType === "metro_linear";

  const startQuickEdit = (product: any) => {
    const calculationType = product.calculationType || "unidade";
    setQuickEditingId(product.id);
    setQuickCalculationType(calculationType);
    setQuickPrice(
      isMeasureBased(calculationType)
        ? String(product.pricePerM2 ?? "")
        : String(product.price ?? "")
    );
  };

  const handleQuickPricingSave = async (product: any) => {
    const normalizedPrice = quickPrice.replace(",", ".").trim();
    const numericPrice = Number.parseFloat(normalizedPrice);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error("Informe um preço-base maior que R$ 0,00");
      return;
    }

    try {
      const measureBased = isMeasureBased(quickCalculationType);
      await updateProductMutation.mutateAsync({
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        price: measureBased ? String(product.price ?? "0") : normalizedPrice,
        segment: product.segment || "geral",
        imageUrl: product.imageUrl || undefined,
        calculationType: quickCalculationType as "m2" | "metro_linear" | "pacote" | "unidade",
        pricePerM2: measureBased ? normalizedPrice : undefined,
      });
      await utils.products.getAll.invalidate();
      setQuickEditingId(null);
      toast.success("Preço atualizado com sucesso", {
        description: `${product.name}: ${quickCalculationType === "m2" ? "valor por m²" : quickCalculationType === "metro_linear" ? "valor por metro linear" : "valor-base"} salvo.`,
        position: "top-right",
        duration: 3500,
        id: `quick-pricing-${product.id}`,
      });
    } catch (error) {
      console.error("Erro na edição rápida de preço:", error);
      toast.error("Não foi possível atualizar o preço do produto");
    }
  };

  const handleSave = async () => {
    if (!editingId) return;
    if (!editForm.name.trim()) { toast.error("Nome do produto é obrigatório"); return; }
    if ((editForm as any).calculationType !== "m2" && (editForm as any).calculationType !== "metro_linear") {
      if (!editForm.price || parseFloat(editForm.price as any) <= 0) { toast.error("Preço é obrigatório e deve ser maior que 0"); return; }
    }

    if ((editForm as any).calculationType === "m2") {
      if (!(editForm as any).pricePerM2 || parseFloat((editForm as any).pricePerM2) <= 0) { toast.error("Preço por m² é obrigatório"); return; }
      if (!(editForm as any).minWidth || parseFloat((editForm as any).minWidth) <= 0) { toast.error("Largura mínima é obrigatória"); return; }
      if (!(editForm as any).maxWidth || parseFloat((editForm as any).maxWidth) <= 0) { toast.error("Largura máxima é obrigatória"); return; }
      if (!(editForm as any).minHeight || parseFloat((editForm as any).minHeight) <= 0) { toast.error("Altura mínima é obrigatória"); return; }
      if (!(editForm as any).maxHeight || parseFloat((editForm as any).maxHeight) <= 0) { toast.error("Altura máxima é obrigatória"); return; }
      if (parseFloat((editForm as any).minWidth) >= parseFloat((editForm as any).maxWidth)) { toast.error("Largura máxima deve ser maior que a mínima"); return; }
      if (parseFloat((editForm as any).minHeight) >= parseFloat((editForm as any).maxHeight)) { toast.error("Altura máxima deve ser maior que a mínima"); return; }
    }

    try {
      await updateProductMutation.mutateAsync({
        id: editingId,
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        segment: "alimentacao",
        imageUrl: editForm.imageUrl,
        imageKey: (editForm as any).imageKey || undefined,
        galleryUrls: (editForm as any).galleryUrls?.length > 0 ? JSON.stringify((editForm as any).galleryUrls) : undefined,
        calculationType: (editForm as any).calculationType,
        pricePerM2: (editForm as any).calculationType === "m2" ? (editForm as any).pricePerM2 : undefined,
        minWidth: (editForm as any).calculationType === "m2" ? (editForm as any).minWidth : undefined,
        maxWidth: (editForm as any).calculationType === "m2" ? (editForm as any).maxWidth : undefined,
        minHeight: (editForm as any).calculationType === "m2" ? (editForm as any).minHeight : undefined,
        maxHeight: (editForm as any).calculationType === "m2" ? (editForm as any).maxHeight : undefined,
        specifications: (editForm as any).specifications?.length > 0 ? JSON.stringify((editForm as any).specifications) : undefined,
        tags: (editForm as any).tags !== undefined ? JSON.stringify((editForm as any).tags || []) : undefined,
        tagPosition: (editForm as any).tagPosition || "top-right",
      });
      await updateSegmentsMutation.mutateAsync({ productId: editingId, segmentIds: editForm.segmentIds });
      toast.success("Produto atualizado com sucesso!");
      setEditingId(null);
      refetch();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao atualizar produto");
    }
  };

  // ─── Seleção múltipla ─────────────────────────────────────────────────────
  const handleToggleProduct = (id: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) { newSelected.delete(id); } else { newSelected.add(id); }
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
    if (selectedProducts.size === 0) { toast.error("Selecione pelo menos um produto"); return; }
    if (!confirm(`Tem certeza que deseja remover ${selectedProducts.size} produto(s)?`)) return;
    try {
      await deleteMultipleProductsMutation.mutateAsync({ ids: Array.from(selectedProducts) });
      toast.success(`${selectedProducts.size} produto(s) removido(s) com sucesso!`);
      setSelectedProducts(new Set());
    } catch (error) { toast.error("Erro ao remover produtos"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;
    try {
      utils.products.getAll.setData(undefined, (old: any) => old ? old.filter((p: any) => p.id !== id) : old);
      await deleteProductMutation.mutateAsync({ id });
      toast.success("Produto removido com sucesso!");
    } catch (error) {
      utils.products.getAll.invalidate();
      toast.error("Erro ao remover produto");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie o catálogo de produtos da gráfica</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => navigate("/admin/variacoes")}
          >
            <span className="mr-2">⚙</span> Gerenciar Variações
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => navigate("/admin/novo-produto")}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Produto
          </Button>
                </div>
      </div>
      {/* ─── Barra de busca e ações em lote ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        )}

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
                {selectedProducts.size > 0 ? `${selectedProducts.size} produto(s) selecionado(s)` : "Selecionar produtos"}
              </span>
            </div>
            {selectedProducts.size > 0 && (
              <Button variant="destructive" onClick={handleDeleteMultiple} disabled={deleteMultipleProductsMutation.isPending}>
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteMultipleProductsMutation.isPending ? "Removendo..." : `Remover ${selectedProducts.size}`}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ─── Lista de produtos ────────────────────────────────────────────── */}
      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Nenhum produto criado ainda</p>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => navigate("/admin/novo-produto")}>
              Criar Primeiro Produto
            </Button>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Nenhum produto encontrado com "{searchQuery}"</p>
            <Button variant="ghost" onClick={() => setSearchQuery("")} className="mt-4 text-orange-500 hover:text-orange-600">
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
                      <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-lg" />
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
                        {formatProductPrice(product)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end md:col-span-1">
                    <Button variant="outline" size="sm" onClick={() => startQuickEdit(product)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Preço rápido
                    </Button>
                    <Dialog open={editingId === product.id} onOpenChange={(open) => !open && setEditingId(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar Produto</DialogTitle>
                          <DialogDescription>Atualize as informações do produto</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-name">Nome</Label>
                            <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                          </div>
                          <div>
                            <Label htmlFor="edit-description">Descrição</Label>
                            <Textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                          </div>
                          {/* Tipo de Cobrança — sempre primeiro */}
                          <div>
                            <Label htmlFor="edit-calculationType">Tipo de Cobrança</Label>
                            <Select
                              value={(editForm as any).calculationType || "unidade"}
                              onValueChange={(value) => setEditForm({ ...editForm, calculationType: value } as any)}
                            >
                              <SelectTrigger id="edit-calculationType">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unidade">Unidade</SelectItem>
                                <SelectItem value="m2">m² (Metro Quadrado)</SelectItem>
                                <SelectItem value="metro_linear">Metro Linear</SelectItem>
                                <SelectItem value="pacote">Pacote</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Preço Base: visível APENAS para Unidade e Pacote */}
                          {((editForm as any).calculationType === "unidade" || (editForm as any).calculationType === "pacote") && (
                            <div>
                              <Label htmlFor="edit-price">Preço Base (R$)</Label>
                              <Input id="edit-price" type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} placeholder="0.00" />
                            </div>
                          )}

                          {((editForm as any).calculationType === "m2" || (editForm as any).calculationType === "metro_linear") && (
                            <>
                              <div>
                                <Label htmlFor="edit-pricePerM2">
                                  {(editForm as any).calculationType === "metro_linear" ? "Preço por Metro Linear (R$)" : "Preço por m² (R$)"}
                                </Label>
                                <Input id="edit-pricePerM2" type="number" step="0.01" value={(editForm as any).pricePerM2 || ""} onChange={(e) => setEditForm({ ...editForm, pricePerM2: e.target.value } as any)} />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor="edit-minWidth">Largura Mín (m)</Label>
                                  <Input id="edit-minWidth" type="number" step="0.01" value={(editForm as any).minWidth || ""} onChange={(e) => setEditForm({ ...editForm, minWidth: e.target.value } as any)} />
                                </div>
                                <div>
                                  <Label htmlFor="edit-maxWidth">Largura Máx (m)</Label>
                                  <Input id="edit-maxWidth" type="number" step="0.01" value={(editForm as any).maxWidth || ""} onChange={(e) => setEditForm({ ...editForm, maxWidth: e.target.value } as any)} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor="edit-minHeight">Altura Mín (m)</Label>
                                  <Input id="edit-minHeight" type="number" step="0.01" value={(editForm as any).minHeight || ""} onChange={(e) => setEditForm({ ...editForm, minHeight: e.target.value } as any)} />
                                </div>
                                <div>
                                  <Label htmlFor="edit-maxHeight">Altura Máx (m)</Label>
                                  <Input id="edit-maxHeight" type="number" step="0.01" value={(editForm as any).maxHeight || ""} onChange={(e) => setEditForm({ ...editForm, maxHeight: e.target.value } as any)} />
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

                          {/* Upload de Fotos */}
                          <ProductImageUploader
                            mainImageUrl={editForm.imageUrl}
                            galleryUrls={(editForm as any).galleryUrls || []}
                            onMainImageChange={(url, key) => setEditForm({ ...editForm, imageUrl: url, imageKey: key || "" } as any)}
                            onGalleryChange={(urls) => setEditForm({ ...editForm, galleryUrls: urls } as any)}
                          />

                          {/* Aba Logística */}
                          {editingId && (
                            <div className="border-t pt-4 mt-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Logística</h3>
                              <ProductLogisticsTab productId={editingId} />
                            </div>
                          )}

                          {/* Especificações Técnicas */}
                          {/* Tags do Produto */}
                          <div className="border-t pt-4 mt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Tags do Produto</h3>
                            <p className="text-sm text-gray-500 mb-3">Selecione as tags que aparecerão sobre a imagem do produto no catálogo.</p>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              {["Mais vendido", "Promoção", "Destaque", "Novo"].map((tag) => (
                                <label key={tag} className="flex items-center gap-2 cursor-pointer select-none">
                                  <Checkbox
                                    checked={((editForm as any).tags || []).includes(tag)}
                                    onCheckedChange={(checked) => {
                                      setEditForm((prev) => ({
                                        ...prev,
                                        tags: checked
                                          ? [...((prev as any).tags || []), tag]
                                          : ((prev as any).tags || []).filter((t: string) => t !== tag),
                                      } as any));
                                    }}
                                  />
                                  <span className="text-sm text-gray-700">{tag}</span>
                                </label>
                              ))}
                            </div>
                            {((editForm as any).tags || []).length > 0 && (
                              <div className="space-y-1">
                                <Label className="text-sm font-medium text-gray-700">Posição das Tags no Card</Label>
                                <Select
                                  value={(editForm as any).tagPosition || "top-right"}
                                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, tagPosition: val } as any))}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione a posição" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="top-left">Canto Superior Esquerdo</SelectItem>
                                    <SelectItem value="top-right">Canto Superior Direito (padrão)</SelectItem>
                                    <SelectItem value="bottom-left">Canto Inferior Esquerdo</SelectItem>
                                    <SelectItem value="bottom-right">Canto Inferior Direito</SelectItem>
                                    <SelectItem value="top-center">Centro Superior</SelectItem>
                                    <SelectItem value="bottom-center">Centro Inferior</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">Especificações Técnicas</h3>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditForm((prev) => ({ ...prev, specifications: [...((prev as any).specifications || []), { label: "", value: "" }] } as any))}
                              >
                                + Adicionar
                              </Button>
                            </div>
                            {((editForm as any).specifications || []).length === 0 && (
                              <p className="text-sm text-gray-400">Nenhuma especificação adicionada. Clique em "+ Adicionar" para incluir.</p>
                            )}
                            {((editForm as any).specifications || []).map((spec: any, idx: number) => (
                              <div key={idx} className="flex gap-2 items-center mb-2">
                                <Input
                                  placeholder="Ex: Lona 440g impermeável, costura dupla, ilhós a cada 50cm..."
                                  value={spec.label}
                                  onChange={(e) => {
                                    const updated = [...((editForm as any).specifications || [])];
                                    updated[idx] = { ...updated[idx], label: e.target.value, value: "" };
                                    setEditForm((prev) => ({ ...prev, specifications: updated } as any));
                                  }}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 px-2"
                                  onClick={() => setEditForm((prev) => ({ ...prev, specifications: ((prev as any).specifications || []).filter((_: any, i: number) => i !== idx) } as any))}
                                >
                                  ✕
                                </Button>
                              </div>
                            ))}
                          </div>

                          <Button
                            onClick={handleSave}
                            className="w-full bg-orange-500 hover:bg-orange-600"
                            disabled={updateProductMutation.isPending || updateSegmentsMutation.isPending}
                          >
                            {updateProductMutation.isPending || updateSegmentsMutation.isPending ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
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

                {quickEditingId === product.id && (
                  <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50/60 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-semibold text-gray-900">Unidade de cobrança</Label>
                        <Select value={quickCalculationType} onValueChange={setQuickCalculationType}>
                          <SelectTrigger className="mt-1 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unidade">Unidade</SelectItem>
                            <SelectItem value="m2">m² (Metro Quadrado)</SelectItem>
                            <SelectItem value="metro_linear">Metro Linear</SelectItem>
                            <SelectItem value="pacote">Pacote</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-semibold text-gray-900">
                          {quickCalculationType === "m2"
                            ? "Preço-base por m² (R$)"
                            : quickCalculationType === "metro_linear"
                              ? "Preço-base por metro linear (R$)"
                              : "Preço-base (R$)"}
                        </Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={quickPrice}
                          onChange={(event) => setQuickPrice(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") handleQuickPricingSave(product);
                          }}
                          className="mt-1 bg-white"
                          placeholder="0,00"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickEditingId(null)}
                          disabled={updateProductMutation.isPending}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => handleQuickPricingSave(product)}
                          disabled={updateProductMutation.isPending}
                        >
                          {updateProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
