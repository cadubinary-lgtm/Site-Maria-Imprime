import { useState, useEffect, useMemo, useRef } from "react";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
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
  Truck, CreditCard,
  Home, Clock, Tag, ThumbsUp,
  Store, Zap, Lightbulb,
  AlertTriangle, CheckSquare
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsAcceptance } from "@/components/TermsAcceptance";
import { processRules, generateInitialState } from "@/lib/attributes-engine";
import { useChunkedUpload } from "@/hooks/useChunkedUpload";
import { getCompanyWhatsAppMessage, getWhatsAppUrl, useCompanySettings, useWhatsAppButtonVisibility } from "@/hooks/useCompanySettings";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { exportBudgetPDFWithValidation } from "@/lib/export-budget-pdf";
import { getProductPaymentPrices } from "@/lib/productPrice";
import { getOrderTotal, getShippingSummary } from "@/lib/shipping-summary";
import { getProductRatingDisplay } from "@/lib/product-rating";
import { PENDING_FIELDS_NOTICE_MOTION } from "@/lib/pending-fields-notice";
import { formatProductionDeadlineSurcharge, getProductionDeadlineSurcharge } from "@/lib/production-deadline-pricing";
import { getProductSeoMetadata, getProductSeoScript } from "@shared/productSeo";

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

interface SelectedArtFile {
  id: string;
  file: File;
  preview: string | null;
}

const ART_ALLOWED_EXTENSIONS = ["pdf", "ai", "cdr", "psd", "eps", "jpg", "jpeg", "png", "tiff", "tif", "svg"];
const ART_MAX_FILE_SIZE = 100 * 1024 * 1024;

const PRODUCT_FEATURES = [
  { Icon: ShieldCheck, bg: "bg-green-50",  color: "text-green-600",  label: "Alta resistência",        desc: "Material resistente ao sol e chuva" },
  { Icon: Droplets,   bg: "bg-blue-50",   color: "text-blue-600",   label: "Cores vivas",             desc: "Impressão digital de alta definição" },
  { Icon: Scissors,   bg: "bg-orange-50", color: "text-orange-600", label: "Acabamento profissional", desc: "Diversas opções de acabamento" },
  { Icon: LayoutGrid, bg: "bg-orange-50", color: "text-orange-600", label: "Uso versátil",            desc: "Eventos, fachadas, promoções e muito mais" },
];

const FOOTER_BADGES = [
  { Icon: Home,     bg: "bg-orange-50", color: "text-orange-500", label: "Qualidade garantida",      desc: "Impressão de alta definição" },
  { Icon: Clock,    bg: "bg-orange-50", color: "text-orange-500", label: "Melhor prazo do mercado",  desc: "Produção rápida e eficiente" },
  { Icon: Tag,      bg: "bg-orange-50", color: "text-orange-500", label: "Preço justo",              desc: "Melhor custo-benefício" },
  { Icon: ThumbsUp, bg: "bg-orange-50", color: "text-orange-500", label: "Satisfação garantida",     desc: "Ou seu dinheiro de volta" },
];

// ─── Utilitários de data/prazo ─────────────────────────────────────────────
function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++; // pula sáb e dom
  }
  return result;
}

function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

