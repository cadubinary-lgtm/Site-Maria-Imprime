import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  const [quantity, setQuantity] = useState(1);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Record<number, number>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [areaM2, setAreaM2] = useState<number>(0);

  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId || 0 },
    { enabled: !!productId }
  );

  const { data: variations } = trpc.variations.getByProduct.useQuery(
    { productId: productId || 0 },
    { enabled: !!productId }
  );

  const createOrderMutation = trpc.orders.createOrder.useMutation();

  // Calcular área em m²
  const calculateArea = () => {
    if (!width || !height) {
      setAreaM2(0);
      return;
    }
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      setAreaM2(0);
      return;
    }
    const area = (w * h) / 10000; // Converter cm² para m²
    setAreaM2(Math.round(area * 100) / 100);
  };

  // Calcular preço final com variações
  const calculateFinalPrice = () => {
    if (!product) return 0;
    
    let total = parseFloat(product.price);
    
    if (variations) {
      for (const variationType of variations) {
        const selectedOptionId = selectedVariations[variationType.id];
        if (selectedOptionId) {
          const option = variationType.options.find(o => o.id === selectedOptionId);
          if (option) {
            total += parseFloat(option.priceModifier);
          }
        }
      }
    }
    
    // Se o produto requer cálculo de área, multiplicar pelo m²
    if (product.requiresAreaCalculation && areaM2 > 0) {
      return total * areaM2 * quantity;
    }
    
    return total * quantity;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máximo 10MB)");
        return;
      }
      setArtFile(file);
    }
  };

  const validateVariations = () => {
    if (!variations) return true;
    
    for (const variationType of variations) {
      if (variationType.isRequired && !selectedVariations[variationType.id]) {
        toast.error(`Por favor, selecione um ${variationType.name}`);
        return false;
      }
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!product) return;

    if (!artFile) {
      toast.error("Por favor, envie o arquivo de arte");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Por favor, aceite os termos e condições");
      return;
    }

    if (!validateVariations()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Simular upload de arquivo
      const artFileUrl = `https://example.com/arts/${Date.now()}-${artFile.name}`;
      const artFileKey = `arts/${Date.now()}-${artFile.name}`;

      await createOrderMutation.mutateAsync({
        productId: product.id,
        quantity,
        artFileUrl,
        artFileKey,
      });

      toast.success("Pedido criado com sucesso! Redirecionando...");
      setTimeout(() => {
        window.location.href = `/confirmacao/${product.name.replace(/\s+/g, '-')}-${Date.now()}`;
      }, 1500);
    } catch (error) {
      toast.error("Erro ao criar pedido");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!productId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Produto não encontrado</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-orange-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Produto não encontrado</p>
      </div>
    );
  }

  const finalPrice = calculateFinalPrice();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/catalogo">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Catálogo
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Informações do Produto */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.segment}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{product.description}</p>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">Preço Base</p>
                  <p className="text-2xl font-bold text-orange-500">
                    R$ {parseFloat(product.price).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário de Compra */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Variações */}
                {variations && variations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Variações do Produto</h3>
                    {variations.map((variationType) => (
                      <div key={variationType.id} className="space-y-2">
                        <Label className="text-base font-medium">
                          {variationType.name}
                          {variationType.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Select
                          value={selectedVariations[variationType.id]?.toString() || ""}
                          onValueChange={(value) => {
                            setSelectedVariations({
                              ...selectedVariations,
                              [variationType.id]: parseInt(value),
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Selecione um ${variationType.name.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {variationType.options.map((option) => (
                              <SelectItem key={option.id} value={option.id.toString()}>
                                {option.name}
                                {parseFloat(option.priceModifier) > 0 && (
                                  <span className="text-gray-600 ml-2">
                                    +R$ {parseFloat(option.priceModifier).toFixed(2)}
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {variationType.options.find(o => o.id === selectedVariations[variationType.id])?.description && (
                          <p className="text-sm text-gray-600">
                            {variationType.options.find(o => o.id === selectedVariations[variationType.id])?.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Calculador de m² para lona e adesivo */}
                {product.requiresAreaCalculation && (
                  <div className="space-y-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <h3 className="font-semibold text-lg text-blue-900">Calcular Metragem Quadrada</h3>
                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div className="space-y-2">
                        <Label htmlFor="width" className="text-sm">Largura (cm)</Label>
                        <Input
                          id="width"
                          type="number"
                          placeholder="1,00"
                          value={width}
                          onChange={(e) => {
                            setWidth(e.target.value);
                            setTimeout(calculateArea, 0);
                          }}
                          className="w-full"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="flex items-center justify-center text-2xl font-bold text-gray-400">×</div>
                      <div className="space-y-2">
                        <Label htmlFor="height" className="text-sm">Altura (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="1,00"
                          value={height}
                          onChange={(e) => {
                            setHeight(e.target.value);
                            setTimeout(calculateArea, 0);
                          }}
                          className="w-full"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200 text-center">
                      <p className="text-sm text-gray-600">Total m²</p>
                      <p className="text-2xl font-bold text-blue-600">{areaM2.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {/* Quantidade */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full"
                  />
                </div>

                {/* Upload de Arquivo */}
                <div className="space-y-2">
                  <Label htmlFor="artFile">Arquivo de Arte</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition">
                    <input
                      id="artFile"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.ai,.psd,.png,.jpg,.jpeg"
                    />
                    <label htmlFor="artFile" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        {artFile ? artFile.name : "Clique para enviar ou arraste o arquivo"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Máximo 10MB (PDF, AI, PSD, PNG, JPG)</p>
                    </label>
                  </div>
                  {artFile && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Arquivo selecionado
                    </div>
                  )}
                </div>

                {/* Checagem de Arquivo - Informações */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Checagem Gratuita de Arquivo</p>
                    <ul className="text-sm space-y-1 ml-2">
                      <li>✓ Conferência de tamanho proporcional</li>
                      <li>✓ Verificação de resolução (300 DPI)</li>
                      <li>✓ Verificação de cores em CMYK</li>
                      <li>✓ Verificação de margens de segurança</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Termos e Condições */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm">Termos e Condições</h4>
                  <div className="text-xs text-gray-600 space-y-2 max-h-40 overflow-y-auto">
                    <p><strong>Variação de Cores:</strong> As cores podem variar até 15% devido a diferenças de materiais e processos de impressão.</p>
                    <p><strong>Responsabilidade:</strong> Não nos responsabilizamos pelas informações contidas no layout enviado. Todo conteúdo é responsabilidade do cliente.</p>
                    <p><strong>Checagem:</strong> Esta checagem não inclui criação ou ajustes avançados na arte. Problemas serão notificados para correção.</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
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

                {/* Preço Final */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Preço Final</span>
                    <span className="text-3xl font-bold text-orange-500">
                      R$ {finalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Botão de Checkout */}
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing || !artFile || !acceptedTerms}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Prosseguir para Pagamento"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
