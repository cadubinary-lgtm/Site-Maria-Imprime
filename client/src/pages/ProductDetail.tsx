import { useState, useEffect, useMemo } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Upload, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { processRules, generateInitialState } from "@/lib/attributes-engine";
import { OrderSummary } from "@/components/OrderSummary";
import { exportBudgetPDFWithValidation } from "@/lib/export-budget-pdf";
import { ConfiguradorVisual } from "@/components/ConfiguradorVisual";
import ProductConfigurator from "@/components/ProductConfigurator";


export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  const [quantity, setQuantity] = useState(1);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [artLink, setArtLink] = useState("");
  const [useLink, setUseLink] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, { valueIds: number[]; customValue?: string }>>({});
  const [notes, setNotes] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [configuradorPrice, setConfiguradorPrice] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [configuradorAttributes, setConfiguradorAttributes] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);
  const [deliveryTax, setDeliveryTax] = useState(0);

  // Carregar produto
  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId || 0 },
    { enabled: !!productId }
  );

  // Carregar tipos de variações
  const { data: variationTypes = [] } = trpc.variations.getByProduct.useQuery(
    { productId: productId || 0 },
    { enabled: !!productId }
  );

  // Preparar galeria de imagens
  useEffect(() => {
    if (product) {
      const images: string[] = [];
      if (product.imageUrl) {
        images.push(product.imageUrl);
      }
      if (product.galleryUrls) {
        try {
          const parsed = JSON.parse(product.galleryUrls);
          if (Array.isArray(parsed)) {
            images.push(...parsed);
          }
        } catch (e) {
          // Ignorar erro de parsing
        }
      }
      setGalleryImages(images);
      setCurrentImageIndex(0);
    }
  }, [product]);

  // Carregar atributos dinâmicos do produto
  const { data: productAttributes } = trpc.attributes.getProductAttributes.useQuery(
    productId || 0,
    { enabled: !!productId }
  );

  // Carregar regras dinâmicas do produto
  const { data: productRules } = trpc.attributes.getProductRules.useQuery(
    productId || 0,
    { enabled: !!productId }
  );

  const createOrderMutation = trpc.orders.createOrder.useMutation();

  // Processar regras dinâmicas
  const attributeState = useMemo(() => {
    if (!productAttributes || !productRules) return null;

    const attributeIds = productAttributes.map((pa) => pa.attributeId);
    const initialState = generateInitialState(attributeIds);

    // Converter selectedAttributes para Map
    const selectedMap = new Map<number, any>();
    Object.entries(selectedAttributes).forEach(([attrId, selection]) => {
      selectedMap.set(Number(attrId), selection.valueIds[0] || selection.customValue);
    });

    // Processar regras
    return processRules(productRules as any, selectedMap, initialState);
  }, [productAttributes, productRules, selectedAttributes]);

  // Filtrar atributos visíveis
  const visibleAttributes = useMemo(() => {
    // Se não há regras, mostrar todos os atributos
    if (!productAttributes) return [];
    if (!attributeState) return productAttributes;

    return productAttributes.filter((pa) => {
      const state = attributeState[pa.attributeId];
      return state?.visible !== false;
    });
  }, [productAttributes, attributeState]);

  // Calcular preço final
  const calculateFinalPrice = () => {
    if (!product) return 0;

    let total = parseFloat(product.price);

    // Adicionar modificadores de atributos selecionados
    Object.entries(selectedAttributes).forEach(([attrId, selection]) => {
      const attr = productAttributes?.find((pa) => pa.attributeId === Number(attrId));
      if (attr) {
        selection.valueIds.forEach((valueId) => {
          const value = attr.values.find((v) => v.id === valueId);
          if (value) {
            total += parseFloat(value.priceModifier.toString());
          }
        });
      }
    });

    // Adicionar modificadores de regras
    if (attributeState) {
      Object.values(attributeState).forEach((state) => {
        total += state.priceModifier || 0;
      });
    }

    return Math.max(0, total);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máximo 50MB)");
        return;
      }
      setArtFile(file);
      toast.success("Arquivo selecionado com sucesso");
    }
  };

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
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeId]: { valueIds, customValue },
    }));
  };

  const handleExportBudget = async () => {
    if (!product) {
      toast.error("Produto não encontrado");
      return;
    }

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
    } catch (error) {
      toast.error("Erro ao exportar orçamento");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !productId) {
      toast.error("Produto não encontrado");
      return;
    }

    if (!validateAttributes()) {
      return;
    }

    if (!acceptedTerms) {
      toast.error("Você deve aceitar os termos");
      return;
    }

    setIsProcessing(true);

    try {
      const order = await createOrderMutation.mutateAsync({
        productId,
        quantity,
      });

      toast.success("Produto adicionado ao carrinho!");
    } catch (error) {
      toast.error("Erro ao adicionar ao carrinho");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Preparar atributos selecionados para OrderSummary
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Produto não encontrado</AlertDescription>
        </Alert>
        <Link href="/catalogo">
          <Button className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Catálogo
          </Button>
        </Link>
      </div>
    );
  }

  // Converter atributos para formato do ConfiguradorVisual
  const configuradorSteps: any[] = visibleAttributes?.map((attr, index) => ({
    id: `attr-${attr.attributeId}`,
    title: attr.attribute?.name || "Atributo",
    description: "",
    type: attr.allowMultiple ? "checkbox" : "radio",
    visible: true,
    required: attr.isRequired,
    attributes: attr.values.map((v) => ({
      id: `value-${v.id}`,
      label: v.value,
      description: v.value || "",
      priceModifier: parseFloat(v.priceModifier.toString()),
    })),
  })) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/catalogo">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda - Imagem e Galeria */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="pt-6 space-y-4">
              {/* Imagem Principal */}
              <div className="relative bg-gray-100 rounded overflow-hidden">
                {galleryImages.length > 0 ? (
                  <>
                    <img
                      src={galleryImages[currentImageIndex]}
                      alt={`${product.name} - ${currentImageIndex + 1}`}
                      className="w-full h-96 object-cover"
                    />
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Galeria de Miniaturas */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                        idx === currentImageIndex ? "border-red-600" : "border-gray-300"
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Dados Base do Produto */}
              <div className="border-t pt-4 space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-600">ID do Produto:</span>
                  <p className="text-gray-900">{product.id}</p>
                </div>
                {product.category && (
                  <div>
                    <span className="font-semibold text-gray-600">Categoria:</span>
                    <p className="text-gray-900">{product.category}</p>
                  </div>
                )}
                {product.subcategory && (
                  <div>
                    <span className="font-semibold text-gray-600">Subcategoria:</span>
                    <p className="text-gray-900">{product.subcategory}</p>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-600">Tipo de Cálculo:</span>
                  <p className="text-gray-900">
                    {product.calculationType === "m2"
                      ? "m²"
                      : product.calculationType === "metro_linear"
                        ? "Metro Linear"
                        : product.calculationType === "pacote"
                          ? "Pacote"
                          : "Unidade"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Unidade:</span>
                  <p className="text-gray-900">{product.unit}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Status:</span>
                  <p className={product.isActive ? "text-green-600" : "text-red-600"}>
                    {product.isActive ? "Ativo" : "Inativo"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Central - Configurador Visual */}
        <div className="lg:col-span-1 space-y-6">
          {/* Detalhes do Produto */}
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600 mt-2">{product.description}</p>
          </div>

          {/* Configurador de Produto */}
          {product && (
            <ProductConfigurator
              productId={product.id}
              basePrice={parseFloat(product.price)}
              calculationType={product.calculationType as any}
              pricePerM2={(product as any).pricePerM2 ? parseFloat((product as any).pricePerM2) : undefined}
              minWidth={(product as any).minWidth ? parseFloat((product as any).minWidth) : undefined}
              maxWidth={(product as any).maxWidth ? parseFloat((product as any).maxWidth) : undefined}
              minHeight={(product as any).minHeight ? parseFloat((product as any).minHeight) : undefined}
              maxHeight={(product as any).maxHeight ? parseFloat((product as any).maxHeight) : undefined}
              onPriceUpdate={(price, config) => {
                // Atualizar preço e atributos no resumo
                setTotalPrice(price);
                // Construir array de atributos selecionados para o OrderSummary
                const attrs: any[] = [];
                Object.entries(config.selectedVariations || {}).forEach(([attrId, valueId]) => {
                  const attr = (variationTypes || []).find((vt: any) => vt.id === parseInt(attrId));
                  if (attr) {
                    const option = (attr.options || []).find((opt: any) => opt.id === valueId);
                    if (option) {
                      attrs.push({
                        name: attr.name,
                        value: option.name,
                        priceModifier: parseFloat(option.priceModifier || '0'),
                      });
                    }
                  }
                });
                setConfiguradorAttributes(attrs);
                // Rastrear prazo selecionado e taxa
                if (config.selectedDeliveryOption && config.deliveryOptions) {
                  const selected = config.deliveryOptions.find((opt: any) => opt.id === config.selectedDeliveryOption);
                  if (selected) {
                    setSelectedDeliveryOption(selected);
                    setDeliveryTax(config.deliveryTax || 0);
                  }
                }
              }}
              onAddToCart={(config) => {
                // Adicionar ao carrinho
                console.log('Adicionar ao carrinho:', config);
              }}
            />
          )}

          {/* Upload de Arquivo */}
          <Card>
            <CardHeader>
              <CardTitle>Arquivo de Arte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Toggle entre Upload e Link */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setUseLink(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    !useLink
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Upload de Arquivo
                </button>
                <button
                  onClick={() => setUseLink(true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    useLink
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Link/URL
                </button>
              </div>

              {/* Upload de Arquivo */}
              {!useLink && (
                <>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="art-upload"
                      accept=".pdf,.ai,.cdr,.psd,.eps,.jpg,.png"
                    />
                    <label htmlFor="art-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium">Clique para fazer upload</p>
                      <p className="text-xs text-gray-500">PDF, AI, CDR, PSD, EPS, JPG, PNG (máx 50MB)</p>
                    </label>
                  </div>
                  {artFile && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>Arquivo selecionado: {artFile.name}</AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {/* Campo de Link */}
              {useLink && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="art-link">Cole o link da sua arte aqui</Label>
                    <Input
                      id="art-link"
                      type="url"
                      placeholder="https://exemplo.com/sua-arte.pdf"
                      value={artLink}
                      onChange={(e) => setArtLink(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  {artLink && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>Link adicionado com sucesso</AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Termos */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              Aceito os termos e condições
            </Label>
          </div>
        </div>

        {/* Coluna Direita - Resumo do Pedido */}
        <div className="lg:col-span-1">
          <OrderSummary
            productName={product.name}
            productImage={product.imageUrl || undefined}
            basePrice={totalPrice || parseFloat(product.price)}
            selectedAttributes={configuradorAttributes}
            quantity={quantity}
            onQuantityChange={setQuantity}
            deadline={!selectedDeliveryOption ? "5 dias úteis" : undefined}
            notes={notes}
            onNotesChange={setNotes}
            onAddToCart={handleAddToCart}
            isLoading={isProcessing}
            deliveryOption={selectedDeliveryOption}
            deliveryTax={deliveryTax}
          />
        </div>
      </div>
    </div>
  );
}
