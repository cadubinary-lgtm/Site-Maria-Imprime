import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AttributeValue {
  id: number;
  value: string;
  priceModifier: number;
  timeModifier: number;
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
  calculationType: "m2" | "metro_linear" | "pacote" | "unidade";
  onPriceUpdate?: (price: number, config: any) => void;
  onAddToCart?: (config: any) => void;
}

export function ProductConfigurator({
  productId,
  basePrice,
  calculationType,
  onPriceUpdate,
  onAddToCart,
}: ProductConfiguratorProps) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>({});
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [quantity, setQuantity] = useState(1);
  const [calculatorConfig, setCalculatorConfig] = useState<ProductCalculatorConfig | null>(null);
  const [expandedAttribute, setExpandedAttribute] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar atributos do produto
  useEffect(() => {
    const loadProductAttributes = async () => {
      try {
        setIsLoading(true);
        // Aqui você faria uma chamada à API para carregar os atributos do produto
        // Por enquanto, usando dados mock
        const mockAttributes: ProductAttribute[] = [
          {
            id: 1,
            attributeId: 1,
            attributeName: "Tipo de Impressão",
            attributeSlug: "tipo-impressao",
            attributeType: "select",
            values: [
              { id: 1, value: "Solvente", priceModifier: 0, timeModifier: 0 },
              { id: 2, value: "UV", priceModifier: 50, timeModifier: 24 },
            ],
            isRequired: true,
            displayOrder: 1,
            priceModifier: 0,
          },
          {
            id: 2,
            attributeId: 2,
            attributeName: "Material",
            attributeSlug: "material",
            attributeType: "select",
            values: [
              { id: 3, value: "Vinil Transparente", priceModifier: 0, timeModifier: 0 },
              { id: 4, value: "Vinil Brilho", priceModifier: 30, timeModifier: 0 },
            ],
            isRequired: true,
            displayOrder: 2,
            priceModifier: 0,
          },
        ];

        const mockConfig: ProductCalculatorConfig = {
          baseValuePerSqm: 50,
          materialCost: 20,
          printingCost: 15,
          finishingCost: 10,
          profitMarginPercent: 30,
          minimumAreaSqm: 0.1,
          productionDays: 5,
          expressProductionDays: 2,
        };

        setAttributes(mockAttributes);
        setCalculatorConfig(mockConfig);
      } catch (err) {
        setError("Erro ao carregar configurações do produto");
      } finally {
        setIsLoading(false);
      }
    };

    loadProductAttributes();
  }, [productId]);

  // Calcular preço em tempo real
  const calculatedPrice = useMemo(() => {
    if (!calculatorConfig) return basePrice;

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

    // Calcular área se necessário
    let area = 1;
    if (calculationType === "m2" && dimensions.width > 0 && dimensions.height > 0) {
      area = (dimensions.width * dimensions.height) / 10000; // Converter para m²
      area = Math.max(area, calculatorConfig.minimumAreaSqm);
    }

    // Calcular preço final
    const pricePerUnit = (basePrice + totalAdditionals) * area;
    totalPrice = pricePerUnit * quantity;

    // Aplicar margem de lucro
    const margin = totalPrice * (calculatorConfig.profitMarginPercent / 100);
    totalPrice = totalPrice + margin;

    return totalPrice;
  }, [selectedValues, dimensions, quantity, basePrice, calculationType, calculatorConfig, attributes]);

  // Atualizar preço no componente pai
  useEffect(() => {
    if (onPriceUpdate) {
      onPriceUpdate(calculatedPrice, {
        selectedValues,
        dimensions,
        quantity,
        calculationType,
      });
    }
  }, [calculatedPrice, selectedValues, dimensions, quantity, calculationType, onPriceUpdate]);

  const handleAttributeSelect = (attributeId: number, valueId: number) => {
    setSelectedValues((prev) => ({
      ...prev,
      [attributeId]: valueId,
    }));
  };

  const handleDimensionChange = (field: "width" | "height", value: string) => {
    const numValue = parseFloat(value) || 0;
    setDimensions((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const isConfigurationComplete = attributes
    .filter((a) => a.isRequired)
    .every((a) => selectedValues[a.id] !== undefined);

  if (isLoading) {
    return <div className="text-center py-8">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Configurações do Produto</h2>
        <p className="text-gray-600">Customize seu produto selecionando as opções abaixo</p>
        <div className="mt-4 h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-orange-500 rounded-full transition-all"
            style={{
              width: `${
                (Object.keys(selectedValues).length /
                  attributes.filter((a) => a.isRequired).length) *
                100
              }%`,
            }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {Object.keys(selectedValues).length} de {attributes.filter((a) => a.isRequired).length} campos
          preenchidos
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Atributos */}
      <div className="space-y-3">
        {attributes.map((attribute, index) => (
          <Card
            key={attribute.id}
            className={`cursor-pointer transition-all ${
              expandedAttribute === attribute.id ? "ring-2 ring-orange-500" : ""
            }`}
            onClick={() =>
              setExpandedAttribute(
                expandedAttribute === attribute.id ? null : attribute.id
              )
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {attribute.attributeName}
                      {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </CardTitle>
                    <CardDescription>
                      {selectedValues[attribute.id]
                        ? attribute.values.find((v) => v.id === selectedValues[attribute.id])
                            ?.value
                        : "Não selecionado"}
                    </CardDescription>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    expandedAttribute === attribute.id ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CardHeader>

            {expandedAttribute === attribute.id && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {attribute.attributeType === "select" && (
                    <Select
                      value={selectedValues[attribute.id]?.toString() || ""}
                      onValueChange={(value) =>
                        handleAttributeSelect(attribute.id, parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        {attribute.values.map((value) => (
                          <SelectItem key={value.id} value={value.id.toString()}>
                            {value.value}
                            {value.priceModifier > 0 && (
                              <span className="text-orange-500 ml-2">
                                +R$ {value.priceModifier.toFixed(2)}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Dimensões (se necessário) */}
      {calculationType === "m2" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dimensões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Largura (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  value={dimensions.width || ""}
                  onChange={(e) => handleDimensionChange("width", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={dimensions.height || ""}
                  onChange={(e) => handleDimensionChange("height", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            {dimensions.width > 0 && dimensions.height > 0 && (
              <div className="text-sm text-gray-600">
                Área: {((dimensions.width * dimensions.height) / 10000).toFixed(4)} m²
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quantidade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quantidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
          />
        </CardContent>
      </Card>

      {/* Resumo de Preço */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-base">Preço Total Estimado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Preço Base:</span>
            <span className="font-semibold">R$ {basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Adicionais:</span>
            <span className="font-semibold">
              R$ {(calculatedPrice - basePrice).toFixed(2)}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between items-center">
            <span className="text-lg font-bold">Total:</span>
            <span className="text-2xl font-bold text-orange-600">
              R$ {calculatedPrice.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Botão Adicionar ao Carrinho */}
      <Button
        onClick={() =>
          onAddToCart?.({
            selectedValues,
            dimensions,
            quantity,
            totalPrice: calculatedPrice,
          })
        }
        disabled={!isConfigurationComplete}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-bold"
      >
        {isConfigurationComplete ? "Adicionar ao Carrinho" : "Preencha todos os campos obrigatórios"}
      </Button>
    </div>
  );
}
