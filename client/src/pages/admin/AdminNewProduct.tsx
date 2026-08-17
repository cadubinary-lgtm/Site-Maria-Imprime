import AdminLayout from "@/components/AdminLayout";
import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Package, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLocation } from "wouter";
import MultiSegmentSelector from "@/components/MultiSegmentSelector";
import { DeliveryOptionsManager, type DeliveryOptionData } from "@/components/products/DeliveryOptionsManager";
import { ProductImageUploader } from "@/components/products/ProductImageUploader";
import { EDIT_PRODUCT_MODAL_LAYOUT, NEW_PRODUCT_FIELD_LAYOUT, PRODUCT_FORM_PANEL } from "@/lib/new-product-layout";
import { getLegacySegmentFromSelection } from "@/lib/new-product-segment";

export default function AdminNewProduct() {
  const [, navigate] = useLocation();

  const [createDeliveryOptions, setCreateDeliveryOptions] = useState<DeliveryOptionData[]>([]);
  const [autoCreatedProductId, setAutoCreatedProductId] = useState<number | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "waiting" | "saving" | "saved" | "error">("idle");
  const [lastSyncedSignature, setLastSyncedSignature] = useState("");
  const [autoSaveRevision, setAutoSaveRevision] = useState(0);
  const isAutoSaveInFlightRef = useRef(false);
  const autoSaveTimerRef = useRef<number | null>(null);
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
    pixPrice: "",
    cardPrice: "",
    resellerPrice: "",
    segment: "",
    imageUrl: "",
    imageKey: "",
    galleryUrls: [] as string[],
    calculationType: "unidade",
    pricePerM2: "",
    pixPricePerM2: "",
    cardPricePerM2: "",
    resellerPricePerM2: "",
    minWidth: "",
    maxWidth: "",
    minHeight: "",
    maxHeight: "",
    segmentIds: [] as number[],
    specifications: [] as { label: string; value: string }[],
    tags: [] as string[],
    tagPosition: "top-right" as string,
    cardDescription: "",
  });

  const { data: segmentsData } = trpc.segments.getAll.useQuery();
  const { data: carriersData } = trpc.logistics.carriers.list.useQuery();

  const createProductMutation = trpc.admin.createProduct.useMutation();
  const updateProductMutation = trpc.admin.updateProduct.useMutation();
  const createDeliveryOptionMutation = trpc.deliveryOptions.create.useMutation();
  const updateSegmentsMutation = trpc.productSegments.updateSegments.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    const rawDraft = window.localStorage.getItem("maria-imprime-new-product-autosave");
    if (!rawDraft) return;
    try {
      const draft = JSON.parse(rawDraft);
      if (draft?.createForm?.name) {
        setCreateForm((current) => ({ ...current, ...draft.createForm }));
        if (draft.createLogistics) setCreateLogistics((current) => ({ ...current, ...draft.createLogistics }));
        if (Array.isArray(draft.createDeliveryOptions)) setCreateDeliveryOptions(draft.createDeliveryOptions);
        setAutoSaveState("waiting");
        toast.info("Rascunho recuperado", { description: "O novo produto será salvo automaticamente quando os dados obrigatórios estiverem completos." });
      }
    } catch {
      window.localStorage.removeItem("maria-imprime-new-product-autosave");
    }
  }, []);

  const handleCreateSegmentsChange = useCallback((segmentIds: number[]) => {
    setCreateForm((prev) => ({
      ...prev,
      segmentIds,
      segment: getLegacySegmentFromSelection(segmentIds, segmentsData || []),
    }));
  }, [segmentsData]);

  const isCreateFormReadyForAutoSave = useCallback(() => {
    if (!createForm.name.trim()) return false;
    const isMeasureBased = createForm.calculationType === "m2" || createForm.calculationType === "metro_linear";
    if (!isMeasureBased) return parseFloat(createForm.pixPrice) > 0 && parseFloat(createForm.cardPrice) > 0;
    return parseFloat(createForm.pixPricePerM2) > 0
      && parseFloat(createForm.cardPricePerM2) > 0
      && parseFloat(createForm.minWidth) > 0
      && parseFloat(createForm.maxWidth) > parseFloat(createForm.minWidth)
      && parseFloat(createForm.minHeight) > 0
      && parseFloat(createForm.maxHeight) > parseFloat(createForm.minHeight);
  }, [createForm]);

  const getCreatePayload = useCallback(() => {
    const isMeasureBased = createForm.calculationType === "m2" || createForm.calculationType === "metro_linear";
    return {
      name: createForm.name,
      description: createForm.description,
      price: isMeasureBased ? (createForm.price || createForm.pixPricePerM2) : createForm.pixPrice,
      pixPrice: createForm.pixPrice,
      cardPrice: createForm.cardPrice,
      resellerPrice: createForm.resellerPrice || undefined,
      segment: createForm.segment?.trim() || "geral",
      imageUrl: createForm.imageUrl,
      imageKey: createForm.imageKey || undefined,
      galleryUrls: createForm.galleryUrls.length > 0 ? JSON.stringify(createForm.galleryUrls) : undefined,
      calculationType: createForm.calculationType as "m2" | "metro_linear" | "pacote" | "unidade",
      pricePerM2: isMeasureBased ? createForm.pixPricePerM2 : undefined,
      pixPricePerM2: isMeasureBased ? createForm.pixPricePerM2 : undefined,
      cardPricePerM2: isMeasureBased ? createForm.cardPricePerM2 : undefined,
      resellerPricePerM2: isMeasureBased ? createForm.resellerPricePerM2 || undefined : undefined,
      minWidth: isMeasureBased ? createForm.minWidth : undefined,
      maxWidth: isMeasureBased ? createForm.maxWidth : undefined,
      minHeight: isMeasureBased ? createForm.minHeight : undefined,
      maxHeight: isMeasureBased ? createForm.maxHeight : undefined,
      weight: createLogistics.weight ? parseFloat(createLogistics.weight) : undefined,
      logisticsWidth: createLogistics.width ? parseFloat(createLogistics.width) : undefined,
      logisticsHeight: createLogistics.height ? parseFloat(createLogistics.height) : undefined,
      logisticsLength: createLogistics.length ? parseFloat(createLogistics.length) : undefined,
      allowedCarrierIds: createLogistics.allowedCarrierIds,
      specifications: createForm.specifications.length > 0 ? JSON.stringify(createForm.specifications) : undefined,
      tags: createForm.tags.length > 0 ? JSON.stringify(createForm.tags) : undefined,
      tagPosition: createForm.tagPosition || "top-right",
      cardDescription: createForm.cardDescription.trim(),
    };
  }, [createForm, createLogistics]);

  const getNewProductSignature = useCallback(() => JSON.stringify({ createForm, createLogistics, createDeliveryOptions }), [createForm, createDeliveryOptions, createLogistics]);

  const synchronizeNewProduct = useCallback(async () => {
    if (isAutoSaveInFlightRef.current || !isCreateFormReadyForAutoSave()) return;
    const signatureAtStart = getNewProductSignature();
    isAutoSaveInFlightRef.current = true;
    setAutoSaveState("saving");
    try {
      const payload = getCreatePayload();
      let productId = autoCreatedProductId;
      if (productId) {
        await updateProductMutation.mutateAsync({ id: productId, ...payload });
      } else {
        const result = await createProductMutation.mutateAsync(payload);
        productId = (result as any)?.id;
        if (!productId) throw new Error("O produto não retornou um identificador");
        setAutoCreatedProductId(productId);
        const activeOptions = createDeliveryOptions.filter((opt) => opt.isActive);
        await Promise.all(activeOptions.map((opt, index) => createDeliveryOptionMutation.mutateAsync({
          productId: productId!, name: opt.name, daysToDeliver: opt.daysToDeliver, pricePerM2: opt.pricePerM2, isActive: true, order: index,
        })));
      }
      await updateSegmentsMutation.mutateAsync({ productId, segmentIds: createForm.segmentIds });
      await utils.products.getAll.invalidate();
      setLastSyncedSignature(signatureAtStart);
      window.localStorage.removeItem("maria-imprime-new-product-autosave");
      setAutoSaveState("saved");
    } catch (error) {
      console.error("[new-product-autosave]", error);
      window.localStorage.setItem("maria-imprime-new-product-autosave", JSON.stringify({ createForm, createLogistics, createDeliveryOptions, savedAt: Date.now() }));
      setLastSyncedSignature(signatureAtStart);
      setAutoSaveState("error");
      toast.error("Falha ao salvar automaticamente: rascunho preservado no navegador");
    } finally {
      isAutoSaveInFlightRef.current = false;
      setAutoSaveRevision((revision) => revision + 1);
    }
  }, [autoCreatedProductId, createDeliveryOptionMutation, createDeliveryOptions, createForm, createLogistics, createProductMutation, getCreatePayload, getNewProductSignature, isCreateFormReadyForAutoSave, updateProductMutation, updateSegmentsMutation, utils]);

  useEffect(() => {
    const signature = getNewProductSignature();
    if (signature === lastSyncedSignature) return;
    window.localStorage.setItem("maria-imprime-new-product-autosave", JSON.stringify({ createForm, createLogistics, createDeliveryOptions, savedAt: Date.now() }));
    if (!isCreateFormReadyForAutoSave()) {
      setAutoSaveState("waiting");
      return;
    }
    setAutoSaveState("waiting");
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => synchronizeNewProduct(), 900);
    return () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, [autoSaveRevision, createDeliveryOptions, createForm, createLogistics, getNewProductSignature, isCreateFormReadyForAutoSave, lastSyncedSignature, synchronizeNewProduct]);

  return (
    <AdminLayout>
      <div className="admin-visual-system space-y-4 xl:space-y-5">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados para criar um novo produto no catálogo</p>
          </div>
          <div className="flex items-center gap-2">
            {autoSaveState !== "idle" && (
              <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                autoSaveState === "error" ? "bg-red-50 text-red-700" : autoSaveState === "waiting" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
              }`} aria-live="polite">
                {autoSaveState === "saving" ? "Salvando automaticamente..." : autoSaveState === "saved" ? "Salvo automaticamente" : autoSaveState === "error" ? "Falha ao salvar: rascunho preservado" : "Aguardando dados obrigatórios"}
              </span>
            )}
            <Button variant="outline" onClick={() => navigate("/admin/produtos")}>
              ← Voltar para Produtos
            </Button>
          </div>
        </div>

        <Card className={PRODUCT_FORM_PANEL.card}>
          <CardContent className={PRODUCT_FORM_PANEL.content}>
            <h3 className={PRODUCT_FORM_PANEL.title}>Dados comerciais</h3>
            <form onSubmit={(event) => event.preventDefault()} className="space-y-4">
              <div className={EDIT_PRODUCT_MODAL_LAYOUT.details}>
                <div className={EDIT_PRODUCT_MODAL_LAYOUT.name}>
                  <Label htmlFor="create-name">Nome</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ex: Adesivo Brilho"
                    required
                  />
                </div>

                <div className={EDIT_PRODUCT_MODAL_LAYOUT.description}>
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

                <div className={EDIT_PRODUCT_MODAL_LAYOUT.calculation}>
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
                  <div className={EDIT_PRODUCT_MODAL_LAYOUT.price}>
                    <Label htmlFor="create-pixPrice">Preço via Pix (R$) *</Label>
                    <Input
                      id="create-pixPrice"
                      type="number"
                      step="0.01"
                      value={createForm.pixPrice}
                      onChange={(e) => setCreateForm({ ...createForm, pixPrice: e.target.value, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                )}
                {(createForm.calculationType === "unidade" || createForm.calculationType === "pacote") && (
                  <div className={EDIT_PRODUCT_MODAL_LAYOUT.price}>
                    <Label htmlFor="create-cardPrice">Preço via Cartão (R$) *</Label>
                    <Input id="create-cardPrice" type="number" step="0.01" value={createForm.cardPrice} onChange={(e) => setCreateForm({ ...createForm, cardPrice: e.target.value })} placeholder="0.00" required />
                  </div>
                )}
                {(createForm.calculationType === "unidade" || createForm.calculationType === "pacote") && (
                  <div className={EDIT_PRODUCT_MODAL_LAYOUT.price}>
                    <Label htmlFor="create-resellerPrice">Preço Revendedor (R$)</Label>
                    <Input id="create-resellerPrice" type="number" step="0.01" value={createForm.resellerPrice} onChange={(e) => setCreateForm({ ...createForm, resellerPrice: e.target.value })} placeholder="Opcional" />
                  </div>
                )}
              </div>
              {/* Campos condicionais para m² e metro linear */}
              {(createForm.calculationType === "m2" || createForm.calculationType === "metro_linear") && (
                <div className={EDIT_PRODUCT_MODAL_LAYOUT.measureFields}>
                    <div className="sm:col-span-1 xl:col-span-2">
                      <Label htmlFor="create-pixPricePerM2">
                        {createForm.calculationType === "metro_linear" ? "Preço via Pix por Metro Linear (R$)" : "Preço via Pix por m² (R$)"}
                      </Label>
                      <Input id="create-pixPricePerM2" type="number" step="0.01" value={createForm.pixPricePerM2} onChange={(e) => setCreateForm({ ...createForm, pixPricePerM2: e.target.value, pricePerM2: e.target.value })} placeholder="45.00" />
                    </div>
                    <div className="sm:col-span-1 xl:col-span-2">
                      <Label htmlFor="create-cardPricePerM2">
                        {createForm.calculationType === "metro_linear" ? "Preço via Cartão por Metro Linear (R$)" : "Preço via Cartão por m² (R$)"}
                      </Label>
                      <Input id="create-cardPricePerM2" type="number" step="0.01" value={createForm.cardPricePerM2} onChange={(e) => setCreateForm({ ...createForm, cardPricePerM2: e.target.value })} placeholder="45.00" />
                    </div>
                    <div className="sm:col-span-1 xl:col-span-2">
                      <Label htmlFor="create-resellerPricePerM2">
                        {createForm.calculationType === "metro_linear" ? "Preço Revendedor por Metro Linear (R$)" : "Preço Revendedor por m² (R$)"}
                      </Label>
                      <Input id="create-resellerPricePerM2" type="number" step="0.01" value={createForm.resellerPricePerM2} onChange={(e) => setCreateForm({ ...createForm, resellerPricePerM2: e.target.value })} placeholder="Opcional" />
                    </div>
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2 xl:col-span-6 xl:grid-cols-4">
                    <div>
                      <Label htmlFor="create-minWidth">Largura Mínima (m)</Label>
                      <Input id="create-minWidth" type="number" step="0.01" value={createForm.minWidth} onChange={(e) => setCreateForm({ ...createForm, minWidth: e.target.value })} placeholder="0.10" />
                    </div>
                    <div>
                      <Label htmlFor="create-maxWidth">Largura Máxima (m)</Label>
                      <Input id="create-maxWidth" type="number" step="0.01" value={createForm.maxWidth} onChange={(e) => setCreateForm({ ...createForm, maxWidth: e.target.value })} placeholder="5.00" />
                    </div>
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
              <div className={EDIT_PRODUCT_MODAL_LAYOUT.secondary}>
                <div className="space-y-4">
                  {/* Upload de Fotos */}
                  <Card className={PRODUCT_FORM_PANEL.card}>
                    <CardContent className="px-4">
                      <ProductImageUploader
                        mainImageUrl={createForm.imageUrl}
                        galleryUrls={createForm.galleryUrls}
                        onMainImageChange={(url, key) => setCreateForm({ ...createForm, imageUrl: url, imageKey: key || "" })}
                        onGalleryChange={(urls) => setCreateForm({ ...createForm, galleryUrls: urls })}
                        compact
                      />
                    </CardContent>
                  </Card>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                  {/* Segmentos */}
                  <Card className={PRODUCT_FORM_PANEL.card}>
                    <CardContent className={PRODUCT_FORM_PANEL.content}>
                      <h3 className={PRODUCT_FORM_PANEL.title}>Segmentos</h3>
                      <MultiSegmentSelector
                        productId={autoCreatedProductId || 0}
                        selectedSegmentIds={createForm.segmentIds}
                        onSegmentsChange={handleCreateSegmentsChange}
                      />
                    </CardContent>
                  </Card>

                  <Card className={PRODUCT_FORM_PANEL.card}>
                    <CardContent className={PRODUCT_FORM_PANEL.content}>
                      <h3 className={PRODUCT_FORM_PANEL.title}>Tags do Produto</h3>
                      <p className="text-sm text-gray-500">Selecione as tags que aparecerão sobre a imagem do produto no catálogo.</p>
                      <div className="grid grid-cols-1 gap-3">
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
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <Label htmlFor="create-card-description" className="text-sm font-medium text-gray-700">Descrição do Card</Label>
                        <p className="mt-1 text-sm text-gray-500">Mensagem exibida abaixo dos preços no card público. Quando preenchida, substitui o aviso automático de urgência.</p>
                        <Textarea
                          id="create-card-description"
                          value={createForm.cardDescription}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, cardDescription: event.target.value.slice(0, 180) }))}
                          placeholder="Ex.: Produção no mesmo dia · taxa de urgência de R$ 20,00/m²"
                          maxLength={180}
                          className="mt-3 min-h-20 resize-y"
                        />
                        <p className="mt-1 text-right text-xs text-gray-400">{createForm.cardDescription.length}/180</p>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Prazos de Produção */}
                  <DeliveryOptionsManager
                    key={autoCreatedProductId || "new-product-draft"}
                    productId={autoCreatedProductId || undefined}
                    calculationType={createForm.calculationType}
                    onChange={autoCreatedProductId ? undefined : setCreateDeliveryOptions}
                    initialOptions={createDeliveryOptions}
                    compact
                  />
              {/* Logística */}
              <Card className={PRODUCT_FORM_PANEL.card}>
                <CardContent className={PRODUCT_FORM_PANEL.content}>
                  <h3 className={`${PRODUCT_FORM_PANEL.title} flex items-center gap-2`}>
                    <Package className="w-4 h-4 text-orange-500" />
                    Logística
                  </h3>
                <div className={PRODUCT_FORM_PANEL.inner}>
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
                <div className={PRODUCT_FORM_PANEL.inner}>
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
                </CardContent>
              </Card>
              {/* Especificações Técnicas */}
              <div className={PRODUCT_FORM_PANEL.inner}>
                <div className="flex items-center justify-between">
                  <h3 className={PRODUCT_FORM_PANEL.title}>Especificações Técnicas</h3>
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
                      className="h-9 w-9 p-0 text-gray-400 hover:bg-pink-50 hover:text-pink-600 focus-visible:bg-pink-50 focus-visible:text-pink-600"
                      onClick={() => setCreateForm((prev) => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== idx) }))}
                      title="Excluir especificação"
                      aria-label="Excluir especificação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 pt-2 text-sm text-gray-500">
                <p>As alterações são salvas automaticamente assim que os dados obrigatórios estiverem válidos.</p>
                <Button type="button" variant="outline" onClick={() => navigate("/admin/produtos")}>Voltar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
