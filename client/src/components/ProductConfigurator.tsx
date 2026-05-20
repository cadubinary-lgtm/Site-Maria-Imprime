
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface AttributeValue {
  id: number;
  value: string;
  priceModifier: number;
  timeModifier: number;
  compatibleWith?: number[]; // IDs dos atributos de impressão compatíveis
}

interface ProductAttribute {
  id: number;
  attributeId: number;
  attributeName: string;
  attributeSlug: string;
  attributeType: string;
  attributeIcon?: string;
  values: AttributeValue[];
  isRequired: boolean;
  displayOrder: number;
  priceModifier: number;
}

interface ProductCalculatorConfig {
  baseValuePerSqm: number;
  materialCost: number;
  printingCost: number;
  finishingCost: number;
  profitMarginPercent: number;
  minimumAreaSqm: number;
  productionDays: number;
  expressProductionDays: number;
}

interface ProductConfiguratorProps {
  productId: number;
  basePrice: number;
  calculationType?: string;
  pricePerM2?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  onPriceUpdate?: (price: number, config: any) => void;
  onAddToCart?: (config: any) => void;
}

export default function ProductConfigurator({
  productId,
  basePrice,
  calculationType,
  pricePerM2,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  onPriceUpdate,
  onAddToCart,
}: ProductConfiguratorProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>({});
  const [dimensions, setDimensions] = useState({ width: "", height: "" });
  const [quantity, setQuantity] = useState(1);
  const [calculatorConfig, setCalculatorConfig] = useState<ProductCalculatorConfig | null>(null);
  const [expandedAttribute, setExpandedAttribute] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<number | null>(null);
  const [deliveryOptions, setDeliveryOptions] = useState<any[]>([]);

  // Converter vírgula para ponto
  const parseDecimal = (value: string): number => {
    const normalized = value.replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  // Carregar variações reais do backend
  const { data: variationTypes = [] } = trpc.variations.getByProduct.useQuery(
    { productId },
    { enabled: !!productId }
  );

  // Carregar prazos de entrega (apenas se for m²)
  const { data: deliveryOptionsData = [] } = trpc.deliveryOptions.getByProduct.useQuery(
    { productId },
    { enabled: !!productId && calculationType === "m2" }
  );

  // Atualizar delivery options quando carregar
  useEffect(() => {
    if (deliveryOptionsData && deliveryOptionsData.length > 0) {
      setDeliveryOptions(deliveryOptionsData as any[]);
      // Selecionar primeira opção ativa por padrão
      const firstActive = deliveryOptionsData.find((opt: any) => opt.isActive);
      if (firstActive) {
        setSelectedDeliveryOption(firstActive.id);
      }
    }
  }, [deliveryOptionsData]);

  // Carregar atributos do produto
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        setIsLoading(true);
        // Aqui você carregaria os atributos do backend se necessário
        // Por enquanto, usamos os variationTypes
        setIsLoading(false);
      } catch (err) {
        setError("Erro ao carregar atributos");
        setIsLoading(false);
      }
    };

    if (productId) {
      loadAttributes();
    }
  }, [productId]);

  // Calcular preço total
  const totalPrice = useMemo(() => {
    let price = basePrice;

    // Adicionar modificadores de atributos
    Object.entries(selectedValues).forEach(([attrId, valueId]) => {
      const attr = attributes.find((a) => a.id === parseInt(attrId));
      if (attr) {
        const value = attr.values.find((v) => v.id === valueId);
        if (value) {
          price += value.priceModifier;
        }
      }
    });

    // Se for m², calcular por área
    if (calculationType === "m2" && pricePerM2) {
      const width = parseDecimal(dimensions.width as string);
      const height = parseDecimal(dimensions.height as string);
      const area = width * height;
      const areaPrice = area * pricePerM2;
      price = areaPrice;
    }

    return price * quantity;
  }, [selectedValues, attributes, basePrice, calculationType, pricePerM2, dimensions, quantity]);

  // Notificar mudança de preço
  useEffect(() => {
    if (onPriceUpdate) {
      onPriceUpdate(totalPrice, {
        selectedValues,
        dimensions,
        quantity,
        deliveryOption: selectedDeliveryOption,
      });
    }
  }, [totalPrice, selectedValues, dimensions, quantity, selectedDeliveryOption, onPriceUpdate]);

  const handleAddToCart = () => {
    if (calculationType === "m2" && (!dimensions.width || !dimensions.height)) {
      setError("Por favor, preencha largura e altura");
      return;
    }

    if (onAddToCart) {
      onAddToCart({
        productId,
        selectedValues,
        dimensions,
        quantity,
        deliveryOption: selectedDeliveryOption,
        totalPrice,
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Seção de Atributos */}
      {variationTypes && variationTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personalizações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {variationTypes.map((attr: any) => (
              <div key={attr.id} className="border rounded-lg p-3">
                <button
                  onClick={() =>
                    setExpandedAttribute(
                      expandedAttribute === attr.id ? null : attr.id
                    )
                  }
                  className="w-full flex items-center justify-between font-semibold text-left"
                >
                  <span>{attr.name}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedAttribute === attr.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expandedAttribute === attr.id && (
                  <div className="mt-3 space-y-2">
                    {attr.values && attr.values.length > 0 ? (
                      attr.values.map((value: any) => (
                        <label
                          key={value.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`attr-${attr.id}`}
                            value={value.id}
                            checked={selectedValues[attr.id] === value.id}
                            onChange={() =>
                              setSelectedValues({
                                ...selectedValues,
                                [attr.id]: value.id,
                              })
                            }
                          />
                          <span className="text-sm">
                            {value.name}
                            {value.priceModifier > 0 && (
                              <span className="text-gray-600 ml-2">
                                +R$ {value.priceModifier.toFixed(2)}
                              </span>
                            )}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhuma opção disponível</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Seção de Dimensões (apenas se for m²) */}
      {calculationType === "m2" && (
        <Card>
          <CardHeader>
            <CardTitle>Calculadora de Área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Largura (m)</Label>
                <Input
                  id="width"
                  type="text"
                  inputMode="decimal"
                  value={dimensions.width}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, width: e.target.value })
                  }
                  placeholder="1.50 ou 1,50"
                />
                {minWidth && maxWidth && isAdmin && (
                  <p className="text-xs text-gray-600 mt-1">
                    Min: {minWidth}m | Max: {maxWidth}m
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="height">Altura (m)</Label>
                <Input
                  id="height"
                  type="text"
                  inputMode="decimal"
                  value={dimensions.height}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, height: e.target.value })
                  }
                  placeholder="2.00 ou 2,00"
                />
                {minHeight && maxHeight && isAdmin && (
                  <p className="text-xs text-gray-600 mt-1">
                    Min: {minHeight}m | Max: {maxHeight}m
                  </p>
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Área total:</p>
                    <p className="font-semibold text-lg">
                      {(
                        parseDecimal(dimensions.width as string) *
                        parseDecimal(dimensions.height as string)
                      ).toFixed(2)}{" "}
                      m²
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valor por m²:</p>
                    <p className="font-semibold text-lg">
                      R$ {pricePerM2?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção de Quantidade */}
      <Card>
        <CardHeader>
          <CardTitle>Quantidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
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
        </CardContent>
      </Card>

      {/* Seção de Prazos de Entrega */}
      {deliveryOptions && deliveryOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prazo de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedDeliveryOption?.toString() || ""}
              onValueChange={(value) => setSelectedDeliveryOption(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um prazo" />
              </SelectTrigger>
              <SelectContent>
                {deliveryOptions.map((option: any) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.name} - {option.daysToDeliver} dias úteis
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Resumo de Preço */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-2xl text-red-600">
            R$ {totalPrice.toFixed(2)}
          </CardTitle>
          <CardDescription>Preço total</CardDescription>
        </CardHeader>
      </Card>

      {/* Botão de Adicionar ao Carrinho */}
      <Button
        onClick={handleAddToCart}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold"
      >
        Adicionar ao Carrinho
      </Button>
    </div>
  );
}
