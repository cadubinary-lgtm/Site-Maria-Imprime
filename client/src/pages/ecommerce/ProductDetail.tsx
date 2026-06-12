import { useState, useEffect, useMemo, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import {
  Loader2, Upload, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Star, Shield,
  Package, ChevronDown, ChevronUp, Link2, Search,
  ShoppingCart, FileText, MessageCircle,
  ShieldCheck, Droplets, Scissors, LayoutGrid,
  Factory, Truck, CreditCard, HeadphonesIcon,
  Home, Clock, Tag, ThumbsUp,
  Store, Zap, Lightbulb,
  AlertTriangle, CheckSquare
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { processRules, generateInitialState } from "@/lib/attributes-engine";
import { exportBudgetPDFWithValidation } from "@/lib/export-budget-pdf";

// ─── Tipos de frete dinâmico ─────────────────────────────────────────────────
interface ShippingQuote {
  id: string | number;
  name: string;
  company: string;
  logoUrl?: string | null;
  price: number;
  deliveryDays: number;
  isFixed?: boolean;
  fixedType?: string;
}

const PRODUCT_FEATURES = [
  { Icon: ShieldCheck, bg: "bg-green-50",  color: "text-green-600",  label: "Alta resistência",        desc: "Material resistente ao sol e chuva" },
  { Icon: Droplets,   bg: "bg-blue-50",   color: "text-blue-600",   label: "Cores vivas",             desc: "Impressão digital de alta definição" },
  { Icon: Scissors,   bg: "bg-orange-50", color: "text-orange-600", label: "Acabamento profissional", desc: "Diversas opções de acabamento" },
  { Icon: LayoutGrid, bg: "bg-purple-50", color: "text-purple-600", label: "Uso versátil",            desc: "Eventos, fachadas, promoções e muito mais" },
];

const COMPANY_DIFFERENTIALS = [
  { Icon: Factory,         bg: "bg-orange-50", color: "text-orange-500", label: "Produção própria",        desc: "Qualidade garantida" },
  { Icon: Truck,           bg: "bg-orange-50", color: "text-orange-500", label: "Entrega para todo Brasil", desc: "Enviamos para sua cidade" },
  { Icon: CreditCard,      bg: "bg-orange-50", color: "text-orange-500", label: "Pagamento facilitado",    desc: "PIX, Boleto ou Cartão" },
  { Icon: HeadphonesIcon,  bg: "bg-orange-50", color: "text-orange-500", label: "Atendimento humanizado",  desc: "Suporte rápido via WhatsApp" },
];

const FOOTER_BADGES = [
  { Icon: Home,     bg: "bg-orange-50", color: "text-orange-500", label: "Qualidade garantida",      desc: "Impressão de alta definição" },
  { Icon: Clock,    bg: "bg-orange-50", color: "text-orange-500", label: "Melhor prazo do mercado",  desc: "Produção rápida e eficiente" },
  { Icon: Tag,      bg: "bg-orange-50", color: "text-orange-500", label: "Preço justo",              desc: "Melhor custo-benefício" },
  { Icon: ThumbsUp, bg: "bg-orange-50", color: "text-orange-500", label: "Satisfação garantida",     desc: "Ou seu dinheiro de volta" },
];

// ─── Accordion ──────────────────────────────────────────────────────────────
function AccordionStep({
  id, number, title, isOpen, onToggle, children,
}: {
  id?: string; number: number; title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div id={id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </div>
        <span className="flex-1 font-semibold text-gray-800 text-sm">{title}</span>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  // Galeria
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Configuração
  const [quantity, setQuantity] = useState(1);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [artFilePreview, setArtFilePreview] = useState<string | null>(null);
  const [artLink, setArtLink] = useState("");
  const [fileMode, setFileMode] = useState<"upload" | "link">("upload");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, { valueIds: number[]; customValue?: string }>>({})
  const [selectedVariations, setSelectedVariations] = useState<Record<number, number>>({}) // variationTypeId -> optionId;
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);
  const [deliveryTax, setDeliveryTax] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Medidas
  const [dimWidth, setDimWidth] = useState("");
  const [dimHeight, setDimHeight] = useState("");

  // Acordeão
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({ 0: true });

  // Frete dinâmico
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepAddress, setCepAddress] = useState<string | null>(null);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [shippingCalculated, setShippingCalculated] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<ShippingQuote | null>(null);
  const calculateShippingMutation = trpc.logistics.shipping.calculate.useMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // ─── Queries ────────────────────────────────────────────────────────────
  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId || 0 }, { enabled: !!productId }
  );
  const { data: productAttributes } = trpc.attributes.getProductAttributes.useQuery(
    productId || 0, { enabled: !!productId }
  );
  const { data: productRules } = trpc.attributes.getProductRules.useQuery(
    productId || 0, { enabled: !!productId }
  );
  const { data: deliveryOptions = [] } = trpc.deliveryOptions.getByProduct.useQuery(
    { productId: productId || 0 }, { enabled: !!productId }
  );
  const { data: variationTypes = [] } = trpc.variations.getByProduct.useQuery(
    { productId: productId || 0 }, { enabled: !!productId }
  );
  const addToCartMutation = trpc.cart.addItem.useMutation();

  // ─── Galeria ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!product) return;
    const imgs: string[] = [];
    if (product.imageUrl) imgs.push(product.imageUrl);
    try {
      if ((product as any).galleryUrls) {
        const parsed = JSON.parse((product as any).galleryUrls);
        if (Array.isArray(parsed)) imgs.push(...parsed);
      }
    } catch {}
    setGalleryImages(imgs);
    setCurrentImageIndex(0);
  }, [product]);

  // ─── Regras dinâmicas ────────────────────────────────────────────────────
  const attributeState = useMemo(() => {
    if (!productAttributes || !productRules) return null;
    const ids = productAttributes.map(pa => pa.attributeId);
    const init = generateInitialState(ids);
    const sel = new Map<number, any>();
    Object.entries(selectedAttributes).forEach(([id, s]) => {
      sel.set(Number(id), s.valueIds[0] ?? s.customValue);
    });
    return processRules(productRules as any, sel, init);
  }, [productAttributes, productRules, selectedAttributes]);

  const visibleAttributes = useMemo(() => {
    if (!productAttributes) return [];
    if (!attributeState) return productAttributes;
    return productAttributes.filter(pa => attributeState[pa.attributeId]?.visible !== false);
  }, [productAttributes, attributeState]);

  // ─── Preço ───────────────────────────────────────────────────────────────
  const basePrice = useMemo(() => {
    if (!product) return 0;
    let total = parseFloat(product.price);
    // Modificadores de variações (variationTypes/variationOptions)
    // O cálculo depende do calculationType da opção:
    // - unit: valor fixo por unidade (multiplicado pela quantidade no subtotal)
    // - m2: valor por m² (multiplicado pela billedArea)
    // - linear: valor por metro linear (largura em metros)
    // - package: valor fixo por pacote
    Object.entries(selectedVariations).forEach(([vtypeId, optId]) => {
      const vtype = variationTypes.find((vt: any) => vt.id === Number(vtypeId));
      const opt = vtype?.options?.find((o: any) => o.id === optId);
      if (!opt) return;
      const modifier = parseFloat(opt.priceModifier?.toString() ?? "0");
      const calcType = opt.calculationType || "unit";
      const w = parseFloat(dimWidth.replace(",", ".")) || 0;
      const h = parseFloat(dimHeight.replace(",", ".")) || 0;
      const areaM2 = Math.max(w * h, (w > 0 && h > 0) ? 1 : 0); // m² mínimo 1
      const linearM = w / 100; // cm -> metros
      if (calcType === "m2") {
        total += modifier * (areaM2 > 0 ? areaM2 : 1);
      } else if (calcType === "linear") {
        total += modifier * (linearM > 0 ? linearM : 1);
      } else {
        // unit ou package: valor fixo
        total += modifier;
      }
    });
    // Modificadores de atributos
    Object.entries(selectedAttributes).forEach(([attrId, sel]) => {
      const attr = productAttributes?.find(pa => pa.attributeId === Number(attrId));
      sel.valueIds.forEach(vid => {
        const v = attr?.values.find(v => v.id === vid);
        if (v) total += parseFloat(v.priceModifier?.toString() ?? "0");
      });
    });
    // Modificadores de prazo
    if (selectedDeliveryOption) total += deliveryTax;
    return Math.max(0, total);
  }, [product, selectedVariations, variationTypes, selectedAttributes, productAttributes, selectedDeliveryOption, deliveryTax, dimWidth, dimHeight]);

  const area = useMemo(() => {
    const w = parseFloat(dimWidth.replace(",", "."));
    const h = parseFloat(dimHeight.replace(",", "."));
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) return w * h;
    return 0;
  }, [dimWidth, dimHeight]);

  const isM2 = product?.calculationType === "m2";
  // Área mínima cobrada: sempre 1 m² (mesmo que o cliente informe menos)
  const billedArea = useMemo(() => Math.max(area, area > 0 ? 1 : 0), [area]);
  const effectivePrice = useMemo(() => {
    if (!product) return 0;
    if (isM2 && billedArea > 0 && product?.pricePerM2) {
      // Preço base do produto (m² * preço/m²)
      const productBase = parseFloat(product.pricePerM2 as any) * billedArea;
      // Modificadores de variações (calculados separadamente para não duplicar)
      let varModifiers = 0;
      Object.entries(selectedVariations).forEach(([vtypeId, optId]) => {
        const vtype = (variationTypes as any[])?.find((vt: any) => vt.id === Number(vtypeId));
        const opt = vtype?.options?.find((o: any) => o.id === optId);
        if (!opt) return;
        const modifier = parseFloat(opt.priceModifier?.toString() ?? "0");
        const calcType = opt.calculationType || "unit";
        const w = parseFloat(dimWidth.replace(",", ".")) || 0;
        const h = parseFloat(dimHeight.replace(",", ".")) || 0;
        const areaM2 = Math.max(w * h, (w > 0 && h > 0) ? 1 : 0);
        const linearM = w / 100;
        if (calcType === "m2") {
          varModifiers += modifier * (areaM2 > 0 ? areaM2 : 1);
        } else if (calcType === "linear") {
          varModifiers += modifier * (linearM > 0 ? linearM : 1);
        } else {
          varModifiers += modifier;
        }
      });
      // Modificadores de atributos
      let attrModifiers = 0;
      Object.entries(selectedAttributes).forEach(([attrId, sel]) => {
        const attr = productAttributes?.find(pa => pa.attributeId === Number(attrId));
        (sel as any).valueIds.forEach((vid: number) => {
          const v = attr?.values.find((v: any) => v.id === vid);
          if (v) attrModifiers += parseFloat(v.priceModifier?.toString() ?? "0");
        });
      });
      // Modificadores de prazo
      const prazoMod = selectedDeliveryOption ? deliveryTax : 0;
      return Math.max(0, productBase + varModifiers + attrModifiers + prazoMod);
    }
    return basePrice;
  }, [isM2, billedArea, product, basePrice, selectedVariations, variationTypes, selectedAttributes, productAttributes, selectedDeliveryOption, deliveryTax, dimWidth, dimHeight]);

  const fretePrice = selectedShipping?.price ?? 0;
  const subtotal = effectivePrice * quantity;
  const total = subtotal + fretePrice + (selectedDeliveryOption?.priceModifier ?? 0);

  // ─── Validação de campos obrigatórios ────────────────────────────────────
  const missingFields = useMemo(() => {
    const missing: { id: string; message: string }[] = [];
    
    // 1. Variações obrigatórias
    (variationTypes ?? []).forEach((vt, idx) => {
      if (!selectedVariations[vt.id]) missing.push({ id: `var-${vt.id}`, message: `Selecione ${vt.name}` });
    });
    
    // 2. Atributos obrigatórios
    (visibleAttributes ?? []).forEach(attr => {
      if (attr.isRequired && !selectedAttributes[attr.attributeId]) {
        missing.push({ id: `attr-${attr.attributeId}`, message: `Preencha ${attr.attribute?.name}` });
      }
    });
    
    // 3. Medidas (se m²)
    if (isM2 && area === 0) missing.push({ id: "dimensions", message: "Informe as medidas (Largura e Altura)" });
    
    // 4. Arquivo
    if (fileMode === "upload" && !artFile) missing.push({ id: "file-upload", message: "Envie um arquivo de arte" });
    if (fileMode === "link" && !artLink) missing.push({ id: "file-link", message: "Informe o link do arquivo" });
    
    // 5. Prazo de produção
    if (!selectedDeliveryOption) missing.push({ id: "prazo", message: "Selecione o prazo de produção" });
    
    // 6. Termos
    if (!acceptedTerms) missing.push({ id: "terms", message: "Aceite os termos e condições" });
    
    return missing;
  }, [variationTypes, selectedVariations, visibleAttributes, selectedAttributes, isM2, area, fileMode, artFile, artLink, selectedDeliveryOption, acceptedTerms]);

  const canAddToCart = missingFields.length === 0;

  // ─── Função para rolar até o campo correspondente ──────────────────────────
  const scrollToField = (fieldId: string) => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus({ preventScroll: true });
    }
  };

  // ─── Atributos selecionados para resumo ──────────────────────────────────
  const selectedAttrsForSummary = useMemo(() => {
    return Object.entries(selectedAttributes)
      .map(([attrId, sel]) => {
        const attr = productAttributes?.find(pa => pa.attributeId === Number(attrId));
        if (!attr) return null;
        const val = attr.values.find(v => v.id === sel.valueIds[0]);
        return {
          name: attr.attribute?.name ?? "Atributo",
          value: val?.value ?? sel.customValue ?? "",
          priceModifier: parseFloat(val?.priceModifier?.toString() ?? "0"),
        };
      })
      .filter(Boolean) as { name: string; value: string; priceModifier: number }[];
  }, [selectedAttributes, productAttributes]);

  // ─── Arquivo ─────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 100MB)"); return; }
    setArtFile(file);
    if (file.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = ev => setArtFilePreview(ev.target?.result as string);
      r.readAsDataURL(file);
    } else setArtFilePreview(null);
  };

  // ─── CEP ─────────────────────────────────────────────────────────────────
  const handleCepSearch = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) { setCepError("CEP deve ter 8 dígitos"); return; }
    setCepLoading(true); setCepError(null); setCepAddress(null);
    setShippingQuotes([]); setShippingCalculated(false); setSelectedShipping(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const d = await res.json();
      if (d.erro) { setCepError("CEP não encontrado"); return; }
      setCepAddress(`${d.logradouro ? d.logradouro + ", " : ""}${d.bairro ? d.bairro + " — " : ""}${d.localidade}/${d.uf}`);
      // Calcular fretes via backend (Retirada + Local + Melhor Envio)
      const quotes = await calculateShippingMutation.mutateAsync({
        destinationCep: clean,
        weight: 1,
        height: 5,
        width: 30,
        length: 40,
      });
      const typedQuotes = quotes as ShippingQuote[];
      setShippingQuotes(typedQuotes);
      setShippingCalculated(true);
      // Pré-selecionar Retirar na Loja por padrão
      const pickup = typedQuotes.find(q => q.fixedType === "pickup");
      if (pickup) setSelectedShipping(pickup);
    } catch { setCepError("Erro ao calcular frete. Tente novamente."); }
    finally { setCepLoading(false); }
  };

  // ─── Add to Cart ─────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!product || !productId) return;
    if (!acceptedTerms) { setValidationError("Aceite os termos para continuar"); return; }
    setValidationError(null);
    setIsProcessing(true);
    try {
      const attrsJson = Object.keys(selectedAttributes).length > 0
        ? JSON.stringify(Object.fromEntries(
            Object.entries(selectedAttributes).map(([attrId, sel]) => {
              const attr = productAttributes?.find(pa => pa.attributeId === Number(attrId));
              const val = attr?.values.find(v => v.id === sel.valueIds[0]);
              return [attr?.attribute?.name ?? attrId, val?.value ?? sel.customValue ?? ""];
            })
          ))
        : undefined;

      let artUrl: string | undefined = fileMode === "link" ? artLink || undefined : undefined;
      if (artFile && fileMode === "upload") {
        toast.loading("Enviando arquivo...", { id: "upload" });
        const fd = new FormData(); fd.append("file", artFile);
        const r = await fetch("/api/upload-art", { method: "POST", body: fd });
        toast.dismiss("upload");
        if (!r.ok) throw new Error((await r.json()).error ?? "Erro no upload");
        artUrl = (await r.json()).url;
      }

      const shippingId = selectedShipping ? String(selectedShipping.id) : "retirada";
      const shippingPrice = selectedShipping?.price ?? 0;
      const shippingLabel = selectedShipping
        ? `${selectedShipping.company} — ${selectedShipping.name}`
        : "Retirar na Loja";
      const combinedNotes = notes || undefined;

      await addToCartMutation.mutateAsync({
        productId, quantity,
        selectedAttributes: attrsJson,
        priceAtCart: effectivePrice,
        notes: combinedNotes,
        artFileUrl: artUrl,
        shippingMethod: shippingId,
        shippingPrice,
        shippingLabel,
      });
      toast.success("Adicionado ao carrinho!", {
        action: { label: "Ver Carrinho", onClick: () => setLocation("/carrinho") },
      });
    } catch { toast.error("Erro ao adicionar ao carrinho"); }
    finally { setIsProcessing(false); }
  };

  // ─── Export Budget ────────────────────────────────────────────────────────
  const handleExportBudget = async () => {
    if (!product) return;
    setIsExporting(true);
    try {
      await exportBudgetPDFWithValidation({
        productName: product.name,
        productDescription: product.description || undefined,
        basePrice: parseFloat(product.price),
        selectedAttributes: selectedAttrsForSummary,
        quantity,
        finalPrice: total,
        deadline: selectedDeliveryOption?.name ?? "5 dias úteis",
        notes,
        customerName: "Cliente",
        companyName: "Gráfica Ponto Digital",
      });
      toast.success("Orçamento exportado!");
    } catch { toast.error("Erro ao exportar orçamento"); }
    finally { setIsExporting(false); }
  };

  const toggleStep = (idx: number) =>
    setOpenSteps(prev => ({ ...prev, [idx]: !prev[idx] }));

  // ─── Loading / Not Found ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="w-5 h-5" />
          <p>Produto não encontrado</p>
        </div>
        <Link href="/catalogo">
          <Button variant="outline">Voltar ao Catálogo</Button>
        </Link>
      </div>
    );
  }

  // Número de steps — combina variações + atributos
  const varCount = variationTypes?.length ?? 0;
  const attrCount = (visibleAttributes?.length ?? 0) + varCount;
  const dimStepIdx = attrCount;       // Medidas (se m²)
  const fileStepIdx = attrCount + (isM2 ? 1 : 0);
  const prazoStepIdx = fileStepIdx + 1;  // Prazo de produção
  const deliveryStepIdx = prazoStepIdx + 1;

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-[1280px] mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-orange-500">Início</Link>
          <span>/</span>
          <Link href="/catalogo" className="hover:text-orange-500">Catálogo</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-6 items-start">

          {/* ═══════════════════════════════════════════════════════════════
              COLUNA ESQUERDA — Galeria + Info
          ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">

            {/* Foto principal */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative" style={{ aspectRatio: "4/3" }}>
                {galleryImages.length > 0 ? (
                  <>
                    <img
                      src={galleryImages[currentImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(p => (p - 1 + galleryImages.length) % galleryImages.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-md"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(p => (p + 1) % galleryImages.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-md"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-700" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Miniaturas */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {galleryImages.slice(0, 5).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex
                          ? "border-orange-500"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nome, badge, avaliações, descrição, features */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-orange-500" /> Mais vendido
              </span>
              <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                ))}
                <span className="text-sm text-gray-500 ml-1">4,9 (248 avaliações)</span>
              </div>
              {product.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              )}

              <div className="space-y-3 pt-1">
                {PRODUCT_FEATURES.map(({ Icon, bg, color, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <p className="text-sm text-gray-500 mb-1">Dúvidas sobre o produto?</p>
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 py-1 select-none list-none">
                    Ver especificações técnicas
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <p><span className="font-medium">Cálculo:</span> {product.calculationType === "m2" ? "Por m²" : product.calculationType === "metro_linear" ? "Metro linear" : product.calculationType === "pacote" ? "Pacote" : "Unidade"}</p>
                    {product.unit && <p><span className="font-medium">Unidade:</span> {product.unit}</p>}
                    {product.category && <p><span className="font-medium">Categoria:</span> {product.category}</p>}
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              COLUNA CENTRAL — Configurador
          ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-3">

            {/* Cabeçalho do configurador */}
            <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Configure seu produto</h2>
              <p className="text-sm text-gray-500 mt-0.5">Escolha as opções abaixo e veja o preço atualizado</p>

              {/* Alerta de campos obrigatórios */}
              {visibleAttributes && visibleAttributes.some(a => a.isRequired && !selectedAttributes[a.attributeId]) && (
                <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <p className="text-xs text-orange-700">Preencha todas as opções obrigatórias para continuar</p>
                </div>
              )}
            </div>

            {/* ── Variações em acordeão (sistema variationTypes) ── */}
            {(variationTypes ?? []).map((vtype: any, idx: number) => {
              const selOptId = selectedVariations[vtype.id];
              return (
                <AccordionStep
                  key={`vtype-${vtype.id}`}
                  id={`var-${vtype.id}`}
                  number={idx + 1}
                  title={vtype.name}
                  isOpen={!!openSteps[idx]}
                  onToggle={() => toggleStep(idx)}
                >
                  <div className="space-y-2 mt-2">
                    {(vtype.options ?? []).map((opt: any) => {
                      const isSel = selOptId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariations(prev => ({ ...prev, [vtype.id]: opt.id }));
                            setOpenSteps(prev => ({ ...prev, [idx]: false, [idx + 1]: true }));
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                            isSel
                              ? "border-orange-500 bg-orange-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSel ? "border-orange-500" : "border-gray-300"
                          }`}>
                            {isSel && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-tight ${isSel ? "text-orange-700" : "text-gray-800"}`}>
                              {opt.name}
                            </p>
                            {opt.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                            )}
                          </div>
                          {parseFloat(opt.priceModifier?.toString() ?? "0") > 0 && (
                            <span className="text-xs font-semibold text-green-600 flex-shrink-0">
                              +R$ {parseFloat(opt.priceModifier.toString()).toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {(vtype.options ?? []).length === 0 && (
                      <p className="text-sm text-gray-400 italic">Nenhuma opção cadastrada para esta variação.</p>
                    )}
                  </div>
                </AccordionStep>
              );
            })}

            {/* ── Atributos em acordeão (sistema productAttributes) ── */}
            {(visibleAttributes ?? []).map((attr, idx) => {
              const globalIdx = varCount + idx; // continua numeração após variações
              const selVal = selectedAttributes[attr.attributeId];
              return (
                <AccordionStep
                  key={attr.attributeId}
                  id={`attr-${attr.attributeId}`}
                  number={globalIdx + 1}
                  title={attr.attribute?.name ?? `Atributo ${globalIdx + 1}`}
                  isOpen={!!openSteps[globalIdx]}
                  onToggle={() => toggleStep(globalIdx)}
                >
                  <div className="space-y-2 mt-2">
                    {attr.values.map(val => {
                      const isSel = selVal?.valueIds.includes(val.id);
                      return (
                        <button
                          key={val.id}
                          type="button"
                          onClick={() => {
                            setSelectedAttributes(prev => ({ ...prev, [attr.attributeId]: { valueIds: [val.id] } }));
                            setOpenSteps(prev => ({ ...prev, [globalIdx]: false, [globalIdx + 1]: true }));
                            // Smooth scroll para o próximo step
                            setTimeout(() => {
                              const nextStep = document.getElementById(`attr-${attr.attributeId}`)?.nextElementSibling;
                              if (nextStep) {
                                nextStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                            isSel
                              ? "border-orange-500 bg-orange-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSel ? "border-orange-500" : "border-gray-300"
                          }`}>
                            {isSel && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-tight ${isSel ? "text-orange-700" : "text-gray-800"}`}>
                              {val.value}
                            </p>
                            {(val as any).description && (
                              <p className="text-xs text-gray-500 mt-0.5">{(val as any).description}</p>
                            )}
                          </div>
                          {parseFloat(val.priceModifier?.toString() ?? "0") > 0 && (
                            <span className="text-xs font-semibold text-green-600 flex-shrink-0">
                              +R$ {parseFloat(val.priceModifier.toString()).toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </AccordionStep>
              );
            })}

            {/* ── Medidas (m²) ── */}
            {isM2 && (
              <AccordionStep
                id="dimensions"
                number={dimStepIdx + 1}
                title="Medidas (cm)"
                isOpen={!!openSteps[dimStepIdx]}
                onToggle={() => toggleStep(dimStepIdx)}
              >
                <div className="mt-3 space-y-4">
                  <div className="grid grid-cols-3 gap-3 items-start">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block">Largura (cm)</Label>
                      <Input
                        type="number"
                        placeholder="0,00"
                        min="0"
                        value={dimWidth}
                        onChange={e => setDimWidth(e.target.value)}
                        className="font-semibold text-base h-12 border-gray-200"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block">Altura (cm)</Label>
                      <Input
                        type="number"
                        placeholder="0,00"
                        min="0"
                        value={dimHeight}
                        onChange={e => setDimHeight(e.target.value)}
                        className="font-semibold text-base h-12 border-gray-200"
                      />
                    </div>
                    {area > 0 && (
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 mb-0.5">Área total</p>
                        <p className="text-xl font-bold text-orange-500">{billedArea.toFixed(2)} m²</p>
                        <p className="text-xs text-gray-400">{dimWidth} x {dimHeight} cm</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-blue-700">A área mínima cobrada é de 1 m²</p>
                  </div>

                  {area > 0 && (
                    <button
                      type="button"
                      onClick={() => setOpenSteps(prev => ({ ...prev, [dimStepIdx]: false, [fileStepIdx]: true }))}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar medidas
                    </button>
                  )}
                </div>
              </AccordionStep>
            )}

            {/* ── Enviar Arquivo ── */}
            <AccordionStep
              id="file-upload"
              number={fileStepIdx + 1}
              title="Enviar Arquivo"
              isOpen={!!openSteps[fileStepIdx]}
              onToggle={() => toggleStep(fileStepIdx)}
            >
              <div className="mt-3 space-y-3">
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFileMode("upload")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      fileMode === "upload"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-orange-300"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload de arquivo
                    <span className="text-xs text-gray-400 block leading-tight">Envie do seu dispositivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileMode("link")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      fileMode === "link"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-orange-300"
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                    Link da arte
                    <span className="text-xs text-gray-400 block leading-tight">Cole o link da sua arte</span>
                  </button>
                </div>

                {fileMode === "upload" && (
                  <>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/20 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 font-medium">Arraste seu arquivo aqui ou clique para selecionar</p>
                      <p className="text-xs text-gray-400 mt-1">Formatos aceitos: PDF, PNG, JPG, TIFF, AI, CDR</p>
                      <p className="text-xs text-gray-400">Tamanho máximo: 100MB</p>
                      <button
                        type="button"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <FileText className="w-4 h-4" />
                        Selecionar arquivo
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.ai,.cdr,.psd,.eps,.jpg,.jpeg,.png,.tiff,.tif,.svg"
                      onChange={handleFileChange}
                    />

                    {artFile && (
                      <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                        {artFilePreview
                          ? <img src={artFilePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-green-200" />
                          : <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-8 h-8 text-green-600" />
                            </div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-green-800 truncate">{artFile.name}</p>
                          <p className="text-xs text-green-600 mt-0.5">{(artFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">Arquivo selecionado</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => { setArtFile(null); setArtFilePreview(null); }} className="text-gray-400 hover:text-red-500">✕</button>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>Dica: Use arquivos em alta resolução para melhor qualidade de impressão.</span>
                    </div>
                  </>
                )}

                {fileMode === "link" && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700 mb-3">Cole o link da sua arte</p>
                      <Input
                        type="url"
                        placeholder="https://exemplo.com/sua-arte.pdf"
                        value={artLink}
                        onChange={e => setArtLink(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Aceitamos links do Google Drive, Dropbox, OneDrive, WeTransfer, Canva, ChatGPT e outros.</p>
                    {artLink && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700">Link adicionado</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>Dica: Use arquivos em alta resolução para melhor qualidade de impressão.</span>
                    </div>
                  </div>
                )}

                {/* Botão confirmar arquivo */}
                {(artFile || artLink) && (
                  <button
                    type="button"
                    onClick={() => setOpenSteps(prev => ({ ...prev, [fileStepIdx]: false, [prazoStepIdx]: true }))}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar arquivo
                  </button>
                )}
              </div>
            </AccordionStep>

            {/* ── Prazo de Produção ── */}
            {deliveryOptions && deliveryOptions.length > 0 && (
            <AccordionStep
              id="prazo"
              number={prazoStepIdx + 1}
              title="Prazo de produção"
              isOpen={!!openSteps[prazoStepIdx]}
              onToggle={() => toggleStep(prazoStepIdx)}
            >
                <div className="mt-3 space-y-2">
                  {deliveryOptions.map((opt: any) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedDeliveryOption(opt);
                        const extra = isM2 && area > 0
                          ? (opt.pricePerM2 ?? 0) * billedArea
                          : (opt.pricePerM2 ?? 0);
                        setDeliveryTax(extra);
                        setOpenSteps(prev => ({ ...prev, [prazoStepIdx]: false, [deliveryStepIdx]: true }));
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                        selectedDeliveryOption?.id === opt.id
                          ? "border-orange-500 bg-orange-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedDeliveryOption?.id === opt.id ? "border-orange-500" : "border-gray-300"
                        }`}>
                          {selectedDeliveryOption?.id === opt.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                        </div>
                        <div className="text-left">
                          <span className={`font-medium block ${
                            selectedDeliveryOption?.id === opt.id ? "text-orange-700" : "text-gray-800"
                          }`}>
                            {opt.name}
                          </span>
                          {opt.daysToDeliver > 0 && (
                            <span className="text-xs text-gray-400">
                              {opt.daysToDeliver === 1 ? "24 horas" : `${opt.daysToDeliver} dias úteis`}
                            </span>
                          )}
                        </div>
                      </div>
                      {(opt.pricePerM2 ?? 0) > 0 && (
                        <span className="text-green-600 font-semibold text-xs flex-shrink-0">
                          +R$ {((isM2 && billedArea > 0 ? billedArea : 1) * (opt.pricePerM2 ?? 0)).toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </AccordionStep>
            )}

            {/* ── Opções de Entrega ── */}
            <AccordionStep
              number={deliveryStepIdx + 1}
              title="Opções de Entrega"
              isOpen={!!openSteps[deliveryStepIdx]}
              onToggle={() => toggleStep(deliveryStepIdx)}
            >
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500 mb-3">Escolha como deseja receber seu pedido</p>

                {/* CEP */}
                <div className="flex gap-2 mb-4">
                  <Input
                    type="text"
                    placeholder="Digite seu CEP"
                    value={cep}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setCep(v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v);
                      setCepError(null); setCepAddress(null);
                    }}
                    onKeyDown={e => e.key === "Enter" && handleCepSearch()}
                    maxLength={9}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleCepSearch} disabled={cepLoading} className="flex-shrink-0">
                    {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {cepError && <p className="text-xs text-red-500 -mt-2 mb-2">{cepError}</p>}
                {cepAddress && <p className="text-xs text-green-600 -mt-2 mb-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{cepAddress}</p>}

                {/* Estado antes de calcular */}
                {!shippingCalculated && !cepLoading && (
                  <div className="text-center py-6 text-gray-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Digite seu CEP acima para ver as opções de entrega</p>
                  </div>
                )}

                {/* Calculando */}
                {(cepLoading || calculateShippingMutation.isPending) && (
                  <div className="text-center py-6 text-gray-400">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-orange-500" />
                    <p className="text-sm">Calculando opções de entrega...</p>
                  </div>
                )}

                {/* Opções calculadas */}
                {shippingCalculated && shippingQuotes.map(opt => {
                  const isSel = selectedShipping && String(selectedShipping.id) === String(opt.id);
                  // Soma de prazos: produção + frete
                  const productionDays = selectedDeliveryOption?.daysToDeliver ?? 0;
                  const totalDays = productionDays + (opt.deliveryDays ?? 0);
                  // Texto formatado do prazo total
                  const isLocal = opt.fixedType === 'local';
                  const isPickup = opt.fixedType === 'pickup';
                  const deadlineText = (() => {
                    if (isPickup) return null; // retirada não tem prazo de entrega
                    if (isLocal) {
                      if (totalDays === 0) return '🚀 Receba HOJE! (Entrega Local)';
                      if (totalDays === 1) return '⚡ Receba amanhã! (Entrega Local)';
                      return `Receba em ${totalDays} dias úteis (Entrega Local)`;
                    }
                    // Melhor Envio
                    if (totalDays === 0) return 'Receba hoje!';
                    if (totalDays === 1) return 'Receba amanhã!';
                    return `Receba em ${totalDays} dias úteis`;
                  })();
                  return (
                    <button
                      key={String(opt.id)}
                      type="button"
                      onClick={() => setSelectedShipping(opt)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        isSel
                          ? "border-orange-500 bg-orange-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSel ? "border-orange-500" : "border-gray-300"}`}>
                        {isSel && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                      </div>
                      <span className="flex-shrink-0 text-gray-500">
                        {isPickup && <Store className="w-4 h-4 text-green-600" />}
                        {isLocal && !isPickup && <Zap className="w-4 h-4 text-orange-500" />}
                        {!isPickup && !isLocal && <Truck className="w-4 h-4" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isSel ? "text-orange-700" : "text-gray-800"}`}>{opt.name}</p>
                        <p className="text-xs text-gray-500">{opt.company}</p>
                        {deadlineText && (
                          <p className={`text-xs font-medium mt-0.5 ${
                            totalDays === 0 ? 'text-green-600' :
                            totalDays === 1 ? 'text-orange-500' :
                            'text-gray-400'
                          }`}>{deadlineText}</p>
                        )}
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${isSel ? "text-orange-600" : "text-gray-700"}`}>
                        {opt.price === 0 ? <span className="text-green-600">Grátis</span> : `R$ ${opt.price.toFixed(2)}`}
                      </span>
                    </button>
                  );
                })}

                {shippingCalculated && shippingQuotes.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma opção disponível para este CEP.</p>
                )}

                {/* Botão confirmar entrega */}
                {shippingCalculated && selectedShipping && (
                  <button
                    type="button"
                    onClick={() => setOpenSteps(prev => ({ ...prev, [deliveryStepIdx]: false }))}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar entrega
                  </button>
                )}
              </div>
            </AccordionStep>

            {/* Termos */}
            <div id="terms" className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms-checkbox"
                  checked={acceptedTerms}
                  onCheckedChange={c => { setAcceptedTerms(c as boolean); if (c) setValidationError(null); }}
                />
                <Label htmlFor="terms-checkbox" className="text-sm cursor-pointer text-gray-700">
                  Aceito os termos e condições
                </Label>
              </div>
              {validationError && (
                <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{validationError}</p>
                </div>
              )}
            </div>

            {/* Footer badges */}
            <div className="grid grid-cols-4 gap-3">
              {FOOTER_BADGES.map(({ Icon, bg, color, label, desc }) => (
                <div key={label} className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                  <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              COLUNA DIREITA — Resumo do Pedido
          ═══════════════════════════════════════════════════════════════ */}
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Header do resumo */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-gray-900">Resumo do pedido</h3>
              </div>

              <div className="px-5 py-4 space-y-3">
                {/* Produto */}
                <div className="flex gap-3 pb-3 border-b border-gray-100">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                  )}
                  <div>
                    <p className="text-xs text-gray-400">Produto</p>
                    <p className="text-sm font-bold text-gray-900">{product.name}</p>
                  </div>
                </div>

                {/* Variações selecionadas (sistema variationTypes) */}
                {variationTypes && variationTypes.length > 0 && Object.keys(selectedVariations).length > 0 && (
                  <div className="space-y-2 pb-3 border-b border-gray-100">
                    {(variationTypes as any[]).map((vtype: any) => {
                      const selOptId = selectedVariations[vtype.id];
                      const selOpt = (vtype.options ?? []).find((o: any) => o.id === selOptId);
                      if (!selOpt) return null;
                      return (
                        <div key={vtype.id} className="flex justify-between text-sm">
                          <span className="text-gray-500">{vtype.name}</span>
                          <span className="font-medium text-gray-800 text-right max-w-[150px]">{selOpt.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Atributos selecionados dinamicamente */}
                {selectedAttrsForSummary.length > 0 && (
                  <div className="space-y-2 pb-3 border-b border-gray-100">
                    {selectedAttrsForSummary.map((a, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-500">{a.name}</span>
                        <span className="font-medium text-gray-800 text-right max-w-[150px]">{a.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Medidas */}
                {isM2 && area > 0 && (
                  <div className="pb-3 border-b border-gray-100 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Medidas</span>
                      <span className="font-medium text-gray-800">{dimWidth} × {dimHeight} cm</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Área total</span>
                      <span className="font-medium text-gray-800">{area.toFixed(2)} m²</span>
                    </div>
                  </div>
                )}

                {/* Prazo de produção selecionado */}
                {selectedDeliveryOption && (
                  <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                    <span className="text-gray-500">Prazo de produção</span>
                    <div className="text-right">
                      <span className="font-medium text-gray-800 block">{selectedDeliveryOption.name}</span>
                      {selectedDeliveryOption.daysToDeliver > 0 && (
                        <span className="text-xs text-gray-400">
                          {selectedDeliveryOption.daysToDeliver === 1 ? "24 horas" : `${selectedDeliveryOption.daysToDeliver} dias úteis`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Entrega */}
                <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                  <span className="text-gray-500">Entrega</span>
                  <span className={`font-medium ${fretePrice === 0 ? "text-green-600" : "text-gray-800"}`}>
                    {selectedShipping ? selectedShipping.name : "A calcular"} — {fretePrice === 0 ? "Grátis" : `R$ ${fretePrice.toFixed(2)}`}
                  </span>
                </div>

                {/* Totais */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Acréscimos</span>
                      <span className="font-medium text-green-600">+R$ {deliveryTax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Entrega</span>
                    <span className={`font-medium ${fretePrice === 0 ? "text-green-600" : ""}`}>
                      {fretePrice === 0 ? "Grátis" : `R$ ${fretePrice.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-orange-600">R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Segurança */}
                <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-green-800">Compra 100% segura</p>
                    <p className="text-xs text-green-600">Seus dados protegidos e compra garantida.</p>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="px-5 pb-5 space-y-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={isProcessing || !canAddToCart}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-base h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
                    : <><ShoppingCart className="w-4 h-4 mr-2" />Adicionar ao carrinho</>
                  }
                </Button>
                
                {/* Lista de campos pendentes */}
                {!canAddToCart && missingFields.length > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <p className="text-sm font-bold text-amber-900">Quase pronto! Complete os campos abaixo:</p>
                    </div>
                    <ul className="space-y-2">
                      {missingFields.map((field) => (
                        <li key={field.id} className="text-sm text-amber-800 flex items-start gap-3 pl-1 cursor-pointer hover:text-amber-900 transition-colors" onClick={() => scrollToField(field.id)}>
                          <CheckSquare className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug underline">{field.message}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-amber-700 mt-3 pt-3 border-t border-amber-200 italic">Após preencher todos os campos, o botão será ativado automaticamente.</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={handleExportBudget}
                  disabled={isExporting}
                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-xl h-12"
                >
                  {isExporting
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
                    : <><FileText className="w-4 h-4 mr-2" />Solicitar orçamento</>
                  }
                </Button>
                <a
                  href="https://wa.me/5522999459596?text=Olá! Preciso de ajuda com um produto."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Precisa de ajuda?</p>
                      <p className="text-xs text-gray-500">Fale com nosso especialista pelo WhatsApp</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>

            {/* Nossos Diferenciais */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-3">Nossos diferenciais</p>
              <div className="space-y-3">
                {COMPANY_DIFFERENTIALS.map(({ Icon, bg, color, label, desc }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


