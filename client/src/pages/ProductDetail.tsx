import { useState, useMemo } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Upload, AlertCircle, CheckCircle2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { processRules, generateInitialState } from "@/lib/attributes-engine";
import { OrderSummary } from "@/components/OrderSummary";
import { exportBudgetPDFWithValidation } from "@/lib/export-budget-pdf";
import { ConfiguradorVisual } from "@/components/ConfiguradorVisual";

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  const [quantity, setQuantity] = useState(1);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, { valueIds: number[]; customValue?: string }>>({});
  const [notes, setNotes] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [configuradorPrice, setConfiguradorPrice] = useState(0);

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
      Object.values(attributeState).forEach((state: any) => {
        if (state.priceModifier) {
          total += state.priceModifier;
        }
      });
    }

    return total * quantity;
  };

  const handleAttributeSelect = (attributeId: number, valueIds: number[]) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeId]: { valueIds, customValue: undefined },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = [".pdf", ".ai", ".cdr", ".psd", ".eps", ".jpg", ".png"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        toast.error("Tipo de arquivo não suportado");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máximo 50MB)");
        return;
      }

      setArtFile(file);
      toast.success("Arquivo selecionado com sucesso");
    }
  };

  const handleCreateOrder = async () => {
    if (!product) return;

    if (!artFile) {
      toast.error("Por favor, faça upload do arquivo de arte");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Por favor, aceite os termos e condições");
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", artFile);
      formData.append("productId", product.id.toString());
      formData.append("quantity", quantity.toString());
      formData.append("selectedAttributes", JSON.stringify(selectedAttributes));
      formData.append("notes", notes);

      const response = await fetch("/api/orders/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao criar pedido");
      }

      const order = await response.json();
      toast.success("Pedido criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar pedido");
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/catalogo">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Catálogo
          </Button>
        </Link>
      </div>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna Esquerda - Imagem do Produto */}
          <div className="flex flex-col">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-auto object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Sem imagem</span>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Detalhes e Configuração */}
          <div className="space-y-6">
            {/* Informações do Produto */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600 text-lg mb-4">{product.description}</p>
              
              {/* Preço */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Preço a partir de:</p>
                <p className="text-3xl font-bold text-red-600">
                  R$ {calculateFinalPrice().toFixed(2)}
                </p>
              </div>
            </div>

            {/* Seletores de Atributos */}
            {visibleAttributes && visibleAttributes.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Configurações</h2>
                
                {visibleAttributes.map((attr) => {
                  const selectedValue = selectedAttributes[attr.attributeId]?.valueIds[0];
                  
                  return (
                    <div key={attr.attributeId} className="space-y-2">
                      <Label className="text-base font-semibold text-gray-900">
                        {attr.attribute?.name}
                      </Label>
                      
                      <Select
                        value={selectedValue?.toString() || ""}
                        onValueChange={(value) => handleAttributeSelect(attr.attributeId, [parseInt(value)])}
                      >
                        <SelectTrigger className="w-full h-10 border-gray-300">
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          {attr.values.map((value) => {
                            const priceModifier = parseFloat(value.priceModifier.toString());
                            return (
                            <SelectItem key={value.id} value={value.id.toString()}>
                              {value.value}
                              {priceModifier > 0 && ` (+R$ ${priceModifier.toFixed(2)})`}
                              {priceModifier < 0 && ` (-R$ ${Math.abs(priceModifier).toFixed(2)})`}
                            </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantidade */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Quantidade</h2>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Upload de Arquivo */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Arquivo de Arte</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="art-upload"
                  accept=".pdf,.ai,.cdr,.psd,.eps,.jpg,.png"
                />
                <label htmlFor="art-upload" className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">Clique para fazer upload</p>
                  <p className="text-xs text-gray-500">PDF, AI, CDR, PSD, EPS, JPG, PNG (máx 50MB)</p>
                </label>
              </div>
              {artFile && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>Arquivo selecionado: {artFile.name}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Notas */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Observações (Opcional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre seu pedido..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>

            {/* Termos e Botão de Compra */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                  Aceito os termos e condições de compra
                </label>
              </div>

              <Button
                onClick={handleCreateOrder}
                disabled={isProcessing || !artFile || !acceptedTerms}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {isProcessing ? "Processando..." : "Solicitar Orçamento"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
