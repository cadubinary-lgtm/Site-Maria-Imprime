import AdminLayout from "@/components/AdminLayout";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, Plus, Package, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLocation } from "wouter";
import MultiSegmentSelector from "@/components/MultiSegmentSelector";
import { DeliveryOptionsManager, type DeliveryOptionData } from "@/components/products/DeliveryOptionsManager";
import { ProductImageUploader } from "@/components/products/ProductImageUploader";
import { EDIT_PRODUCT_MODAL_LAYOUT, NEW_PRODUCT_FIELD_LAYOUT, PRODUCT_FORM_PANEL } from "@/lib/new-product-layout";
import { getLegacySegmentFromSelection } from "@/lib/new-product-segment";
import { getCardDescriptionLines, PRODUCT_CARD_DESCRIPTION_LINE_MAX_LENGTH, updateCardDescriptionLine } from "@/lib/product-card-description";
import { formatProductPriceInput, normalizeProductPriceInput, parseProductPriceInput } from "@/lib/product-price-input";
import { scheduleProductPriceAutoAdvance } from "@/lib/product-price-auto-advance";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DEFAULT_BRL_PRICE = "0,00";
const toBrazilianPriceInput = (value: unknown) => {
  const amount = parseProductPriceInput(String(value ?? 0));
  return Number.isFinite(amount) && amount >= 0 ? formatProductPriceInput(String(amount)) : DEFAULT_BRL_PRICE;
};

const getInitialCreateLogistics = () => ({
  weight: "",
  width: "",
  height: "",
  length: "",
  allowedCarrierIds: [] as number[],
});

