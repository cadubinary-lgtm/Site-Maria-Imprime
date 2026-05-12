import React, { useState, useMemo } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import DynamicAttributeRenderer, { DynamicAttribute } from "@/components/DynamicAttributeRenderer";
import { processRules, generateInitialState, getVisibleAttributes } from "@/lib/attributes-engine";

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  const [quantity, setQuantity] = useState(1);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Estado de atributos selecionados
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, { valueIds: number[]; customValue?: string }>>({});

  // Carregar produto
  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId || 0 },
    { enabled: !!productId }
  );

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
    if (!productAttributes || !attributeState) return [];

    return productAttributes.filter((pa) => {
      const state = attributeState[pa.attributeId];
      return state?.visible !== false;
    });
  }, [productAttributes, attributeState]);

  // Calcular preço final com modificadores de atributos
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

    return Math.max(0, total * quantity);
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
      // Redirecionar para carrinho ou checkout
    } catch (error) {
      toast.error("Erro ao adicionar ao carrinho");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

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
        <Link href="/produtos">
          <Button className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Produtos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/produtos">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coluna Esquerda - Imagem */}
        <div>
          <Card>
            <CardContent className="pt-6">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-96 object-cover rounded" />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-500">Sem imagem</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Detalhes e Configuração */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600 mt-2">{product.description}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Preço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                R$ {calculateFinalPrice().toFixed(2)}
              </div>
              <p className="text-sm text-gray-500 mt-2">Preço base: R$ {product.price}</p>
            </CardContent>
          </Card>

          {/* Renderização Dinâmica de Atributos */}
          {visibleAttributes && visibleAttributes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Customize seu produto selecionando as opções abaixo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {visibleAttributes.map((attr) => {
                  const attrObj: DynamicAttribute = {
                    id: attr.attributeId,
                    name: attr.attribute?.name || "Atributo",
                    slug: attr.attribute?.slug || "",
                    type: (attr.attribute?.type as any) || "select",
                    isRequired: attr.isRequired,
                    allowMultiple: attr.allowMultiple,
                    values: attr.values.map((v) => ({
                      ...v,
                      priceModifier: typeof v.priceModifier === "string" ? parseFloat(v.priceModifier) : v.priceModifier,
                      weightModifier: typeof v.weightModifier === "string" ? parseFloat(v.weightModifier) : v.weightModifier,
                      icon: v.icon || undefined,
                      image: v.image || undefined,
                    })) as any,
                    visible: attributeState?.[attr.attributeId]?.visible !== false,
                    enabled: attributeState?.[attr.attributeId]?.enabled !== false,
                  };
                  return (
                    <DynamicAttributeRenderer
                      key={attr.attributeId}
                      attribute={attrObj}
                      onSelect={handleAttributeSelect}
                      selectedValues={selectedAttributes[attr.attributeId]?.valueIds}
                      customValue={selectedAttributes[attr.attributeId]?.customValue}
                    />
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Upload de Arquivo */}
          <Card>
            <CardHeader>
              <CardTitle>Arquivo de Arte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Quantidade */}
          <Card>
            <CardHeader>
              <CardTitle>Quantidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Termos */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="cursor-pointer">
              Aceito os termos e condições
            </Label>
          </div>

          {/* Botão de Compra */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              "Adicionar ao Carrinho"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
