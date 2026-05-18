
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";

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

export function ProductConfigurator({
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
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>({});
  const [dimensions, setDimensions] = useState({ width: "", height: "" });
  const [quantity, setQuantity] = useState(1);
  const [calculatorConfig, setCalculatorConfig] = useState<ProductCalculatorConfig | null>(null);
  const [expandedAttribute, setExpandedAttribute] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Memoizar variações para evitar re-renders infinitos
  // Filtrar apenas variações obrigatórias (isRequired = true)
  const memoizedVariationTypes = useMemo(() => {
    return variationTypes.filter((vt: any) => vt.isRequired !== false);
  }, [JSON.stringify(variationTypes)]);

  // Carregar atributos do produto
  useEffect(() => {
    const loadProductAttributes = async () => {
      try {
        setIsLoading(true);
        
        // Usar APENAS variações reais do backend (sistema global)
        if (memoizedVariationTypes && memoizedVariationTypes.length > 0) {
          const attributes: ProductAttribute[] = memoizedVariationTypes
            .filter((vt: any) => vt.isRequired !== false)
            .map((vt: any, index: number) => ({
            id: vt.id,
            attributeId: vt.id,
            attributeName: vt.name,
            attributeSlug: vt.slug || vt.name.toLowerCase().replace(/\s+/g, '-'),
            attributeType: vt.selectionType || 'select',
            values: (vt.options || []).map((opt: any) => ({
              id: opt.id,
              value: opt.name,
              priceModifier: parseFloat(opt.priceModifier || '0'),
              timeModifier: 0,
            })) || [],
            isRequired: vt.isRequired ?? true,
            displayOrder: vt.order || index + 1,
            priceModifier: 0,
          }));
          setAttributes(attributes);
          setError(null);
          setIsLoading(false);
          return;
        }
        
        // Se não houver variações, mostrar erro em vez de dados mock
        setError("Este produto não possui variações configuradas no sistema global");
        setAttributes([]);
      } catch (err) {
        setError("Erro ao carregar configurações do produto");
      } finally {
        setIsLoading(false);
      }
    };

    loadProductAttributes();
  }, [productId, memoizedVariationTypes]);

  // Calcular preço em tempo real
  const calculatedPrice = useMemo(() => {
    let totalPrice = basePrice;
    let totalAdditionals = 0;

    // Adicionar modificadores dos atributos selecionados
    Object.entries(selectedValues).forEach(([attrId, valueId]) => {
      const attribute = attributes.find((a) => a.id === parseInt(attrId));
      if (attribute) {
        const value = attribute.values.find((v) => v.id === valueId);
        if (value) {
          totalAdditionals += value.priceModifier;
        }
      }
    });

    // Se for m², calcular por área
    if (calculationType === "m2" && pricePerM2) {
      const width = parseDecimal(dimensions.width as string);
      const height = parseDecimal(dimensions.height as string);
      const area = width * height;
      totalPrice = (area * pricePerM2) + totalAdditionals;
    } else {
      totalPrice += totalAdditionals;
      totalPrice = totalPrice * quantity;
    }

    return totalPrice;
  }, [selectedValues, attributes, basePrice, quantity, calculationType, pricePerM2, dimensions, parseDecimal]);

  // Efeito para chamar onPriceUpdate quando o preço muda
  useEffect(() => {
    if (onPriceUpdate) {
      const config = {
        productId,
        selectedVariations: selectedValues,
        quantity,
        totalPrice: calculatedPrice,
      };
      onPriceUpdate(calculatedPrice, config);
    }
  }, [calculatedPrice, onPriceUpdate, productId, selectedValues, quantity]);

  const handleSelectChange = (attributeId: number, valueId: number) => {
    setSelectedValues((prev) => ({
      ...prev,
      [attributeId]: valueId,
    }));
  };

  const handleAddToCart = () => {
    // Calcular additionals para enviar ao carrinho
    let totalAdditionals = 0;
    Object.entries(selectedValues).forEach(([attrId, valueId]) => {
      const attribute = attributes.find((a) => a.id === parseInt(attrId));
      if (attribute) {
        const value = attribute.values.find((v) => v.id === valueId);
        if (value) {
          totalAdditionals += value.priceModifier;
        }
      }
    });

    const config = {
      productId,
      selectedVariations: selectedValues,
      quantity,
      totalPrice: calculatedPrice,
      totalAdditionals,
      dimensions: {
        width: parseDecimal(dimensions.width as string),
        height: parseDecimal(dimensions.height as string),
      },
    };
    onAddToCart?.(config);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || attributes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Este produto não possui variações configuradas"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Produto</CardTitle>
        <CardDescription>Customize seu produto selecionando as opções abaixo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contador de campos preenchidos */}
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-sm text-orange-700">
            {Object.keys(selectedValues).length} de {attributes.filter(a => a.isRequired).length} campos preenchidos
          </p>
        </div>

        {/* Atributos */}
        {attributes.map((attribute) => (
          <div key={attribute.id} className="space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              onClick={() =>
                setExpandedAttribute(
                  expandedAttribute === attribute.id ? null : attribute.id
                )
              }
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">
                  {attributes.indexOf(attribute) + 1}
                </div>
                <div>
                  <Label className="font-semibold cursor-pointer">
                    {attribute.attributeName}
                    {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {selectedValues[attribute.id] ? "Selecionado" : "Não selecionado"}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedAttribute === attribute.id ? "rotate-180" : ""
                }`}
              />
            </div>

            {expandedAttribute === attribute.id && (
              <Select
                value={selectedValues[attribute.id]?.toString() || ""}
                onValueChange={(value) =>
                  handleSelectChange(attribute.id, parseInt(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {attribute.values.map((value) => (
                    <SelectItem key={value.id} value={value.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{value.value}</span>
                        {value.priceModifier > 0 && (
                          <span className="text-green-600 font-semibold">
                            +R$ {value.priceModifier.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}

        {/* Calculadora de m² */}
        {calculationType === "m2" && (
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">Calculadora de Área</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Largura (m)</Label>
                <Input
                  id="width"
                  type="text"
                  inputMode="decimal"
                  value={dimensions.width}
                  onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                  placeholder="1.50 ou 1,50"
                />
                {minWidth && maxWidth && (
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
                  onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                  placeholder="2.00 ou 2,00"
                />
                {minHeight && maxHeight && (
                  <p className="text-xs text-gray-600 mt-1">
                    Min: {minHeight}m | Max: {maxHeight}m
                  </p>
                )}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Área total:</p>
                  <p className="font-semibold text-lg">{(parseDecimal(dimensions.width as string) * parseDecimal(dimensions.height as string)).toFixed(2)} m²</p>
                </div>
                <div>
                  <p className="text-gray-600">Valor por m²:</p>
                  <p className="font-semibold text-lg">R$ {pricePerM2?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quantidade (apenas para unidade) */}
        {calculationType !== "m2" && (
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        )}

        {/* Preço Total */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Preço Total:</span>
            <span className="text-2xl font-bold text-orange-600">
              R$ {calculatedPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botão Adicionar ao Carrinho */}
        <Button
          onClick={handleAddToCart}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={
            attributes.filter(a => a.isRequired).length !==
            Object.keys(selectedValues).length
          }
        >
          Adicionar ao Carrinho
        </Button>
      </CardContent>
    </Card>
  );
}
