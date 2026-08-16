import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Edit2, Trash2, Plus, Search, X, Package } from "lucide-react";
import { formatProductPrice } from "@/lib/productPrice";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import { ProductLogisticsTab } from "@/components/products/ProductLogisticsTab";
import { ProductImageUploader } from "@/components/products/ProductImageUploader";
import MultiSegmentSelector from "@/components/MultiSegmentSelector";
import { DeliveryOptionsManager, type DeliveryOptionData } from "@/components/products/DeliveryOptionsManager";
import { EDIT_PRODUCT_MODAL_LAYOUT, PRODUCT_FORM_PANEL } from "@/lib/new-product-layout";
import { createProductEditSignature, hasUnsavedProductChanges, shouldInitializeProductEditSession } from "@/lib/product-edit-guard";
import { getProductEditDraftKey, parseProductEditDraft, serializeProductEditDraft } from "@/lib/product-edit-draft";
import { formatProductPriceInput, normalizeProductPriceInput, parseProductPriceInput } from "@/lib/product-price-input";

type EditPriceField = "price" | "pixPrice" | "cardPrice" | "resellerPrice" | "pricePerM2" | "pixPricePerM2" | "cardPricePerM2" | "resellerPricePerM2";

export default function AdminProducts() {
  const [, navigate] = useLocation();

  // ─── Estado de edição ─────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBaselineSignature, setEditBaselineSignature] = useState<string | null>(null);
  const [waitingInitialSegments, setWaitingInitialSegments] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [editAutoSaveState, setEditAutoSaveState] = useState<"idle" | "waiting" | "saving" | "saved" | "error">("idle");
  const editAutoSaveTimerRef = useRef<number | null>(null);
  const [quickEditingId, setQuickEditingId] = useState<number | null>(null);
  const [quickPixPrice, setQuickPixPrice] = useState("");
  const [quickCardPrice, setQuickCardPrice] = useState("");
  const [quickResellerPrice, setQuickResellerPrice] = useState("");
  const [quickCalculationType, setQuickCalculationType] = useState("unidade");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [pixDiscountPercent, setPixDiscountPercent] = useState("");
  const [isPixDiscountConfirmOpen, setIsPixDiscountConfirmOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    pixPrice: "",
    cardPrice: "",
    resellerPrice: "",
    imageUrl: "",
    imageKey: "",
    galleryUrls: [] as string[],
    segment: "geral",
    segmentIds: [] as number[],
    calculationType: "unidade",
    pricePerM2: "",
    pixPricePerM2: "",
    cardPricePerM2: "",
    resellerPricePerM2: "",
    minWidth: "",
    maxWidth: "",
    minHeight: "",
    maxHeight: "",
    specifications: [] as { label: string; value: string }[],
    tags: [] as string[],
    tagPosition: "top-right" as string,
  });
  const lastCommittedEditFormRef = useRef<typeof editForm | null>(null);
  const [undoEditForm, setUndoEditForm] = useState<typeof editForm | null>(null);

  // ─── Queries & Mutations ──────────────────────────────────────────────────
  const { data: products, isLoading, refetch } = trpc.products.getAll.useQuery();
  const { data: productSegments } = trpc.productSegments.getProductSegments.useQuery(
    editingId || 0,
    { enabled: !!editingId }
  );
  const { data: availableSegments, isLoading: availableSegmentsLoading } = trpc.productSegments.getAllSegments.useQuery();
  const { data: selectedSegmentProducts, isLoading: selectedSegmentProductsLoading } = trpc.productSegments.getProductsBySegment.useQuery(
    selectedSegmentId || 0,
    { enabled: selectedSegmentId !== null },
  );
  const { data: carriersData } = trpc.logistics.carriers.list.useQuery();

  const adminSegments = useMemo(() => {
    if (!availableSegments || availableSegments.length === 0) return [];
    return availableSegments.map((seg: any) => ({
      id: seg.id,
      label: `${seg.icon || "📦"} ${seg.name}`,
    }));
  }, [availableSegments]);

  const selectedSegmentProductIds = useMemo(
    () => new Set((selectedSegmentProducts || []).map((product: any) => product.id)),
    [selectedSegmentProducts],
  );

  const updateProductMutation = trpc.admin.updateProduct.useMutation();
  const updateSegmentsMutation = trpc.productSegments.updateSegments.useMutation();
  const utils = trpc.useUtils();
  const deleteProductMutation = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => { utils.products.getAll.invalidate(); },
  });
  const deleteMultipleProductsMutation = trpc.admin.deleteMultipleProducts.useMutation({
    onSuccess: () => { utils.products.getAll.invalidate(); },
  });
  const applyPixDiscountMutation = trpc.productPaymentPricing.applyPixDiscount.useMutation();

  // ─── Sincronizar segmentos ao editar ─────────────────────────────────────
  useEffect(() => {
    if (!shouldInitializeProductEditSession(editingId, waitingInitialSegments, productSegments) || editingId === null || !productSegments) return;
    const productId = editingId;

    let nextForm = {
      ...editForm,
      segmentIds: productSegments.map((segment) => segment.id),
    };
    const committedForm = nextForm;
    const baselineSignature = createProductEditSignature(nextForm);
    const draft = typeof window !== "undefined"
      ? parseProductEditDraft(window.localStorage.getItem(getProductEditDraftKey(productId)))
      : null;

    if (draft?.baselineSignature === baselineSignature) {
      nextForm = draft.form;
      setDraftSavedAt(draft.savedAt);
      toast.info("Rascunho recuperado", {
        description: "As alterações locais deste produto foram restauradas.",
        position: "top-right",
        id: `product-draft-restored-${productId}`,
      });
    } else {
      setDraftSavedAt(null);
    }

    setEditForm(nextForm);
    setEditBaselineSignature(baselineSignature);
    lastCommittedEditFormRef.current = committedForm;
    setUndoEditForm(null);
    setWaitingInitialSegments(false);
  }, [editingId, productSegments, waitingInitialSegments]);

  useEffect(() => {
    if (!editingId || !editBaselineSignature || !hasUnsavedProductChanges(editBaselineSignature, editForm)) return;

    const timeout = window.setTimeout(() => {
      const savedAt = Date.now();
      window.localStorage.setItem(
        getProductEditDraftKey(editingId),
        serializeProductEditDraft({
          version: 1,
          savedAt,
          baselineSignature: editBaselineSignature,
          form: editForm,
        }),
      );
      setDraftSavedAt(savedAt);
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [editBaselineSignature, editForm, editingId]);

  const handleSegmentsChange = useCallback((segmentIds: number[]) => {
    setEditForm((prev) => ({ ...prev, segmentIds }));
  }, []);

  const finalizeEditPrice = useCallback((field: EditPriceField, syncBasePrice = false) => {
    setEditForm((prev) => {
      const formatted = formatProductPriceInput(prev[field]);
      if (formatted === prev[field]) return prev;
      return {
        ...prev,
        [field]: formatted,
        ...(syncBasePrice ? { price: formatted } : {}),
      };
    });
  }, []);

  const isEditFormReadyForAutoSave = useCallback(() => {
    if (!editForm.name.trim()) return false;
    const measureBased = isMeasureBased(editForm.calculationType);
    if (!measureBased) {
      return parseProductPriceInput(editForm.pixPrice) > 0 && parseProductPriceInput(editForm.cardPrice) > 0;
    }
    const widthValid = parseFloat(editForm.minWidth) > 0 && parseFloat(editForm.maxWidth) > parseFloat(editForm.minWidth);
    const heightValid = parseFloat(editForm.minHeight) > 0 && parseFloat(editForm.maxHeight) > parseFloat(editForm.minHeight);
    return parseProductPriceInput(editForm.pixPricePerM2) > 0 && parseProductPriceInput(editForm.cardPricePerM2) > 0 && widthValid && heightValid;
  }, [editForm]);

  // ─── Editar produto ───────────────────────────────────────────────────────
  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filteredProducts = (selectedSegmentId === null
    ? products
    : products?.filter((product: any) => selectedSegmentProductIds.has(product.id))
  )?.filter((product: any) => product.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditBaselineSignature(null);
    setWaitingInitialSegments(true);
    setDraftSavedAt(null);
    setEditAutoSaveState("idle");
    lastCommittedEditFormRef.current = null;
    setUndoEditForm(null);
    let parsedGallery: string[] = [];
    try {
      if (product.galleryUrls) parsedGallery = JSON.parse(product.galleryUrls);
    } catch {}
    setEditForm((prev) => ({
      ...prev,
      name: product.name,
      description: product.description || "",
      price: formatProductPriceInput(product.price.toString()),
      pixPrice: formatProductPriceInput(product.pixPrice ? product.pixPrice.toString() : product.price.toString()),
      cardPrice: formatProductPriceInput(product.cardPrice ? product.cardPrice.toString() : product.price.toString()),
      resellerPrice: product.resellerPrice ? formatProductPriceInput(product.resellerPrice.toString()) : "",
      imageUrl: product.imageUrl || "",
      imageKey: product.imageKey || "",
      galleryUrls: parsedGallery,
      segment: product.segment || "geral",
      calculationType: product.calculationType || "unidade",
      pricePerM2: product.pricePerM2 ? formatProductPriceInput(product.pricePerM2.toString()) : "",
      pixPricePerM2: product.pixPricePerM2 ? formatProductPriceInput(product.pixPricePerM2.toString()) : (product.pricePerM2 ? formatProductPriceInput(product.pricePerM2.toString()) : ""),
      cardPricePerM2: product.cardPricePerM2 ? formatProductPriceInput(product.cardPricePerM2.toString()) : (product.pricePerM2 ? formatProductPriceInput(product.pricePerM2.toString()) : ""),
      resellerPricePerM2: product.resellerPricePerM2 ? formatProductPriceInput(product.resellerPricePerM2.toString()) : "",
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

  const closeEditSession = () => {
    if (editingId && editBaselineSignature && hasUnsavedProductChanges(editBaselineSignature, editForm)) {
      const savedAt = Date.now();
      window.localStorage.setItem(getProductEditDraftKey(editingId), serializeProductEditDraft({ version: 1, savedAt, baselineSignature: editBaselineSignature, form: editForm }));
    } else if (editingId) {
      window.localStorage.removeItem(getProductEditDraftKey(editingId));
    }
    setEditingId(null);
    setEditBaselineSignature(null);
    setWaitingInitialSegments(false);
    setDraftSavedAt(null);
    setEditAutoSaveState("idle");
    lastCommittedEditFormRef.current = null;
    setUndoEditForm(null);
  };

  const requestEditClose = () => {
    closeEditSession();
  };

  const handleUndoLastAutoSave = () => {
    if (!undoEditForm || editAutoSaveState !== "saved") return;

    setUndoEditForm(null);
    setEditForm(undoEditForm);
    setEditAutoSaveState("waiting");
    toast.info("Revertendo a última alteração", {
      description: "A versão anterior será salva automaticamente em instantes.",
      position: "top-right",
    });
  };

  const isMeasureBased = (calculationType: string) =>
    calculationType === "m2" || calculationType === "metro_linear";

  const startQuickEdit = (product: any) => {
    const calculationType = product.calculationType || "unidade";
    const measureBased = isMeasureBased(calculationType);
    setQuickEditingId(product.id);
    setQuickCalculationType(calculationType);
    setQuickPixPrice(String(measureBased ? product.pixPricePerM2 ?? product.pricePerM2 ?? "" : product.pixPrice ?? product.price ?? ""));
    setQuickCardPrice(String(measureBased ? product.cardPricePerM2 ?? product.pricePerM2 ?? "" : product.cardPrice ?? product.price ?? ""));
    setQuickResellerPrice(String(measureBased ? product.resellerPricePerM2 ?? "" : product.resellerPrice ?? ""));
  };

  const handleQuickPricingSave = async (product: any) => {
    const normalizePrice = (value: string) => value.replace(",", ".").trim();
    const normalizedPixPrice = normalizePrice(quickPixPrice);
    const normalizedCardPrice = normalizePrice(quickCardPrice);
    const normalizedResellerPrice = normalizePrice(quickResellerPrice);
    const numericPixPrice = Number.parseFloat(normalizedPixPrice);
    const numericCardPrice = Number.parseFloat(normalizedCardPrice);
    const numericResellerPrice = normalizedResellerPrice ? Number.parseFloat(normalizedResellerPrice) : null;

    if (!Number.isFinite(numericPixPrice) || numericPixPrice <= 0) {
      toast.error("Informe um preço via Pix maior que R$ 0,00");
      return;
    }
    if (!Number.isFinite(numericCardPrice) || numericCardPrice <= 0) {
      toast.error("Informe um preço via cartão maior que R$ 0,00");
      return;
    }
    if (numericResellerPrice !== null && (!Number.isFinite(numericResellerPrice) || numericResellerPrice <= 0)) {
      toast.error("O preço revendedor deve ser maior que R$ 0,00 ou ficar em branco");
      return;
    }

    try {
      const measureBased = isMeasureBased(quickCalculationType);
      await updateProductMutation.mutateAsync({
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        price: measureBased ? String(product.price ?? "0") : normalizedPixPrice,
        pixPrice: measureBased ? String(product.pixPrice ?? product.price ?? "0") : normalizedPixPrice,
        cardPrice: measureBased ? String(product.cardPrice ?? product.price ?? "0") : normalizedCardPrice,
        resellerPrice: measureBased ? undefined : normalizedResellerPrice,
        segment: product.segment || "geral",
        imageUrl: product.imageUrl || undefined,
        calculationType: quickCalculationType as "m2" | "metro_linear" | "pacote" | "unidade",
        pricePerM2: measureBased ? normalizedPixPrice : undefined,
        pixPricePerM2: measureBased ? normalizedPixPrice : undefined,
        cardPricePerM2: measureBased ? normalizedCardPrice : undefined,
        resellerPricePerM2: measureBased ? normalizedResellerPrice : undefined,
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

  const handleSave = async (automatic = false) => {
    if (!editingId) return;
    if (!editForm.name.trim()) { toast.error("Nome do produto é obrigatório"); return; }
    if ((editForm as any).calculationType !== "m2" && (editForm as any).calculationType !== "metro_linear") {
      if (!(editForm as any).pixPrice || parseProductPriceInput((editForm as any).pixPrice) <= 0) { toast.error("Preço via Pix é obrigatório e deve ser maior que 0"); return; }
      if (!(editForm as any).cardPrice || parseProductPriceInput((editForm as any).cardPrice) <= 0) { toast.error("Preço via cartão é obrigatório e deve ser maior que 0"); return; }
    }

    if (isMeasureBased((editForm as any).calculationType)) {
      if (!(editForm as any).pixPricePerM2 || parseProductPriceInput((editForm as any).pixPricePerM2) <= 0) { toast.error(`Preço via Pix por ${(editForm as any).calculationType === "metro_linear" ? "metro linear" : "m²"} é obrigatório`); return; }
      if (!(editForm as any).cardPricePerM2 || parseProductPriceInput((editForm as any).cardPricePerM2) <= 0) { toast.error(`Preço via cartão por ${(editForm as any).calculationType === "metro_linear" ? "metro linear" : "m²"} é obrigatório`); return; }
      if (!(editForm as any).minWidth || parseFloat((editForm as any).minWidth) <= 0) { toast.error("Largura mínima é obrigatória"); return; }
      if (!(editForm as any).maxWidth || parseFloat((editForm as any).maxWidth) <= 0) { toast.error("Largura máxima é obrigatória"); return; }
      if (!(editForm as any).minHeight || parseFloat((editForm as any).minHeight) <= 0) { toast.error("Altura mínima é obrigatória"); return; }
      if (!(editForm as any).maxHeight || parseFloat((editForm as any).maxHeight) <= 0) { toast.error("Altura máxima é obrigatória"); return; }
      if (parseFloat((editForm as any).minWidth) >= parseFloat((editForm as any).maxWidth)) { toast.error("Largura máxima deve ser maior que a mínima"); return; }
      if (parseFloat((editForm as any).minHeight) >= parseFloat((editForm as any).maxHeight)) { toast.error("Altura máxima deve ser maior que a mínima"); return; }
    }

    const previouslyCommittedForm = lastCommittedEditFormRef.current;
    try {
      await updateProductMutation.mutateAsync({
        id: editingId,
        name: editForm.name,
        description: editForm.description,
        price: normalizeProductPriceInput(isMeasureBased((editForm as any).calculationType) ? editForm.price : (editForm as any).pixPrice),
        pixPrice: normalizeProductPriceInput((editForm as any).pixPrice),
        cardPrice: normalizeProductPriceInput((editForm as any).cardPrice),
        resellerPrice: normalizeProductPriceInput((editForm as any).resellerPrice),
        segment: editForm.segment || "geral",
        imageUrl: editForm.imageUrl,
        imageKey: (editForm as any).imageKey || undefined,
        galleryUrls: (editForm as any).galleryUrls?.length > 0 ? JSON.stringify((editForm as any).galleryUrls) : undefined,
        calculationType: (editForm as any).calculationType,
        pricePerM2: isMeasureBased((editForm as any).calculationType) ? normalizeProductPriceInput((editForm as any).pixPricePerM2) : undefined,
        pixPricePerM2: isMeasureBased((editForm as any).calculationType) ? normalizeProductPriceInput((editForm as any).pixPricePerM2) : undefined,
        cardPricePerM2: isMeasureBased((editForm as any).calculationType) ? normalizeProductPriceInput((editForm as any).cardPricePerM2) : undefined,
        resellerPricePerM2: isMeasureBased((editForm as any).calculationType) ? normalizeProductPriceInput((editForm as any).resellerPricePerM2) || "" : undefined,
        minWidth: isMeasureBased((editForm as any).calculationType) ? (editForm as any).minWidth : undefined,
        maxWidth: isMeasureBased((editForm as any).calculationType) ? (editForm as any).maxWidth : undefined,
        minHeight: isMeasureBased((editForm as any).calculationType) ? (editForm as any).minHeight : undefined,
        maxHeight: isMeasureBased((editForm as any).calculationType) ? (editForm as any).maxHeight : undefined,
        specifications: (editForm as any).specifications?.length > 0 ? JSON.stringify((editForm as any).specifications) : undefined,
        tags: (editForm as any).tags !== undefined ? JSON.stringify((editForm as any).tags || []) : undefined,
        tagPosition: (editForm as any).tagPosition || "top-right",
      });
      await updateSegmentsMutation.mutateAsync({
        productId: editingId,
        segmentIds: Array.from(new Set(editForm.segmentIds)).filter(Number.isFinite),
      });
      const signature = createProductEditSignature(editForm);
      setEditBaselineSignature(signature);
      if (automatic && previouslyCommittedForm && createProductEditSignature(previouslyCommittedForm) !== signature) {
        setUndoEditForm(previouslyCommittedForm);
      }
      lastCommittedEditFormRef.current = editForm;
      window.localStorage.removeItem(getProductEditDraftKey(editingId));
      setDraftSavedAt(null);
      setEditAutoSaveState("saved");
      await utils.products.getAll.invalidate();
      await refetch();
      if (!automatic) {
        toast.success("Produto atualizado com sucesso!", {
          description: "As alterações foram salvas e já estão refletidas no catálogo.",
          position: "top-right",
          duration: 3500,
        });
      }
      return true;
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      const detail = error instanceof Error ? error.message : "Não foi possível concluir o salvamento.";
      setEditAutoSaveState("error");
      if (!automatic) toast.error("Erro ao atualizar produto", { description: detail, position: "top-right" });
      return false;
    }
  };

  useEffect(() => {
    if (!editingId || !editBaselineSignature || !hasUnsavedProductChanges(editBaselineSignature, editForm)) return;
    if (!isEditFormReadyForAutoSave()) {
      setEditAutoSaveState("waiting");
      return;
    }

    setEditAutoSaveState("waiting");
    if (editAutoSaveTimerRef.current) window.clearTimeout(editAutoSaveTimerRef.current);
    editAutoSaveTimerRef.current = window.setTimeout(async () => {
      setEditAutoSaveState("saving");
      await handleSave(true);
    }, 900);

    return () => {
      if (editAutoSaveTimerRef.current) window.clearTimeout(editAutoSaveTimerRef.current);
    };
  }, [editingId, editBaselineSignature, editForm, isEditFormReadyForAutoSave]);

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

  const handleOpenPixDiscountConfirm = () => {
    const parsedPercent = Number(pixDiscountPercent.replace(",", "."));
    if (!Number.isFinite(parsedPercent) || parsedPercent < 0 || parsedPercent >= 100) {
      toast.error("Informe um percentual entre 0% e 99,99%");
      return;
    }
    setIsPixDiscountConfirmOpen(true);
  };

  const handleApplyPixDiscount = async () => {
    const parsedPercent = Number(pixDiscountPercent.replace(",", "."));
    try {
      const result = await applyPixDiscountMutation.mutateAsync({
        discountPercent: parsedPercent,
        productIds: selectedProducts.size > 0 ? Array.from(selectedProducts) : undefined,
      });
      await utils.products.getAll.invalidate();
      await refetch();
      toast.success("Desconto Pix aplicado", {
        description: `${result.updatedCount} produto(s) atualizado(s) com ${result.discountPercent}% de desconto sobre o valor do cartão.`,
        position: "top-right",
      });
      setIsPixDiscountConfirmOpen(false);
      setSelectedProducts(new Set());
    } catch (error) {
      toast.error("Não foi possível aplicar o desconto Pix", { position: "top-right" });
    }
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

  if (isLoading || (selectedSegmentId !== null && selectedSegmentProductsLoading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="admin-visual-system space-y-6">
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[12.5rem_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-gray-900">Segmentos</h2>
                <p className="mt-1 text-xs text-gray-500">Filtre a listagem por categoria.</p>
              </div>
              <nav aria-label="Filtrar produtos administrativos por segmento" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <Button
                  type="button"
                  variant={selectedSegmentId === null ? "default" : "outline"}
                  onClick={() => {
                    setSelectedSegmentId(null);
                    setSelectedProducts(new Set());
                  }}
                  className={`h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm ${selectedSegmentId === null ? "bg-pink-600 hover:bg-pink-700" : "border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700"}`}
                >
                  Todos os segmentos
                </Button>
                {availableSegmentsLoading ? (
                  <div className="col-span-full flex items-center gap-2 px-2 py-3 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando segmentos...
                  </div>
                ) : adminSegments.map((segment) => (
                  <Button
                    key={segment.id}
                    type="button"
                    variant={selectedSegmentId === segment.id ? "default" : "outline"}
                    onClick={() => {
                      setSelectedSegmentId(segment.id);
                      setSelectedProducts(new Set());
                    }}
                    className={`h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm ${selectedSegmentId === segment.id ? "bg-pink-600 hover:bg-pink-700" : "border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700"}`}
                  >
                    {segment.label}
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 space-y-6">
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
                {selectedProducts.size > 0 ? `${selectedProducts.size} produto(s) selecionado(s)` : "Sem seleção: aplicar em todos os produtos ativos"}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Input
                type="number"
                min="0"
                max="99.99"
                step="0.01"
                value={pixDiscountPercent}
                onChange={(event) => setPixDiscountPercent(event.target.value)}
                placeholder="Desconto Pix (%)"
                className="h-9 w-36 bg-white"
                aria-label="Percentual padrão de desconto no Pix"
              />
              <Button variant="outline" onClick={handleOpenPixDiscountConfirm} disabled={applyPixDiscountMutation.isPending}>
                {applyPixDiscountMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Aplicar no Pix
              </Button>
              {selectedProducts.size > 0 && (
                <Button variant="destructive" onClick={handleDeleteMultiple} disabled={deleteMultipleProductsMutation.isPending}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteMultipleProductsMutation.isPending ? "Removendo..." : `Remover ${selectedProducts.size}`}
                </Button>
              )}
            </div>
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
                    <Dialog open={editingId === product.id} onOpenChange={(open) => !open && requestEditClose()}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent showCloseButton={false} className={`${EDIT_PRODUCT_MODAL_LAYOUT.dialog} admin-visual-system`}>
                        <DialogHeader className="sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div>
                            <DialogTitle>Editar Produto</DialogTitle>
                            <DialogDescription>Atualize as informações do produto</DialogDescription>
                          </div>
                          <div className="mt-2 flex w-fit items-center gap-3 sm:mt-0">
                            {editAutoSaveState !== "idle" && (
                              <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                editAutoSaveState === "error" ? "bg-red-50 text-red-700" : editAutoSaveState === "waiting" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                              }`} aria-live="polite">
                                {editAutoSaveState === "saving" ? "Salvando automaticamente..." : editAutoSaveState === "saved" ? "Salvo automaticamente" : editAutoSaveState === "error" ? "Falha ao salvar: rascunho preservado" : "Aguardando dados obrigatórios"}
                              </span>
                              {editAutoSaveState === "saved" && undoEditForm && (
                                <button
                                  type="button"
                                  onClick={handleUndoLastAutoSave}
                                  className="text-xs font-medium text-gray-500 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-pink-600 hover:decoration-pink-300 focus:outline-none focus-visible:text-pink-600"
                                  aria-label="Desfazer última alteração salva"
                                >
                                  Desfazer
                                </button>
                              )}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={requestEditClose}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-pink-600 focus:outline-none focus-visible:text-pink-600"
                              aria-label="Voltar para a lista de produtos"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                              Voltar
                            </button>
                          </div>
                        </DialogHeader>

                        <div className="space-y-4">
                          <Card className={PRODUCT_FORM_PANEL.card}>
                            <CardContent className={PRODUCT_FORM_PANEL.content}>
                              <h3 className={PRODUCT_FORM_PANEL.title}>Dados comerciais</h3>
                              <div className={EDIT_PRODUCT_MODAL_LAYOUT.details}>
                            <div className={EDIT_PRODUCT_MODAL_LAYOUT.name}>
                              <Label htmlFor="edit-name">Nome</Label>
                              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div className={EDIT_PRODUCT_MODAL_LAYOUT.description}>
                              <Label htmlFor="edit-description">Descrição</Label>
                              <Textarea id="edit-description" rows={2} className="min-h-[68px]" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                            </div>
                            {/* Tipo de Cobrança — sempre primeiro */}
                            <div className={EDIT_PRODUCT_MODAL_LAYOUT.calculation}>
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
                              <div className={EDIT_PRODUCT_MODAL_LAYOUT.price}>
                                <Label htmlFor="edit-pixPrice">Preço via Pix (R$)</Label>
                                <Input id="edit-pixPrice" type="text" inputMode="decimal" value={(editForm as any).pixPrice} onChange={(e) => setEditForm({ ...editForm, pixPrice: e.target.value, price: e.target.value } as any)} onBlur={() => finalizeEditPrice("pixPrice", true)} placeholder="0,00" />
                              </div>
                            )}
                            {((editForm as any).calculationType === "unidade" || (editForm as any).calculationType === "pacote") && (
                              <div className={EDIT_PRODUCT_MODAL_LAYOUT.price}>
                                <Label htmlFor="edit-cardPrice">Preço via Cartão (R$)</Label>
                                <Input id="edit-cardPrice" type="text" inputMode="decimal" value={(editForm as any).cardPrice} onChange={(e) => setEditForm({ ...editForm, cardPrice: e.target.value } as any)} onBlur={() => finalizeEditPrice("cardPrice")} placeholder="0,00" />
                              </div>
                            )}
                            {((editForm as any).calculationType === "unidade" || (editForm as any).calculationType === "pacote") && (
                              <div className={EDIT_PRODUCT_MODAL_LAYOUT.price}>
                                <Label htmlFor="edit-resellerPrice">Preço Revendedor (R$)</Label>
                                <Input id="edit-resellerPrice" type="text" inputMode="decimal" value={(editForm as any).resellerPrice || ""} onChange={(e) => setEditForm({ ...editForm, resellerPrice: e.target.value } as any)} onBlur={() => finalizeEditPrice("resellerPrice")} placeholder="Opcional" />
                              </div>
                            )}
                              </div>

                              {((editForm as any).calculationType === "m2" || (editForm as any).calculationType === "metro_linear") && (
                            <div className={EDIT_PRODUCT_MODAL_LAYOUT.measureFields}>
                              <div className="sm:col-span-1 xl:col-span-2">
                                <Label htmlFor="edit-pixPricePerM2">
                                  {(editForm as any).calculationType === "metro_linear" ? "Preço via Pix por Metro Linear (R$)" : "Preço via Pix por m² (R$)"}
                                </Label>
                                <Input id="edit-pixPricePerM2" type="text" inputMode="decimal" value={(editForm as any).pixPricePerM2 || ""} onChange={(e) => setEditForm({ ...editForm, pixPricePerM2: e.target.value, pricePerM2: e.target.value } as any)} onBlur={() => finalizeEditPrice("pixPricePerM2")} placeholder="0,00" />
                              </div>
                              <div className="sm:col-span-1 xl:col-span-2">
                                <Label htmlFor="edit-cardPricePerM2">
                                  {(editForm as any).calculationType === "metro_linear" ? "Preço via Cartão por Metro Linear (R$)" : "Preço via Cartão por m² (R$)"}
                                </Label>
                                <Input id="edit-cardPricePerM2" type="text" inputMode="decimal" value={(editForm as any).cardPricePerM2 || ""} onChange={(e) => setEditForm({ ...editForm, cardPricePerM2: e.target.value } as any)} onBlur={() => finalizeEditPrice("cardPricePerM2")} placeholder="0,00" />
                              </div>
                              <div className="sm:col-span-1 xl:col-span-2">
                                <Label htmlFor="edit-resellerPricePerM2">
                                  {(editForm as any).calculationType === "metro_linear" ? "Preço Revendedor por Metro Linear (R$)" : "Preço Revendedor por m² (R$)"}
                                </Label>
                                <Input id="edit-resellerPricePerM2" type="text" inputMode="decimal" value={(editForm as any).resellerPricePerM2 || ""} onChange={(e) => setEditForm({ ...editForm, resellerPricePerM2: e.target.value } as any)} onBlur={() => finalizeEditPrice("resellerPricePerM2")} placeholder="Opcional" />
                              </div>
                              <div className="grid grid-cols-2 gap-3 sm:col-span-2 xl:col-span-6 xl:grid-cols-4">
                                <div>
                                  <Label htmlFor="edit-minWidth">Largura Mín (m)</Label>
                                  <Input id="edit-minWidth" type="number" step="0.01" value={(editForm as any).minWidth || ""} onChange={(e) => setEditForm({ ...editForm, minWidth: e.target.value } as any)} />
                                </div>
                                <div>
                                  <Label htmlFor="edit-maxWidth">Largura Máx (m)</Label>
                                  <Input id="edit-maxWidth" type="number" step="0.01" value={(editForm as any).maxWidth || ""} onChange={(e) => setEditForm({ ...editForm, maxWidth: e.target.value } as any)} />
                                </div>
                                <div>
                                  <Label htmlFor="edit-minHeight">Altura Mín (m)</Label>
                                  <Input id="edit-minHeight" type="number" step="0.01" value={(editForm as any).minHeight || ""} onChange={(e) => setEditForm({ ...editForm, minHeight: e.target.value } as any)} />
                                </div>
                                <div>
                                  <Label htmlFor="edit-maxHeight">Altura Máx (m)</Label>
                                  <Input id="edit-maxHeight" type="number" step="0.01" value={(editForm as any).maxHeight || ""} onChange={(e) => setEditForm({ ...editForm, maxHeight: e.target.value } as any)} />
                                </div>
                              </div>
                            </div>
                              )}
                            </CardContent>
                          </Card>

                          <div className={EDIT_PRODUCT_MODAL_LAYOUT.secondary}>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">

                          <Card className={`${PRODUCT_FORM_PANEL.card} sm:col-start-1 sm:row-start-2 self-start`}>
                            <CardContent className={PRODUCT_FORM_PANEL.content}>
                              <h3 className={PRODUCT_FORM_PANEL.title}>Segmentos</h3>
                              <MultiSegmentSelector
                                productId={editingId || 0}
                                selectedSegmentIds={editForm.segmentIds}
                                onSegmentsChange={handleSegmentsChange}
                              />
                            </CardContent>
                          </Card>

                          {/* Upload de Fotos */}
                          <Card className={`${PRODUCT_FORM_PANEL.card} sm:col-span-2 sm:row-start-1`}>
                            <CardContent className="px-4">
                              <ProductImageUploader
                                mainImageUrl={editForm.imageUrl}
                                galleryUrls={(editForm as any).galleryUrls || []}
                                onMainImageChange={(url, key) => setEditForm({ ...editForm, imageUrl: url, imageKey: key || "" } as any)}
                                onGalleryChange={(urls) => setEditForm({ ...editForm, galleryUrls: urls } as any)}
                                compact
                              />
                            </CardContent>
                          </Card>

                          <Card className={`${PRODUCT_FORM_PANEL.card} sm:col-start-2 sm:row-start-2`}>
                            <CardContent className={PRODUCT_FORM_PANEL.content}>
                              <h3 className={PRODUCT_FORM_PANEL.title}>Tags do Produto</h3>
                              <p className="text-sm text-gray-500">Selecione as tags que aparecerão sobre a imagem do produto no catálogo.</p>
                              <div className="grid grid-cols-1 gap-3">
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
                            </CardContent>
                          </Card>

                          </div>

                          <div className="flex flex-col gap-4">
                          {editingId && (
                            <DeliveryOptionsManager
                              productId={editingId}
                              calculationType={(editForm as any).calculationType || "m2"}
                              compact
                            />
                          )}

                          {/* Aba Logística */}
                          {editingId && (
                            <Card className={PRODUCT_FORM_PANEL.card}>
                              <CardContent className={PRODUCT_FORM_PANEL.content}>
                                <h3 className={PRODUCT_FORM_PANEL.title}>Logística</h3>
                                <ProductLogisticsTab productId={editingId} />
                              </CardContent>
                            </Card>
                          )}

                          {/* Especificações Técnicas */}
                          <div className={PRODUCT_FORM_PANEL.inner}>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className={PRODUCT_FORM_PANEL.title}>Especificações Técnicas</h3>
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
                          </div>
                          </div>

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
                    <div className="grid gap-4 md:grid-cols-4 md:items-end">
                      <div className="min-w-0">
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
                      <div className="min-w-0">
                        <Label className="text-sm font-semibold text-gray-900">
                          {quickCalculationType === "m2"
                            ? "Preço via Pix por m² (R$)"
                            : quickCalculationType === "metro_linear"
                              ? "Preço via Pix por metro linear (R$)"
                              : "Preço via Pix (R$)"}
                        </Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={quickPixPrice}
                          onChange={(event) => setQuickPixPrice(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") handleQuickPricingSave(product);
                          }}
                          className="mt-1 bg-white"
                          placeholder="0,00"
                        />
                      </div>
                      <div className="min-w-0">
                        <Label className="text-sm font-semibold text-gray-900">
                          {quickCalculationType === "m2"
                            ? "Preço via Cartão por m² (R$)"
                            : quickCalculationType === "metro_linear"
                              ? "Preço via Cartão por metro linear (R$)"
                              : "Preço via Cartão (R$)"}
                        </Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={quickCardPrice}
                          onChange={(event) => setQuickCardPrice(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") handleQuickPricingSave(product);
                          }}
                          className="mt-1 bg-white"
                          placeholder="0,00"
                        />
                      </div>
                      <div className="min-w-0">
                        <Label className="text-sm font-semibold text-gray-900">
                          {quickCalculationType === "m2"
                            ? "Preço Revendedor por m² (R$)"
                            : quickCalculationType === "metro_linear"
                              ? "Preço Revendedor por metro linear (R$)"
                              : "Preço Revendedor (R$)"}
                        </Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={quickResellerPrice}
                          onChange={(event) => setQuickResellerPrice(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") handleQuickPricingSave(product);
                          }}
                          className="mt-1 bg-white"
                          placeholder="Opcional"
                        />
                      </div>
                      <div className="flex gap-2 md:col-span-4 md:justify-end">
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
      </div>

      <AlertDialog open={isPixDiscountConfirmOpen} onOpenChange={setIsPixDiscountConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar desconto padrão no Pix?</AlertDialogTitle>
            <AlertDialogDescription>
              O sistema calculará {pixDiscountPercent || "0"}% de desconto sobre o preço de cartão e atualizará o preço Pix de {selectedProducts.size > 0 ? `${selectedProducts.size} produto(s) selecionado(s)` : "todos os produtos ativos"}. Os preços de cartão e de revenda não serão alterados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyPixDiscountMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); handleApplyPixDiscount(); }} disabled={applyPixDiscountMutation.isPending}>
              {applyPixDiscountMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Aplicando...</> : "Confirmar desconto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </AdminLayout>
  );
}