const getInitialCreateForm = () => ({
  name: "",
  description: "",
  price: DEFAULT_BRL_PRICE,
  pixPrice: DEFAULT_BRL_PRICE,
  cardPrice: DEFAULT_BRL_PRICE,
  resellerPrice: DEFAULT_BRL_PRICE,
  segment: "",
  imageUrl: "",
  imageKey: "",
  galleryUrls: [] as string[],
  calculationType: "unidade",
  pricePerM2: DEFAULT_BRL_PRICE,
  pixPricePerM2: DEFAULT_BRL_PRICE,
  cardPricePerM2: DEFAULT_BRL_PRICE,
  resellerPricePerM2: DEFAULT_BRL_PRICE,
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

type CreatePriceField = "price" | "pixPrice" | "cardPrice" | "resellerPrice" | "pricePerM2" | "pixPricePerM2" | "cardPricePerM2" | "resellerPricePerM2";

export default function AdminNewProduct() {
  const [location, navigate] = useLocation();
  const duplicateProductId = useMemo(() => {
    const productId = Number(new URLSearchParams(location.split("?")[1] || "").get("duplicar"));
    return Number.isInteger(productId) && productId > 0 ? productId : null;
  }, [location]);

  const [createDeliveryOptions, setCreateDeliveryOptions] = useState<DeliveryOptionData[]>([]);
  const [autoCreatedProductId, setAutoCreatedProductId] = useState<number | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "waiting" | "saving" | "saved" | "error">("idle");
  const [lastSyncedSignature, setLastSyncedSignature] = useState("");
  const [autoSaveRevision, setAutoSaveRevision] = useState(0);
  const [draftResetVersion, setDraftResetVersion] = useState(0);
  const [isDiscardDraftDialogOpen, setIsDiscardDraftDialogOpen] = useState(false);
  const [isDuplicatingDraft, setIsDuplicatingDraft] = useState(false);
  const [isClearDuplicateImagesDialogOpen, setIsClearDuplicateImagesDialogOpen] = useState(false);
  const isAutoSaveInFlightRef = useRef(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const duplicatedProductIdRef = useRef<number | null>(null);
  const [createLogistics, setCreateLogistics] = useState(getInitialCreateLogistics);
  const [createForm, setCreateForm] = useState(getInitialCreateForm);

  const { data: segmentsData } = trpc.segments.getAll.useQuery();
  const { data: carriersData } = trpc.logistics.carriers.list.useQuery();
  const { data: duplicateSourceProduct, isLoading: isDuplicateSourceLoading } = trpc.products.getById.useQuery(
    { id: duplicateProductId || 0 },
    { enabled: duplicateProductId !== null },
  );
  const { data: duplicateSourceSegments, isLoading: isDuplicateSegmentsLoading } = trpc.productSegments.getProductSegments.useQuery(
    duplicateProductId || 0,
    { enabled: duplicateProductId !== null },
  );
  const { data: duplicateSourceDeliveryOptions, isLoading: isDuplicateDeliveryOptionsLoading } = trpc.deliveryOptions.getByProduct.useQuery(
    { productId: duplicateProductId || 0 },
    { enabled: duplicateProductId !== null },
  );

  const createProductMutation = trpc.admin.createProduct.useMutation();
  const updateProductMutation = trpc.admin.updateProduct.useMutation();
  const createDeliveryOptionMutation = trpc.deliveryOptions.create.useMutation();
  const updateSegmentsMutation = trpc.productSegments.updateSegments.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (duplicateProductId !== null) return;
    const rawDraft = window.localStorage.getItem("maria-imprime-new-product-autosave");
    if (!rawDraft) return;
    try {
      const draft = JSON.parse(rawDraft);
        if (draft?.createForm?.name) {
          setCreateForm((current) => ({
            ...current,
            ...draft.createForm,
            price: toBrazilianPriceInput(draft.createForm.price),
            pixPrice: toBrazilianPriceInput(draft.createForm.pixPrice),
            cardPrice: toBrazilianPriceInput(draft.createForm.cardPrice),
            resellerPrice: toBrazilianPriceInput(draft.createForm.resellerPrice),
            pricePerM2: toBrazilianPriceInput(draft.createForm.pricePerM2),
            pixPricePerM2: toBrazilianPriceInput(draft.createForm.pixPricePerM2),
            cardPricePerM2: toBrazilianPriceInput(draft.createForm.cardPricePerM2),
            resellerPricePerM2: toBrazilianPriceInput(draft.createForm.resellerPricePerM2),
          }));
          if (draft.createLogistics) setCreateLogistics((current) => ({ ...current, ...draft.createLogistics }));
          if (Array.isArray(draft.createDeliveryOptions)) setCreateDeliveryOptions(draft.createDeliveryOptions);
          setAutoSaveState("waiting");
          toast.info("Rascunho recuperado", { description: "Conclua os dados obrigatórios e clique em Criar produto para confirmar o cadastro." });
      }
    } catch {
      window.localStorage.removeItem("maria-imprime-new-product-autosave");
    }
  }, [duplicateProductId]);

  useEffect(() => {
    if (
      duplicateProductId === null
      || duplicatedProductIdRef.current === duplicateProductId
      || isDuplicateSourceLoading
      || isDuplicateSegmentsLoading
      || isDuplicateDeliveryOptionsLoading
      || !duplicateSourceProduct
    ) return;

    const parseJsonArray = <T,>(value: string | null | undefined, fallback: T[]) => {
      try {
        const parsed = value ? JSON.parse(value) : fallback;
        return Array.isArray(parsed) ? parsed : fallback;
      } catch {
        return fallback;
      }
    };
    const toInputValue = (value: unknown) => value === null || value === undefined ? "" : String(value);
    const source = duplicateSourceProduct as any;
    const sourceSegmentIds = (duplicateSourceSegments || []).map((segment: any) => segment.id);
    const sourceDeliveryOptions = (duplicateSourceDeliveryOptions || []).map((option: any, index: number) => ({
      name: option.name,
      daysToDeliver: Number(option.daysToDeliver),
      pricePerM2: Number(option.pricePerM2),
      isActive: Boolean(option.isActive),
      order: index,
    }));
    const sourceAllowedCarrierIds = parseJsonArray<number>(source.allowedCarriers, []).filter(Number.isFinite);
    const duplicatedForm = {
      ...getInitialCreateForm(),
      name: `Cópia de ${source.name}`,
      description: source.description || "",
      price: toBrazilianPriceInput(source.price),
      pixPrice: toBrazilianPriceInput(source.pixPrice ?? source.price),
      cardPrice: toBrazilianPriceInput(source.cardPrice ?? source.price),
      resellerPrice: toBrazilianPriceInput(source.resellerPrice),
      segment: source.segment || "geral",
      imageUrl: source.imageUrl || "",
      imageKey: source.imageKey || "",
      galleryUrls: parseJsonArray<string>(source.galleryUrls, []),
      calculationType: source.calculationType || "unidade",
      pricePerM2: toBrazilianPriceInput(source.pricePerM2),
      pixPricePerM2: toBrazilianPriceInput(source.pixPricePerM2 ?? source.pricePerM2),
      cardPricePerM2: toBrazilianPriceInput(source.cardPricePerM2 ?? source.pricePerM2),
      resellerPricePerM2: toBrazilianPriceInput(source.resellerPricePerM2),
      minWidth: toInputValue(source.minWidth),
      maxWidth: toInputValue(source.maxWidth),
      minHeight: toInputValue(source.minHeight),
      maxHeight: toInputValue(source.maxHeight),
      segmentIds: sourceSegmentIds,
      specifications: parseJsonArray<{ label: string; value: string }>(source.specifications, []),
      tags: parseJsonArray<string>(source.tags, []),
      tagPosition: source.tagPosition || "top-right",
      cardDescription: source.cardDescription || "",
    };
    const duplicatedLogistics = {
      weight: toInputValue(source.weight),
      width: toInputValue(source.width),
      height: toInputValue(source.height),
      length: toInputValue(source.length),
      allowedCarrierIds: sourceAllowedCarrierIds,
    };

    duplicatedProductIdRef.current = duplicateProductId;
    setCreateForm(duplicatedForm);
    setCreateLogistics(duplicatedLogistics);
    setCreateDeliveryOptions(sourceDeliveryOptions);
    setAutoCreatedProductId(null);
    setIsDuplicatingDraft(true);
    setLastSyncedSignature("");
    setAutoSaveState("waiting");
    setDraftResetVersion((version) => version + 1);
    window.localStorage.removeItem("maria-imprime-new-product-autosave");
    toast.success("Produto pronto para duplicação", {
      description: "Revise os dados e clique em Criar produto para confirmar o novo cadastro.",
      position: "top-right",
      duration: 3500,
      id: `product-duplicate-ready-${duplicateProductId}`,
    });
    navigate("/admin/novo-produto", { replace: true });
  }, [duplicateProductId, duplicateSourceDeliveryOptions, duplicateSourceProduct, duplicateSourceSegments, isDuplicateDeliveryOptionsLoading, isDuplicateSegmentsLoading, isDuplicateSourceLoading, navigate]);

  const handleCreateSegmentsChange = useCallback((segmentIds: number[]) => {
    setCreateForm((prev) => ({
      ...prev,
      segmentIds,
      segment: getLegacySegmentFromSelection(segmentIds, segmentsData || []),
    }));
  }, [segmentsData]);

  const finalizeCreatePrice = useCallback((field: CreatePriceField, syncBasePrice = false) => {
    setCreateForm((previous) => {
      const formatted = formatProductPriceInput(previous[field]);
      if (formatted === previous[field]) return previous;
      return {
        ...previous,
        [field]: formatted,
        ...(syncBasePrice ? { price: formatted } : {}),
      };
    });
  }, []);

  const isCreateFormReadyForAutoSave = useCallback(() => {
    if (!createForm.name.trim()) return false;
    const isMeasureBased = createForm.calculationType === "m2" || createForm.calculationType === "metro_linear";
    if (!isMeasureBased) return parseProductPriceInput(createForm.pixPrice) > 0 && parseProductPriceInput(createForm.cardPrice) > 0;
    return parseProductPriceInput(createForm.pixPricePerM2) > 0
      && parseProductPriceInput(createForm.cardPricePerM2) > 0
      && parseFloat(createForm.minWidth) > 0
      && parseFloat(createForm.maxWidth) > parseFloat(createForm.minWidth)
      && parseFloat(createForm.minHeight) > 0
      && parseFloat(createForm.maxHeight) > parseFloat(createForm.minHeight);
  }, [createForm]);

  const getCreatePayload = useCallback(() => {
    const isMeasureBased = createForm.calculationType === "m2" || createForm.calculationType === "metro_linear";
    const pixPrice = normalizeProductPriceInput(createForm.pixPrice);
    const cardPrice = normalizeProductPriceInput(createForm.cardPrice);
    const resellerPrice = normalizeProductPriceInput(createForm.resellerPrice);
    const pixPricePerM2 = normalizeProductPriceInput(createForm.pixPricePerM2);
    const cardPricePerM2 = normalizeProductPriceInput(createForm.cardPricePerM2);
    const resellerPricePerM2 = normalizeProductPriceInput(createForm.resellerPricePerM2);
    const hasResellerPrice = parseProductPriceInput(createForm.resellerPrice) > 0;
    const hasResellerPricePerM2 = parseProductPriceInput(createForm.resellerPricePerM2) > 0;
    return {
      name: createForm.name,
      description: createForm.description,
      price: isMeasureBased ? (normalizeProductPriceInput(createForm.price) || pixPricePerM2) : pixPrice,
      pixPrice,
      cardPrice,
      resellerPrice: hasResellerPrice ? resellerPrice : undefined,
      segment: createForm.segment?.trim() || "geral",
      imageUrl: createForm.imageUrl,
      imageKey: createForm.imageKey || undefined,
      galleryUrls: createForm.galleryUrls.length > 0 ? JSON.stringify(createForm.galleryUrls) : undefined,
      calculationType: createForm.calculationType as "m2" | "metro_linear" | "pacote" | "unidade",
      pricePerM2: isMeasureBased ? pixPricePerM2 : undefined,
      pixPricePerM2: isMeasureBased ? pixPricePerM2 : undefined,
      cardPricePerM2: isMeasureBased ? cardPricePerM2 : undefined,
      resellerPricePerM2: isMeasureBased && hasResellerPricePerM2 ? resellerPricePerM2 : undefined,
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
    if (isAutoSaveInFlightRef.current || !autoCreatedProductId || !isCreateFormReadyForAutoSave()) return;
    const signatureAtStart = getNewProductSignature();
    isAutoSaveInFlightRef.current = true;
    setAutoSaveState("saving");
    try {
      const payload = getCreatePayload();
      await updateProductMutation.mutateAsync({ id: autoCreatedProductId, ...payload });
      await updateSegmentsMutation.mutateAsync({ productId: autoCreatedProductId, segmentIds: createForm.segmentIds });
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
  }, [autoCreatedProductId, createDeliveryOptions, createForm, createLogistics, getCreatePayload, getNewProductSignature, isCreateFormReadyForAutoSave, updateProductMutation, updateSegmentsMutation, utils]);

  const handleCreateProduct = useCallback(async () => {
    if (isAutoSaveInFlightRef.current || autoCreatedProductId) return;
    if (!isCreateFormReadyForAutoSave()) {
      setAutoSaveState("waiting");
      toast.error("Preencha os dados obrigatórios antes de criar o produto");
      return;
    }

    const signatureAtStart = getNewProductSignature();
    isAutoSaveInFlightRef.current = true;
    setAutoSaveState("saving");
    try {
      const result = await createProductMutation.mutateAsync(getCreatePayload());
      const productId = Number((result as { id?: unknown } | undefined)?.id);
      if (!Number.isInteger(productId) || productId <= 0) {
        throw new Error("O produto não retornou um identificador válido");
      }

      const productName = createForm.name.trim();
      const wasDuplicatingDraft = isDuplicatingDraft;
      const activeOptions = createDeliveryOptions.filter((opt) => opt.isActive);
      const postCreateResults = await Promise.allSettled([
        ...activeOptions.map((opt, index) => createDeliveryOptionMutation.mutateAsync({
          productId, name: opt.name, daysToDeliver: opt.daysToDeliver, pricePerM2: opt.pricePerM2, isActive: true, order: index,
        })),
        updateSegmentsMutation.mutateAsync({ productId, segmentIds: createForm.segmentIds }),
      ]);
      const hasPostCreateFailure = postCreateResults.some((result) => result.status === "rejected");

      await utils.products.getAll.invalidate();
      const initialForm = getInitialCreateForm();
      const initialLogistics = getInitialCreateLogistics();
      const initialDeliveryOptions: DeliveryOptionData[] = [];
      setCreateForm(initialForm);
      setCreateLogistics(initialLogistics);
      setCreateDeliveryOptions(initialDeliveryOptions);
      setAutoCreatedProductId(null);
      setIsDuplicatingDraft(false);
      duplicatedProductIdRef.current = null;
      setLastSyncedSignature(JSON.stringify({
        createForm: initialForm,
        createLogistics: initialLogistics,
        createDeliveryOptions: initialDeliveryOptions,
      }));
      setAutoSaveRevision((revision) => revision + 1);
      setDraftResetVersion((version) => version + 1);
      window.localStorage.removeItem("maria-imprime-new-product-autosave");
      setAutoSaveState("idle");
      toast.success("Produto criado com sucesso", {
        description: wasDuplicatingDraft
          ? `${productName}: a cópia foi criada e será destacada na lista de produtos.`
          : `${productName}: cadastro confirmado e formulário pronto para um novo produto.`,
        position: "top-right",
        duration: 3500,
        id: `new-product-created-${productId}`,
        icon: <CheckCircle2 className="h-5 w-5 animate-[pulse_1.2s_ease-in-out_2] text-emerald-600" aria-hidden="true" />,
        className: "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-lg",
      });
      if (hasPostCreateFailure) {
        toast.warning("Produto criado com dados complementares pendentes", {
          description: "Revise prazos de produção e segmentos quando estiver pronto. O cadastro principal foi confirmado.",
          position: "top-right",
          duration: 4500,
          id: `new-product-post-create-warning-${productId}`,
        });
      }
      navigate(`/admin/produtos?destacar=${productId}`);
    } catch (error) {
      console.error("[new-product-create]", error);
      window.localStorage.setItem("maria-imprime-new-product-autosave", JSON.stringify({ createForm, createLogistics, createDeliveryOptions, savedAt: Date.now() }));
      setAutoSaveState("error");
      toast.error("Falha ao criar produto: rascunho preservado no navegador");
    } finally {
      isAutoSaveInFlightRef.current = false;
    }
  }, [autoCreatedProductId, createDeliveryOptionMutation, createDeliveryOptions, createForm, createProductMutation, getCreatePayload, isCreateFormReadyForAutoSave, isDuplicatingDraft, navigate, updateSegmentsMutation, utils]);

  const handleClearDuplicateImages = useCallback(() => {
    if (!isDuplicatingDraft || autoCreatedProductId) return;
    setCreateForm((current) => ({
      ...current,
      imageUrl: "",
      imageKey: "",
      galleryUrls: [],
    }));
    setIsClearDuplicateImagesDialogOpen(false);
    toast.info("Imagens removidas", {
      description: "Adicione as fotos do novo produto quando estiver pronto.",
      position: "top-right",
      duration: 3500,
      id: "new-product-duplicate-images-cleared",
    });
  }, [autoCreatedProductId, isDuplicatingDraft]);

  const handleDiscardDraft = useCallback(() => {
    if (autoCreatedProductId || createProductMutation.isPending) return;
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);

    const initialForm = getInitialCreateForm();
    const initialLogistics = getInitialCreateLogistics();
    const initialDeliveryOptions: DeliveryOptionData[] = [];
    setCreateForm(initialForm);
    setCreateLogistics(initialLogistics);
    setCreateDeliveryOptions(initialDeliveryOptions);
    setAutoCreatedProductId(null);
    setIsDuplicatingDraft(false);
    duplicatedProductIdRef.current = null;
    setLastSyncedSignature(JSON.stringify({
      createForm: initialForm,
      createLogistics: initialLogistics,
      createDeliveryOptions: initialDeliveryOptions,
    }));
    setAutoSaveState("idle");
    setAutoSaveRevision((revision) => revision + 1);
    setDraftResetVersion((version) => version + 1);
    window.localStorage.removeItem("maria-imprime-new-product-autosave");
    setIsDiscardDraftDialogOpen(false);
    toast.info("Rascunho descartado", {
      description: "Os dados preenchidos foram removidos.",
      position: "top-right",
      duration: 3500,
      id: "new-product-draft-discarded",
    });
  }, [autoCreatedProductId, createProductMutation.isPending]);

  useEffect(() => {
    const signature = getNewProductSignature();
    if (signature === lastSyncedSignature) return;
    window.localStorage.setItem("maria-imprime-new-product-autosave", JSON.stringify({ createForm, createLogistics, createDeliveryOptions, savedAt: Date.now() }));
    if (!autoCreatedProductId) {
      setAutoSaveState("waiting");
      return;
    }
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
  }, [autoCreatedProductId, autoSaveRevision, createDeliveryOptions, createForm, createLogistics, getNewProductSignature, isCreateFormReadyForAutoSave, lastSyncedSignature, synchronizeNewProduct]);

  return (
    <AdminLayout>
      <div className="admin-visual-system min-h-full space-y-4 xl:space-y-5">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados para criar um novo produto no catálogo</p>
          </div>
          <div className="flex items-center gap-2">
            {autoSaveState !== "idle" && (
              <span role="status" className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                autoSaveState === "error" ? "bg-red-50 text-red-700" : autoSaveState === "waiting" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
              }`} aria-live="polite">
                {autoSaveState === "saving" ? (autoCreatedProductId ? "Salvando automaticamente..." : "Criando produto...") : autoSaveState === "saved" ? "Salvo automaticamente" : autoSaveState === "error" ? "Falha ao salvar: rascunho preservado" : autoCreatedProductId ? "Aguardando dados obrigatórios" : "Pronto para criar"}
              </span>
            )}
            {!autoCreatedProductId && (createForm.name.trim() || createForm.description.trim() || createForm.pixPrice || createForm.cardPrice || createForm.pixPricePerM2 || createForm.cardPricePerM2 || createForm.imageUrl || createForm.galleryUrls.length > 0 || createForm.segmentIds.length > 0 || createForm.specifications.length > 0 || createForm.tags.length > 0 || createForm.cardDescription.trim() || createLogistics.weight || createLogistics.width || createLogistics.height || createLogistics.length || createLogistics.allowedCarrierIds.length > 0 || createDeliveryOptions.length > 0) && (
              <Button
                type="button"
                variant="outline"
                disabled={createProductMutation.isPending}
                className="text-gray-500 hover:bg-pink-50 hover:text-pink-600 focus-visible:bg-pink-50 focus-visible:text-pink-600"
                onClick={() => setIsDiscardDraftDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Descartar Rascunho
              </Button>
            )}
            <Button type="button" onClick={handleCreateProduct} disabled={Boolean(autoCreatedProductId) || createProductMutation.isPending} aria-busy={createProductMutation.isPending} className="bg-pink-600 hover:bg-pink-700 focus-visible:ring-pink-300">
              {createProductMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="mr-2 h-4 w-4" aria-hidden="true" />}
              {autoCreatedProductId ? "Produto criado" : "Criar produto"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/produtos")}>
              ← Voltar para Produtos
            </Button>
          </div>
        </div>

        <Card className={PRODUCT_FORM_PANEL.card}>
          <CardContent className={PRODUCT_FORM_PANEL.content}>
            <h3 className={PRODUCT_FORM_PANEL.title}>Dados comerciais</h3>
            <form onSubmit={(event) => { event.preventDefault(); handleCreateProduct(); }} className="space-y-4">
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
                      type="text"
                      inputMode="decimal"
                      value={createForm.pixPrice}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, pixPrice: e.target.value, price: e.target.value });
                        scheduleProductPriceAutoAdvance(e.currentTarget);
                      }}
                      onBlur={() => finalizeCreatePrice("pixPrice", true)}
                      placeholder="0,00"
                      required
                    />
                  </div>
                )}
                {(createForm.calculationType === "unidade" || createForm.calculationType === "pacote") && (
                  <div className={EDIT_PRODUCT_MODAL_LAYOUT.price}>
                    <Label htmlFor="create-cardPrice">Preço via Cartão (R$) *</Label>
                    <Input id="create-cardPrice" type="text" inputMode="decimal" value={createForm.cardPrice} onChange={(e) => { setCreateForm({ ...createForm, cardPrice: e.target.value }); scheduleProductPriceAutoAdvance(e.currentTarget); }} onBlur={() => finalizeCreatePrice("cardPrice")} placeholder="0,00" required />
                  </div>
                )}
                {(createForm.calculationType === "unidade" || createForm.calculationType === "pacote") && (
                  <div className={EDIT_PRODUCT_MODAL_LAYOUT.price}>
                    <Label htmlFor="create-resellerPrice">Preço Revendedor (R$)</Label>
                    <Input id="create-resellerPrice" type="text" inputMode="decimal" value={createForm.resellerPrice} onChange={(e) => { setCreateForm({ ...createForm, resellerPrice: e.target.value }); scheduleProductPriceAutoAdvance(e.currentTarget); }} onBlur={() => finalizeCreatePrice("resellerPrice")} placeholder="0,00" />
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
                      <Input id="create-pixPricePerM2" type="text" inputMode="decimal" value={createForm.pixPricePerM2} onChange={(e) => { setCreateForm({ ...createForm, pixPricePerM2: e.target.value, pricePerM2: e.target.value }); scheduleProductPriceAutoAdvance(e.currentTarget); }} onBlur={() => finalizeCreatePrice("pixPricePerM2", true)} placeholder="0,00" />
                    </div>
                    <div className="sm:col-span-1 xl:col-span-2">
                      <Label htmlFor="create-cardPricePerM2">
                        {createForm.calculationType === "metro_linear" ? "Preço via Cartão por Metro Linear (R$)" : "Preço via Cartão por m² (R$)"}
                      </Label>
                      <Input id="create-cardPricePerM2" type="text" inputMode="decimal" value={createForm.cardPricePerM2} onChange={(e) => { setCreateForm({ ...createForm, cardPricePerM2: e.target.value }); scheduleProductPriceAutoAdvance(e.currentTarget); }} onBlur={() => finalizeCreatePrice("cardPricePerM2")} placeholder="0,00" />
                    </div>
                    <div className="sm:col-span-1 xl:col-span-2">
                      <Label htmlFor="create-resellerPricePerM2">
                        {createForm.calculationType === "metro_linear" ? "Preço Revendedor por Metro Linear (R$)" : "Preço Revendedor por m² (R$)"}
                      </Label>
                      <Input id="create-resellerPricePerM2" type="text" inputMode="decimal" value={createForm.resellerPricePerM2} onChange={(e) => { setCreateForm({ ...createForm, resellerPricePerM2: e.target.value }); scheduleProductPriceAutoAdvance(e.currentTarget); }} onBlur={() => finalizeCreatePrice("resellerPricePerM2")} placeholder="0,00" />
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
                      {isDuplicatingDraft && !autoCreatedProductId && (
                        <div className="flex justify-end pb-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!createForm.imageUrl && createForm.galleryUrls.length === 0}
                            className="text-gray-500 hover:bg-pink-50 hover:text-pink-600 focus-visible:bg-pink-50 focus-visible:text-pink-600"
                            onClick={() => setIsClearDuplicateImagesDialogOpen(true)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Limpar imagens
                          </Button>
                        </div>
                      )}
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

                  <div className="flex flex-col gap-4 self-start sm:col-start-2">
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
                    </CardContent>
                  </Card>
                  <Card className={PRODUCT_FORM_PANEL.card}>
                    <CardContent className={PRODUCT_FORM_PANEL.content}>
                      <h3 className={PRODUCT_FORM_PANEL.title}>Descrição do Card</h3>
                      <p className="text-sm text-gray-500">Defina até duas linhas exibidas abaixo dos preços. Quando preenchidas, substituem o aviso automático de urgência.</p>
                      <div className="mt-4 space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="create-card-description-line-1" className="text-sm font-medium text-gray-700">Linha 1</Label>
                          <Input
                            id="create-card-description-line-1"
                            value={getCardDescriptionLines(createForm.cardDescription)[0]}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, cardDescription: updateCardDescriptionLine(prev.cardDescription, 0, event.target.value) }))}
                            placeholder="Ex.: Produção no mesmo dia"
                            maxLength={PRODUCT_CARD_DESCRIPTION_LINE_MAX_LENGTH}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="create-card-description-line-2" className="text-sm font-medium text-gray-700">Linha 2</Label>
                          <Input
                            id="create-card-description-line-2"
                            value={getCardDescriptionLines(createForm.cardDescription)[1]}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, cardDescription: updateCardDescriptionLine(prev.cardDescription, 1, event.target.value) }))}
                            placeholder="Ex.: Taxa de urgência de R$ 20,00/m²"
                            maxLength={PRODUCT_CARD_DESCRIPTION_LINE_MAX_LENGTH}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Prazos de Produção */}
                  <DeliveryOptionsManager
                    key={`${autoCreatedProductId || "new-product-draft"}-${draftResetVersion}`}
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
                    <Package className="w-4 h-4 text-pink-600" aria-hidden="true" />
                    Logística
                  </h3>
                <div className={PRODUCT_FORM_PANEL.inner}>
                  <p className="text-sm font-medium text-gray-700">Dimensões e Peso da Embalagem</p>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    <div>
                      <Label htmlFor="create-weight">Peso (kg)</Label>
                      <Input id="create-weight" type="number" step="0.01" placeholder="Ex: 0.5" value={createLogistics.weight} onChange={(e) => { setCreateLogistics((prev) => ({ ...prev, weight: e.target.value })); scheduleProductPriceAutoAdvance(e.currentTarget); }} />
                    </div>
                    <div>
                      <Label htmlFor="create-log-width">Largura (cm)</Label>
                      <Input id="create-log-width" type="number" step="0.1" placeholder="Ex: 20" value={createLogistics.width} onChange={(e) => { setCreateLogistics((prev) => ({ ...prev, width: e.target.value })); scheduleProductPriceAutoAdvance(e.currentTarget); }} />
                    </div>
                    <div>
                      <Label htmlFor="create-log-height">Altura (cm)</Label>
                      <Input id="create-log-height" type="number" step="0.1" placeholder="Ex: 30" value={createLogistics.height} onChange={(e) => { setCreateLogistics((prev) => ({ ...prev, height: e.target.value })); scheduleProductPriceAutoAdvance(e.currentTarget); }} />
                    </div>
                    <div>
                      <Label htmlFor="create-log-length">Comprimento (cm)</Label>
                      <Input id="create-log-length" type="number" step="0.1" placeholder="Ex: 10" value={createLogistics.length} onChange={(e) => { setCreateLogistics((prev) => ({ ...prev, length: e.target.value })); scheduleProductPriceAutoAdvance(e.currentTarget); }} />
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
                <p>{autoCreatedProductId ? "As alterações são salvas automaticamente após a criação." : "Preencha os dados obrigatórios e clique em Criar produto para iniciar o autosalvamento."}</p>
                <Button type="button" variant="outline" onClick={() => navigate("/admin/produtos")}>Voltar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={isDiscardDraftDialogOpen} onOpenChange={setIsDiscardDraftDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar rascunho?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados preenchidos neste novo produto serão removidos e não poderão ser recuperados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardDraft} className="bg-pink-600 text-white hover:bg-pink-700">
              Descartar rascunho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isClearDuplicateImagesDialogOpen} onOpenChange={setIsClearDuplicateImagesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar imagens da cópia?</AlertDialogTitle>
            <AlertDialogDescription>
              A foto principal e todas as fotos adicionais serão removidas somente deste novo rascunho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter imagens</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearDuplicateImages} className="bg-pink-600 text-white hover:bg-pink-700">
              Limpar imagens
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