// ─── Accordion ──────────────────────────────────────────────────────────────
function AccordionStep({
  id, number, title, isOpen, onToggle, children, summary,
}: {
  id?: string; number: number; title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode; summary?: string;
}) {
  const isCompleted = !isOpen && !!summary;
  return (
    <div id={id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors ${
          isCompleted ? 'bg-gray-200 text-gray-500' : 'text-white'
        }`}
          style={{ backgroundColor: isCompleted ? undefined : '#7DCCD8' }}
        >
          {number}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">{title}</span>
          {isCompleted && summary && (
            <span className="text-xs text-gray-500 truncate">— {summary}</span>
          )}
        </div>
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
  const { user } = useAuth();
  const { customer } = useCustomerAuth();
  const { company } = useCompanySettings();
  const showWhatsApp = useWhatsAppButtonVisibility(company);
  const isOperator = user?.role === "admin";
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  // Galeria
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Configuração
  const [quantity, setQuantity] = useState(1);
  const [artFiles, setArtFiles] = useState<SelectedArtFile[]>([]);
  const [artUploadMode, setArtUploadMode] = useState<"single" | "multiple">("single");
  const [artFilesConfirmed, setArtFilesConfirmed] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<{ current: number; total: number; completed: number; fileName: string } | null>(null);
  const [isArtDropActive, setIsArtDropActive] = useState(false);
  const [artUploadSuccess, setArtUploadSuccess] = useState<number | null>(null);
  const [artLink, setArtLink] = useState("");
  const [fileMode, setFileMode] = useState<"upload" | "link">("upload");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, { valueIds: number[]; customValue?: string }>>({})
  const [selectedVariations, setSelectedVariations] = useState<Record<number, number>>({}) // variationTypeId -> optionId;
  const [notes, setNotes] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"pix" | "cartao">("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);
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
  const [cutoffTime, setCutoffTime] = useState<string>('13:00');
  const [shippingLimitWarning, setShippingLimitWarning] = useState<string | null>(null);
  const calculateShippingMutation = trpc.logistics.shipping.calculate.useMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { openCart } = useCartDrawer();
  const utils = trpc.useUtils();
  const { state: uploadState, upload: doChunkedUpload, cancel: cancelUpload, reset: resetUpload } = useChunkedUpload();

  // ─── Queries ────────────────────────────────────────────────────────────
  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId || 0 }, { enabled: !!productId }
  );
  const priceAudience = customer?.priceTier === "reseller" ? "reseller" : "final";
  const paymentProductPrices = useMemo(
    () => product ? getProductPaymentPrices(product as any, priceAudience) : { pix: { value: 0, label: "R$ 0.00", suffix: "" }, card: { value: 0, label: "R$ 0.00", suffix: "" } },
    [product, priceAudience],
  );
  const commercialProductPrice = paymentProductPrices.pix.value;
  const commercialCardPrice = paymentProductPrices.card.value;
  const productRating = useMemo(
    () => getProductRatingDisplay({ rating: (product as any)?.rating, reviewCount: (product as any)?.reviewCount }),
    [product],
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

  useEffect(() => {
    if (!product) return;

    const seo = getProductSeoMetadata(product as any);
    const originalTitle = document.title;
    const restoreEntries: Array<{ node: Element; attribute: "content" | "href"; value: string | null }> = [];

    const updateMeta = (selector: string, content: string) => {
      const node = document.querySelector(selector);
      if (!node) return;
      restoreEntries.push({ node, attribute: "content", value: node.getAttribute("content") });
      node.setAttribute("content", content);
    };

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      restoreEntries.push({ node: canonical, attribute: "href", value: canonical.getAttribute("href") });
      canonical.setAttribute("href", seo.url);
    }

    document.title = seo.title;
    updateMeta('meta[name="description"]', seo.description);
    updateMeta('meta[name="keywords"]', seo.keywords);
    updateMeta('meta[property="og:type"]', "product");
    updateMeta('meta[property="og:title"]', seo.title);
    updateMeta('meta[property="og:description"]', seo.description);
    updateMeta('meta[property="og:url"]', seo.url);
    updateMeta('meta[property="og:image"]', seo.image);
    updateMeta('meta[property="og:image:secure_url"]', seo.image);
    updateMeta('meta[property="og:image:alt"]', seo.imageAlt);
    updateMeta('meta[name="twitter:title"]', seo.title);
    updateMeta('meta[name="twitter:description"]', seo.description);
    updateMeta('meta[name="twitter:image"]', seo.image);
    updateMeta('meta[name="twitter:image:alt"]', seo.imageAlt);

    const previousStructuredData = document.getElementById("product-seo-jsonld");
    const previousStructuredContent = previousStructuredData?.textContent ?? null;
    const structuredData = previousStructuredData ?? document.createElement("script");
    structuredData.id = "product-seo-jsonld";
    structuredData.setAttribute("type", "application/ld+json");
    structuredData.textContent = getProductSeoScript(seo.jsonLd);
    if (!previousStructuredData) document.head.appendChild(structuredData);

    return () => {
      document.title = originalTitle;
      restoreEntries.forEach(({ node, attribute, value }) => {
        if (value === null) node.removeAttribute(attribute);
        else node.setAttribute(attribute, value);
      });
      if (previousStructuredData) previousStructuredData.textContent = previousStructuredContent;
      else structuredData.remove();
    };
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
  const deadlineWidth = parseFloat(dimWidth.replace(",", ".")) || 0;
  const deadlineHeight = parseFloat(dimHeight.replace(",", ".")) || 0;
  const deadlineBilledArea = deadlineWidth > 0 && deadlineHeight > 0
    ? Math.max(deadlineWidth * deadlineHeight, 1)
    : 0;
  const deadlineLinearMeters = deadlineWidth > 0 ? deadlineWidth : 0;
  const deliveryTax = getProductionDeadlineSurcharge({
    rate: selectedDeliveryOption?.pricePerM2,
    calculationType: product?.calculationType,
    billedArea: deadlineBilledArea,
    linearMeters: deadlineLinearMeters,
  });

  const basePrice = useMemo(() => {
    if (!product) return 0;
    // Para m² e metro_linear, o preço base vem de pricePerM2 (calculado em effectivePrice)
    // Aqui só calculamos os modificadores de variações/atributos/prazo para não-m2
    const isM2Type = product.calculationType === "m2" || product.calculationType === "metro_linear";
    let total = isM2Type ? 0 : commercialProductPrice;
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
    if (selectedDeliveryOption && !isM2Type) total += deliveryTax;
    return Math.max(0, total);
  }, [product, commercialProductPrice, selectedVariations, variationTypes, selectedAttributes, productAttributes, selectedDeliveryOption, deliveryTax, dimWidth, dimHeight]);

  const area = useMemo(() => {
    const w = parseFloat(dimWidth.replace(",", "."));
    const h = parseFloat(dimHeight.replace(",", "."));
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) return w * h;
    return 0;
  }, [dimWidth, dimHeight]);

  const isM2 = product?.calculationType === "m2";
  const isMetroLinear = product?.calculationType === "metro_linear";
  // Área mínima cobrada: sempre 1 m² (mesmo que o cliente informe menos)
  const billedArea = useMemo(() => Math.max(area, area > 0 ? 1 : 0), [area]);
  const effectivePrice = useMemo(() => {
    if (!product) return 0;
    // Metro Linear: preço = pricePerM2 * largura (em metros)
    if (isMetroLinear && commercialProductPrice > 0) {
      const w = parseFloat(dimWidth.replace(",", ".")) || 0;
      const linearM = w > 0 ? w : 1; // metros lineares (largura em cm / 100 se necessário)
      const productBase = commercialProductPrice * linearM;
      let varModifiers = 0;
      Object.entries(selectedVariations).forEach(([vtypeId, optId]) => {
        const vtype = (variationTypes as any[])?.find((vt: any) => vt.id === Number(vtypeId));
        const opt = vtype?.options?.find((o: any) => o.id === optId);
        if (!opt) return;
        const modifier = parseFloat(opt.priceModifier?.toString() ?? "0");
        varModifiers += modifier;
      });
      let attrModifiers = 0;
      Object.entries(selectedAttributes).forEach(([attrId, sel]) => {
        const attr = productAttributes?.find(pa => pa.attributeId === Number(attrId));
        (sel as any).valueIds.forEach((vid: number) => {
          const v = attr?.values.find((v: any) => v.id === vid);
          if (v) attrModifiers += parseFloat(v.priceModifier?.toString() ?? "0");
        });
      });
      const prazoMod = selectedDeliveryOption ? deliveryTax : 0;
      return Math.max(0, productBase + varModifiers + attrModifiers + prazoMod);
    }
    if (isM2 && commercialProductPrice > 0) {
      // Antes de informar medidas, exibe o preço mínimo faturável de 1 m².
      // A validação continua exigindo largura e altura para permitir a compra.
      const chargeableArea = billedArea > 0 ? billedArea : 1;
      // Preço base do produto (m² * preço/m²)
      const productBase = commercialProductPrice * chargeableArea;
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
  }, [isM2, isMetroLinear, billedArea, commercialProductPrice, basePrice, selectedVariations, variationTypes, selectedAttributes, productAttributes, selectedDeliveryOption, deliveryTax, dimWidth, dimHeight]);

  const shippingSummary = getShippingSummary({ selectedShipping, shippingCalculated });
  const fretePrice = shippingSummary.amount;
  const paymentPriceMultiplier = useMemo(() => {
    if (isM2) return billedArea > 0 ? billedArea : 1;
    if (isMetroLinear) {
      const linearMeters = parseFloat(dimWidth.replace(",", ".")) || 0;
      return linearMeters > 0 ? linearMeters : 1;
    }
    return 1;
  }, [billedArea, dimWidth, isM2, isMetroLinear]);
  const cardEffectivePrice = Math.max(0, effectivePrice + (commercialCardPrice - commercialProductPrice) * paymentPriceMultiplier);
  const cardSubtotal = cardEffectivePrice * quantity;
  const cardTotal = getOrderTotal(cardSubtotal, fretePrice);
  const selectedUnitPrice = selectedPaymentMethod === "cartao" ? cardEffectivePrice : effectivePrice;
  const subtotal = selectedUnitPrice * quantity;
  const total = getOrderTotal(subtotal, fretePrice);

  // ─── Previsão de Entrega ─────────────────────────────────────────────
  const deliveryForecast = useMemo(() => {
    if (!selectedDeliveryOption) return null;
    const productionDays = Number(selectedDeliveryOption.daysToDeliver ?? 0);
    const isPickup = selectedShipping?.fixedType === 'pickup' || selectedShipping?.id === 'retirada';

    const today = new Date();
    // Considera prazo de produção em horas ou dias
    let productionDate: Date;
    if (selectedDeliveryOption.daysToDeliver === 1) {
      // 24 horas = 1 dia útil
      productionDate = addBusinessDays(today, 1);
    } else {
      productionDate = addBusinessDays(today, productionDays);
    }

    if (isPickup) {
      // Retirada na loja: apenas prazo de produção
      return {
        type: 'pickup' as const,
        date: productionDate,
        label: `Disponível para retirada: ${formatDeliveryDate(productionDate)}`,
        totalDays: productionDays,
      };
    }

    if (selectedShipping && selectedShipping.deliveryDays > 0) {
      // Entrega via transportadora: produção + transporte
      const shippingDays = Number(selectedShipping.deliveryDays ?? 0);
      const finalDate = addBusinessDays(productionDate, shippingDays);
      const totalDays = productionDays + shippingDays;
      return {
        type: 'shipping' as const,
        date: finalDate,
        label: `Previsão de entrega: ${formatDeliveryDate(finalDate)}`,
        productionDays,
        shippingDays,
        totalDays,
      };
    }

    // Selecionou transportadora mas sem deliveryDays (ex: entrega local)
    if (selectedShipping) {
      return {
        type: 'shipping' as const,
        date: productionDate,
        label: `Disponível após produção: ${formatDeliveryDate(productionDate)}`,
        productionDays,
        shippingDays: 0,
        totalDays: productionDays,
      };
    }

    return null;
  }, [selectedDeliveryOption, selectedShipping]);

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
    if (fileMode === "upload" && artFiles.length === 0) missing.push({ id: "file-upload", message: "Envie ao menos um arquivo de arte" });
    if (fileMode === "upload" && artFiles.length > 0 && !artFilesConfirmed) missing.push({ id: "file-upload", message: "Confirme os arquivos selecionados para continuar" });
    if (fileMode === "link" && !artLink) missing.push({ id: "file-link", message: "Informe o link do arquivo" });
    
    // 5. Prazo de produção
    if (!selectedDeliveryOption) missing.push({ id: "prazo", message: "Selecione o prazo de produção" });

    // 6. Entrega
    if (!selectedShipping) missing.push({ id: "delivery-options", message: "Selecione uma opção de entrega" });
    
    // 7. Termos
    if (!acceptedTerms) missing.push({ id: "terms", message: "Aceite os termos e condições" });
    
    return missing;
  }, [variationTypes, selectedVariations, visibleAttributes, selectedAttributes, isM2, area, fileMode, artFiles, artFilesConfirmed, artLink, selectedDeliveryOption, selectedShipping, acceptedTerms]);

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

  // ─── Auto-avanço: Medidas ──────────────────────────────────────────────
  const prevDimRef = useRef({ width: "", height: "" });
  useEffect(() => {
    const prev = prevDimRef.current;
    const w = dimWidth.trim();
    const h = dimHeight.trim();
    const wasEmpty = !prev.width || !prev.height;
    const nowFilled = w !== "" && h !== "" && parseFloat(w.replace(",", ".")) > 0 && parseFloat(h.replace(",", ".")) > 0;
    if (wasEmpty && nowFilled) {
      // Avança automaticamente para o step de arquivo
      setOpenSteps(prev => ({ ...prev, [dimStepIdx]: false, [fileStepIdx]: true }));
    }
    prevDimRef.current = { width: w, height: h };
  }, [dimWidth, dimHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Arquivo ─────────────────────────────────────────────────────────────
  const addArtFiles = async (selected: File[]) => {
    if (!selected.length) return;
    const unsupportedFiles = selected.filter((file) => !ART_ALLOWED_EXTENSIONS.includes(file.name.split(".").pop()?.toLowerCase() ?? ""));
    const oversizedFiles = selected.filter((file) => file.size > ART_MAX_FILE_SIZE);
    const validFiles = selected.filter((file) => !unsupportedFiles.includes(file) && !oversizedFiles.includes(file));
    if (unsupportedFiles.length) toast.error(`${unsupportedFiles.length} arquivo(s) ignorado(s): use PDF, AI, CDR, PSD, EPS, JPG, PNG, TIFF ou SVG.`);
    if (oversizedFiles.length) toast.error(`${oversizedFiles.length} arquivo(s) ignorado(s): cada arquivo pode ter no máximo 100 MB.`);
    if (!validFiles.length) return;
    const filesForMode = artUploadMode === "single" ? validFiles.slice(0, 1) : validFiles;
    if (artUploadMode === "single" && validFiles.length > 1) toast.info("Modo de arquivo único: apenas o primeiro arquivo foi selecionado.");
    const filesWithPreview = await Promise.all(filesForMode.map(async (file): Promise<SelectedArtFile> => {
      const preview = file.type.startsWith("image/")
        ? await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          })
        : null;
      return { id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`, file, preview };
    }));
    setArtFiles((current) => {
      const base = artUploadMode === "single" ? [] : current;
      const existing = new Set(base.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`));
      return [...base, ...filesWithPreview.filter((item) => !existing.has(`${item.file.name}-${item.file.size}-${item.file.lastModified}`))];
    });
    setArtFilesConfirmed(false);
    setArtUploadSuccess(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await addArtFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const handleArtDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsArtDropActive(false);
    await addArtFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const removeArtFile = (fileId: string) => {
    setArtFiles((current) => current.filter((item) => item.id !== fileId));
    setArtFilesConfirmed(false);
    setArtUploadSuccess(null);
    resetUpload();
  };

  const clearAllArtFiles = () => {
    setArtFiles([]);
    setArtFilesConfirmed(false);
    setArtUploadSuccess(null);
    setUploadQueue(null);
    resetUpload();
  };

  const selectArtUploadMode = (mode: "single" | "multiple") => {
    setArtUploadMode(mode);
    setArtFilesConfirmed(false);
    setArtUploadSuccess(null);
    if (mode === "single" && artFiles.length > 1) {
      setArtFiles((current) => current.slice(0, 1));
      toast.info("Mantivemos apenas o primeiro arquivo ao trocar para arquivo único.");
    }
  };

  const confirmArtFiles = () => {
    if (!artFiles.length) return;
    setArtFilesConfirmed(true);
    setOpenSteps(prev => ({ ...prev, [fileStepIdx]: false, [prazoStepIdx]: true }));
  };

  // ─── CEP ─────────────────────────────────────────────────────────────────
  // Calcula dimensões e peso proporcionais à quantidade
  const getShippingParams = (qty: number) => {
    const baseWeight = product ? (parseFloat((product as any).weight ?? '0') || 0.5) : 0.5;
    const baseH = product ? (parseFloat((product as any).height ?? '0') || 5) : 5;
    const baseW = product ? (parseFloat((product as any).width ?? '0') || 30) : 30;
    const baseL = product ? (parseFloat((product as any).length ?? '0') || 40) : 40;
    // Peso cresce linearmente com a quantidade
    const totalWeight = Math.max(0.1, baseWeight * qty);
    // Dimensões: aumenta levemente (empilhamento), mas não linearmente
    const stackFactor = Math.ceil(Math.sqrt(qty));
    return {
      weight: Math.round(totalWeight * 1000) / 1000,
      height: Math.min(baseH * stackFactor, 100),
      width: baseW,
      length: baseL,
    };
  };

  const doCalculateShipping = async (cleanCep: string, qty: number, prevQuotes?: ShippingQuote[]) => {
    const params = getShippingParams(qty);
    const quotes = await calculateShippingMutation.mutateAsync({
      destinationCep: cleanCep,
      ...params,
    });
    const result = quotes as any;
    const quotesArray: ShippingQuote[] = Array.isArray(result) ? result : (result.quotes ?? []);
    const serverCutoff: string = result.cutoffTime ?? '13:00';

    // Detectar transportadoras que foram removidas por excesso de peso/dimensão
    if (prevQuotes && prevQuotes.length > 0 && qty > 1) {
      const prevNonFixed = prevQuotes.filter(q => !(q as any).isFixed);
      const newNonFixed = quotesArray.filter(q => !(q as any).isFixed);
      const removedCarriers = prevNonFixed.filter(pq => !newNonFixed.some(nq => nq.id === pq.id));
      if (removedCarriers.length > 0) {
        const names = removedCarriers.map(c => c.company ? `${c.company} — ${c.name}` : c.name).join(', ');
        const params = getShippingParams(qty);
        setShippingLimitWarning(
          `⚠️ ${removedCarriers.length === 1 ? 'A transportadora' : 'As transportadoras'} ${names} ${removedCarriers.length === 1 ? 'não está disponível' : 'não estão disponíveis'} para ${qty} unidades (peso total: ${params.weight.toFixed(2)} kg). Escolha outra opção de entrega.`
        );
      } else {
        setShippingLimitWarning(null);
      }
    } else {
      setShippingLimitWarning(null);
    }

    setShippingQuotes(quotesArray);
    setCutoffTime(serverCutoff);
    setShippingCalculated(true);
    // Atualizar seleção se já havia uma transportadora selecionada
    setSelectedShipping(prev => {
      if (!prev) return null;
      // Tentar encontrar a mesma transportadora nas novas cotações
      const updated = quotesArray.find(q => q.id === prev.id);
      if (!updated) {
        // Transportadora selecionada foi removida por limite de peso
        return null;
      }
      return updated;
    });
  };

  const handleCepSearch = async (cepOverride?: string) => {
    const clean = (cepOverride ?? cep).replace(/\D/g, "");
    if (clean.length !== 8) { setCepError("CEP deve ter 8 dígitos"); return; }
    setCepLoading(true); setCepError(null); setCepAddress(null);
    setShippingQuotes([]); setShippingCalculated(false); setSelectedShipping(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const d = await res.json();
      if (d.erro) { setCepError("CEP não encontrado"); return; }
      setCepAddress(`${d.logradouro ? d.logradouro + ", " : ""}${d.bairro ? d.bairro + " — " : ""}${d.localidade}/${d.uf}`);
      await doCalculateShipping(clean, quantity);
      // Salvar CEP no localStorage para pré-carregar no checkout
      localStorage.setItem("checkout_cep", clean);
    } catch { setCepError("Erro ao calcular frete. Tente novamente."); }
    finally { setCepLoading(false); }
  };

  // Recalcular frete automaticamente quando a quantidade muda (se CEP já foi calculado)
  const prevQuantityRef = useRef(quantity);
  const shippingQuotesRef = useRef(shippingQuotes);
  useEffect(() => { shippingQuotesRef.current = shippingQuotes; }, [shippingQuotes]);
  useEffect(() => {
    if (prevQuantityRef.current === quantity) return;
    prevQuantityRef.current = quantity;
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8 || !shippingCalculated) return;
    // Recalcular silenciosamente passando as cotações anteriores para detectar limites
    doCalculateShipping(clean, quantity, shippingQuotesRef.current).catch(() => {});
  }, [quantity, shippingCalculated]);

  // ─── Add to Cart ─────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!product || !productId) return;
    if (!acceptedTerms) { setValidationError("Aceite os termos para continuar"); return; }
    setValidationError(null);
    setIsProcessing(true);
    const optimisticItemId = -Date.now();
    let optimisticItemAdded = false;

    const removeOptimisticItem = () => {
      if (!optimisticItemAdded) return;
      utils.cart.getItems.setData(undefined, current =>
        ((current ?? []).filter((item: any) => item.id !== optimisticItemId) as any)
      );
      utils.cart.getCount.setData(undefined, current => Math.max(0, Number(current ?? 0) - quantity));
    };

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

      const shippingId = selectedShipping ? String(selectedShipping.id) : "retirada";
      const shippingPrice = selectedShipping?.price ?? 0;
      // Evitar duplicação: se o name já começa com company (ex: 'Entrega Local - Carro'), usar apenas name
      const shippingLabel = selectedShipping
        ? (selectedShipping.company && !selectedShipping.name.startsWith(selectedShipping.company)
            ? `${selectedShipping.company} — ${selectedShipping.name}`
            : selectedShipping.name)
        : "Retirar na Loja";
      const combinedNotes = notes || undefined;

      // Snapshot de variações selecionadas
      const variationSnapshotJson = variationTypes && Object.keys(selectedVariations).length > 0
        ? JSON.stringify((variationTypes as any[]).map((vt: any) => {
            const optId = selectedVariations[vt.id];
            const opt = (vt.options ?? []).find((o: any) => o.id === optId);
            return opt ? { name: vt.name, value: opt.name } : null;
          }).filter(Boolean))
        : undefined;

      // Prazo de produção
      const prazoName = selectedDeliveryOption?.name;
      const prazoHours = selectedDeliveryOption
        ? (selectedDeliveryOption.daysToDeliver === 1 ? 24 : (selectedDeliveryOption.daysToDeliver ?? 0) * 24)
        : 0;
      const urgencyMultiplier = selectedDeliveryOption
        ? (isM2 ? deadlineBilledArea : isMetroLinear ? deadlineLinearMeters : 1)
        : 0;
      const urgencyUnit = isM2 ? "m²" : isMetroLinear ? "metro linear" : product.calculationType === "pacote" ? "pacote" : "unidade";
      const urgencyRate = selectedDeliveryOption ? Number(selectedDeliveryOption.pricePerM2 ?? 0) : 0;
      const urgencySurcharge = deliveryTax;

      // Previsão de entrega
      const forecastDate = deliveryForecast ? deliveryForecast.date.toLocaleDateString('pt-BR') : undefined;
      const forecastLabel = deliveryForecast ? deliveryForecast.label : undefined;

      // CEP de destino
      const cepDestinoVal = cep.replace(/\D/g, '').length === 8 ? cep : undefined;

      // Dimensões customizadas
      const customDimensions = isM2 && dimWidth && dimHeight
        ? `${dimWidth}x${dimHeight}`
        : undefined;

      // Atualiza o drawer e o contador imediatamente; o envio e a confirmação seguem em segundo plano.
      await Promise.all([
        utils.cart.getItems.cancel(),
        utils.cart.getCount.cancel(),
      ]);
      utils.cart.getItems.setData(undefined, current => ([
        ...(current ?? []),
        {
          id: optimisticItemId,
          productId,
          quantity,
          selectedAttributes: attrsJson ?? null,
          customDimensions: customDimensions ?? null,
          priceAtCart: String(selectedUnitPrice),
          pixPriceAtCart: String(effectivePrice),
          cardPriceAtCart: String(cardEffectivePrice),
          selectedPaymentMethod,
          artFileUrl: fileMode === "link" ? artLink || null : null,
          artFileUrls: fileMode === "link" && artLink ? JSON.stringify([artLink]) : null,
          notes: combinedNotes ?? null,
          productName: product.name,
          productImage: product.imageUrl ?? null,
          calculationType: product.calculationType ?? "unidade",
          unit: product.unit ?? "unidade",
          shippingMethod: shippingId,
          shippingPrice: String(shippingPrice),
          shippingLabel,
          variationSnapshot: variationSnapshotJson ?? null,
          prazoName: prazoName ?? null,
          prazoHours,
          urgencyRate,
          urgencyMultiplier,
          urgencyUnit,
          urgencySurcharge,
          forecastDate: forecastDate ?? null,
          forecastLabel: forecastLabel ?? null,
          cepDestino: cepDestinoVal ?? null,
        },
      ] as any));
      utils.cart.getCount.setData(undefined, current => Number(current ?? 0) + quantity);
      optimisticItemAdded = true;
      openCart();

      let artUrls: string[] = fileMode === "link" && artLink ? [artLink] : [];
      setArtUploadSuccess(null);
      if (artFiles.length && fileMode === "upload") {
        try {
          for (let index = 0; index < artFiles.length; index += 1) {
            const art = artFiles[index];
            setUploadQueue({ current: index + 1, total: artFiles.length, completed: index, fileName: art.file.name });
            const { url } = await doChunkedUpload(art.file);
            artUrls.push(url);
            setUploadQueue({ current: index + 1, total: artFiles.length, completed: index + 1, fileName: art.file.name });
          }
          setArtUploadSuccess(artFiles.length);
          toast.success(`${artFiles.length} ${artFiles.length === 1 ? "arquivo enviado" : "arquivos enviados"} com sucesso.`);
        } catch (uploadErr: any) {
          if (uploadErr?.message === "CANCELLED") { removeOptimisticItem(); setIsProcessing(false); return; }
          console.error('[upload-art] catch:', uploadErr?.message);
          toast.error(uploadErr?.message ?? "Erro ao enviar o arquivo", { duration: 8000 });
          removeOptimisticItem();
          return;
        } finally {
          setUploadQueue(null);
        }
      }
      const artUrl = artUrls[0];
      const addedItem = await addToCartMutation.mutateAsync({
        productId, quantity,
        selectedAttributes: attrsJson,
        customDimensions,
        priceAtCart: selectedUnitPrice,
        pixPriceAtCart: effectivePrice,
        cardPriceAtCart: cardEffectivePrice,
        selectedPaymentMethod,
        notes: combinedNotes,
        artFileUrl: artUrl,
        artFileUrls: artUrls.length ? JSON.stringify(artUrls) : undefined,
        shippingMethod: shippingId,
        shippingPrice,
        shippingLabel,
        variationSnapshot: variationSnapshotJson,
        prazoName,
        prazoHours,
        urgencyRate,
        urgencyMultiplier,
        urgencyUnit,
        urgencySurcharge,
        forecastDate,
        forecastLabel,
        cepDestino: cepDestinoVal,
      });
      utils.cart.getItems.setData(undefined, current =>
        ((current ?? []).map((item: any) => item.id === optimisticItemId ? { ...item, id: addedItem.id } : item) as any)
      );
      void utils.cart.getItems.invalidate();
      void utils.cart.getCount.invalidate();
      toast.success("Adicionado ao carrinho!", {
        action: { label: "Ver Carrinho", onClick: () => setLocation("/carrinho") },
      });
    } catch {
      removeOptimisticItem();
      toast.error("Erro ao adicionar ao carrinho");
    }
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
        basePrice: commercialProductPrice,
        selectedAttributes: selectedAttrsForSummary,
        quantity,
        finalPrice: total,
        deadline: selectedDeliveryOption?.name ?? "5 dias úteis",
        notes,
        customerName: "Cliente",
        companyName: "Maria Imprime",
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
      <div className="w-full mx-auto px-4 py-6 max-w-7xl">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-orange-500">Início</Link>
          <span>/</span>
          <Link href="/catalogo" className="hover:text-orange-500">Catálogo</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-4 lg:gap-6 items-start">

          {/* ═══════════════════════════════════════════════════════════════
              COLUNA ESQUERDA — Galeria + Info
          ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-3 lg:space-y-4">

            {/* Foto principal */}
            <div className="bg-white rounded-lg lg:rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {galleryImages.length > 0 ? (
                  <>
                    <img
                      src={galleryImages[currentImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-contain"
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
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex
                          ? "border-orange-500"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain bg-gray-50" />
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
              {productRating && (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <div className="flex items-center gap-0.5 flex-shrink-0" aria-label={`${productRating.rating} de 5 estrelas`}>
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{productRating.rating} ({productRating.reviewCount} avaliações)</span>
                </div>
              )}
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
                    {/* Especificações cadastradas pelo admin */}
                    {(() => {
                      try {
                        const specs = product.specifications ? JSON.parse(product.specifications) : [];
                        if (specs.length > 0) {
                          return specs.map((spec: { label: string; value: string }, i: number) => (
                            <p key={i} className="flex items-start gap-1"><span className="text-orange-500 mt-0.5">•</span> {spec.label}</p>
                          ));
                        }
                      } catch {}
                      // Fallback: exibir dados padrão do produto
                      return (
                        <>
                          <p><span className="font-medium">Cálculo:</span> {product.calculationType === "m2" ? "Por m²" : product.calculationType === "metro_linear" ? "Metro linear" : product.calculationType === "pacote" ? "Pacote" : "Unidade"}</p>
                          {product.unit && <p><span className="font-medium">Unidade:</span> {product.unit}</p>}
                          {product.category && <p><span className="font-medium">Categoria:</span> {product.category}</p>}
                        </>
                      );
                    })()}
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
              const selOptName = vtype.options?.find((o: any) => o.id === selOptId)?.name;
              return (
                <AccordionStep
                  key={`vtype-${vtype.id}`}
                  id={`var-${vtype.id}`}
                  number={idx + 1}
                  title={vtype.name}
                  isOpen={!!openSteps[idx]}
                  onToggle={() => toggleStep(idx)}
                  summary={selOptName}
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
              const selAttrName = selVal?.valueIds[0]
                ? attr.values.find(v => v.id === selVal.valueIds[0])?.value
                : selVal?.customValue;
              return (
                <AccordionStep
                  key={attr.attributeId}
                  id={`attr-${attr.attributeId}`}
                  number={globalIdx + 1}
                  title={attr.attribute?.name ?? `Atributo ${globalIdx + 1}`}
                  isOpen={!!openSteps[globalIdx]}
                  onToggle={() => toggleStep(globalIdx)}
                  summary={selAttrName}
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
                            requestAnimationFrame(() => {
                              const nextStep = document.getElementById(`attr-${attr.attributeId}`)?.nextElementSibling;
                              if (nextStep) {
                                nextStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            });
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
                title="Medidas (metros)"
                isOpen={!!openSteps[dimStepIdx]}
                onToggle={() => toggleStep(dimStepIdx)}
                summary={area > 0 ? `${dimWidth}×${dimHeight} m — ${billedArea.toFixed(2)} m²` : undefined}
              >
                <div className="mt-3 space-y-4">
                  <div className="grid grid-cols-3 gap-3 items-start">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block">Largura (metros)</Label>
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
                      <Label className="text-xs text-gray-500 mb-1.5 block">Altura (metros)</Label>
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
                        <p className="text-xs text-gray-400">{dimWidth} x {dimHeight} m</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-blue-700">A área mínima cobrada é de 1 m²</p>
                  </div>

                  {area > 0 && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <p className="text-xs text-green-700">Medidas confirmadas — avançando automaticamente...</p>
                    </div>
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
              summary={artFiles.length ? (artFiles.length === 1 ? artFiles[0].file.name : `${artFiles.length} arquivos selecionados`) : (artLink ? 'Link enviado' : undefined)}
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
                    Upload de arquivos
                    <span className="text-xs text-gray-400 block leading-tight">Envie um ou mais arquivos do seu dispositivo</span>
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
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-1">
                      <button type="button" onClick={() => selectArtUploadMode("single")} className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition ${artUploadMode === "single" ? "bg-white text-pink-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        <span className="block">Arquivo único</span><span className="font-normal text-[11px] text-gray-400">Uma arte para este produto</span>
                      </button>
                      <button type="button" onClick={() => selectArtUploadMode("multiple")} className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition ${artUploadMode === "multiple" ? "bg-white text-pink-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        <span className="block">Vários arquivos</span><span className="font-normal text-[11px] text-gray-400">Ex.: frente e verso</span>
                      </button>
                    </div>
                    <div
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${isArtDropActive ? "border-pink-500 bg-pink-50 scale-[1.01]" : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/20"}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={(event) => { event.preventDefault(); setIsArtDropActive(true); }}
                      onDragOver={(event) => { event.preventDefault(); setIsArtDropActive(true); }}
                      onDragLeave={(event) => { event.preventDefault(); setIsArtDropActive(false); }}
                      onDrop={handleArtDrop}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <Upload className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm text-gray-600 font-medium">{isArtDropActive ? "Solte os arquivos aqui" : artUploadMode === "single" ? "Clique para selecionar seu arquivo" : "Clique para selecionar ou arraste vários arquivos"}</p>
                          <p className="text-xs text-gray-400">PDF, PNG, JPG, TIFF, AI, CDR — máx 100MB</p>
                        </div>
                        <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition flex-shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                          Selecionar
                        </span>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.ai,.cdr,.psd,.eps,.jpg,.jpeg,.png,.tiff,.tif,.svg"
                      multiple={artUploadMode === "multiple"}
                      onChange={handleFileChange}
                    />

                    {artFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-medium text-gray-600">{artFiles.length} {artFiles.length === 1 ? "arquivo selecionado" : "arquivos selecionados"}</span>
                          <button type="button" onClick={clearAllArtFiles} disabled={uploadState.isUploading} className="text-xs font-medium text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50">Limpar todos</button>
                        </div>
                        {artFiles.map((art) => (
                          <div key={art.id} className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                            {art.preview
                              ? <img src={art.preview} alt={`Prévia de ${art.file.name}`} className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-green-200" />
                              : <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-8 h-8 text-green-600" /></div>}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-green-800 truncate">{art.file.name}</p>
                              <p className="text-xs text-green-600 mt-0.5">{(art.file.size / 1024 / 1024).toFixed(2)} MB</p>
                              <div className="flex items-center gap-1 mt-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /><span className="text-xs text-green-700 font-medium">Arquivo selecionado</span></div>
                            </div>
                            <button type="button" onClick={() => removeArtFile(art.id)} className="text-gray-400 hover:text-red-500" aria-label={`Remover ${art.file.name}`}>✕</button>
                          </div>
                        ))}
                        <div className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${artFilesConfirmed ? "border-green-200 bg-green-50" : "border-pink-200 bg-pink-50"}`}>
                          <p className={`text-xs ${artFilesConfirmed ? "text-green-700" : "text-pink-700"}`}>{artFilesConfirmed ? `${artFiles.length} ${artFiles.length === 1 ? "arquivo confirmado" : "arquivos confirmados"}. Você pode continuar.` : `Revise os ${artFiles.length} ${artFiles.length === 1 ? "arquivo" : "arquivos"} antes de continuar.`}</p>
                          {!artFilesConfirmed && <Button type="button" size="sm" onClick={confirmArtFiles} className="h-8 bg-pink-600 text-xs hover:bg-pink-700">Confirmar e continuar</Button>}
                        </div>
                      </div>
                    )}
                    {uploadState.isUploading && (
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{uploadQueue ? `Enviando arquivo ${uploadQueue.current} de ${uploadQueue.total}: ${uploadQueue.fileName}` : `Enviando... ${uploadState.currentChunk}/${uploadState.totalChunks} partes`}</span>
                          <span>{uploadQueue ? Math.round(((uploadQueue.completed + uploadState.progress / 100) / uploadQueue.total) * 100) : uploadState.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-pink-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadQueue ? Math.round(((uploadQueue.completed + uploadState.progress / 100) / uploadQueue.total) * 100) : uploadState.progress}%` }}
                          />
                        </div>
                        <button
                          type="button"
                          className="text-xs text-gray-400 hover:text-red-500 underline"
                          onClick={cancelUpload}
                        >
                          Cancelar envio
                        </button>
                      </div>
                    )}
                    {artUploadSuccess && !uploadState.isUploading && (
                      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-3 animate-pulse" aria-live="polite">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
                        <div><p className="text-sm font-semibold text-green-800">Envio concluído com sucesso!</p><p className="text-xs text-green-700">{artUploadSuccess} {artUploadSuccess === 1 ? "arquivo foi enviado" : "arquivos foram enviados"} e serão incluídos no pedido.</p></div>
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
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Link2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <Input
                          type="url"
                          placeholder="https://drive.google.com/sua-arte.pdf"
                          value={artLink}
                          onChange={e => {
                            setArtLink(e.target.value);
                            // Avança automaticamente quando o link parece válido
                            if (e.target.value.startsWith("http")) {
                              setOpenSteps(prev => ({ ...prev, [fileStepIdx]: false, [prazoStepIdx]: true }));
                            }
                          }}
                          className="text-sm flex-1"
                        />
                      </div>
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
              summary={selectedDeliveryOption ? selectedDeliveryOption.name : undefined}
            >
                <div className="mt-3 space-y-2">
                  {deliveryOptions.map((opt: any) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedDeliveryOption(opt);
                        setOpenSteps(prev => ({ ...prev, [prazoStepIdx]: false, [deliveryStepIdx]: true }));
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all duration-800 ${
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
                          +R$ {getProductionDeadlineSurcharge({
                            rate: opt.pricePerM2,
                            calculationType: product?.calculationType,
                            billedArea: deadlineBilledArea,
                            linearMeters: deadlineLinearMeters,
                          }).toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </AccordionStep>
            )}

            {/* ── Opções de Entrega ── */}
            <AccordionStep
              id="delivery-options"
              number={deliveryStepIdx + 1}
              title="Opções de Entrega"
              isOpen={!!openSteps[deliveryStepIdx]}
              onToggle={() => toggleStep(deliveryStepIdx)}
              summary={selectedShipping
                ? (selectedShipping.fixedType === 'pickup' || selectedShipping.id === 'retirada'
                    ? 'Retirada na Loja'
                    : `${selectedShipping.company} — R$ ${selectedShipping.price.toFixed(2)}`)
                : undefined}
            >
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500 mb-3">Escolha como deseja receber seu pedido</p>

                {/* ─── Retirada na Loja: SEMPRE FIXA NO TOPO ─── */}
                {(() => {
                  const isPickupSel = selectedShipping?.fixedType === 'pickup' || selectedShipping?.id === 'retirada';
                  const pickupQuote = { id: 'retirada', name: 'Retirar na Loja', company: '', price: 0, deliveryDays: 0, fixedType: 'pickup' } as any;
                  return (
                    <div className="space-y-2">
                      <button
                        key="pickup-fixed"
                        type="button"
                        onClick={() => {
                          if (isPickupSel) {
                            setSelectedShipping(null);
                          } else {
                            setSelectedShipping(pickupQuote);
                            // Limpar CEP ao selecionar retirada
                            setCep('');
                            setShippingQuotes([]);
                            setShippingCalculated(false);
                            setCepError(null);
                            setCepAddress(null);
                            setOpenSteps(prev => ({ ...prev, [deliveryStepIdx]: false }));
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-800 ${
                          isPickupSel
                            ? 'border-orange-500 bg-orange-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-orange-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isPickupSel ? 'border-orange-500' : 'border-gray-300'}`}>
                          {isPickupSel && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                        </div>
                        <span className="flex-shrink-0">
                          <Store className="w-4 h-4 text-green-600" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isPickupSel ? 'text-orange-700' : 'text-gray-800'}`}>Retirar na Loja</p>
                          <p className="text-xs text-gray-500">Retirada Presencial — Grátis</p>
                        </div>
                        <span className="text-sm font-bold flex-shrink-0 text-green-600">Grátis</span>
                      </button>

                      {isPickupSel && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <Store className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-blue-900">Endereço da Loja</p>
                              <p className="text-xs text-blue-700 leading-relaxed mt-0.5">Av. Ver. Antônio Ferreira dos Santos, 651 — Braga, Cabo Frio — RJ, 28908-200</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-blue-900">Horário de Funcionamento</p>
                              <p className="text-xs text-blue-700 leading-relaxed mt-0.5">Segunda a Sexta: 09:00 — 12:00 e 13:30 — 18:00<br />Sábado e Domingo: Fechado</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 pt-1 border-t border-blue-200">
                            <MessageCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-blue-900">Telefone</p>
                              <p className="text-xs text-blue-700">(22) 99945-9596</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Separador */}
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">ou calcule o frete</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* CEP */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Digite seu CEP"
                    value={cep}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                      const formatted = v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v;
                      setCep(formatted);
                      setCepError(null);
                      setCepAddress(null);
                      // Auto-busca ao completar 8 dígitos
                      if (v.length === 8) {
                        // Passa o CEP diretamente para evitar problema de closure
                        setTimeout(() => handleCepSearch(v), 100);
                      } else {
                        // Ao apagar o CEP, limpar as transportadoras
                        setShippingQuotes([]);
                        setShippingCalculated(false);
                        // Se tinha transportadora selecionada, limpar
                        if (selectedShipping && selectedShipping.fixedType !== 'pickup' && selectedShipping.id !== 'retirada') {
                          setSelectedShipping(null);
                        }
                      }
                    }}
                    onKeyDown={e => e.key === "Enter" && handleCepSearch()}
                    maxLength={9}
                    className="flex-1"
                  />
                  {cepLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500 flex-shrink-0" />
                  )}
                </div>
                {cepError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700">{cepError}</p>
                  </div>
                )}
                {cepAddress && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <p className="text-xs text-green-700">{cepAddress}</p>
                  </div>
                )}

                {/* Estado antes de calcular */}
                {!shippingCalculated && !cepLoading && (
                  <div className="text-center py-3 text-gray-400">
                    <Truck className="w-6 h-6 mx-auto mb-1 opacity-30" />
                    <p className="text-xs">Digite seu CEP para ver as opções de entrega</p>
                  </div>
                )}

                {/* Calculando */}
                {(cepLoading || calculateShippingMutation.isPending) && (
                  <div className="text-center py-4 text-gray-400">
                    <Loader2 className="w-7 h-7 mx-auto mb-1.5 animate-spin text-orange-500" />
                    <p className="text-sm">Calculando opções de entrega...</p>
                  </div>
                )}

                {/* Aviso de limite de peso/dimensão */}
                {shippingLimitWarning && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-3 mt-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 mb-0.5">Opção indisponível para esta quantidade</p>
                      <p className="text-xs text-amber-700 leading-snug">{shippingLimitWarning.replace(/^⚠️\s*/, '')}</p>
                    </div>
                  </div>
                )}

                {/* Opções calculadas — filtra pickup para não duplicar com o botão fixo acima */}
                {shippingCalculated && shippingQuotes
                  .filter(opt => opt.fixedType !== 'pickup')
                  .map(opt => {
                  const isSel = selectedShipping && String(selectedShipping.id) === String(opt.id);
                  const productionDays = Number(selectedDeliveryOption?.daysToDeliver ?? 0);
                  const deliveryDaysNum = Number(opt.deliveryDays ?? 0);
                  const totalDays = Math.round(productionDays + deliveryDaysNum);
                  const isLocal = opt.fixedType === 'local';
                  const deadlineText = (() => {
                    if (isLocal) {
                      if (totalDays === 0) return '🚀 Receba HOJE! (Entrega Local)';
                      if (totalDays === 1) return '⚡ Receba amanhã! (Entrega Local)';
                      return `Receba em ${totalDays} dias úteis (Entrega Local)`;
                    }
                    if (totalDays === 0) return 'Receba hoje!';
                    if (totalDays === 1) return 'Receba amanhã!';
                    return `Receba em ${totalDays} dias úteis`;
                  })();
                  return (
                    <button
                      key={String(opt.id)}
                      type="button"
                      onClick={() => {
                        setSelectedShipping(opt);
                        setOpenSteps(prev => ({ ...prev, [deliveryStepIdx]: false }));
                      }}
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
                        {isLocal ? <Zap className="w-4 h-4 text-orange-500" /> : <Truck className="w-4 h-4" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isSel ? "text-orange-700" : "text-gray-800"}`}>{opt.name}</p>
                        {opt.company && opt.company !== opt.name && !opt.name.startsWith(opt.company) && (
                          <p className="text-xs text-gray-500">{opt.company}</p>
                        )}
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

                {shippingCalculated && shippingQuotes.filter(q => q.fixedType !== 'pickup').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-3">Nenhuma transportadora disponível para este CEP.</p>
                )}

                {/* Aviso institucional da gráfica */}
                {shippingCalculated && shippingQuotes.some(q => q.fixedType === 'local') && (
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    *Prazos válidos para arquivos enviados com arte aprovada até as {cutoffTime}. Pedidos de grandes formatos ou altas tiragens podem sofrer acréscimo de prazo após análise técnica.
                  </p>
                )}


              </div>
            </AccordionStep>

            {/* Termos */}
            <div>
              <TermsAcceptance checked={acceptedTerms} onCheckedChange={checked => { setAcceptedTerms(checked); if (checked) { localStorage.setItem("maria_imprime_terms_version", "2026-08-12"); setValidationError(null); } else localStorage.removeItem("maria_imprime_terms_version"); }} />
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
          <div className="sticky top-4 h-fit space-y-4">
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
                  <div className="space-y-1.5 pb-3 border-b border-gray-100">
                    {(variationTypes as any[]).map((vtype: any) => {
                      const selOptId = selectedVariations[vtype.id];
                      const selOpt = (vtype.options ?? []).find((o: any) => o.id === selOptId);
                      if (!selOpt) return null;
                      return (
                        <div key={vtype.id} className="flex justify-between gap-2">
                          <span className="text-xs text-gray-400 flex-shrink-0">{vtype.name}</span>
                          <span className="text-xs font-medium text-gray-700 text-right truncate max-w-[120px]">{selOpt.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Atributos selecionados dinamicamente */}
                {selectedAttrsForSummary.length > 0 && (
                  <div className="space-y-1.5 pb-3 border-b border-gray-100">
                    {selectedAttrsForSummary.map((a, i) => (
                      <div key={i} className="flex justify-between gap-2">
                        <span className="text-xs text-gray-400 flex-shrink-0">{a.name}</span>
                        <span className="text-xs font-medium text-gray-700 text-right truncate max-w-[120px]">{a.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Medidas */}
                {isM2 && area > 0 && (
                  <div className="pb-3 border-b border-gray-100 space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-gray-400">Medidas</span>
                      <span className="text-xs font-medium text-gray-700">{dimWidth} × {dimHeight} m</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-gray-400">Área total</span>
                      <span className="text-xs font-medium text-gray-700">{area.toFixed(2)} m²</span>
                    </div>
                  </div>
                )}

                {/* Prazo de produção selecionado */}
                {selectedDeliveryOption && (
                  <div className="flex justify-between gap-2 pb-2 border-b border-gray-100">
                    <span className="text-xs text-gray-400 flex-shrink-0">Prazo</span>
                    <span className="text-xs font-medium text-gray-700 text-right">
                      {selectedDeliveryOption.daysToDeliver === 1 ? "24h" : `${selectedDeliveryOption.daysToDeliver}d úteis`}
                    </span>
                  </div>
                )}

                {/* Entrega */}
                {selectedShipping && (
                  <div className="flex justify-between gap-2 pb-2 border-b border-gray-100">
                    <span className="text-xs text-gray-400 flex-shrink-0">Entrega</span>
                    <div className="text-right">
                      <span className={`text-xs font-medium block truncate max-w-[130px] ${shippingSummary.isFree ? "text-green-600" : "text-gray-700"}`}>
                        {selectedShipping.name}
                      </span>
                      <span className={`text-xs ${shippingSummary.isFree ? "text-green-600" : "text-gray-400"}`}>
                        {shippingSummary.label}
                      </span>
                    </div>
                  </div>
                )}

                {/* Previsão de Entrega */}
                {deliveryForecast && (
                  <div className="pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-700">Previsão de Entrega</span>
                    </div>
                    {deliveryForecast.type === 'pickup' ? (
                      <div className="bg-blue-50 rounded-lg px-3 py-2 space-y-0.5">
                        <p className="text-xs font-semibold text-blue-800">
                          {formatDeliveryDate(deliveryForecast.date)}
                        </p>
                        <p className="text-xs text-blue-600">
                          Disponível para retirada na loja
                        </p>
                        {deliveryForecast.totalDays > 0 && (
                          <p className="text-xs text-blue-500">
                            {deliveryForecast.totalDays === 1 ? "Após 24h de produção" : `Após ${deliveryForecast.totalDays}d úteis de produção`}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-orange-50 rounded-lg px-3 py-2 space-y-0.5">
                        <p className="text-xs font-semibold text-orange-800">
                          {formatDeliveryDate(deliveryForecast.date)}
                        </p>
                        <p className="text-xs text-orange-600">
                          {deliveryForecast.totalDays === 1
                            ? "Receba em 1 dia útil"
                            : `Receba em ${deliveryForecast.totalDays} dias úteis`}
                        </p>
                        {(deliveryForecast as any).shippingDays > 0 && (
                          <p className="text-xs text-orange-400">
                            {(deliveryForecast as any).productionDays === 1 ? "24h" : `${(deliveryForecast as any).productionDays}d`} produção
                            {" + "}
                            {(deliveryForecast as any).shippingDays}d transporte
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Quantidade */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400">Quantidade</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors text-sm font-bold"
                    >−</button>
                    <span className="text-sm font-semibold text-gray-800 w-6 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors text-sm font-bold"
                    >+</button>
                  </div>
                </div>

                {/* Totais */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryTax > 0 && (
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-600">Urgência</span>
                      <span className="font-medium text-green-600 text-right">
                        {formatProductionDeadlineSurcharge({
                          rate: selectedDeliveryOption?.pricePerM2,
                          multiplier: isM2 ? deadlineBilledArea : isMetroLinear ? deadlineLinearMeters : 1,
                          unit: isM2 ? "m²" : isMetroLinear ? "metro linear" : product?.calculationType === "pacote" ? "pacote" : "unidade",
                          surcharge: deliveryTax,
                          quantity,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Entrega</span>
                    <span className={`font-medium ${shippingSummary.isFree ? "text-green-600" : shippingSummary.isPending ? "text-gray-500" : ""}`}>
                      {shippingSummary.label}
                    </span>
                  </div>
                  <div className="space-y-2 pt-3 border-t border-gray-200" role="radiogroup" aria-label="Forma de pagamento">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedPaymentMethod === "pix"}
                      onClick={() => setSelectedPaymentMethod("pix")}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${selectedPaymentMethod === "pix" ? "border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200" : "border-gray-200 bg-gray-50 hover:border-emerald-200"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Preço especial no Pix</span>
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">à vista</span>
                      </div>
                      <p className={`mt-1 font-extrabold tracking-tight text-emerald-700 ${selectedPaymentMethod === "pix" ? "text-3xl" : "text-xl"}`}>R$ {getOrderTotal(effectivePrice * quantity, fretePrice).toFixed(2)}</p>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedPaymentMethod === "cartao"}
                      onClick={() => setSelectedPaymentMethod("cartao")}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${selectedPaymentMethod === "cartao" ? "border-pink-300 bg-pink-50 ring-1 ring-pink-200" : "border-gray-200 bg-gray-50 hover:border-pink-200"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-700">No cartão</span>
                        <CreditCard className={`h-4 w-4 ${selectedPaymentMethod === "cartao" ? "text-pink-600" : "text-gray-400"}`} aria-hidden />
                      </div>
                      <p className={`mt-1 font-extrabold tracking-tight text-gray-800 ${selectedPaymentMethod === "cartao" ? "text-3xl" : "text-xl"}`}>R$ {cardTotal.toFixed(2)}</p>
                    </button>
                  </div>
                </div>

                {/* Segurança */}
                <div className="flex items-center justify-between gap-3 rounded-xl bg-green-50 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Shield className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <div>
                      <p className="text-xs font-semibold text-green-800">Pagamento Seguro</p>
                      <p className="text-xs text-green-600">Processado pelo Mercado Pago.</p>
                    </div>
                  </div>
                  <span className="h-7 w-20 flex-shrink-0 overflow-hidden rounded-sm" aria-hidden>
                    <img
                      src="/manus-storage/mercado-pago-logo_3e251139.png"
                      alt="Mercado Pago"
                      className="h-full w-full object-cover"
                    />
                  </span>
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
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploadState.isUploading ? `Enviando arquivo... ${uploadState.progress}%` : "Processando..."}</>
                    : <><ShoppingCart className="w-4 h-4 mr-2" />Adicionar ao carrinho</>
                  }
                </Button>
                {isProcessing && uploadState.isUploading && (
                  <p className="mt-2 text-center text-xs text-gray-500" aria-live="polite">
                    Seu arquivo está sendo enviado. Aguarde a conclusão para adicionarmos o produto ao carrinho.
                  </p>
                )}
                
                {/* Botão Fazer Orçamento - apenas para operadores */}
                {isOperator && (
                  <Button
                    variant="outline"
                    className="w-full border-pink-300 text-pink-700 hover:bg-pink-50 font-semibold py-3 rounded-xl text-base h-12 gap-2"
                    onClick={() => {
                      const specs: Record<string, string> = {};
                      if (dimWidth) specs.width = dimWidth;
                      if (dimHeight) specs.height = dimHeight;
                      const params = new URLSearchParams({
                        productId: String(productId ?? ""),
                        productName: encodeURIComponent(product?.name ?? ""),
                        productImage: encodeURIComponent(product?.imageUrl ?? ""),
                        unitPrice: String(total),
                        quantity: String(quantity),
                        specifications: encodeURIComponent(JSON.stringify(specs)),
                        artFileUrl: encodeURIComponent(artLink || ""),
                      });
                      setLocation(`/admin/orcamentos/novo?${params.toString()}`);
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Fazer Orçamento
                  </Button>
                )}

              {/* Lista de campos pendentes */}
                {!canAddToCart && missingFields.length > 0 && (
                  <div className={`mt-4 p-4 bg-white border-2 border-pink-200 rounded-xl shadow-sm ${PENDING_FIELDS_NOTICE_MOTION}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-pink-500 flex-shrink-0" />
                      <p className="text-sm font-bold text-gray-900">Quase pronto! Complete os campos abaixo:</p>
                    </div>
                    <ul className="space-y-2">
                      {missingFields.map((field) => (
                        <li key={field.id} className="text-sm text-gray-800 flex items-start gap-3 pl-1 cursor-pointer hover:text-gray-950 transition-colors" onClick={() => scrollToField(field.id)}>
                          <CheckSquare className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{field.message}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-700 mt-3 pt-3 border-t border-pink-100 italic">Após preencher todos os campos, o botão será ativado automaticamente.</p>
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
                {showWhatsApp && (
                  <a
                    href={getWhatsAppUrl(company.whatsappNumber, getCompanyWhatsAppMessage(company, product?.name))}
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
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
