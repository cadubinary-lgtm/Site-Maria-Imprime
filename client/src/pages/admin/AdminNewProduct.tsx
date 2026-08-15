import AdminLayout from "@/components/AdminLayout";
import { useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLocation } from "wouter";
import MultiSegmentSelector from "@/components/MultiSegmentSelector";
import { DeliveryOptionsManager, type DeliveryOptionData } from "@/components/products/DeliveryOptionsManager";
import { ProductImageUploader } from "@/components/products/ProductImageUploader";
import { NEW_PRODUCT_FIELD_LAYOUT } from "@/lib/new-product-layout";

export default function AdminNewProduct() {
  const [, navigate] = useLocation();

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
    tags: [] as string[],
    tagPosition: "top-right" as string,
  });

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
  const updateSegmentsMutation = trpc.productSegments.updateSegments.useMutation();
  const utils = trpc.useUtils();

  const handleCreateSegmentsChange = useCallback((segmentIds: number[]) => {
    setCreateForm((prev) => ({ ...prev, segmentIds }));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.name.trim()) { toast.error("Nome do produto é obrigatório"); return; }
    if (createForm.calculationType !== "m2" && createForm.calculationType !== "metro_linear") {
      if (!createForm.price || parseFloat(createForm.price) <= 0) { toast.error("Preço é obrigatório e deve ser maior que 0"); return; }
    }
    if (!createForm.calculationType) { toast.error("Tipo de cobrança é obrigatório"); return; }

    // Normalizar segment: se vazio, usar "geral" como fallback
    const effectiveSegment = createForm.segment?.trim() || "geral";

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
        segment: effectiveSegment,
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
        tags: createForm.tags.length > 0 ? JSON.stringify(createForm.tags) : undefined,
        tagPosition: createForm.tagPosition || "top-right",
      });

      const newProductId = (result as any)?.id;

      if (newProductId && createForm.segmentIds.length > 0) {
        try {
          await updateSegmentsMutation.mutateAsync({ productId: newProductId, segmentIds: createForm.segmentIds });
        } catch (e) { console.warn("Erro ao vincular segmentos:", e); }
      }

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

      // Resetar formulário
      setCreateForm({
        name: "", description: "", price: "", segment: "", imageUrl: "", imageKey: "", galleryUrls: [],
        calculationType: "unidade", pricePerM2: "", minWidth: "", maxWidth: "",
        minHeight: "", maxHeight: "", segmentIds: [], specifications: [], tags: [], tagPosition: "top-right",
      });
      setCreateDeliveryOptions([]);
      setCreateLogistics({ weight: "", width: "", height: "", length: "", allowedCarrierIds: [] });

      // Redirecionar para lista de produtos
      navigate("/admin/produtos");
    } catch (error) {
      const msg = (error as any)?.message ?? "Erro desconhecido";
      toast.error(`Erro ao criar produto: ${msg}`);
      console.error("[createProduct]", error);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-visual-system space-y-4 xl:space-y-5">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados para criar um novo produto no catálogo</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/produtos")}>
            ← Voltar para Produtos
          </Button>
        </div>

        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Plus className="w-4 h-4" />
              Dados do Produto
            </CardTitle>
            <CardDescription>Preencha os dados para criar um novo produto no catálogo</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <form onSubmit={handleCreate} className="space-y-3">
              <div className={NEW_PRODUCT_FIELD_LAYOUT.grid}>
                <div className={NEW_PRODUCT_FIELD_LAYOUT.name}>
                  <Label htmlFor="create-name">Nome do Produto *</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ex: Adesivo Brilho"
                    required
                  />
                </div>
                <div className={NEW_PRODUCT_FIELD_LAYOUT.calculation}>
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
                {(createForm.calculationType === "unidade" || createForm.calculationType === "pacote") && (
                  <div className={NEW_PRODUCT_FIELD_LAYOUT.price}>
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
                <div className={NEW_PRODUCT_FIELD_LAYOUT.segment}>
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
                <div className={NEW_PRODUCT_FIELD_LAYOUT.description}>
                  <Label htmlFor="create-description">Descrição</Label>
                  <Textarea
                    id="create-description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Descreva o produto"
                    rows={2}
                    className="min-h-[68px]"
                  />
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
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
                <div className="space-y-4">
                  {/* Upload de Fotos */}
                  <ProductImageUploader
                    mainImageUrl={createForm.imageUrl}
                    galleryUrls={createForm.galleryUrls}
                    onMainImageChange={(url, key) => setCreateForm({ ...createForm, imageUrl: url, imageKey: key || "" })}
                    onGalleryChange={(urls) => setCreateForm({ ...createForm, galleryUrls: urls })}
                    compact
                  />
                  {/* Segmentos */}
                  <div className={NEW_PRODUCT_FIELD_LAYOUT.segmentsAlignment}>
                    <Label>Segmentos</Label>
                    <MultiSegmentSelector
                      productId={0}
                      selectedSegmentIds={createForm.segmentIds}
                      onSegmentsChange={handleCreateSegmentsChange}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Prazos de Produção */}
                  <DeliveryOptionsManager
                    calculationType={createForm.calculationType}
                    onChange={setCreateDeliveryOptions}
                    compact
                  />
              {/* Logística */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  Logística
                </h3>
                <div className="p-4 bg-white rounded-lg border border-gray-100 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Dimensões e Peso da Embalagem</p>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    <div>
                      <Label htmlFor="create-weight">Peso (kg)</Label>
                      <Input id="create-weight" type="number" step="0.01" placeholder="Ex: 0.5" value={createLogistics.weight} onChange={(e) => setCreateLogistics((prev) => ({ ...prev, weight: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="create-log-width">Largura (cm)</Label>
                      <Input id="create-log-width" type="number" step="0.1" placeholder="Ex: 20" value={createLogistics.width} onChange={(e) => setCreateLogistics((prev) => ({ ...prev, width: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="create-log-height">Altura (cm)</Label>
                      <Input id="create-log-height" type="number" step="0.1" placeholder="Ex: 30" value={createLogistics.height} onChange={(e) => setCreateLogistics((prev) => ({ ...prev, height: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="create-log-length">Comprimento (cm)</Label>
                      <Input id="create-log-length" type="number" step="0.1" placeholder="Ex: 10" value={createLogistics.length} onChange={(e) => setCreateLogistics((prev) => ({ ...prev, length: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-100 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Transportadoras Permitidas</p>
                  {carriersData && (carriersData as any[]).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              {/* Tags do Produto */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Tags do Produto</h3>
                <p className="text-sm text-gray-500">Selecione as tags que aparecerão sobre a imagem do produto no catálogo.</p>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  {["Mais vendido", "Promoção", "Destaque", "Novo"].map((tag) => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={createForm.tags.includes(tag)}
                        onCheckedChange={(checked) => {
                          setCreateForm((prev) => ({
                            ...prev,
                            tags: checked
                              ? [...prev.tags, tag]
                              : prev.tags.filter((t) => t !== tag),
                          }));
                        }}
                      />
                      <span className="text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
                {createForm.tags.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">Posição das Tags no Card</Label>
                    <Select
                      value={createForm.tagPosition}
                      onValueChange={(val) => setCreateForm((prev) => ({ ...prev, tagPosition: val }))}
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
              {/* Especificações Técnicas */}
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
                      placeholder="Ex: Lona 440g impermeável, costura dupla, ilhós a cada 50cm..."
                      value={spec.label}
                      onChange={(e) => {
                        const updated = [...createForm.specifications];
                        updated[idx] = { ...updated[idx], label: e.target.value, value: "" };
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
                </div>
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
                  onClick={() => navigate("/admin/produtos")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
