import { useState, useEffect, useMemo, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import {
  Loader2, ArrowLeft, Upload, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Star, Shield, Truck, Clock,
  Package, Phone, ChevronDown, ChevronUp, Link2, Search,
  ShoppingCart, FileText, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { processRules, generateInitialState } from "@/lib/attributes-engine";
import { OrderSummary } from "@/components/OrderSummary";
import { exportBudgetPDFWithValidation } from "@/lib/export-budget-pdf";

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface FreteOption {
  id: string;
  name: string;
  description: string;
  price: number;
  days: string;
  logo: string;
}

const FRETE_OPTIONS: FreteOption[] = [
  { id: "retirada",       name: "Retirar na Loja",  description: "Retirada presencial",          price: 0,    days: "Conforme produção",  logo: "🏪" },
  { id: "motoboy",        name: "Moto Express",     description: "Entrega expressa",             price: 15,   days: "Mesmo dia*",         logo: "🛵" },
  { id: "uber",           name: "Uber Entrega",     description: "Entrega via Uber",             price: 28,   days: "Mesmo dia*",         logo: "🚗" },
  { id: "jadlog",         name: "Jadlog",           description: "2 a 3 dias úteis",             price: 24.9, days: "2 a 3 dias úteis",   logo: "📦" },
  { id: "correios_sedex", name: "Correios SEDEX",   description: "1 a 2 dias úteis",             price: 18.9, days: "1 a 2 dias úteis",   logo: "📮" },
  { id: "correios_pac",   name: "Correios PAC",     description: "3 a 5 dias úteis",             price: 12.9, days: "3 a 5 dias úteis",   logo: "📮" },
  { id: "transportadora", name: "Transportadora",   description: "2 a 4 dias úteis",             price: 39,   days: "2 a 4 dias úteis",   logo: "🚛" },
];

const PRODUCT_FEATURES = [
  { icon: Shield, label: "Alta resistência",       desc: "Material resistente ao sol e chuva" },
  { icon: Star,   label: "Cores vivas",            desc: "Impressão digital de alta definição" },
  { icon: Package,label: "Acabamento profissional",desc: "Diversas opções de acabamento" },
  { icon: Truck,  label: "Uso versátil",           desc: "Eventos, fachadas, promoções e muito mais" },
];

const COMPANY_DIFFERENTIALS = [
  { icon: "🏭", label: "Produção própria",       desc: "Qualidade garantida" },
  { icon: "🚚", label: "Entrega para todo Brasil", desc: "Enviamos para sua cidade" },
  { icon: "💳", label: "Pagamento facilitado",   desc: "PIX, Boleto ou Cartão" },
  { icon: "🤝", label: "Atendimento humanizado", desc: "Suporte rápido via WhatsApp" },
];

const FOOTER_BADGES = [
  { icon: "🏆", label: "Qualidade garantida",  desc: "Impressão de alta definição" },
  { icon: "⏱",  label: "Melhor prazo do mercado", desc: "Produção rápida e eficiente" },
  { icon: "💰", label: "Preço justo",           desc: "Melhor custo-benefício" },
  { icon: "😊", label: "Satisfação garantida",  desc: "Ou seu dinheiro de volta" },
];

// ─── Componente Accordion ───────────────────────────────────────────────────
function AccordionItem({
  number, title, subtitle, isOpen, onToggle, children,
}: {
  number: number; title: string; subtitle?: string;
  isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold flex-shrink-0">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          {subtitle && <span className="text-xs text-gray-500 ml-2">{subtitle}</span>}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 bg-white border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ───────────────────────────────────────────────────
export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  // Estado de galeria
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Estado de configuração
  const [quantity, setQuantity] = useState(1);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [artFilePreview, setArtFilePreview] = useState<string | null>(null);
  const [artLink, setArtLink] = useState("");
  const [fileMode, setFileMode] = useState<"upload" | "link">("upload");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, { valueIds: number[]; customValue?: string }>>({});
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [configuradorAttributes, setConfiguradorAttributes] = useState<any[]>([]);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);
  const [deliveryTax, setDeliveryTax] = useState(0);
  const [selectedFreteFromConfigurador, setSelectedFreteFromConfigurador] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [configuradorRequiredCount, setConfiguradorRequiredCount] = useState(0);
  const [configuradorSelectedCount, setConfiguradorSelectedCount] = useState(0);
  const [calculatorArea, setCalculatorArea] = useState(0);

  // Estado do acordeão — cada step tem seu próprio open
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({ 0: true });

  // Estado de CEP e frete
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepAddress, setCepAddress] = useState<string | null>(null);
  const [selectedFreteId, setSelectedFreteId] = useState<string>("retirada");
  const selectedFrete = FRETE_OPTIONS.find(f => f.id === selectedFreteId) ?? FRETE_OPTIONS[0];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId || 0 },
    { enabled: !!productId }
  );
  const { data: variationTypes = [] } = trpc.variations.getByProduct.useQuery(
    { productId: productId || 0 },
    { enabled: !!productId }
  );
  const { data: productAttributes } = trpc.attributes.getProductAttributes.useQuery(
    productId || 0,
    { enabled: !!productId }
  );
  const { data: productRules } = trpc.attributes.getProductRules.useQuery(
    productId || 0,
    { enabled: !!productId }
  );

  // ─── Mutations ────────────────────────────────────────────────────────────
  const addToCartMutation = trpc.cart.addItem.useMutation();

  // ─── Galeria ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (product) {
      const images: string[] = [];
      if (product.imageUrl) images.push(product.imageUrl);
      if ((product as any).galleryUrls) {
        try {
          const parsed = JSON.parse((product as any).galleryUrls);
          if (Array.isArray(parsed)) images.push(...parsed);
        } catch {}
      }
      setGalleryImages(images);
      setCurrentImageIndex(0);
    }
  }, [product]);

  // ─── Regras dinâmicas ─────────────────────────────────────────────────────
  const attributeState = useMemo(() => {
    if (!productAttributes || !productRules) return null;
    const attributeIds = productAttributes.map((pa) => pa.attributeId);
    const initialState = generateInitialState(attributeIds);
    const selectedMap = new Map<number, any>();
    Object.entries(selectedAttributes).forEach(([attrId, selection]) => {
      selectedMap.set(Number(attrId), selection.valueIds[0] || selection.customValue);
    });
    return processRules(productRules as any, selectedMap, initialState);
  }, [productAttributes, productRules, selectedAttributes]);

  const visibleAttributes = useMemo(() => {
    if (!productAttributes) return [];
    if (!attributeState) return productAttributes;
    return productAttributes.filter((pa) => {
      const state = attributeState[pa.attributeId];
      return state?.visible !== false;
    });
  }, [productAttributes, attributeState]);

  // ─── Preço ────────────────────────────────────────────────────────────────
  const calculateFinalPrice = () => {
    if (!product) return 0;
    let total = parseFloat(product.price);
    Object.entries(selectedAttributes).forEach(([attrId, selection]) => {
      const attr = productAttributes?.find((pa) => pa.attributeId === Number(attrId));
      if (attr) {
        selection.valueIds.forEach((valueId) => {
          const value = attr.values.find((v) => v.id === valueId);
          if (value) total += parseFloat(value.priceModifier.toString());
        });
      }
    });
    if (attributeState) {
      Object.values(attributeState).forEach((state) => {
        total += (state as any).priceModifier || 0;
      });
    }
    return Math.max(0, total);
  };

  // ─── Arquivo ──────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 100MB)");
      return;
    }
    setArtFile(file);
    // Preview para imagens
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setArtFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setArtFilePreview(null);
    }
    toast.success("Arquivo selecionado!");
  };

  // ─── CEP ──────────────────────────────────────────────────────────────────
  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setCepError("CEP deve ter 8 dígitos");
      return;
    }
    setCepLoading(true);
    setCepError(null);
    setCepAddress(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado");
      } else {
        setCepAddress(`${data.logradouro ? data.logradouro + ", " : ""}${data.bairro ? data.bairro + " — " : ""}${data.localidade}/${data.uf}`);
      }
    } catch {
      setCepError("Erro ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  // ─── Validação ────────────────────────────────────────────────────────────
  const validateAttributes = () => {
    if (!visibleAttributes) return true;
    for (const attr of visibleAttributes) {
      if (attr.isRequired && !selectedAttributes[attr.attributeId]) {
        toast.error(`Por favor, selecione ${attr.attribute?.name || "um atributo obrigatório"}`);
        return false;
      }
    }
    return true;
  };

  const handleAttributeSelect = (attributeId: number, valueIds: number[], customValue?: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [attributeId]: { valueIds, customValue } }));
  };

  // ─── Orçamento PDF ────────────────────────────────────────────────────────
  const handleExportBudget = async () => {
    if (!product) return;
    setIsExporting(true);
    try {
      await exportBudgetPDFWithValidation({
        productName: product.name,
        productDescription: product.description || undefined,
        basePrice: parseFloat(product.price),
        selectedAttributes: selectedAttributesForSummary,
        quantity,
        finalPrice: calculateFinalPrice() * quantity,
        deadline: "5 dias úteis",
        notes,
        customerName: "Cliente",
        companyName: "Gráfica Ponto Digital",
      });
      toast.success("Orçamento exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar orçamento");
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Adicionar ao Carrinho ────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!product || !productId) { toast.error("Produto não encontrado"); return; }
    if (configuradorRequiredCount > 0 && configuradorSelectedCount < configuradorRequiredCount) {
      setValidationError(`Selecione todas as opções obrigatórias (${configuradorSelectedCount} de ${configuradorRequiredCount} selecionadas)`);
      return;
    }
    if (!acceptedTerms) {
      setValidationError("Você deve aceitar os termos e condições antes de continuar");
      return;
    }
    setValidationError(null);
    setIsProcessing(true);
    try {
      const attrsJson = Object.keys(selectedAttributes).length > 0
        ? JSON.stringify(Object.fromEntries(
            Object.entries(selectedAttributes).map(([attrId, sel]) => {
              const attr = productAttributes?.find((pa) => pa.attributeId === Number(attrId));
              const value = attr?.values.find((v) => v.id === sel.valueIds[0]);
              return [attr?.attribute?.name ?? attrId, value?.value ?? sel.customValue ?? ""];
            })
          ))
        : undefined;
      const finalPrice = totalPrice > 0 ? totalPrice : parseFloat(product.price);

      let resolvedArtFileUrl: string | undefined = fileMode === "link" ? artLink || undefined : undefined;
      if (artFile && fileMode === "upload") {
        toast.loading("Enviando arquivo de arte...", { id: "art-upload" });
        const formData = new FormData();
        formData.append("file", artFile);
        const uploadRes = await fetch("/api/upload-art", { method: "POST", body: formData });
        toast.dismiss("art-upload");
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "Erro ao enviar arquivo de arte");
        }
        const { url } = await uploadRes.json();
        resolvedArtFileUrl = url;
      }

      const deliveryNote = selectedDeliveryOption
        ? `Prazo: ${selectedDeliveryOption.name}${deliveryTax > 0 ? ` (+R$ ${deliveryTax.toFixed(2)})` : ""}`
        : "";
      const freteNote = selectedFreteFromConfigurador?.id
        ? `freteId:${selectedFreteFromConfigurador.id}`
        : `freteId:${selectedFreteId}`;
      const combinedNotes = [notes, deliveryNote, freteNote].filter(Boolean).join(" | ") || undefined;

      await addToCartMutation.mutateAsync({
        productId,
        quantity,
        selectedAttributes: attrsJson,
        priceAtCart: finalPrice,
        notes: combinedNotes,
        artFileUrl: resolvedArtFileUrl,
      });

      toast.success("Produto adicionado ao carrinho!", {
        action: { label: "Ver Carrinho", onClick: () => setLocation("/carrinho") },
      });
    } catch (error) {
      toast.error("Erro ao adicionar ao carrinho");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Atributos para resumo ────────────────────────────────────────────────
  const selectedAttributesForSummary = useMemo(() => {
    return Object.entries(selectedAttributes)
      .map(([attrId, selection]) => {
        const attr = productAttributes?.find((pa) => pa.attributeId === Number(attrId));
        if (!attr) return null;
        const value = attr.values.find((v) => v.id === selection.valueIds[0]);
        return {
          name: attr.attribute?.name || "Atributo",
          value: value?.value || selection.customValue || "",
          priceModifier: value?.priceModifier,
        };
      })
      .filter(Boolean) as any[];
  }, [selectedAttributes, productAttributes]);

  const toggleStep = (idx: number) => {
    setOpenSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ─── Loading / Not Found ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
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
          <Button><ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Catálogo</Button>
        </Link>
      </div>
    );
  }

  const basePrice = totalPrice > 0 ? totalPrice : parseFloat(product.price);
  const fretePrice = selectedFrete.price;
  const totalWithFrete = basePrice * quantity + fretePrice;

  // Número de steps dinâmicos (atributos + medidas se m² + arquivo + entrega)
  const isM2 = product.calculationType === "m2";
  const attrSteps = visibleAttributes || [];
  const hasDimensions = isM2;
  // Índices dos steps especiais
  const dimensionsStepIdx = attrSteps.length;
  const fileStepIdx = attrSteps.length + (hasDimensions ? 1 : 0);
  const deliveryStepIdx = fileStepIdx + 1;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/catalogo" className="hover:text-orange-500 transition-colors">Catálogo</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Coluna Esquerda: Galeria + Info ─────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Foto Principal */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
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
                          onClick={() => setCurrentImageIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((p) => (p + 1) % galleryImages.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
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
                          ? "border-orange-500 shadow-sm"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nome e badge */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">⭐ Mais vendido</span>
              </div>
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

              {/* Features */}
              <div className="space-y-2 pt-1">
                {PRODUCT_FEATURES.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Especificações técnicas */}
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 py-1 select-none">
                  Ver especificações técnicas
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p><span className="font-medium">Tipo de cálculo:</span> {product.calculationType === "m2" ? "m²" : product.calculationType === "metro_linear" ? "Metro Linear" : product.calculationType === "pacote" ? "Pacote" : "Unidade"}</p>
                  <p><span className="font-medium">Unidade:</span> {product.unit}</p>
                  {product.category && <p><span className="font-medium">Categoria:</span> {product.category}</p>}
                </div>
              </details>
            </div>
          </div>

          {/* ── Coluna Central: Configurador ─────────────────────────────── */}
          <div className="lg:col-span-6 space-y-3">
            {/* Cabeçalho */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Configure seu produto</h2>
              <p className="text-sm text-gray-500">Escolha as opções abaixo e veja o preço atualizado</p>
              {configuradorRequiredCount > 0 && configuradorSelectedCount < configuradorRequiredCount && (
                <div className="mt-2 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <p className="text-xs text-orange-700">Preencha todas as opções obrigatórias para continuar</p>
                </div>
              )}
            </div>

            {/* Atributos em acordeão numerado */}
            {attrSteps.map((attr, idx) => {
              const selectedVal = selectedAttributes[attr.attributeId];
              const selectedLabel = selectedVal
                ? attr.values.find(v => v.id === selectedVal.valueIds[0])?.value || ""
                : "";
              return (
                <AccordionItem
                  key={attr.attributeId}
                  number={idx + 1}
                  title={attr.attribute?.name || `Atributo ${idx + 1}`}
                  subtitle={`${attr.isRequired ? "Obrigatório" : "Opcional"} • ${attr.values.length} opções`}
                  isOpen={!!openSteps[idx]}
                  onToggle={() => toggleStep(idx)}
                >
                  <div className="space-y-2 mt-2">
                    {attr.values.map((val) => {
                      const isSelected = selectedVal?.valueIds.includes(val.id);
                      return (
                        <button
                          key={val.id}
                          type="button"
                          onClick={() => {
                            handleAttributeSelect(attr.attributeId, [val.id]);
                            // Abrir próximo step
                            setOpenSteps(prev => ({ ...prev, [idx]: false, [idx + 1]: true }));
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-orange-500 bg-orange-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-orange-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-orange-500" : "border-gray-300"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${isSelected ? "text-orange-700" : "text-gray-800"}`}>
                              {val.value}
                            </p>
                            {val.value && (
                              <p className="text-xs text-gray-500 mt-0.5">{val.value}</p>
                            )}
                          </div>
                          {parseFloat(val.priceModifier.toString()) > 0 && (
                            <span className="text-xs font-semibold text-green-600 flex-shrink-0">
                              +R$ {parseFloat(val.priceModifier.toString()).toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </AccordionItem>
              );
            })}

            {/* Medidas (m²) */}
            {hasDimensions && (
              <AccordionItem
                number={dimensionsStepIdx + 1}
                title="Medidas (cm)"
                subtitle="Obrigatório"
                isOpen={!!openSteps[dimensionsStepIdx]}
                onToggle={() => toggleStep(dimensionsStepIdx)}
              >
                <div className="mt-2 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Largura (cm)</Label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {/* handled by ProductConfigurator */}}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >−</button>
                        <Input
                          type="number"
                          placeholder="200"
                          className="text-center font-semibold"
                        />
                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >+</button>
                      </div>
                      {product.minWidth && product.maxWidth && (
                        <p className="text-xs text-gray-400 mt-1">
                          Min: {parseFloat(product.minWidth as any) * 100}cm — Max: {parseFloat(product.maxWidth as any) * 100}cm
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Altura (cm)</Label>
                      <div className="flex items-center gap-2">
                        <button type="button" className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100">−</button>
                        <Input type="number" placeholder="100" className="text-center font-semibold" />
                        <button type="button" className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Área total</p>
                    <p className="text-xl font-bold text-orange-600">
                      {calculatorArea > 0 ? `${(calculatorArea / 10000).toFixed(2)} m²` : "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {calculatorArea > 0
                        ? `${Math.round(Math.sqrt(calculatorArea / 10000) * 100)} × ${Math.round(Math.sqrt(calculatorArea / 10000) * 100)} cm`
                        : "Preencha as medidas"}
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    ℹ A área mínima é de 0,25 m² e máxima de 100 m²
                  </p>
                </div>
              </AccordionItem>
            )}

            {/* Enviar Arquivo */}
            <AccordionItem
              number={fileStepIdx + 1}
              title="Enviar arquivo"
              subtitle="Obrigatório"
              isOpen={!!openSteps[fileStepIdx]}
              onToggle={() => toggleStep(fileStepIdx)}
            >
              <div className="mt-2 space-y-3">
                {/* Tabs Upload / Link */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFileMode("upload")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      fileMode === "upload"
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload de arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileMode("link")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      fileMode === "link"
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                    Link da arte
                  </button>
                </div>

                {fileMode === "upload" && (
                  <>
                    {/* Área de drop */}
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Arraste seu arquivo aqui ou clique para selecionar</p>
                      <p className="text-xs text-gray-400 mt-1">Formatos aceitos: PDF, PNG, JPG, TIFF, AI, CDR</p>
                      <p className="text-xs text-gray-400">Tamanho máximo: 100MB</p>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <FileText className="w-4 h-4" />
                        Selecionar arquivo
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.ai,.cdr,.psd,.eps,.jpg,.jpeg,.png,.tiff,.tif"
                      onChange={handleFileChange}
                    />

                    {/* Preview do arquivo selecionado */}
                    {artFile && (
                      <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                        {artFilePreview ? (
                          <img src={artFilePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-green-200" />
                        ) : (
                          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-8 h-8 text-green-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-green-800 truncate">{artFile.name}</p>
                          <p className="text-xs text-green-600 mt-0.5">
                            {(artFile.size / 1024 / 1024).toFixed(2)} MB — {artFile.type || "arquivo"}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">Arquivo selecionado com sucesso</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setArtFile(null); setArtFilePreview(null); }}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span>💡</span> Dica: Use arquivos em alta resolução para melhor qualidade de impressão.
                    </p>
                  </>
                )}

                {fileMode === "link" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <Input
                        type="url"
                        placeholder="https://exemplo.com/sua-arte.pdf"
                        value={artLink}
                        onChange={(e) => setArtLink(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Aceitamos links do Google Drive, Dropbox, OneDrive, WeTransfer, Canva, ChatGPT e outros.
                    </p>
                    {artLink && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700">Link adicionado com sucesso</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AccordionItem>

            {/* Opções de Entrega */}
            <AccordionItem
              number={deliveryStepIdx + 1}
              title="Opções de Entrega"
              subtitle="Escolha como deseja receber seu pedido"
              isOpen={!!openSteps[deliveryStepIdx]}
              onToggle={() => toggleStep(deliveryStepIdx)}
            >
              <div className="mt-2 space-y-2">
                {/* Campo de CEP */}
                <div className="mb-3">
                  <Label className="text-xs text-gray-600 mb-1 block">Calcular frete por CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                        setCep(v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v);
                        setCepError(null);
                        setCepAddress(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleCepSearch()}
                      className="flex-1"
                      maxLength={9}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCepSearch}
                      disabled={cepLoading}
                      className="flex-shrink-0"
                    >
                      {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
                  {cepAddress && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {cepAddress}
                    </p>
                  )}
                </div>

                {/* Lista de fretes */}
                {FRETE_OPTIONS.map((option) => {
                  const isSelected = selectedFreteId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedFreteId(option.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-orange-500 bg-orange-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "border-orange-500" : "border-gray-300"
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                      </div>
                      <span className="text-lg flex-shrink-0">{option.logo}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isSelected ? "text-orange-700" : "text-gray-800"}`}>{option.name}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${isSelected ? "text-orange-600" : "text-gray-700"}`}>
                        {option.price === 0 ? <span className="text-green-600">Grátis</span> : `R$ ${option.price.toFixed(2)}`}
                      </span>
                    </button>
                  );
                })}
                <p className="text-xs text-orange-500 mt-1">* Valores de entrega podem variar de acordo com a região.</p>
              </div>
            </AccordionItem>

            {/* Termos */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => {
                    setAcceptedTerms(checked as boolean);
                    if (checked) setValidationError(null);
                  }}
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  Aceito os termos e condições
                </Label>
              </div>
              {validationError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{validationError}</p>
                </div>
              )}
            </div>

            {/* Footer badges */}
            <div className="grid grid-cols-4 gap-3">
              {FOOTER_BADGES.map(({ icon, label, desc }) => (
                <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Coluna Direita: Resumo do Pedido ─────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="sticky top-4 space-y-4">
              {/* Card de Resumo */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-orange-500" />
                  <h3 className="font-bold text-gray-900 text-sm">Resumo do pedido</h3>
                </div>
                <div className="p-4 space-y-3">
                  {/* Produto */}
                  <div className="flex gap-3">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Produto</p>
                      <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                    </div>
                  </div>

                  {/* Atributos selecionados */}
                  {selectedAttributesForSummary.length > 0 && (
                    <div className="space-y-1.5 border-t border-gray-100 pt-3">
                      {selectedAttributesForSummary.map((attr: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-gray-500">{attr.name}</span>
                          <span className="font-medium text-gray-800">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Medidas */}
                  {calculatorArea > 0 && (
                    <div className="border-t border-gray-100 pt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Medidas</span>
                        <span className="font-medium text-gray-800">{(calculatorArea / 10000).toFixed(2)} m²</span>
                      </div>
                    </div>
                  )}

                  {/* Prazo */}
                  {selectedDeliveryOption && (
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Prazo de produção</span>
                        <span className="font-medium text-green-600">
                          {selectedDeliveryOption.name}
                          {deliveryTax > 0 && ` +R$ ${deliveryTax.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Entrega */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Entrega</span>
                      <span className={`font-medium ${selectedFrete.price === 0 ? "text-green-600" : "text-gray-800"}`}>
                        {selectedFrete.name} {selectedFrete.price === 0 ? "— Grátis" : `— R$ ${selectedFrete.price.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Totais */}
                  <div className="border-t border-gray-100 pt-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">R$ {(basePrice * quantity).toFixed(2)}</span>
                    </div>
                    {deliveryTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Acréscimos</span>
                        <span className="font-medium text-green-600">+R$ {deliveryTax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Entrega</span>
                      <span className={`font-medium ${selectedFrete.price === 0 ? "text-green-600" : ""}`}>
                        {selectedFrete.price === 0 ? "Grátis" : `R$ ${selectedFrete.price.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-1 border-t border-gray-100">
                      <span>Total</span>
                      <span className="text-orange-600">R$ {totalWithFrete.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quantidade */}
                  <div className="border-t border-gray-100 pt-3">
                    <Label className="text-xs text-gray-600 mb-2 block">Quantidade</Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-bold"
                      >−</button>
                      <span className="flex-1 text-center font-bold text-lg">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-bold"
                      >+</button>
                    </div>
                  </div>

                  {/* Segurança */}
                  <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                    <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-green-800">Compra 100% segura</p>
                      <p className="text-xs text-green-600">Seus dados protegidos e compra garantida.</p>
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="px-4 pb-4 space-y-2">
                  <Button
                    onClick={handleAddToCart}
                    disabled={isProcessing}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-base"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4 mr-2" />Adicionar ao carrinho</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportBudget}
                    disabled={isExporting}
                    className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-xl"
                  >
                    {isExporting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
                    ) : (
                      <><FileText className="w-4 h-4 mr-2" />Solicitar orçamento</>
                    )}
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
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm font-bold text-gray-900 mb-3">Nossos diferenciais</p>
                <div className="space-y-2.5">
                  {COMPANY_DIFFERENTIALS.map(({ icon, label, desc }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 text-base">
                        {icon}
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
    </div>
  );
}
