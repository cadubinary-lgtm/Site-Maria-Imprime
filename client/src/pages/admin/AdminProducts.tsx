import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Edit2, Trash2, Plus, Search, X, ChevronUp, Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import MultiSegmentSelector from "@/components/MultiSegmentSelector";
import { DeliveryOptionsManager, type DeliveryOptionData } from "@/components/products/DeliveryOptionsManager";
import { ProductVariationManager } from "@/components/ProductVariationManager";
import { ProductImageUploader } from "@/components/products/ProductImageUploader";
import { ProductLogisticsTab } from "@/components/products/ProductLogisticsTab";

export default function AdminProducts() {
  // ─── Estado de criação ────────────────────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [createDeliveryOptions, setCreateDeliveryOptions] = useState<DeliveryOptionData[]>([]);
  const [createLogistics, setCreateLogistics] = useState({
    weight: "",
    width: "",
    height: "",
    length: "",
    allowedCarrierIds: [] as number[],
  });
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    price: "",
    segment: "",
    imageUrl: "",
    imageKey: "",
    galleryUrls: [] as string[],
    calculationType: "unidade",
    pricePerM2: "",
    minWidth: "",
    maxWidth: "",
    minHeight: "",
    maxHeight: "",
    segmentIds: [] as number[],
    specifications: [] as { label: string; value: string }[],
  });

  // ─── Estado de edição ─────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
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

  const createProductMutation = trpc.admin.createProduct.useMutation();
  const createDeliveryOptionMutation = trpc.deliveryOptions.create.useMutation();
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

  const handleCreateSegmentsChange = useCallback((segmentIds: number[]) => {
    setCreateForm((prev) => ({ ...prev, segmentIds }));
  }, []);

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filteredProducts = products?.filter((product: any) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // ─── Criar produto ────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.name.trim()) { toast.error("Nome do produto é obrigatório"); return; }
    if (!createForm.price || parseFloat(createForm.price) <= 0) { toast.error("Preço é obrigatório e deve ser maior que 0"); return; }
    if (!createForm.calculationType) { toast.error("Tipo de cobrança é obrigatório"); return; }

    if (createForm.calculationType === "m2") {
      if (!createForm.pricePerM2 || parseFloat(createForm.pricePerM2) <= 0) { toast.error("Preço por m² é obrigatório"); return; }
      if (!createForm.minWidth || parseFloat(createForm.minWidth) <= 0) { toast.error("Largura mínima é obrigatória"); return; }
      if (!createForm.maxWidth || parseFloat(createForm.maxWidth) <= 0) { toast.error("Largura máxima é obrigatória"); return; }
      if (!createForm.minHeight || parseFloat(createForm.minHeight) <= 0) { toast.error("Altura mínima é obrigatória"); return; }
      if (!createForm.maxHeight || parseFloat(createForm.maxHeight) <= 0) { toast.error("Altura máxima é obrigatória"); return; }
      if (parseFloat(createForm.minWidth) >= parseFloat(createForm.maxWidth)) { toast.error("Largura máxima deve ser maior que a mínima"); return; }
      if (parseFloat(createForm.minHeight) >= parseFloat(createForm.maxHeight)) { toast.error("Altura máxima deve ser maior que a mínima"); return; }
    }

    try {
      const result = await createProductMutation.mutateAsync({
        name: createForm.name,
        description: createForm.description,
        price: createForm.price,
        segment: createForm.segment,
        imageUrl: createForm.imageUrl,
        imageKey: createForm.imageKey || undefined,
        galleryUrls: createForm.galleryUrls.length > 0 ? JSON.stringify(createForm.galleryUrls) : undefined,
        calculationType: createForm.calculationType as "m2" | "metro_linear" | "pacote" | "unidade",
        pricePerM2: createForm.calculationType === "m2" ? createForm.pricePerM2 : undefined,
        minWidth: createForm.calculationType === "m2" ? createForm.minWidth : undefined,
        maxWidth: createForm.calculationType === "m2" ? createForm.maxWidth : undefined,
        minHeight: createForm.calculationType === "m2" ? createForm.minHeight : undefined,
        maxHeight: createForm.calculationType === "m2" ? createForm.maxHeight : undefined,
        weight: createLogistics.weight ? parseFloat(createLogistics.weight) : undefined,
        logisticsWidth: createLogistics.width ? parseFloat(createLogistics.width) : undefined,
        logisticsHeight: createLogistics.height ? parseFloat(createLogistics.height) : undefined,
        logisticsLength: createLogistics.length ? parseFloat(createLogistics.length) : undefined,
        allowedCarrierIds: createLogistics.allowedCarrierIds.length > 0 ? createLogistics.allowedCarrierIds : undefined,
        specifications: createForm.specifications.length > 0 ? JSON.stringify(createForm.specifications) : undefined,
      });

      const newProductId = (result as any)?.id;

      // Vincular segmentos
      if (newProductId && createForm.segmentIds.length > 0) {
        try {
          await updateSegmentsMutation.mutateAsync({ productId: newProductId, segmentIds: createForm.segmentIds });
        } catch (e) { console.warn("Erro ao vincular segmentos:", e); }
      }

      // Salvar prazos de produção
      const activeOptions = createDeliveryOptions.filter((opt) => opt.isActive);
      if (activeOptions.length > 0 && newProductId) {
        try {
          await Promise.all(
            activeOptions.map((opt, idx) =>
              createDeliveryOptionMutation.mutateAsync({
                productId: newProductId,
                name: opt.name,
                daysToDeliver: opt.daysToDeliver,
                pricePerM2: opt.pricePerM2,
                isActive: true,
                order: idx,
              })
            )
          );
        } catch (e) { console.warn("Erro ao criar prazos:", e); }
      }

      toast.success("Produto criado com sucesso!");
      utils.products.getAll.invalidate();
      setCreateForm({
        name: "", description: "", price: "", segment: "", imageUrl: "", imageKey: "", galleryUrls: [],
        calculationType: "unidade", pricePerM2: "", minWidth: "", maxWidth: "",
        minHeight: "", maxHeight: "", segmentIds: [], specifications: [],
      });
      setCreateDeliveryOptions([]);
      setCreateLogistics({ weight: "", width: "", height: "", length: "", allowedCarrierIds: [] });
      setShowCreateForm(false);
    } catch (error) {
      toast.error("Erro ao criar produto");
      console.error(error);
    }
  };

  // ─── Editar produto ───────────────────────────────────────────────────────
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
    }));
  };

  const handleSave = async () => {
    if (!editingId) return;
    if (!editForm.name.trim()) { toast.error("Nome do produto é obrigatório"); return; }
    if (!editForm.price || parseFloat(editForm.price as any) <= 0) { toast.error("Preço é obrigatório e deve ser maior que 0"); return; }

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
            onClick={() => { setShowVariations((v) => !v); setShowCreateForm(false); }}
          >
            {showVariations ? (
              <><ChevronUp className="w-4 h-4 mr-2" /> Fechar Variações</>
            ) : (
              <><span className="mr-2">⚙</span> Gerenciar Variações</>
            )}
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => { setShowCreateForm((v) => !v); setShowVariations(false); }}
          >
            {showCreateForm ? (
              <><ChevronUp className="w-4 h-4 mr-2" /> Fechar Formulário</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Novo Produto</>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Gerenciar Variações ─────────────────────────────────────────── */}
      {showVariations && (
        <Card className="border-orange-200">
          <CardContent className="pt-6">
            <ProductVariationManager />
          </CardContent>
        </Card>
      )}

      {/* ─── Formulário de criação ─────────────────────────────────────────── */}
      {showCreateForm && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Plus className="w-4 h-4" />
              Novo Produto
            </CardTitle>
            <CardDescription>Preencha os dados para criar um novo produto no catálogo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-name">Nome do Produto *</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ex: Adesivo Brilho"
                    required
                  />
                </div>
                {/* Preço Base: visível apenas para Unidade e Pacote */}
                {(createForm.calculationType === "unidade" || createForm.calculationType === "pacote") && (
                  <div>
                    <Label htmlFor="create-price">Preço Base (R$) *</Label>
                    <Input
                      id="create-price"
                      type="number"
                      step="0.01"
                      value={createForm.price}
                      onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="create-description">Descrição</Label>
                <Textarea
                  id="create-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Descreva o produto"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-segment">Segmento</Label>
                  <Select
                    value={createForm.segment}
                    onValueChange={(value) => setCreateForm({ ...createForm, segment: value })}
                    disabled={segmentsLoading}
                  >
                    <SelectTrigger id="create-segment">
                      <SelectValue placeholder={segmentsLoading ? "Carregando..." : "Selecione um segmento"} />
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
                  <Label htmlFor="create-calculationType">Tipo de Cobrança *</Label>
                  <Select
                    value={createForm.calculationType}
                    onValueChange={(value) => setCreateForm({ ...createForm, calculationType: value })}
                  >
                    <SelectTrigger id="create-calculationType">
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
              </div>

              {/* Campos condicionais para m² e metro linear */}
              {(createForm.calculationType === "m2" || createForm.calculationType === "metro_linear") && (
                <div className="space-y-3 p-4 bg-white rounded-lg border border-orange-100">
                  <p className="text-sm font-medium text-gray-700">
                    {createForm.calculationType === "metro_linear" ? "Configurações de Metro Linear" : "Configurações de m²"}
                  </p>
                  <div>
                    <Label htmlFor="create-pricePerM2">
                      {createForm.calculationType === "metro_linear" ? "Preço por Metro Linear (R$)" : "Preço por m² (R$)"}
                    </Label>
                    <Input
                      id="create-pricePerM2"
                      type="number"
                      step="0.01"
                      value={createForm.pricePerM2}
                      onChange={(e) => setCreateForm({ ...createForm, pricePerM2: e.target.value })}
                      placeholder="45.00"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="create-minWidth">Largura Mínima (m)</Label>
                      <Input id="create-minWidth" type="number" step="0.01" value={createForm.minWidth} onChange={(e) => setCreateForm({ ...createForm, minWidth: e.target.value })} placeholder="0.10" />
                    </div>
                    <div>
                      <Label htmlFor="create-maxWidth">Largura Máxima (m)</Label>
                      <Input id="create-maxWidth" type="number" step="0.01" value={createForm.maxWidth} onChange={(e) => setCreateForm({ ...createForm, maxWidth: e.target.value })} placeholder="5.00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="create-minHeight">Altura Mínima (m)</Label>
                      <Input id="create-minHeight" type="number" step="0.01" value={createForm.minHeight} onChange={(e) => setCreateForm({ ...createForm, minHeight: e.target.value })} placeholder="0.10" />
                    </div>
                    <div>
                      <Label htmlFor="create-maxHeight">Altura Máxima (m)</Label>
                      <Input id="create-maxHeight" type="number" step="0.01" value={createForm.maxHeight} onChange={(e) => setCreateForm({ ...createForm, maxHeight: e.target.value })} placeholder="5.00" />
                    </div>
                  </div>
                </div>
              )}

              {/* Upload de Fotos */}
              <ProductImageUploader
                mainImageUrl={createForm.imageUrl}
                galleryUrls={createForm.galleryUrls}
                onMainImageChange={(url, key) => setCreateForm({ ...createForm, imageUrl: url, imageKey: key || "" })}
                onGalleryChange={(urls) => setCreateForm({ ...createForm, galleryUrls: urls })}
              />

              {/* Segmentos */}
              <div>
                <Label>Segmentos</Label>
                <MultiSegmentSelector
                  productId={0}
                  selectedSegmentIds={createForm.segmentIds}
                  onSegmentsChange={handleCreateSegmentsChange}
                />
              </div>

              {/* Prazos de Produção */}
              <DeliveryOptionsManager
                calculationType={createForm.calculationType}
                onChange={setCreateDeliveryOptions}
              />

              {/* Logística */}
              <div className="border-t pt-4 mt-2 space-y-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  Logística
                </h3>

                {/* Dimensões e Peso */}
                <div className="p-4 bg-white rounded-lg border border-gray-100 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Dimensões e Peso da Embalagem</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="create-weight">Peso (kg)</Label>
                      <Input
                        id="create-weight"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 0.5"
                        value={createLogistics.weight}
                        onChange={(e) => setCreateLogistics((prev) => ({ ...prev, weight: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-log-width">Largura (cm)</Label>
                      <Input
                        id="create-log-width"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 20"
                        value={createLogistics.width}
                        onChange={(e) => setCreateLogistics((prev) => ({ ...prev, width: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-log-height">Altura (cm)</Label>
                      <Input
                        id="create-log-height"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 30"
                        value={createLogistics.height}
                        onChange={(e) => setCreateLogistics((prev) => ({ ...prev, height: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-log-length">Comprimento (cm)</Label>
                      <Input
                        id="create-log-length"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 10"
                        value={createLogistics.length}
                        onChange={(e) => setCreateLogistics((prev) => ({ ...prev, length: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Transportadoras Permitidas */}
                <div className="p-4 bg-white rounded-lg border border-gray-100 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Transportadoras Permitidas</p>
                  {carriersData && (carriersData as any[]).length > 0 ? (
                    <div className="space-y-2">
                      {(carriersData as any[]).map((carrier: any) => (
                        <div key={carrier.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`create-carrier-${carrier.id}`}
                            checked={createLogistics.allowedCarrierIds.includes(carrier.id)}
                            onCheckedChange={(checked) => {
                              setCreateLogistics((prev) => ({
                                ...prev,
                                allowedCarrierIds: checked
                                  ? [...prev.allowedCarrierIds, carrier.id]
                                  : prev.allowedCarrierIds.filter((id) => id !== carrier.id),
                              }));
                            }}
                          />
                          <Label htmlFor={`create-carrier-${carrier.id}`} className="font-normal cursor-pointer">
                            {carrier.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Nenhuma transportadora cadastrada</p>
                  )}
                </div>
              </div>

              {/* ─── Especificações Técnicas ──────────────────────────────── */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Especificações Técnicas</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateForm((prev) => ({ ...prev, specifications: [...prev.specifications, { label: "", value: "" }] }))}
                  >
                    + Adicionar
                  </Button>
                </div>
                {createForm.specifications.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhuma especificação adicionada. Clique em "+ Adicionar" para incluir.</p>
                )}
                {createForm.specifications.map((spec, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder="Campo (ex: Material)"
                      value={spec.label}
                      onChange={(e) => {
                        const updated = [...createForm.specifications];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setCreateForm((prev) => ({ ...prev, specifications: updated }));
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Valor (ex: Lona 440g)"
                      value={spec.value}
                      onChange={(e) => {
                        const updated = [...createForm.specifications];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        setCreateForm((prev) => ({ ...prev, specifications: updated }));
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 px-2"
                      onClick={() => setCreateForm((prev) => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== idx) }))}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 flex-1"
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</>
                  ) : (
                    "Criar Produto"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowCreateForm(true)}>
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
                        R$ {parseFloat(product.price.toString()).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end md:col-span-1">
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
                          {/* Preço Base: visível apenas para Unidade e Pacote */}
                          {((editForm as any).calculationType === "unidade" || (editForm as any).calculationType === "pacote" || !(editForm as any).calculationType) && (
                            <div>
                              <Label htmlFor="edit-price">Preço Base (R$)</Label>
                              <Input id="edit-price" type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
                            </div>
                          )}
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
                                <SelectItem value="m2">m²</SelectItem>
                                <SelectItem value="metro_linear">Metro Linear</SelectItem>
                                <SelectItem value="pacote">Pacote</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

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
                                  placeholder="Campo (ex: Material)"
                                  value={spec.label}
                                  onChange={(e) => {
                                    const updated = [...((editForm as any).specifications || [])];
                                    updated[idx] = { ...updated[idx], label: e.target.value };
                                    setEditForm((prev) => ({ ...prev, specifications: updated } as any));
                                  }}
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Valor (ex: Lona 440g)"
                                  value={spec.value}
                                  onChange={(e) => {
                                    const updated = [...((editForm as any).specifications || [])];
                                    updated[idx] = { ...updated[idx], value: e.target.value };
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
