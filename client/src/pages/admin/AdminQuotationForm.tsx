import { useState, useEffect, useCallback, useRef } from "react";
import { useChunkedUpload } from "@/hooks/useChunkedUpload";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  X,
} from "lucide-react";
import { toast } from "sonner";

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
  priceAdjustment?: number; // Ajuste manual (+/-) somado ao total calculado
  isCustom?: boolean; // Item fora do catálogo, com nome e valor definidos manualmente
  // UI only
  _specsParsed?: Record<string, string>;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const specificationLabels: Record<string, string> = {
  width: "Largura",
  height: "Altura",
  printingType: "Tipo de impressão",
  material: "Tipo de material",
  thickness: "Tipo de espessura",
  finish: "Tipo de acabamento",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminQuotationForm() {
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEdit = !!params.id;
  const quotationId = params.id ? parseInt(params.id) : undefined;

  // ── Form state ──────────────────────────────────────────────────────────
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [showClientSearch, setShowClientSearch] = useState(false);

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

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
    setShippingMethod(q.shippingMethod ?? "pickup");
    setShippingLabel(q.shippingLabel ?? "Retirada na loja");
    setShippingEstimatedDays(q.shippingEstimatedDays ?? 0);
    setDeliveryAddress(q.deliveryAddress ?? "");
    setPaymentMethod(q.paymentMethod ?? "pix");
    setProductionDeadline(q.productionDeadline ?? 3);
    setQuotationValidity(q.quotationValidity ?? 30);
    setCommercialNotes(q.commercialNotes ?? "");
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
  const acertoValue = parseFloat(acertoTotal.replace(",", ".")) || 0;
  const total = acertoValue > 0 ? acertoValue : calculatedTotal;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = trpc.quotations.create.useMutation({
    onSuccess: (res) => {
      toast.success(`Orçamento ${res.quotationNumber} criado!`);
      navigate("/admin/orcamentos");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.quotations.update.useMutation({
    onSuccess: () => {
      toast.success("Orçamento atualizado!");
      navigate("/admin/orcamentos");
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
    shippingMethod,
    shippingLabel,
    shippingEstimatedDays,
    deliveryAddress,
    paymentMethod,
    productionDeadline,
    quotationValidity,
    commercialNotes,
    saveAsDraft,
  });

  const handleSave = (saveAsDraft: boolean) => {
    if (!clientId) { toast.error("Selecione um cliente."); return; }
    if (items.length === 0) { toast.error("Adicione pelo menos um produto."); return; }

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

  const addCustomItemToQuote = () => {
    const newItem: QuotationItem = {
      productId: null,
      productName: "",
      specifications: JSON.stringify({ itemType: "custom" }),
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      isCustom: true,
      _specsParsed: { itemType: "custom" },
    };
    setItems((prev) => [...prev, newItem]);
    setExpandedItems((prev) => { const next = new Set(prev); next.add(items.length); return next; });
    setShowAddProduct(false);
    setProductSearch("");
  };

  const updateItem = useCallback((idx: number, updates: Partial<QuotationItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      // Recalculate total
      if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
        const q = updates.quantity ?? next[idx].quantity;
        const u = updates.unitPrice ?? next[idx].unitPrice;
        next[idx].totalPrice = q * u + (next[idx].priceAdjustment ?? 0);
      }
      // Se specs ou quantidade mudaram, recalcular preço automaticamente
      if (updates.specifications !== undefined || updates._specsParsed !== undefined || updates.quantity !== undefined) {
        const pricing = !next[idx].isCustom && next[idx].productId !== null
          ? pricingCache[next[idx].productId]
          : undefined;
        if (pricing) {
          const { unitPrice: newUnit, totalPrice: newTotal } = calcItemPricing(next[idx], pricing);
          if (newUnit > 0) {
            next[idx].unitPrice = newUnit;
            next[idx].totalPrice = newTotal + (next[idx].priceAdjustment ?? 0);
          }
        }
      }
      // Se o ajuste mudou, recalcular o total
      if (updates.priceAdjustment !== undefined) {
        const pricing = !next[idx].isCustom && next[idx].productId !== null
          ? pricingCache[next[idx].productId]
          : undefined;
        if (pricing) {
          const { totalPrice: baseTotal } = calcItemPricing(next[idx], pricing);
          next[idx].totalPrice = (baseTotal > 0 ? baseTotal : next[idx].unitPrice * next[idx].quantity) + (updates.priceAdjustment ?? 0);
        } else {
          next[idx].totalPrice = next[idx].unitPrice * next[idx].quantity + (updates.priceAdjustment ?? 0);
        }
      }
      return next;
    });
  }, [pricingCache]);

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
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
      <div key={`custom-${idx}`} className="rounded-lg border border-pink-200 bg-white p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-pink-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-pink-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Item personalizado</p>
              <p className="text-xs text-gray-400">Produto ou serviço fora do catálogo</p>
            </div>
          </div>
          <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors" title="Remover item">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

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
              <img src={item.artFileUrl} alt="Arte do item personalizado" className="max-h-40 mx-auto rounded object-contain" />
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
            <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })} className="h-8 mt-0.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Valor unitário</label>
            <div className="h-8 mt-0.5 px-3 flex items-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-600">{fmt(item.unitPrice)}</div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Valor total</label>
            <Input
              type="text"
              inputMode="decimal"
              aria-label={`Valor total de ${item.productName || "item personalizado"}`}
              defaultValue={item.totalPrice > 0 ? fmt(item.totalPrice) : ""}
              placeholder="R$ 0,00"
              onBlur={(e) => {
                const value = Math.max(0, parseFloat(e.target.value.replace(/[^0-9,.-]/g, "").replace(",", ".")) || 0);
                updateItem(idx, { unitPrice: value / Math.max(1, item.quantity), priceAdjustment: 0 });
                e.target.value = value > 0 ? fmt(value) : "";
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="h-8 mt-0.5 text-sm font-semibold text-right"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/orcamentos")} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
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
                <div className="relative">
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
                </div>
                {showClientSearch && clientSearch.length >= 2 && (
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
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded">
                    <User className="w-3.5 h-3.5" />
                    <span className="font-medium">{clientName}</span>
                    <button className="ml-auto text-gray-400 hover:text-red-500 text-xs" onClick={() => { setClientId(null); setClientName(""); }}>
                      Trocar
                    </button>
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
                    <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <div className="col-span-1">Img</div>
                      <div className="col-span-3">Produto / Especificações</div>
                      <div className="col-span-1 text-center">Arte</div>
                      <div className="col-span-1 text-center">Qtd</div>
                      <div className="col-span-2 text-center">Ajuste</div>
                      <div className="col-span-3 text-right">Total</div>
                      <div className="col-span-1"></div>
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
                    <div key={idx} className="border border-gray-100 rounded-lg overflow-hidden">
                      {/* Linha principal */}
                      <div className="grid grid-cols-12 gap-2 items-center px-2 py-2 bg-gray-50">
                        <div className="col-span-1">
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
                        <div className="col-span-3 min-w-0">
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
                            <button
                              className="flex items-center gap-1 text-sm font-medium text-gray-800 hover:text-pink-600 text-left"
                              onClick={() => toggleItem(idx)}
                            >
                              {item.productName}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                          {specificationSummary && (
                            <p className="mt-1 text-[11px] leading-4 text-gray-500 line-clamp-2">{specificationSummary}</p>
                          )}
                        </div>
                        <div className="col-span-1 flex justify-center">
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
                        <div className="col-span-1 flex justify-center">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-14 h-7 text-center text-sm"
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {item.isCustom ? (
                            <span className="text-xs text-gray-300">—</span>
                          ) : (
                          <input
                            type="text"
                            inputMode="decimal"
                            title="Adicione (+) ou desconte (-) um valor do total"
                            defaultValue={item.priceAdjustment ? (item.priceAdjustment > 0 ? `+${item.priceAdjustment.toFixed(2).replace(".", ",")}` : item.priceAdjustment.toFixed(2).replace(".", ",")) : ""}
                            placeholder="R$ 0,00"
                            onBlur={(e) => {
                              const raw = e.target.value.replace(/[R$\s]/g, "").replace(",", ".");
                              const val = parseFloat(raw);
                              updateItem(idx, { priceAdjustment: isNaN(val) ? 0 : val });
                              e.target.value = isNaN(val) || val === 0 ? "" : (val > 0 ? `+R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : `-R$ ${Math.abs(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            onChange={(e) => {
                              clearTimeout((e.target as any)._ajusteTimer);
                              (e.target as any)._ajusteTimer = setTimeout(() => (e.target as HTMLInputElement).blur(), 500);
                            }}
                            className="w-28 h-7 text-center text-sm border border-input rounded-md px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                          )}
                        </div>
                        <div className="col-span-3 text-right text-sm font-semibold text-gray-800">
                          {item.isCustom ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`Valor total de ${item.productName || "item personalizado"}`}
                              title="Defina livremente o valor total do item personalizado"
                              defaultValue={item.totalPrice > 0 ? fmt(item.totalPrice) : ""}
                              placeholder="R$ 0,00"
                              onBlur={(e) => {
                                const raw = e.target.value.replace(/[^0-9,.-]/g, "").replace(",", ".");
                                const value = Math.max(0, parseFloat(raw) || 0);
                                updateItem(idx, { unitPrice: value / Math.max(1, item.quantity), priceAdjustment: 0 });
                                e.target.value = value > 0 ? fmt(value) : "";
                              }}
                              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                              className="w-28 h-7 text-right text-sm font-semibold border border-input rounded-md px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-pink-400"
                            />
                          ) : fmt(item.totalPrice)}
                        </div>
                        <div className="col-span-1 flex justify-end">
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
                          </div>
                        );
                      })()}
                    </div>
                  );
                    })}
                  </div>
                )}
                {items.some((item) => item.isCustom) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-px flex-1 bg-pink-100" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-pink-600">Itens personalizados</span>
                      <div className="h-px flex-1 bg-pink-100" />
                    </div>
                    {items.map((item, idx) => item.isCustom ? renderCustomItemCard(item, idx) : null)}
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
                  <label className="text-xs text-gray-500 font-medium">Endereço de entrega</label>
                  <Textarea
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
                <label className="text-xs text-gray-500 font-medium">Forma de pagamento</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-0.5 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Prazo de produção (dias)</label>
                <Input
                  type="number"
                  min={0}
                  value={productionDeadline}
                  onChange={(e) => setProductionDeadline(parseInt(e.target.value) || 0)}
                  className="mt-0.5 h-9"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Validade do orçamento (dias)</label>
                <Input
                  type="number"
                  min={1}
                  value={quotationValidity}
                  onChange={(e) => setQuotationValidity(parseInt(e.target.value) || 30)}
                  className="mt-0.5 h-9"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium">Observações comerciais</label>
                <Textarea
                  value={commercialNotes}
                  onChange={(e) => setCommercialNotes(e.target.value)}
                  className="mt-0.5 text-sm"
                  rows={3}
                  placeholder="Condições especiais, prazo de pagamento, informações adicionais..."
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
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixo">R$ fixo</SelectItem>
                      <SelectItem value="percentual">% percentual</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
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
                  <label className="text-xs text-gray-500 font-medium">Acerto Total</label>
                  {acertoValue > 0 && (
                    <button className="text-xs text-gray-400 hover:text-red-500 underline" onClick={() => setAcertoTotal("")}>
                      Limpar
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={acertoTotal}
                  onChange={(e) => setAcertoTotal(e.target.value)}
                  className="h-8 text-sm"
                  placeholder={`Calculado: ${fmt(calculatedTotal)}`}
                />
                {acertoValue > 0 && (
                  <p className="text-xs text-amber-600 mt-0.5">⚠ Valor manual sobrepõe o cálculo automático</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between items-center bg-pink-600 text-white rounded-lg px-4 py-3">
                  <span className="font-semibold">TOTAL</span>
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
              >
                <Send className="w-4 h-4" />
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar e Enviar"}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleSave(true)}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="w-4 h-4" />
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
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Produto ao Orçamento</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-pink-200 bg-pink-50/50 text-left hover:bg-pink-50 transition-colors"
            onClick={addCustomItemToQuote}
          >
            <div className="w-10 h-10 rounded bg-pink-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-pink-800">Adicionar item personalizado</p>
              <p className="text-xs text-pink-600">Para serviços ou produtos que não estão no catálogo</p>
            </div>
          </button>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
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
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="Arte" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
