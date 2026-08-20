import { useState, useEffect, useCallback, useRef } from "react";
import { useChunkedUpload } from "@/hooks/useChunkedUpload";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  User,
  UserPlus,
  Package,
  Truck,
  CreditCard,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Copy,
  GripVertical,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { getAdminReturnTarget } from "@/lib/adminNavigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { parseQuotationCurrency, resolveQuotationItemTotal, roundQuotationMoney } from "@/lib/quotationItemPricing";
import { QUOTATION_AUTO_ADVANCE_MS, scheduleQuotationAutoAdvance } from "@/lib/quotationAutoAdvance";

// ─── Types ───────────────────────────────────────────────────────────────────
interface QuotationItem {
  productId: number | null;
  productName: string;
  productImage?: string;
  specifications: string; // JSON string
  artFileUrl?: string;
  artFileKey?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceAdjustment?: number; // Valor total definido manualmente no campo Ajuste
  isCustom?: boolean; // Item fora do catálogo, com nome e valor definidos manualmente
  // UI only
  _specsParsed?: Record<string, string>;
}

function fmt(v: number) {
  return roundQuotationMoney(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseManualTotal(value: string) {
  const sanitized = value.replace(/[R$\s]/g, "").trim();
  if (!sanitized) return 0;
  const normalized = sanitized.includes(",")
    ? sanitized.replace(/\./g, "").replace(",", ".")
    : sanitized;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatManualTotal(value: number) {
  return fmt(value);
}

function formatManualTotalInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return fmt(Number.parseInt(digits, 10) / 100);
}

const specificationLabels: Record<string, string> = {
  width: "Largura",
  height: "Altura",
  printingType: "Tipo de impressão",
  material: "Tipo de material",
  thickness: "Tipo de espessura",
  finish: "Tipo de acabamento",
};
const CUSTOM_ITEM_NAME_MAX_LENGTH = 80;

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminQuotationForm() {
  const [, navigate] = useLocation();
  const returnTarget = getAdminReturnTarget("/admin/orcamentos");
  const params = useParams<{ id?: string }>();
  const isEdit = !!params.id;
  const quotationId = params.id ? parseInt(params.id) : undefined;
  const { adminUser } = useAdminAuth();

  // ── Form state ──────────────────────────────────────────────────────────
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [showClientSearch, setShowClientSearch] = useState(false);

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [customUnitDrafts, setCustomUnitDrafts] = useState<Record<number, string>>({});
  const [autoRecalculatedUnitItems, setAutoRecalculatedUnitItems] = useState<Set<number>>(new Set());
  const unitRecalculationTimersRef = useRef<Record<number, number>>({});
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const [discountType, setDiscountType] = useState<"percentual" | "fixo">("fixo");
  const [discountValue, setDiscountValue] = useState(0);
  const [shippingPrice, setShippingPrice] = useState(0);
  const [shippingMethod, setShippingMethod] = useState("pickup");
  const [shippingLabel, setShippingLabel] = useState("Retirada na loja");
  const [shippingEstimatedDays, setShippingEstimatedDays] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [productionDeadline, setProductionDeadline] = useState(3);
  const [quotationValidity, setQuotationValidity] = useState(30);
  const [commercialNotes, setCommercialNotes] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const responsiblePrefilledRef = useRef(false);

  const [showAddProduct, setShowAddProduct] = useState(false);
  // Estado do formulário inline de cadastro de cliente
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientWhatsapp, setNewClientWhatsapp] = useState("");
  const [newClientType, setNewClientType] = useState<"balcao" | "site">("balcao");
  const [newClientNotes, setNewClientNotes] = useState("");
  const [newClientCpfCnpj, setNewClientCpfCnpj] = useState("");
  const [newClientZipCode, setNewClientZipCode] = useState("");
  const [newClientStreet, setNewClientStreet] = useState("");
  const [newClientNumber, setNewClientNumber] = useState("");
  const [newClientComplement, setNewClientComplement] = useState("");
  const [newClientNeighborhood, setNewClientNeighborhood] = useState("");
  const [newClientCity, setNewClientCity] = useState("");
  const [newClientState, setNewClientState] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showCustomItemNameStep, setShowCustomItemNameStep] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  // Estado para opções dinâmicas por produto (productId -> { variations, attributes })
  const [productOptionsCache, setProductOptionsCache] = useState<Record<number, any>>({});
  const [activeProductIdForOptions, setActiveProductIdForOptions] = useState<number | null>(null);
  // Cache de precificação por produto (productId -> { pricePerM2, calculationType, variations, attributes })
  const [pricingCache, setPricingCache] = useState<Record<number, any>>({});
  const [activePricingProductId, setActivePricingProductId] = useState<number | null>(null);
  // Upload de arte por item (idx -> isUploading)
  const [artUploadingIdx, setArtUploadingIdx] = useState<number | null>(null);
  const { state: artUploadState, upload: doArtUpload, cancel: cancelArtUpload, reset: resetArtUpload } = useChunkedUpload();
  const artPasteRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Acerto Total (override do total calculado)
  const [acertoTotal, setAcertoTotal] = useState<string>("");
  const [isEditingManualTotal, setIsEditingManualTotal] = useState(false);
  const acertoTotalInputRef = useRef<HTMLInputElement | null>(null);
  const acertoTotalAdvanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isEdit || responsiblePrefilledRef.current || !adminUser?.name) return;
    setResponsibleName(adminUser.name);
    responsiblePrefilledRef.current = true;
  }, [adminUser?.name, isEdit]);

  useEffect(() => () => {
    Object.values(unitRecalculationTimersRef.current).forEach((timer) => window.clearTimeout(timer));
  }, []);

  // ── Pré-preencher a partir de query params (vindo do configurador de produto) ──
  useEffect(() => {
    if (isEdit) return; // Não sobrescrever dados de edição
    const params = new URLSearchParams(window.location.search);
    const productIdParam = params.get("productId");
    const productNameParam = params.get("productName");
    const productImageParam = params.get("productImage");
    const unitPriceParam = params.get("unitPrice");
    const quantityParam = params.get("quantity");
    const specificationsParam = params.get("specifications");
    const artFileUrlParam = params.get("artFileUrl");

    if (productIdParam && productNameParam) {
      const pid = parseInt(productIdParam);
      let specs: Record<string, string> = {};
      try { specs = JSON.parse(decodeURIComponent(specificationsParam ?? "{}")); } catch {}
      const newItem = {
        productId: pid,
        productName: decodeURIComponent(productNameParam),
        productImage: productImageParam ? decodeURIComponent(productImageParam) : undefined,
        specifications: JSON.stringify(specs),
        artFileUrl: artFileUrlParam ? decodeURIComponent(artFileUrlParam) : undefined,
        quantity: parseInt(quantityParam ?? "1") || 1,
        unitPrice: parseFloat(unitPriceParam ?? "0") || 0,
        totalPrice: (parseInt(quantityParam ?? "1") || 1) * (parseFloat(unitPriceParam ?? "0") || 0),
        _specsParsed: specs,
      };
      setItems([newItem]);
      setExpandedItems(new Set([0]));
      // Carregar opções do produto
      setActiveProductIdForOptions(pid);
    }
  }, [isEdit]);

  // ── Load existing quotation for edit ────────────────────────────────────
  const { data: existingQuotation } = trpc.quotations.getById.useQuery(
    { id: quotationId! },
    { enabled: isEdit && !!quotationId }
  );

  useEffect(() => {
    if (!existingQuotation) return;
    const q = existingQuotation;
    setClientId(q.clientId);
    setClientName(q.clientName ?? "");
    setDiscountType((q.discountType as any) ?? "fixo");
    setDiscountValue(Number(q.discountValue ?? 0));
    setShippingPrice(Number(q.shippingPrice ?? 0));
    setAcertoTotal(q.manualTotal !== null && q.manualTotal !== undefined ? formatManualTotal(Number(q.manualTotal)) : "");
    setShippingMethod(q.shippingMethod ?? "pickup");
    setShippingLabel(q.shippingLabel ?? "Retirada na loja");
    setShippingEstimatedDays(q.shippingEstimatedDays ?? 0);
    setDeliveryAddress(q.deliveryAddress ?? "");
    setPaymentMethod(q.paymentMethod ?? "pix");
    setProductionDeadline(q.productionDeadline ?? 3);
    setQuotationValidity(q.quotationValidity ?? 30);
    setCommercialNotes(q.commercialNotes ?? "");
    setResponsibleName(q.responsibleName ?? "");
    responsiblePrefilledRef.current = true;
    setItems(q.items.map((i: any) => {
      let parsedSpecs: Record<string, string> = {};
      try { parsedSpecs = JSON.parse(i.specifications); } catch {}
      return {
        productId: i.productId,
        productName: i.productName,
        productImage: i.productImage ?? undefined,
        specifications: i.specifications,
        artFileUrl: i.artFileUrl ?? undefined,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
        isCustom: !i.productId || parsedSpecs.itemType === "custom",
        _specsParsed: parsedSpecs,
      };
    }));
  }, [existingQuotation]);

  // ── Product options (variações e atributos) ─────────────────────────────
  const { data: activeProductOptions } = trpc.quotations.getProductOptions.useQuery(
    { productId: activeProductIdForOptions! },
    { enabled: !!activeProductIdForOptions }
  );
  useEffect(() => {
    if (activeProductIdForOptions && activeProductOptions) {
      setProductOptionsCache(prev => ({ ...prev, [activeProductIdForOptions]: activeProductOptions }));
    }
  }, [activeProductOptions, activeProductIdForOptions]);

  // ── Product pricing (pricePerM2, calculationType, modifiers) ──────────────
  const { data: activePricingData } = trpc.quotations.getProductPricing.useQuery(
    { productId: activePricingProductId! },
    { enabled: !!activePricingProductId }
  );
  useEffect(() => {
    if (activePricingProductId && activePricingData) {
      setPricingCache(prev => ({ ...prev, [activePricingProductId]: activePricingData }));
    }
  }, [activePricingData, activePricingProductId]);

  // ── Client search ────────────────────────────────────────────────────────
  const { data: clientResults } = trpc.quotations.searchClients.useQuery(
    { search: clientSearch },
    { enabled: clientSearch.length >= 2 }
  );

  // ── Quick create client ──────────────────────────────────────────────────
  const quickCreateClient = trpc.quotations.quickCreateClient.useMutation({
    onSuccess: (newClient) => {
      if (newClient) {
        setClientId(newClient.id);
        setClientName(newClient.name);
        toast.success(`Cliente "${newClient.name}" cadastrado e selecionado!`);
      }
      setShowNewClientForm(false);
      setNewClientName(""); setNewClientEmail(""); setNewClientPhone("");
      setNewClientWhatsapp(""); setNewClientNotes(""); setNewClientType("balcao");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleQuickCreateClient = () => {
    if (!newClientName.trim()) { toast.error("Nome do cliente é obrigatório."); return; }
    quickCreateClient.mutate({
      name: newClientName.trim(),
      email: newClientEmail.trim() || undefined,
      phone: newClientPhone.trim() || undefined,
      whatsapp: newClientWhatsapp.trim() || undefined,
      clientType: newClientType,
      notes: newClientNotes.trim() || undefined,
      cpfCnpj: newClientCpfCnpj.trim() || undefined,
      addressZipCode: newClientZipCode.trim() || undefined,
      addressStreet: newClientStreet.trim() || undefined,
      addressNumber: newClientNumber.trim() || undefined,
      addressComplement: newClientComplement.trim() || undefined,
      addressNeighborhood: newClientNeighborhood.trim() || undefined,
      addressCity: newClientCity.trim() || undefined,
      addressState: newClientState.trim() || undefined,
    });
  };

  // ── Products ─────────────────────────────────────────────────────────────
  const { data: allProducts } = trpc.products.getAll.useQuery();
  const filteredProducts = (allProducts ?? []).filter((p: any) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ── Cálculo de preço por item baseado nas specs ──────────────────────────
  // Retorna { unitPrice: preço/m² (ou preço unitário), totalPrice: unitPrice × área × qtd }
  const calcItemPricing = (item: QuotationItem, pricing: any | null): { unitPrice: number; totalPrice: number } => {
    const fallback = { unitPrice: item.unitPrice, totalPrice: item.totalPrice };
    if (item.isCustom) return fallback;
    if (!pricing) return fallback;
    const specs = item._specsParsed ?? {};
    const w = parseFloat((specs.width ?? specs.largura ?? "0").replace(",", ".")) || 0;
    const h = parseFloat((specs.height ?? specs.altura ?? "0").replace(",", ".")) || 0;
    const area = w * h;
    const billedArea = area > 0 ? Math.max(area, 1) : 0;

    if ((pricing.calculationType === "m2" || pricing.calculationType === "metro_linear") && pricing.pricePerM2 > 0) {
      const baseArea = pricing.calculationType === "metro_linear" ? (w > 0 ? w : 1) : billedArea;
      if (baseArea <= 0) return fallback;

      // UNIT. = preço por m² base + modificadores por m²
      let pricePerM2 = pricing.pricePerM2;

      // Modificadores de variações — separa por m² vs fixo
      let fixedModifiers = 0;
      (pricing.variations ?? []).forEach((vt: any) => {
        const selectedName = specs[vt.name.toLowerCase().replace(/\s+/g, "_")];
        if (!selectedName) return;
        const opt = (vt.options ?? []).find((o: any) => o.name === selectedName);
        if (!opt) return;
        const mod = parseFloat(opt.priceModifier?.toString() ?? "0");
        if (opt.calculationType === "m2" || opt.calculationType === "metro_linear") {
          pricePerM2 += mod;
        } else {
          // unit / pacote / fixo: soma ao total sem multiplicar pela área
          fixedModifiers += mod * item.quantity;
        }
      });

      // Modificadores de atributos
      (pricing.attributes ?? []).forEach((attr: any) => {
        const selectedValue = specs[attr.name.toLowerCase().replace(/\s+/g, "_")];
        if (!selectedValue) return;
        const v = (attr.values ?? []).find((val: any) => val.value === selectedValue);
        if (!v) return;
        const mod = parseFloat(v.priceModifier?.toString() ?? "0");
        if (v.calculationType === "m2" || v.calculationType === "metro_linear") {
          pricePerM2 += mod;
        } else {
          fixedModifiers += mod * item.quantity;
        }
      });

      const unitPrice = Math.max(0, pricePerM2);
      // TOTAL = (preço/m² × área × quantidade) + modificadores fixos
      const totalPrice = unitPrice * baseArea * item.quantity + fixedModifiers;
      return { unitPrice, totalPrice };
    }

    // Produto por unidade/pacote: usa preço base + modifiers fixos
    let unitPrice = pricing.price ?? 0;
    (pricing.variations ?? []).forEach((vt: any) => {
      const selectedName = specs[vt.name.toLowerCase().replace(/\s+/g, "_")];
      if (!selectedName) return;
      const opt = (vt.options ?? []).find((o: any) => o.name === selectedName);
      if (opt) unitPrice += parseFloat(opt.priceModifier?.toString() ?? "0");
    });
    unitPrice = Math.max(0, unitPrice);
    return { unitPrice, totalPrice: unitPrice * item.quantity };
  };
  // Alias para compatibilidade
  const calcItemUnitPrice = (item: QuotationItem, pricing: any | null): number => calcItemPricing(item, pricing).unitPrice;

  // ── Calculations ─────────────────────────────────────────────────────────
  const subtotal = items.reduce((acc, i) => acc + i.totalPrice, 0);
  const discountAmount = discountType === "percentual"
    ? Math.round((subtotal * discountValue) / 100 * 100) / 100
    : Math.min(discountValue, subtotal);
  const calculatedTotal = Math.max(0, subtotal - discountAmount + shippingPrice);
  const hasManualTotal = acertoTotal.trim() !== "";
  const acertoValue = parseManualTotal(acertoTotal);
  const total = hasManualTotal ? acertoValue : calculatedTotal;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = trpc.quotations.create.useMutation({
    onSuccess: (res) => {
      toast.success(`Orçamento ${res.quotationNumber} criado!`);
      navigate(returnTarget.path);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.quotations.update.useMutation({
    onSuccess: () => {
      toast.success("Orçamento atualizado!");
      navigate(returnTarget.path);
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const buildPayload = (saveAsDraft: boolean) => ({
    clientId: clientId!,
    items: items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage ?? undefined,
      specifications: i.specifications,
      artFileUrl: i.artFileUrl ?? undefined,
      artFileKey: i.artFileKey ?? undefined,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
    discountType,
    discountValue,
    shippingPrice,
    manualTotal: hasManualTotal ? acertoValue : null,
    shippingMethod,
    shippingLabel,
    shippingEstimatedDays,
    deliveryAddress,
    paymentMethod,
    productionDeadline,
    quotationValidity,
    commercialNotes,
    responsibleName: responsibleName.trim(),
    saveAsDraft,
  });

  const handleSave = (saveAsDraft: boolean) => {
    if (!clientId) { toast.error("Selecione um cliente."); return; }
    if (items.length === 0) { toast.error("Adicione pelo menos um produto."); return; }
    if (!responsibleName.trim()) { toast.error("Informe o responsável pela emissão do orçamento."); return; }

    if (isEdit && quotationId) {
      updateMutation.mutate({ id: quotationId, ...buildPayload(saveAsDraft) });
    } else {
      createMutation.mutate(buildPayload(saveAsDraft));
    }
  };

  const addProductToQuote = (product: any) => {
    const newItem: QuotationItem = {
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl ?? product.image,
      specifications: JSON.stringify({ material: "", finish: "", printingType: "" }),
      quantity: 1,
      unitPrice: Number(product.basePrice ?? 0),
      totalPrice: Number(product.basePrice ?? 0),
      _specsParsed: {},
    };
    setItems((prev) => [...prev, newItem]);
    setExpandedItems((prev) => { const s = new Set(prev); s.add(items.length); return s; });
    setShowAddProduct(false);
    setProductSearch("");
    // Carregar opções e pricing do produto
    if (!productOptionsCache[product.id]) {
      setActiveProductIdForOptions(product.id);
    }
    if (!pricingCache[product.id]) {
      setActivePricingProductId(product.id);
    }
  };

  const addCustomItemToQuote = (productName: string) => {
    const newItemIndex = items.length;
    const newItem: QuotationItem = {
      productId: null,
      productName,
      specifications: JSON.stringify({ itemType: "custom" }),
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      isCustom: true,
      _specsParsed: { itemType: "custom" },
    };
    setItems((prev) => [...prev, newItem]);
    setExpandedItems((prev) => { const next = new Set(prev); next.add(newItemIndex); return next; });
    setShowAddProduct(false);
    setProductSearch("");
    setShowCustomItemNameStep(false);
    setCustomItemName("");
    toast.success(`Item \"${productName}\" adicionado ao orçamento.`, { id: "quotation-custom-item-added" });
  };

  const openCustomItemNameStep = () => {
    setCustomItemName("");
    setShowAddProduct(true);
    setShowCustomItemNameStep(true);
  };

  const confirmCustomItemName = () => {
    const name = customItemName.trim();
    if (!name) {
      toast.error("Informe o nome do Produto / Serviço.");
      return;
    }
    if (name.length > CUSTOM_ITEM_NAME_MAX_LENGTH) {
      toast.error(`O nome pode ter no máximo ${CUSTOM_ITEM_NAME_MAX_LENGTH} caracteres.`);
      return;
    }
    addCustomItemToQuote(name);
  };

  const clearManualTotal = () => {
    setAcertoTotal("");
    setIsEditingManualTotal(false);
    if (acertoTotalAdvanceTimerRef.current !== null) window.clearTimeout(acertoTotalAdvanceTimerRef.current);
  };

  const commitManualTotal = () => {
    if (acertoTotalAdvanceTimerRef.current !== null) {
      window.clearTimeout(acertoTotalAdvanceTimerRef.current);
      acertoTotalAdvanceTimerRef.current = null;
    }
    if (acertoTotal.trim() !== "") setAcertoTotal(formatManualTotal(parseManualTotal(acertoTotal)));
    setIsEditingManualTotal(false);
  };

  const handleManualTotalChange = (value: string, shouldAdvance = false) => {
    const formattedValue = formatManualTotalInput(value);
    setAcertoTotal(formattedValue);

    if (!shouldAdvance) return;
    if (acertoTotalAdvanceTimerRef.current !== null) window.clearTimeout(acertoTotalAdvanceTimerRef.current);
    if (!formattedValue) return;
    acertoTotalAdvanceTimerRef.current = window.setTimeout(() => {
      acertoTotalInputRef.current?.blur();
    }, QUOTATION_AUTO_ADVANCE_MS);
  };

  const cancelCustomItemName = () => {
    setShowCustomItemNameStep(false);
    setCustomItemName("");
    setShowAddProduct(false);
  };

  const highlightRecalculatedUnit = useCallback((idx: number) => {
    setAutoRecalculatedUnitItems((previous) => new Set(previous).add(idx));
    const existingTimer = unitRecalculationTimersRef.current[idx];
    if (existingTimer !== undefined) window.clearTimeout(existingTimer);
    unitRecalculationTimersRef.current[idx] = window.setTimeout(() => {
      setAutoRecalculatedUnitItems((previous) => {
        const next = new Set(previous);
        next.delete(idx);
        return next;
      });
      delete unitRecalculationTimersRef.current[idx];
    }, 1400);
  }, []);

  const updateItem = useCallback((idx: number, updates: Partial<QuotationItem>) => {
    if (updates.priceAdjustment !== undefined) {
      const currentItem = items[idx];
      const adjusted = resolveQuotationItemTotal(updates.priceAdjustment, currentItem?.quantity ?? 1);
      setCustomUnitDrafts((previous) => ({ ...previous, [idx]: fmt(adjusted.unitPrice) }));
      highlightRecalculatedUnit(idx);
    }
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx], ...updates };
      const quantity = Math.max(1, Math.trunc(item.quantity) || 1);
      item.quantity = quantity;

      if (updates.priceAdjustment !== undefined) {
        const adjusted = resolveQuotationItemTotal(updates.priceAdjustment, quantity);
        item.unitPrice = adjusted.unitPrice;
        item.totalPrice = adjusted.totalPrice;
        item.priceAdjustment = adjusted.totalPrice;
        next[idx] = item;
        return next;
      }

      if (updates.quantity !== undefined || updates.unitPrice !== undefined || updates.specifications !== undefined || updates._specsParsed !== undefined) {
        item.priceAdjustment = undefined;
      }

      // Recalcula o total pelo valor unitário quando o operador altera quantidade ou unitário.
      if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
        item.unitPrice = roundQuotationMoney(item.unitPrice);
        item.totalPrice = roundQuotationMoney(quantity * item.unitPrice);
      }
      // Se specs ou quantidade mudaram, recalcular preço automaticamente
      if (updates.specifications !== undefined || updates._specsParsed !== undefined || updates.quantity !== undefined) {
        const pricing = !item.isCustom && item.productId !== null
          ? pricingCache[item.productId]
          : undefined;
        if (pricing) {
          const { unitPrice: newUnit, totalPrice: newTotal } = calcItemPricing(item, pricing);
          if (newUnit > 0) {
            item.unitPrice = roundQuotationMoney(newUnit);
            item.totalPrice = roundQuotationMoney(newTotal);
          }
        }
      }
      next[idx] = item;
      return next;
    });
  }, [highlightRecalculatedUnit, items, pricingCache]);

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const remapIndexAfterMove = (index: number, from: number, to: number) => {
    if (index === from) return to;
    if (from < to && index > from && index <= to) return index - 1;
    if (from > to && index >= to && index < from) return index + 1;
    return index;
  };

  const reorderItems = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setExpandedItems((prev) => new Set(Array.from(prev, (index) => remapIndexAfterMove(index, from, to))));
    setCustomUnitDrafts((prev) => Object.fromEntries(Object.entries(prev).map(([index, value]) => [remapIndexAfterMove(Number(index), from, to), value])));
  };

  const duplicateItem = (idx: number) => {
    setItems((prev) => {
      const source = prev[idx];
      if (!source) return prev;
      const duplicate: QuotationItem = {
        ...source,
        _specsParsed: source._specsParsed ? { ...source._specsParsed } : undefined,
      };
      return [...prev.slice(0, idx + 1), duplicate, ...prev.slice(idx + 1)];
    });
    setExpandedItems((prev) => new Set(Array.from(prev, (index) => index > idx ? index + 1 : index)));
    setCustomUnitDrafts((prev) => Object.fromEntries(Object.entries(prev).map(([index, value]) => [Number(index) > idx ? Number(index) + 1 : Number(index), value])));
  };

  const startItemDrag = (event: React.DragEvent<HTMLElement>, idx: number) => {
    setDraggedItemIndex(idx);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(idx));
  };

  const dropItem = (event: React.DragEvent<HTMLElement>, targetIndex: number) => {
    event.preventDefault();
    const sourceIndex = Number(event.dataTransfer.getData("text/plain"));
    reorderItems(Number.isFinite(sourceIndex) ? sourceIndex : (draggedItemIndex ?? targetIndex), targetIndex);
    setDraggedItemIndex(null);
  };

  const toggleItem = (idx: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
    // Carregar opções e pricing do produto ao expandir
    const item = items[idx];
    if (item?.productId !== null && item && !productOptionsCache[item.productId]) {
      setActiveProductIdForOptions(item.productId);
    }
    if (item?.productId !== null && item && !pricingCache[item.productId]) {
      setActivePricingProductId(item.productId);
    }
  };

  const renderCustomItemCard = (item: QuotationItem, idx: number) => {
    const specs = item._specsParsed ?? { itemType: "custom" };
    const isExpanded = expandedItems.has(idx);
    const updateSpec = (key: string, value: string) => {
      const nextSpecs = { ...specs, [key]: value };
      updateItem(idx, { specifications: JSON.stringify(nextSpecs), _specsParsed: nextSpecs });
    };

    const uploadCustomArt = async (file: File) => {
      setArtUploadingIdx(idx);
      try {
        const { url } = await doArtUpload(file);
        updateItem(idx, { artFileUrl: url });
      } catch (err: any) {
        if (err?.message !== "CANCELLED") toast.error("Erro ao enviar imagem");
      } finally {
        setArtUploadingIdx(null);
        resetArtUpload();
      }
    };

    return (
      <div key={`custom-${idx}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropItem(event, idx)} className={`overflow-hidden rounded-lg border border-gray-100 bg-white transition-opacity ${draggedItemIndex === idx ? "opacity-50" : ""}`}>
        <div className={`grid grid-cols-[32px_minmax(108px,1fr)_32px_58px_92px_96px_96px_32px] items-center gap-2 bg-gray-50 px-2 py-2 ${isExpanded ? "border-b border-gray-100" : ""}`}>
          <div>
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
              <ImageIcon className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-1">
            <span draggable onDragStart={(event) => startItemDrag(event, idx)} title="Arraste para reordenar" className="cursor-grab text-pink-500 hover:text-pink-700 active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span>
            <button
              type="button"
              className="min-w-0 flex-1 text-left text-sm font-medium text-gray-800 hover:text-pink-600"
              onClick={() => toggleItem(idx)}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Recolher" : "Expandir"} item personalizado`}
            >
              <span className="block truncate">{item.productName || "Item personalizado"}</span>
            </button>
          </div>
          <div className="flex justify-center">
            {item.artFileUrl ? (
              <button
                type="button"
                title="Visualizar arte anexada"
                className="h-8 w-8 overflow-hidden rounded border border-gray-200 bg-white"
                onClick={() => setLightboxImg(item.artFileUrl!)}
              >
                <img src={item.artFileUrl} alt={`Arte de ${item.productName || "item personalizado"}`} className="h-full w-full object-cover" />
              </button>
            ) : (
              <button
                type="button"
                title="Anexar arte"
                className="flex h-8 w-8 items-center justify-center rounded border border-dashed border-gray-300 bg-white text-gray-300 hover:border-pink-300 hover:text-pink-500"
                onClick={() => toggleItem(idx)}
              >
                <ImageIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex justify-center">
            <input
              type="number"
              min={1}
              aria-label={`Quantidade de ${item.productName || "item personalizado"}`}
              value={item.quantity}
              onChange={(e) => {
                updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) });
                scheduleQuotationAutoAdvance(e.currentTarget);
              }}
              className="h-8 w-full min-w-0 bg-white px-2 text-center text-sm font-semibold tabular-nums transition-colors hover:border-pink-300 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <div className="relative flex justify-end">
            <input
              type="text"
              inputMode="decimal"
              aria-label={`Valor unitário no cabeçalho de ${item.productName || "item personalizado"}`}
              value={customUnitDrafts[idx] ?? fmt(item.unitPrice)}
              placeholder="R$ 0,00"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9,.-]/g, "").replace(",", ".");
                setCustomUnitDrafts((prev) => ({ ...prev, [idx]: e.target.value }));
                updateItem(idx, { unitPrice: Math.max(0, parseFloat(raw) || 0) });
                scheduleQuotationAutoAdvance(e.currentTarget);
              }}
              onBlur={(e) => {
                const raw = e.target.value.replace(/[^0-9,.-]/g, "").replace(",", ".");
                const value = Math.max(0, parseFloat(raw) || 0);
                updateItem(idx, { unitPrice: value });
                setCustomUnitDrafts((prev) => ({ ...prev, [idx]: fmt(value) }));
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className={`h-8 w-full min-w-0 rounded-md border px-2 text-right text-sm font-medium tabular-nums transition-all focus:outline-none focus:ring-2 ${
                autoRecalculatedUnitItems.has(idx)
                  ? "border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 motion-safe:animate-pulse"
                  : "border-input bg-white text-foreground hover:border-pink-300 focus:border-pink-500 focus:ring-pink-100"
              }`}
            />
            {autoRecalculatedUnitItems.has(idx) && <span className="sr-only" role="status">Valor unitário recalculado a partir do total do item personalizado.</span>}
          </div>
          <div className="flex justify-center">
            <input
              type="text"
              inputMode="decimal"
              key={`custom-adjustment-${idx}-${item.priceAdjustment ?? item.totalPrice}-${item.quantity}`}
              title="Informe o valor total desejado para este item personalizado"
              defaultValue={fmt(item.priceAdjustment ?? item.totalPrice)}
              placeholder="Total desejado"
              onBlur={(e) => {
                const total = parseQuotationCurrency(e.target.value);
                updateItem(idx, { priceAdjustment: total });
                e.target.value = fmt(total);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              onChange={(e) => {
                scheduleQuotationAutoAdvance(e.currentTarget);
              }}
              className="h-8 w-full min-w-0 rounded-md border border-input bg-white px-2 text-center text-sm tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-pink-400"
            />
          </div>
          <div className="flex items-center justify-end gap-1 text-right text-sm font-semibold text-gray-800">
            <span>{fmt(item.totalPrice)}</span>
            <button
              type="button"
              title={isExpanded ? "Recolher item personalizado" : "Expandir item personalizado"}
              onClick={() => toggleItem(idx)}
              aria-expanded={isExpanded}
              className="rounded p-0.5 text-gray-400 transition-colors hover:text-pink-600"
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="flex justify-end gap-1">
            <button type="button" onClick={() => duplicateItem(idx)} className="text-gray-300 hover:text-pink-600 transition-colors" title="Duplicar item">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors" title="Remover item">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isExpanded && <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500 font-medium">Nome do Produto / Serviço</label>
            <Input
              aria-label="Nome do item personalizado"
              className="h-8 mt-0.5 text-sm"
              value={item.productName}
              onChange={(e) => updateItem(idx, { productName: e.target.value })}
              placeholder="Ex.: Estrutura metálica para lona ou mão de obra de instalação"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500 font-medium">Descrição</label>
            <Textarea
              className="min-h-20 mt-0.5 text-sm resize-y"
              value={specs.description ?? ""}
              onChange={(e) => updateSpec("description", e.target.value)}
              placeholder="Descreva o serviço, materiais, acabamento, observações ou o que será entregue"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">Arte / Layout</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            ref={(el) => { (artPasteRefs.current as any)[`file_${idx}`] = el; }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = "";
              await uploadCustomArt(file);
            }}
          />
          {item.artFileUrl ? (
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <button
                type="button"
                title="Visualizar arte em tamanho ampliado"
                className="mx-auto block cursor-zoom-in"
                onClick={() => setLightboxImg(item.artFileUrl!)}
              >
                <img src={item.artFileUrl} alt="Arte do item personalizado" className="max-h-40 max-w-full rounded object-contain" />
              </button>
              <div className="flex gap-2 justify-center">
                <button type="button" className="text-xs text-pink-600 hover:text-pink-700 underline" onClick={() => (artPasteRefs.current as any)[`file_${idx}`]?.click()}>Substituir</button>
                <span className="text-gray-300 text-xs">|</span>
                <button type="button" className="text-xs text-gray-400 hover:text-red-500 underline" onClick={() => updateItem(idx, { artFileUrl: undefined, artFileKey: undefined })}>Remover</button>
              </div>
            </div>
          ) : artUploadingIdx === idx ? (
            <div className="border-2 border-dashed border-pink-200 rounded-lg p-4 space-y-2 text-center">
              <div className="text-xs text-gray-500">Enviando... {artUploadState.currentChunk}/{artUploadState.totalChunks} — {artUploadState.progress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-pink-500 h-1.5 rounded-full transition-all" style={{ width: `${artUploadState.progress}%` }} /></div>
              <button type="button" className="text-xs text-gray-400 hover:text-red-500 underline" onClick={cancelArtUpload}>Cancelar</button>
            </div>
          ) : (
            <div
              tabIndex={0}
              className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center focus:outline-none focus:border-pink-400 focus:bg-pink-50/20 transition-colors"
              onPaste={async (e) => {
                const imageItem = Array.from(e.clipboardData?.items ?? []).find((clipboardItem) => clipboardItem.type.startsWith("image/"));
                const file = imageItem?.getAsFile();
                if (!file) return;
                e.preventDefault();
                await uploadCustomArt(file);
              }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-pink-400", "bg-pink-50/20"); }}
              onDragLeave={(e) => e.currentTarget.classList.remove("border-pink-400", "bg-pink-50/20")}
              onDrop={async (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-pink-400", "bg-pink-50/20");
                const file = e.dataTransfer.files?.[0];
                if (file?.type.startsWith("image/")) await uploadCustomArt(file);
              }}
            >
              <ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" />
              <div className="text-xs text-gray-400 mb-2">Cole um print aqui <span className="text-gray-300">(Ctrl+V)</span> ou arraste uma imagem</div>
              <button type="button" className="text-xs border border-gray-200 rounded px-3 py-1 text-gray-500 hover:border-pink-300 hover:text-pink-600 transition-colors" onClick={() => (artPasteRefs.current as any)[`file_${idx}`]?.click()}>Selecionar imagem</button>
              <div className="text-[10px] text-gray-300 mt-1">PNG, JPG ou JPEG</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-100 pt-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">Quantidade</label>
            <Input
              type="number"
              min={1}
              aria-label={`Quantidade inferior de ${item.productName || "item personalizado"}`}
              value={item.quantity}
              onChange={(e) => {
                updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) });
                scheduleQuotationAutoAdvance(e.currentTarget);
              }}
              className="h-8 mt-0.5 text-sm transition-colors hover:border-pink-300 focus-visible:border-pink-500 focus-visible:ring-pink-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Valor unitário</label>
            <input
              type="text"
              inputMode="decimal"
              aria-label={`Valor unitário de ${item.productName || "item personalizado"}`}
              value={customUnitDrafts[idx] ?? fmt(item.unitPrice)}
              placeholder="R$ 0,00"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9,.-]/g, "").replace(",", ".");
                setCustomUnitDrafts((prev) => ({ ...prev, [idx]: e.target.value }));
                updateItem(idx, { unitPrice: Math.max(0, parseFloat(raw) || 0) });
                scheduleQuotationAutoAdvance(e.currentTarget);
              }}
              onBlur={(e) => {
                const raw = e.target.value.replace(/[^0-9,.-]/g, "").replace(",", ".");
                const value = Math.max(0, parseFloat(raw) || 0);
                updateItem(idx, { unitPrice: value });
                setCustomUnitDrafts((prev) => ({ ...prev, [idx]: fmt(value) }));
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="h-8 mt-0.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 transition-colors hover:border-pink-300 focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Valor total</label>
            <Input
              type="text"
              inputMode="decimal"
              aria-label={`Valor total de ${item.productName || "item personalizado"}`}
              key={`custom-total-${idx}-${item.totalPrice}`}
              defaultValue={fmt(item.totalPrice)}
              placeholder="R$ 0,00"
              onBlur={(e) => {
                const value = Math.max(0, parseFloat(e.target.value.replace(/[^0-9,.-]/g, "").replace(",", ".")) || 0);
                updateItem(idx, { priceAdjustment: value });
                e.target.value = fmt(value);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              onChangeCapture={(e) => scheduleQuotationAutoAdvance(e.currentTarget)}
              className="h-8 mt-0.5 border-pink-100 bg-pink-50/30 text-sm font-semibold text-right transition-colors hover:border-pink-300 focus-visible:border-pink-500 focus-visible:bg-white focus-visible:ring-pink-100"
            />
          </div>
        </div>
        </div>}
      </div>
    );
  };

  return (
    <div className="admin-visual-system h-screen overflow-y-scroll overscroll-contain p-6 pb-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(returnTarget.path)} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> {returnTarget.label}
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? `Editar Orçamento #${existingQuotation?.quotationNumber ?? "..."}` : "Novo Orçamento"}
          </h1>
          <p className="text-sm text-gray-500">Preencha os dados abaixo para gerar a proposta comercial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-5">

          {/* Seção: Cliente */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-pink-600" />
                <h2 className="font-semibold text-gray-800">Cliente</h2>
              </div>
              {!showNewClientForm && !clientId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-pink-200 text-pink-700 hover:bg-pink-50"
                  onClick={() => { setShowNewClientForm(true); setShowClientSearch(false); }}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Cadastrar Cliente
                </Button>
              )}
            </div>

            {/* Busca de cliente existente */}
            {!showNewClientForm && (
              <div className="relative">
                {!clientId && <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar cliente por nome, e-mail ou telefone..."
                    className="pl-9"
                    value={clientId ? clientName : clientSearch}
                    onChange={(e) => {
                      if (clientId) { setClientId(null); setClientName(""); }
                      setClientSearch(e.target.value);
                      setShowClientSearch(true);
                    }}
                    onFocus={() => setShowClientSearch(true)}
                  />
                </div>}
                {!clientId && showClientSearch && clientSearch.length >= 2 && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {(clientResults ?? []).length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">
                        Nenhum cliente encontrado.
                        <button
                          className="ml-1 text-pink-600 font-medium hover:underline"
                          onClick={() => { setShowNewClientForm(true); setShowClientSearch(false); setNewClientName(clientSearch); }}
                        >
                          Cadastrar novo?
                        </button>
                      </div>
                    ) : (clientResults ?? []).map((c: any) => (
                      <button
                        key={c.id}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                        onClick={() => {
                          setClientId(c.id);
                          setClientName(c.name);
                          setNewClientName(c.name ?? "");
                          setNewClientEmail(c.email ?? "");
                          setNewClientPhone(c.phone ?? "");
                          setNewClientWhatsapp(c.whatsapp ?? "");
                          setNewClientCpfCnpj(c.cpfCnpj ?? "");
                          setNewClientZipCode(c.addressZipCode ?? "");
                          setNewClientStreet(c.addressStreet ?? "");
                          setNewClientNumber(c.addressNumber ?? "");
                          setNewClientComplement(c.addressComplement ?? "");
                          setNewClientNeighborhood(c.addressNeighborhood ?? "");
                          setNewClientCity(c.addressCity ?? "");
                          setNewClientState(c.addressState ?? "");
                          setClientSearch("");
                          setShowClientSearch(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.email ?? c.phone ?? ""}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.source === "customer_accounts" ? "bg-blue-100 text-blue-700"
                            : c.source === "users" ? "bg-purple-100 text-purple-700"
                            : c.clientType === "site" ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                          }`}>
                            {c.source === "customer_accounts" ? "Loja" : c.source === "users" ? "Manus" : c.clientType === "site" ? "Site" : c.clientType === "balcao" ? "Balcão" : c.clientType ?? "CRM"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {clientId && (
                  <div className="mt-2 space-y-3 rounded border border-green-100 bg-green-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <User className="w-3.5 h-3.5" />
                      <span className="font-medium">Dados do cliente</span>
                    <button className="ml-auto text-gray-400 hover:text-red-500 text-xs" onClick={() => { setClientId(null); setClientName(""); }}>
                      Trocar
                    </button>
                  </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input value={clientName} onChange={(e) => { setClientName(e.target.value); setNewClientName(e.target.value); }} placeholder="Nome / Razão social" className="h-8 bg-white text-sm" />
                      <Input value={newClientCpfCnpj} onChange={(e) => setNewClientCpfCnpj(e.target.value)} placeholder="CPF / CNPJ" className="h-8 bg-white text-sm" />
                      <Input value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="E-mail" className="h-8 bg-white text-sm" />
                      <Input value={newClientWhatsapp || newClientPhone} onChange={(e) => setNewClientWhatsapp(e.target.value)} placeholder="Telefone / WhatsApp" className="h-8 bg-white text-sm" />
                      <Input value={newClientStreet} onChange={(e) => setNewClientStreet(e.target.value)} placeholder="Endereço" className="h-8 bg-white text-sm sm:col-span-2" />
                      <Input value={newClientCity} onChange={(e) => setNewClientCity(e.target.value)} placeholder="Cidade" className="h-8 bg-white text-sm" />
                      <Input value={newClientState} onChange={(e) => setNewClientState(e.target.value)} placeholder="UF" className="h-8 bg-white text-sm" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formulário inline de cadastro de novo cliente */}
            {showNewClientForm && (
              <div className="border border-pink-200 rounded-lg p-4 bg-pink-50/30 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-pink-700">Novo Cliente</p>
                  <button onClick={() => setShowNewClientForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Canal de venda */}
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Canal de venda *</label>
                  <div className="flex gap-3">
                    {[
                      { value: "balcao", label: "Cliente Balcão", desc: "Atendimento presencial" },
                      { value: "site", label: "Cliente Site", desc: "Compra online" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewClientType(opt.value as "balcao" | "site")}
                        className={`flex-1 flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
                          newClientType === opt.value
                            ? "border-pink-500 bg-pink-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-pink-300"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                          newClientType === opt.value ? "border-pink-500" : "border-gray-300"
                        }`}>
                          {newClientType === opt.value && <div className="w-2 h-2 rounded-full bg-pink-500" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${newClientType === opt.value ? "text-pink-700" : "text-gray-800"}`}>{opt.label}</p>
                          <p className="text-xs text-gray-400">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-medium">Nome *</label>
                    <Input className="h-8 mt-0.5 text-sm" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">E-mail</label>
                    <Input className="h-8 mt-0.5 text-sm" type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Telefone</label>
                    <Input className="h-8 mt-0.5 text-sm" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">WhatsApp</label>
                    <Input className="h-8 mt-0.5 text-sm" value={newClientWhatsapp} onChange={(e) => setNewClientWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">CPF / CNPJ</label>
                    <Input
                      className="h-8 mt-0.5 text-sm"
                      value={newClientCpfCnpj}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        if (v.length <= 11) {
                          setNewClientCpfCnpj(v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3").replace(/(\d{3})(\d{1,3})/, "$1.$2"));
                        } else {
                          setNewClientCpfCnpj(v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4").replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3").replace(/(\d{2})(\d{1,3})/, "$1.$2"));
                        }
                      }}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Observações</label>
                    <Input className="h-8 mt-0.5 text-sm" value={newClientNotes} onChange={(e) => setNewClientNotes(e.target.value)} placeholder="Opcional" />
                  </div>
                </div>
                {/* Endereço */}
                <div className="border-t border-gray-100 pt-3 mt-1">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Endereço</label>
                    <button type="button" className="text-xs text-pink-600 hover:underline" onClick={() => setManualAddress(!manualAddress)}>
                      {manualAddress ? "Usar CEP" : "Não sei o CEP"}
                    </button>
                  </div>
                  {!manualAddress ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 font-medium">CEP</label>
                        <div className="flex gap-2 mt-0.5">
                          <Input
                            className="h-8 text-sm flex-1"
                            value={newClientZipCode}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                              const masked = v.length > 5 ? v.slice(0,5) + "-" + v.slice(5) : v;
                              setNewClientZipCode(masked);
                              if (v.length === 8) {
                                setCepLoading(true);
                                fetch(`https://viacep.com.br/ws/${v}/json/`)
                                  .then(r => r.json())
                                  .then(d => {
                                    if (!d.erro) {
                                      setNewClientStreet(d.logradouro || "");
                                      setNewClientNeighborhood(d.bairro || "");
                                      setNewClientCity(d.localidade || "");
                                      setNewClientState(d.uf || "");
                                    }
                                  })
                                  .finally(() => setCepLoading(false));
                              }
                            }}
                            placeholder="00000-000"
                          />
                          {cepLoading && <span className="text-xs text-gray-400 self-center">Buscando...</span>}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 font-medium">Logradouro</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientStreet} onChange={(e) => setNewClientStreet(e.target.value)} placeholder="Rua, Av., etc." />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Número *</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientNumber} onChange={(e) => setNewClientNumber(e.target.value)} placeholder="Nº" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Complemento</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientComplement} onChange={(e) => setNewClientComplement(e.target.value)} placeholder="Apto, Sala..." />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Bairro</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientNeighborhood} onChange={(e) => setNewClientNeighborhood(e.target.value)} placeholder="Bairro" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Cidade</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientCity} onChange={(e) => setNewClientCity(e.target.value)} placeholder="Cidade" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Estado (UF)</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientState} onChange={(e) => setNewClientState(e.target.value)} placeholder="SP" maxLength={2} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 font-medium">Logradouro</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientStreet} onChange={(e) => setNewClientStreet(e.target.value)} placeholder="Rua, Av., etc." />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Número *</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientNumber} onChange={(e) => setNewClientNumber(e.target.value)} placeholder="Nº" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Complemento</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientComplement} onChange={(e) => setNewClientComplement(e.target.value)} placeholder="Apto, Sala..." />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Bairro</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientNeighborhood} onChange={(e) => setNewClientNeighborhood(e.target.value)} placeholder="Bairro" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Cidade</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientCity} onChange={(e) => setNewClientCity(e.target.value)} placeholder="Cidade" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">CEP</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientZipCode} onChange={(e) => setNewClientZipCode(e.target.value)} placeholder="00000-000" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Estado (UF)</label>
                        <Input className="h-8 mt-0.5 text-sm" value={newClientState} onChange={(e) => setNewClientState(e.target.value)} placeholder="SP" maxLength={2} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white gap-1"
                    onClick={handleQuickCreateClient}
                    disabled={quickCreateClient.isPending}
                  >
                    {quickCreateClient.isPending ? "Salvando..." : "Salvar e Selecionar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewClientForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-pink-100 bg-pink-50/40 px-3 py-2.5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] sm:items-end">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    <User className="h-3.5 w-3.5 text-pink-600" aria-hidden="true" />
                    Responsável pela emissão
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">Nome que será exibido neste orçamento e na impressão.</p>
                </div>
                <div>
                  <label htmlFor="quotation-responsible-name" className="sr-only">Responsável pela emissão</label>
                  <Input
                    id="quotation-responsible-name"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    className="h-9 bg-white"
                    maxLength={150}
                    placeholder="Nome de quem está criando o orçamento"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Produtos */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-pink-600" />
                <h2 className="font-semibold text-gray-800">Produtos / Serviços</h2>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 border-pink-200 text-pink-700 hover:bg-pink-50"
                onClick={() => setShowAddProduct(true)}
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Produto
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhum produto adicionado</p>
                <p className="text-xs mt-1">Clique em "Adicionar Produto" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.some((item) => !item.isCustom) && (
                  <div className="space-y-2">
                    {/* Cabeçalho da tabela */}
                    <div className="grid grid-cols-[32px_minmax(108px,1fr)_32px_58px_92px_96px_96px_32px] gap-2 px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <div>Img</div>
                      <div>Produto / Especificações</div>
                      <div className="text-center">Arte</div>
                      <div className="text-center">Qtd</div>
                      <div className="text-center">Unit.</div>
                      <div className="text-center">Ajuste</div>
                      <div className="text-right">Total</div>
                      <div></div>
                    </div>
                    {items.map((item, idx) => {
                  if (item.isCustom) return null;
                  const isExpanded = expandedItems.has(idx);
                  const specs = item._specsParsed ?? {};
                  const specificationSummary = Object.entries(specs)
                    .filter(([key, value]) => key !== "itemType" && Boolean(value))
                    .map(([key, value]) => `${specificationLabels[key] ?? key}: ${value}`)
                    .join(" · ");
                  return (
                    <div key={idx} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropItem(event, idx)} className={`border border-gray-100 rounded-lg overflow-hidden transition-opacity ${draggedItemIndex === idx ? "opacity-50" : ""}`}>
                      {/* Linha principal */}
                      <div className="grid grid-cols-[32px_minmax(108px,1fr)_32px_58px_92px_96px_96px_32px] gap-2 items-center px-2 py-2 bg-gray-50">
                        <div>
                          {item.isCustom ? (
                            <div className="w-8 h-8" aria-hidden="true" />
                          ) : item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-8 h-8 object-contain rounded cursor-pointer"
                              onClick={() => setLightboxImg(item.productImage!)}
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          {item.isCustom ? (
                            <div className="flex items-center gap-1">
                              <Input
                                aria-label="Nome do item personalizado"
                                value={item.productName}
                                onChange={(e) => updateItem(idx, { productName: e.target.value })}
                                placeholder="Nome do produto ou serviço"
                                className="h-7 text-sm font-medium"
                              />
                              <button
                                type="button"
                                title={isExpanded ? "Ocultar especificações" : "Editar especificações"}
                                onClick={() => toggleItem(idx)}
                                className="p-1 text-gray-500 hover:text-pink-600"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span draggable onDragStart={(event) => startItemDrag(event, idx)} title="Arraste para reordenar" className="cursor-grab text-pink-500 hover:text-pink-700 active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span>
                            <button
                              className="flex items-center gap-1 text-sm font-medium text-gray-800 hover:text-pink-600 text-left"
                              onClick={() => toggleItem(idx)}
                              aria-label={isExpanded ? "Recolher item" : "Expandir item"}
                            >
                              {item.productName}
                            </button>
                            </div>
                          )}
                          {specificationSummary && (
                            <p className="mt-1 text-[11px] leading-4 text-gray-500 line-clamp-2">{specificationSummary}</p>
                          )}
                        </div>
                        <div className="flex justify-center">
                          {item.artFileUrl ? (
                            <button
                              type="button"
                              title="Visualizar arte anexada"
                              className="w-8 h-8 rounded border border-gray-200 overflow-hidden bg-white"
                              onClick={() => setLightboxImg(item.artFileUrl!)}
                            >
                              <img src={item.artFileUrl} alt={`Arte de ${item.productName || "item personalizado"}`} className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Anexar arte"
                              className="w-8 h-8 rounded border border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-300 hover:border-pink-300 hover:text-pink-500"
                              onClick={() => toggleItem(idx)}
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) });
                              scheduleQuotationAutoAdvance(e.currentTarget);
                            }}
                            className="h-8 w-full min-w-0 bg-white px-2 text-center text-sm font-semibold tabular-nums"
                          />
                        </div>
                        <div className="relative flex justify-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-label={`Valor unitário de ${item.productName}`}
                            value={customUnitDrafts[idx] ?? fmt(item.unitPrice)}
                            placeholder="R$ 0,00"
                            onChange={(e) => {
                              setCustomUnitDrafts((prev) => ({ ...prev, [idx]: e.target.value }));
                              scheduleQuotationAutoAdvance(e.currentTarget);
                            }}
                            onBlur={(e) => {
                              const value = parseQuotationCurrency(e.target.value);
                              updateItem(idx, { unitPrice: value });
                              setCustomUnitDrafts((prev) => ({ ...prev, [idx]: fmt(value) }));
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            className={`h-8 w-full min-w-0 rounded-md border px-2 text-right text-sm font-medium tabular-nums transition-all focus:outline-none focus:ring-2 ${
                              autoRecalculatedUnitItems.has(idx)
                                ? "border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 motion-safe:animate-pulse"
                                : "border-input bg-white text-foreground hover:border-pink-300 focus:border-pink-500 focus:ring-pink-100"
                            }`}
                          />
                          {autoRecalculatedUnitItems.has(idx) && <span className="sr-only" role="status">Valor unitário recalculado a partir do ajuste.</span>}
                        </div>
                        <div className="flex justify-center">
                          {item.isCustom ? (
                            <span className="text-xs text-gray-300">—</span>
                          ) : (
                          <input
                            type="text"
                            inputMode="decimal"
                            key={`product-adjustment-${idx}-${item.priceAdjustment ?? item.totalPrice}-${item.quantity}`}
                            title="Informe o valor total desejado para este item"
                            defaultValue={fmt(item.priceAdjustment ?? item.totalPrice)}
                            placeholder="Total desejado"
                            onBlur={(e) => {
                              const total = parseQuotationCurrency(e.target.value);
                              updateItem(idx, { priceAdjustment: total });
                              e.target.value = fmt(total);
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            onChange={(e) => {
                              scheduleQuotationAutoAdvance(e.currentTarget);
                            }}
                            className="h-8 w-full min-w-0 rounded-md border border-input bg-white px-2 text-center text-sm tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-right text-sm font-semibold text-gray-800">
                          <span>{fmt(item.totalPrice)}</span>
                          <button
                            type="button"
                            title={isExpanded ? "Recolher especificações" : "Expandir especificações"}
                            onClick={() => toggleItem(idx)}
                            aria-expanded={isExpanded}
                            className="rounded p-0.5 text-gray-400 transition-colors hover:text-pink-600"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => duplicateItem(idx)} className="text-gray-300 hover:text-pink-600 transition-colors" title="Duplicar item">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Especificações expandidas */}
                      {isExpanded && (() => {
                        const opts = item.productId !== null ? productOptionsCache[item.productId] : undefined;
                        const updateSpec = (key: string, value: string) => {
                          const newSpecs = { ...specs, [key]: value };
                          updateItem(idx, { specifications: JSON.stringify(newSpecs), _specsParsed: newSpecs });
                        };
                        return (
                          <div className="px-3 py-3 bg-white border-t border-gray-100 grid grid-cols-2 gap-3">
                            {/* Medidas */}
                            <div>
                              <label className="text-xs text-gray-500 font-medium">Largura (m)</label>
                              <Input
                                className="h-7 mt-0.5 text-sm"
                                value={specs.width ?? ""}
                                onChange={(e) => updateSpec("width", e.target.value)}
                                onBlur={(e) => {
                                  const raw = e.target.value.replace(",", ".");
                                  const val = parseFloat(raw);
                                  if (!isNaN(val) && val > 0) updateSpec("width", val.toFixed(2).replace(".", ","));
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                placeholder="0,00"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium">Altura (m)</label>
                              <Input
                                className="h-7 mt-0.5 text-sm"
                                value={specs.height ?? ""}
                                onChange={(e) => updateSpec("height", e.target.value)}
                                onBlur={(e) => {
                                  const raw = e.target.value.replace(",", ".");
                                  const val = parseFloat(raw);
                                  if (!isNaN(val) && val > 0) updateSpec("height", val.toFixed(2).replace(".", ","));
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                placeholder="0,00"
                              />
                            </div>

                            {/* Atributos dinâmicos (ex: Impressão) */}
                            {opts?.attributes?.map((attr: any) => (
                              <div key={attr.attributeId}>
                                <label className="text-xs text-gray-500 font-medium">{attr.name}</label>
                                <Select
                                  value={specs[attr.name.toLowerCase().replace(/\s+/g, "_")] ?? ""}
                                  onValueChange={(v) => updateSpec(attr.name.toLowerCase().replace(/\s+/g, "_"), v)}
                                >
                                  <SelectTrigger className="h-7 mt-0.5 text-sm">
                                    <SelectValue placeholder={`Selecionar ${attr.name}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {attr.values.map((v: any) => (
                                      <SelectItem key={v.id} value={v.value}>{v.value}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}


                            {/* Variações dinâmicas (material, acabamento) */}
                            {opts?.variations?.map((vt: any) => (
                              <div key={vt.id}>
                                <label className="text-xs text-gray-500 font-medium">{vt.name}</label>
                                <Select
                                  value={specs[vt.name.toLowerCase().replace(/\s+/g, "_")] ?? ""}
                                  onValueChange={(v) => updateSpec(vt.name.toLowerCase().replace(/\s+/g, "_"), v)}
                                >
                                  <SelectTrigger className="h-7 mt-0.5 text-sm">
                                    <SelectValue placeholder={`Selecionar ${vt.name}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(vt.options ?? []).map((o: any) => (
                                      <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                            {/* Opções genéricas para itens personalizados ou produtos sem variações cadastradas */}
                            {(!opts || !opts.variations || opts.variations.length === 0 || item.isCustom) && [
                              { key: "printingType", label: "Tipo de Impressão", options: ["Solvente", "Digital", "Offset", "UV", "Outro"] },
                              { key: "material", label: "Tipo de Material", options: ["Lona", "Adesivo", "Papel", "PVC", "Acrílico", "Outro"] },
                              { key: "thickness", label: "Tipo de Espessura", options: ["180g", "280g", "440g", "Outro"] },
                              { key: "finish", label: "Tipo de Acabamento", options: ["Sem acabamento", "Ilhós", "Laminação", "Corte especial", "Outro"] },
                            ].map((field) => (
                              <div key={field.key}>
                                <label className="text-xs text-gray-500 font-medium">{field.label}</label>
                                <Select
                                  value={specs[field.key] ?? ""}
                                  onValueChange={(value) => updateSpec(field.key, value)}
                                >
                                  <SelectTrigger className="h-7 mt-0.5 text-sm">
                                    <SelectValue placeholder={`Selecionar ${field.label}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options.map((option) => (
                                      <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}

                            <div className="col-span-2">
                              <label className="text-xs text-gray-500 font-medium mb-1 block">Arte / Layout</label>
                              {/* Input de arquivo oculto */}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                style={{ display: "none" }}
                                ref={(el) => { (artPasteRefs.current as any)[`file_${idx}`] = el; }}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  e.target.value = "";
                                  setArtUploadingIdx(idx);
                                  try {
                                    const { url } = await doArtUpload(file);
                                    updateItem(idx, { artFileUrl: url });
                                  } catch (err: any) {
                                    if (err?.message !== "CANCELLED") toast.error("Erro ao enviar imagem");
                                  } finally {
                                    setArtUploadingIdx(null);
                                    resetArtUpload();
                                  }
                                }}
                              />
                              {item.artFileUrl ? (
                                /* Preview com opções Substituir e Remover */
                                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                                  <img
                                    src={item.artFileUrl}
                                    alt="Arte"
                                    className="max-h-32 mx-auto rounded object-contain"
                                  />
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      type="button"
                                      className="text-xs text-pink-600 hover:text-pink-700 underline"
                                      onClick={() => (artPasteRefs.current as any)[`file_${idx}`]?.click()}
                                    >
                                      Substituir
                                    </button>
                                    <span className="text-gray-300 text-xs">|</span>
                                    <button
                                      type="button"
                                      className="text-xs text-gray-400 hover:text-red-500 underline"
                                      onClick={() => updateItem(idx, { artFileUrl: undefined, artFileKey: undefined })}
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              ) : artUploadingIdx === idx ? (
                                /* Barra de progresso */
                                <div className="border-2 border-dashed border-pink-200 rounded-lg p-4 space-y-2 text-center">
                                  <div className="text-xs text-gray-500">Enviando... {artUploadState.currentChunk}/{artUploadState.totalChunks} — {artUploadState.progress}%</div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-pink-500 h-1.5 rounded-full transition-all" style={{ width: `${artUploadState.progress}%` }} />
                                  </div>
                                  <button type="button" className="text-xs text-gray-400 hover:text-red-500 underline" onClick={cancelArtUpload}>Cancelar</button>
                                </div>
                              ) : (
                                /* Área de paste e drag-and-drop */
                                <div
                                  ref={(el) => { artPasteRefs.current[idx] = el; }}
                                  tabIndex={0}
                                  className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center focus:outline-none focus:border-pink-400 focus:bg-pink-50/20 transition-colors"
                                  onPaste={async (e) => {
                                    const items = Array.from(e.clipboardData?.items ?? []);
                                    const imgItem = items.find(it => it.type.startsWith("image/"));
                                    if (!imgItem) return;
                                    const file = imgItem.getAsFile();
                                    if (!file) return;
                                    e.preventDefault();
                                    setArtUploadingIdx(idx);
                                    try {
                                      const { url } = await doArtUpload(file);
                                      updateItem(idx, { artFileUrl: url });
                                    } catch (err: any) {
                                      if (err?.message !== "CANCELLED") toast.error("Erro ao enviar imagem");
                                    } finally {
                                      setArtUploadingIdx(null);
                                      resetArtUpload();
                                    }
                                  }}
                                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-pink-400", "bg-pink-50/20"); }}
                                  onDragLeave={(e) => { e.currentTarget.classList.remove("border-pink-400", "bg-pink-50/20"); }}
                                  onDrop={async (e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove("border-pink-400", "bg-pink-50/20");
                                    const file = e.dataTransfer.files?.[0];
                                    if (!file || !file.type.startsWith("image/")) return;
                                    setArtUploadingIdx(idx);
                                    try {
                                      const { url } = await doArtUpload(file);
                                      updateItem(idx, { artFileUrl: url });
                                    } catch (err: any) {
                                      if (err?.message !== "CANCELLED") toast.error("Erro ao enviar imagem");
                                    } finally {
                                      setArtUploadingIdx(null);
                                      resetArtUpload();
                                    }
                                  }}
                                >
                                  <ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                                  <div className="text-xs text-gray-400 mb-2">
                                    Cole um print aqui <span className="text-gray-300">(Ctrl+V)</span> ou arraste uma imagem
                                  </div>
                                  <button
                                    type="button"
                                    className="text-xs border border-gray-200 rounded px-3 py-1 text-gray-500 hover:border-pink-300 hover:text-pink-600 transition-colors"
                                    onClick={() => (artPasteRefs.current as any)[`file_${idx}`]?.click()}
                                  >
                                    Selecionar imagem
                                  </button>
                                  <div className="text-[10px] text-gray-300 mt-1">PNG, JPG ou JPEG</div>
                                </div>
                              )}
                            </div>
                            <div className="col-span-2 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-3">
                              <div>
                                <label className="text-xs font-medium text-gray-500">Quantidade</label>
                                <Input
                                  type="number"
                                  min={1}
                                  aria-label={`Quantidade inferior de ${item.productName}`}
                                  value={item.quantity}
                                  onChange={(event) => {
                                    updateItem(idx, { quantity: Math.max(1, parseInt(event.target.value) || 1) });
                                    scheduleQuotationAutoAdvance(event.currentTarget);
                                  }}
                                  className="mt-0.5 h-8 bg-white text-sm font-semibold tabular-nums transition-colors hover:border-pink-300 focus-visible:border-pink-500 focus-visible:ring-pink-100"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500">Valor unitário</label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  aria-label={`Valor unitário inferior de ${item.productName}`}
                                  value={customUnitDrafts[idx] ?? fmt(item.unitPrice)}
                                  placeholder="R$ 0,00"
                                  onChange={(event) => {
                                    setCustomUnitDrafts((previous) => ({ ...previous, [idx]: event.target.value }));
                                    scheduleQuotationAutoAdvance(event.currentTarget);
                                  }}
                                  onBlur={(event) => {
                                    const value = parseQuotationCurrency(event.target.value);
                                    updateItem(idx, { unitPrice: value });
                                    setCustomUnitDrafts((previous) => ({ ...previous, [idx]: fmt(value) }));
                                  }}
                                  onKeyDown={(event) => { if (event.key === "Enter") (event.target as HTMLInputElement).blur(); }}
                                  className={`mt-0.5 h-8 w-full rounded-md border px-3 text-right text-sm font-medium tabular-nums transition-all focus:outline-none focus:ring-2 ${
                                    autoRecalculatedUnitItems.has(idx)
                                      ? "border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 motion-safe:animate-pulse"
                                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-pink-300 focus:border-pink-500 focus:bg-white focus:ring-pink-100"
                                  }`}
                                />
                                {autoRecalculatedUnitItems.has(idx) && <span className="sr-only" role="status">Valor unitário inferior recalculado a partir do ajuste.</span>}
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500">Valor total</label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  aria-label={`Valor total inferior de ${item.productName}`}
                                  key={`product-total-${idx}-${item.totalPrice}`}
                                  defaultValue={fmt(item.totalPrice)}
                                  placeholder="R$ 0,00"
                                  onBlur={(event) => {
                                    const total = parseQuotationCurrency(event.target.value);
                                    updateItem(idx, { priceAdjustment: total });
                                    event.target.value = fmt(total);
                                  }}
                                  onKeyDown={(event) => { if (event.key === "Enter") (event.target as HTMLInputElement).blur(); }}
                                  onChangeCapture={(event) => scheduleQuotationAutoAdvance(event.currentTarget)}
                                  className="mt-0.5 h-8 border-pink-100 bg-pink-50/30 text-right text-sm font-semibold tabular-nums transition-colors hover:border-pink-300 focus-visible:border-pink-500 focus-visible:bg-white focus-visible:ring-pink-100"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                    })}
                  </div>
                )}
                {items.some((item) => item.isCustom) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
                      <Package className="h-4 w-4 shrink-0 text-pink-600" />
                      <h2 className="font-semibold text-gray-800">Itens personalizados</h2>
                      <span className="text-xs text-gray-400">— produto ou serviço fora do catálogo</span>
                    </div>
                    <div className="grid grid-cols-[32px_minmax(108px,1fr)_32px_58px_92px_96px_96px_32px] gap-2 border-b border-gray-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <div>Img</div>
                      <div>Produto / Serviço</div>
                      <div className="text-center">Arte</div>
                      <div className="text-center">Qtd</div>
                      <div className="text-center">Unit.</div>
                      <div className="text-center">Ajuste</div>
                      <div className="text-right">Total</div>
                      <div></div>
                    </div>
                    {items.map((item, idx) => item.isCustom ? renderCustomItemCard(item, idx) : null)}
                    <div className="pt-1">
                      <Button type="button" variant="outline" size="sm" onClick={openCustomItemNameStep} className="gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800">
                        <Plus className="h-3.5 w-3.5" /> Adicionar novo item
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seção: Entrega */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-pink-600" />
              <h2 className="font-semibold text-gray-800">Entrega</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Método</label>
                <Select value={shippingMethod} onValueChange={(v) => {
                  setShippingMethod(v);
                  if (v === "pickup") { setShippingLabel("Retirada na loja"); setShippingPrice(0); }
                  else if (v === "delivery") setShippingLabel("Entrega local");
                  else if (v === "carrier") setShippingLabel("Transportadora");
                  else if (v === "melhor_envio") setShippingLabel("Melhor Envio");
                }}>
                  <SelectTrigger className="mt-0.5 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Retirada na loja</SelectItem>
                    <SelectItem value="delivery">Entrega local</SelectItem>
                    <SelectItem value="carrier">Transportadora</SelectItem>
                    <SelectItem value="melhor_envio">Melhor Envio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Valor do frete (R$)</label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={shippingPrice}
                  onChange={(e) => setShippingPrice(parseFloat(e.target.value) || 0)}
                  className="mt-0.5 h-9"
                  disabled={shippingMethod === "pickup"}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Prazo estimado (dias)</label>
                <Input
                  type="number"
                  min={0}
                  value={shippingEstimatedDays}
                  onChange={(e) => setShippingEstimatedDays(parseInt(e.target.value) || 0)}
                  className="mt-0.5 h-9"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Descrição do frete</label>
                <Input
                  value={shippingLabel}
                  onChange={(e) => setShippingLabel(e.target.value)}
                  className="mt-0.5 h-9"
                />
              </div>
              {shippingMethod !== "pickup" && (
                <div className="col-span-2">
                  <label htmlFor="quotation-delivery-address" className="text-xs text-gray-500 font-medium">Endereço de entrega</label>
                  <Textarea
                    id="quotation-delivery-address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="mt-0.5 text-sm"
                    rows={2}
                    placeholder="Rua, número, bairro, cidade, CEP..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Seção: Condições */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-pink-600" />
              <h2 className="font-semibold text-gray-800">Condições do Orçamento</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quotation-payment-method" className="text-xs text-gray-500 font-medium">Forma de pagamento</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="quotation-payment-method" className="mt-0.5 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de débito/crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="quotation-production-deadline" className="text-xs text-gray-500 font-medium">Prazo de produção (dias)</label>
                <Input
                  id="quotation-production-deadline"
                  type="number"
                  min={0}
                  value={productionDeadline}
                  onChange={(e) => setProductionDeadline(parseInt(e.target.value) || 0)}
                  className="mt-0.5 h-9"
                />
              </div>
              <div>
                <label htmlFor="quotation-validity" className="text-xs text-gray-500 font-medium">Validade do orçamento (dias)</label>
                <Input
                  id="quotation-validity"
                  type="number"
                  min={1}
                  value={quotationValidity}
                  onChange={(e) => setQuotationValidity(parseInt(e.target.value) || 30)}
                  className="mt-0.5 h-9"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="quotation-commercial-notes" className="text-xs text-gray-500 font-medium">Observações / Termos personalizados</label>
                <Textarea
                  id="quotation-commercial-notes"
                  value={commercialNotes}
                  onChange={(e) => setCommercialNotes(e.target.value)}
                  className="mt-0.5 text-sm"
                  rows={3}
                  placeholder="Insira observações, condições especiais ou termos que devem aparecer no rodapé do orçamento..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna lateral: Resumo financeiro */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-4">
            <h2 className="font-semibold text-gray-800 mb-4">Resumo Financeiro</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{fmt(subtotal)}</span>
              </div>

              {/* Desconto */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Desconto</span>
                  {discountAmount > 0 && <span className="text-green-600 font-medium">- {fmt(discountAmount)}</span>}
                </div>
                <div className="flex gap-2">
                  <label htmlFor="quotation-discount-type" className="sr-only">Tipo de desconto</label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                    <SelectTrigger id="quotation-discount-type" className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixo">R$ fixo</SelectItem>
                      <SelectItem value="percentual">% percentual</SelectItem>
                    </SelectContent>
                  </Select>
                  <label htmlFor="quotation-discount-value" className="sr-only">Valor do desconto</label>
                  <Input
                    id="quotation-discount-value"
                    type="number"
                    min={0}
                    step={0.01}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm flex-1"
                    placeholder={discountType === "percentual" ? "%" : "R$"}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frete</span>
                <span className="font-medium">{fmt(shippingPrice)}</span>
              </div>

              {/* Acerto Total (override comercial) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="quotation-manual-total" className="text-xs text-gray-500 font-medium">Acerto Total</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Como funciona o Acerto Total" className="text-gray-400 transition-colors hover:text-pink-600 focus-visible:outline-none focus-visible:text-pink-600">
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>Substitui o valor final calculado do orçamento.</TooltipContent>
                    </Tooltip>
                  </div>
                  {hasManualTotal && (
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-xs text-gray-400 transition-colors hover:text-pink-600 focus-visible:outline-none focus-visible:text-pink-600" onClick={clearManualTotal}>Limpar</button>
                      <button type="button" aria-label="Limpar Acerto Total" className="text-gray-400 transition-colors hover:text-pink-600 focus-visible:outline-none focus-visible:text-pink-600" onClick={clearManualTotal}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <Input
                  ref={acertoTotalInputRef}
                  id="quotation-manual-total"
                  aria-label="Acerto Total"
                  type="text"
                  inputMode="decimal"
                  min={0}
                  value={acertoTotal}
                  onFocus={() => setIsEditingManualTotal(true)}
                  onChange={(e) => handleManualTotalChange(e.target.value, true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  onBlur={commitManualTotal}
                  className="h-8 text-sm"
                  placeholder={`Calculado: ${fmt(calculatedTotal)}`}
                />
                {hasManualTotal && (
                  <p className="text-xs text-amber-600 mt-0.5" role="status">⚠ Valor manual sobrepõe o cálculo automático</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className={`flex justify-between items-center rounded-lg px-4 py-3 text-white transition-colors ${hasManualTotal ? "bg-amber-500" : "bg-pink-600"}`} aria-live="polite">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{hasManualTotal ? "TOTAL AJUSTADO" : "TOTAL"}</span>
                    {hasManualTotal && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Manual</span>}
                  </div>
                  <span className="text-xl font-bold">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-2">
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700 text-white gap-2"
                onClick={() => handleSave(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
                aria-busy={createMutation.isPending || updateMutation.isPending}
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar e Enviar"}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleSave(true)}
                disabled={createMutation.isPending || updateMutation.isPending}
                aria-busy={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                Salvar como Rascunho
              </Button>
            </div>

            {/* Resumo das condições */}
            {(productionDeadline > 0 || quotationValidity > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                {productionDeadline > 0 && (
                  <div className="flex justify-between">
                    <span>Prazo de produção</span>
                    <span className="font-medium text-gray-700">{productionDeadline} dias</span>
                  </div>
                )}
                {quotationValidity > 0 && (
                  <div className="flex justify-between">
                    <span>Validade do orçamento</span>
                    <span className="font-medium text-gray-700">{quotationValidity} dias</span>
                  </div>
                )}
                {paymentMethod && (
                  <div className="flex justify-between">
                    <span>Pagamento</span>
                    <span className="font-medium text-gray-700 capitalize">{paymentMethod.replace(/_/g, " ")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Adicionar produto */}
      <Dialog open={showAddProduct} onOpenChange={(open) => { setShowAddProduct(open); if (!open) { setShowCustomItemNameStep(false); setCustomItemName(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{showCustomItemNameStep ? "Nome do item personalizado" : "Adicionar Produto ao Orçamento"}</DialogTitle>
          </DialogHeader>
          {showCustomItemNameStep ? (
            <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); confirmCustomItemName(); }}>
              <div>
                <label htmlFor="custom-item-name" className="text-sm font-medium text-gray-800">Produto / Serviço</label>
                <p className="mt-1 text-xs text-gray-500">Informe o nome para que o item já seja criado identificado no orçamento.</p>
                <Input
                  id="custom-item-name"
                  autoFocus
                  value={customItemName}
                  onChange={(event) => setCustomItemName(event.target.value)}
                  maxLength={CUSTOM_ITEM_NAME_MAX_LENGTH}
                  placeholder="Ex.: Instalação de fachada, mão de obra ou estrutura metálica"
                  className="mt-3"
                />
                <p className="mt-2 text-right text-xs text-gray-400">{customItemName.length}/{CUSTOM_ITEM_NAME_MAX_LENGTH}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={cancelCustomItemName}>Cancelar</Button>
                <Button type="submit" className="bg-pink-600 hover:bg-pink-700">Continuar</Button>
              </div>
            </form>
          ) : <>
          <button
            type="button"
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-pink-200 bg-pink-50/50 text-left hover:bg-pink-50 transition-colors"
            onClick={openCustomItemNameStep}
          >
            <div className="w-10 h-10 rounded bg-pink-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-pink-600" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-sm text-pink-800">Adicionar item personalizado</p>
              <p className="text-xs text-pink-600">Para serviços ou produtos que não estão no catálogo</p>
            </div>
          </button>
          <div className="relative mb-3">
            <label htmlFor="quotation-product-search" className="sr-only">Buscar produto para adicionar ao orçamento</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <Input
              id="quotation-product-search"
              placeholder="Buscar produto..."
              className="pl-9"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">Nenhum produto encontrado</p>
            ) : filteredProducts.map((p: any) => (
              <button
                key={p.id}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-left"
                onClick={() => addProductToQuote(p)}
              >
                {p.imageUrl || p.image ? (
                  <img src={p.imageUrl ?? p.image} alt={p.name} className="w-10 h-10 object-contain rounded border border-gray-100" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm text-gray-800">{p.name}</p>
                  {p.basePrice && <p className="text-xs text-gray-400">{fmt(Number(p.basePrice))}</p>}
                </div>
              </button>
            ))}
          </div>
          </>}
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxImg(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Prévia ampliada da arte"
          onKeyDown={(event) => { if (event.key === "Escape") setLightboxImg(null); }}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300" onClick={() => setLightboxImg(null)} aria-label="Fechar prévia da arte"><X className="h-4 w-4" aria-hidden="true" /></button>
            <img src={lightboxImg} alt="Arte" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
