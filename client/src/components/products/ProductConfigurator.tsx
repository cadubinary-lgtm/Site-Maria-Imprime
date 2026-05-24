
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Truck } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<number | null>(null);
  const [deliveryOptions, setDeliveryOptions] = useState<any[]>([]);

  // Frete de entrega
  const FRETE_OPTIONS = [
    { id: "retirada",       name: "Retirar na Loja",  description: "Retire na loja",               price: 0,    days: "Conforme produção", logo: "🏪", highlight: false },
    { id: "motoboy",        name: "Moto Express",     description: "Entrega rápida via motoboy",   price: 15,   days: "Mesmo dia*",        logo: "🛵", highlight: true  },
    { id: "uber",           name: "Uber Entrega",     description: "Entrega via Uber Flash",       price: 20,   days: "Mesmo dia*",        logo: "🚗", highlight: true  },
    { id: "jadlog",         name: "Jadlog",           description: "Transportadora Jadlog",        price: 25.9, days: "3 a 5 dias úteis",  logo: "📦", highlight: false },
    { id: "correios_sedex", name: "Correios SEDEX",   description: "Correios SEDEX",               price: 18.5, days: "2 a 4 dias úteis",  logo: "📮", highlight: false },
    { id: "correios_pac",   name: "Correios PAC",     description: "Correios PAC",                 price: 12.3, days: "5 a 8 dias úteis",  logo: "📮", highlight: false },
    { id: "transportadora", name: "Transportadora",   description: "Transportadora parceira",      price: 35,   days: "5 a 10 dias úteis", logo: "🚛", highlight: false },
  ] as const;
  const [selectedFreteId, setSelectedFreteId] = useState<string>("retirada");
  const selectedFrete = FRETE_OPTIONS.find(f => f.id === selectedFreteId) ?? FRETE_OPTIONS[0];

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
      const rawArea = width * height;
      // Área mínima de 1m² — nunca vender menos que 1m²
      // Se os campos estiverem vazios (area = 0), usar basePrice como mínimo
      const area = rawArea > 0 ? Math.max(rawArea, 1) : 0;
      
      // Calcular taxa de prazo (se selecionado)
      let deliveryAdditional = 0;
      if (selectedDeliveryOption && deliveryOptions.length > 0) {
        const selectedOption = deliveryOptions.find((opt: any) => opt.id === selectedDeliveryOption);
        if (selectedOption) {
          deliveryAdditional = area * selectedOption.pricePerM2;
        }
      }
      
      const calculatedFromArea = (area * pricePerM2) + totalAdditionals + deliveryAdditional;
      // Se campos vazios, mostrar basePrice; caso contrário, nunca abaixo do basePrice
      totalPrice = area === 0 ? basePrice : Math.max(calculatedFromArea, basePrice);
    } else {
      totalPrice += totalAdditionals;
      totalPrice = totalPrice * quantity;
    }

    return totalPrice;
  }, [selectedValues, attributes, basePrice, quantity, calculationType, pricePerM2, dimensions, parseDecimal, selectedDeliveryOption, deliveryOptions]);

  const handleSelectChange = (attributeId: number, valueId: number) => {
    setSelectedValues((prev) => {
      const updated = {
        ...prev,
        [attributeId]: valueId,
      };
      // Chamar onPriceUpdate imediatamente após atualizar estado
      // Será chamado no próximo render com o novo calculatedPrice
      return updated;
    });
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
      totalPrice: calculatedPrice + selectedFrete.price,
      totalAdditionals,
      dimensions: {
        width: parseDecimal(dimensions.width as string),
        height: parseDecimal(dimensions.height as string),
      },
      selectedFrete: {
        id: selectedFrete.id,
        name: selectedFrete.name,
        price: selectedFrete.price,
        days: selectedFrete.days,
      },
    };
    onAddToCart?.(config);
  };

  // Chamar onPriceUpdate quando calculatedPrice muda (sem dependência circular)
  useEffect(() => {
    if (onPriceUpdate && calculatedPrice > 0) {
      // Calcular taxa de prazo
      let deliveryTax = 0;
      if (selectedDeliveryOption && deliveryOptions.length > 0) {
        const selectedOption = deliveryOptions.find((opt: any) => opt.id === selectedDeliveryOption);
        if (selectedOption && calculationType === "m2") {
          const width = parseDecimal(dimensions.width as string);
          const height = parseDecimal(dimensions.height as string);
          const area = width * height;
          deliveryTax = area * selectedOption.pricePerM2;
        }
      }

      // Bug 2: Passar contagem de variações para validação no ProductDetail
      const requiredAttrs = attributes.filter(a => a.isRequired);
      const selectedCount = requiredAttrs.filter(a => selectedValues[a.id] !== undefined).length;
      
      const config = {
        productId,
        selectedVariations: selectedValues,
        quantity,
        totalPrice: calculatedPrice,
        selectedDeliveryOption,
        deliveryOptions,
        deliveryTax,
        requiredCount: requiredAttrs.length,
        selectedCount,
      };
      onPriceUpdate(calculatedPrice, config);
    }
  }, [calculatedPrice, selectedValues, attributes]);

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

        {/* Atributos — sempre visíveis com dropdown direto */}
        {attributes.map((attribute, idx) => (
          <div key={attribute.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <Label className="font-semibold text-gray-800">
                {attribute.attributeName}
                {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            <Select
              value={selectedValues[attribute.id]?.toString() || ""}
              onValueChange={(value) =>
                handleSelectChange(attribute.id, parseInt(value))
              }
            >
              <SelectTrigger className="w-full bg-white">
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
          </div>
        ))}

        {/* Dimensões (m²) */}
        {calculationType === "m2" && (
          <div className="space-y-3">
            <Label className="font-semibold text-gray-800">Medidas</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="width" className="text-xs text-gray-500 mb-1 block">Largura (m)</Label>
                <Input
                  id="width"
                  type="text"
                  inputMode="decimal"
                  value={dimensions.width}
                  onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                  placeholder="ex: 1,50"
                  className="bg-white"
                  autoComplete="off"
                />
                {minWidth && maxWidth && (
                  <p className="text-xs text-gray-400 mt-1">Min: {minWidth}m — Max: {maxWidth}m</p>
                )}
              </div>
              <div>
                <Label htmlFor="height" className="text-xs text-gray-500 mb-1 block">Altura (m)</Label>
                <Input
                  id="height"
                  type="text"
                  inputMode="decimal"
                  value={dimensions.height}
                  onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                  placeholder="ex: 2,00"
                  className="bg-white"
                  autoComplete="off"
                />
                {minHeight && maxHeight && (
                  <p className="text-xs text-gray-400 mt-1">Min: {minHeight}m — Max: {maxHeight}m</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prazos de Entrega (apenas para m²) */}
        {calculationType === "m2" && deliveryOptions.length > 0 && (
          <div className="space-y-4 bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">Prazo de Produção</h3>
            <div className="space-y-3">
              {deliveryOptions.map((option: any) => (
                <label
                  key={option.id}
                  className="flex items-center p-3 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition"
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={option.id}
                    checked={selectedDeliveryOption === option.id}
                    onChange={() => setSelectedDeliveryOption(option.id)}
                    className="w-4 h-4 text-green-600"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-semibold">{option.name}</p>
                    <p className="text-sm text-gray-600">{option.daysToDeliver} dias úteis</p>
                  </div>
                  {option.pricePerM2 > 0 && (
                    <span className="font-semibold text-green-600">+R$ {option.pricePerM2.toFixed(2)}/m²</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Opções de Entrega (Frete) */}
        <div className="space-y-3 border border-gray-200 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-base">Opções de Entrega</h3>
          </div>
          <div className="space-y-2">
            {FRETE_OPTIONS.map((option) => {
              const isSelected = selectedFreteId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedFreteId(option.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-orange-500 bg-orange-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-orange-500" : "border-gray-300"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                  </div>
                  <span className="text-lg flex-shrink-0">{option.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${
                      isSelected ? "text-orange-700" : "text-gray-800"
                    }`}>{option.name}</p>
                    <p className={`text-xs mt-0.5 ${
                      option.highlight ? "text-green-600 font-medium" : "text-gray-500"
                    }`}>{option.days}</p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${
                    isSelected ? "text-orange-600" : "text-gray-700"
                  }`}>
                    {option.price === 0 ? "Grátis" : `R$ ${option.price.toFixed(2)}`}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-orange-500 mt-1">* Mesmo dia válido para pedidos até 12h na região atendida.</p>
        </div>

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
              R$ {(calculatedPrice + selectedFrete.price).toFixed(2)}
            </span>
          </div>
          {selectedFrete.price > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Produto: R$ {calculatedPrice.toFixed(2)} + Frete ({selectedFrete.name}): R$ {selectedFrete.price.toFixed(2)}
            </p>
          )}
        </div>


      </CardContent>
    </Card>
  );
}
