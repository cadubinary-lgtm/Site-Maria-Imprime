'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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

  // Carregar variações reais do backend
  const { data: variationTypes = [] } = trpc.variations.getByProduct.useQuery(
    { productId },
    { enabled: !!productId }
  );

  // Memoizar variações para evitar re-renders infinitos
  const memoizedVariationTypes = useMemo(() => variationTypes, [JSON.stringify(variationTypes)]);

  // Carregar atributos do produto
  useEffect(() => {
    const loadProductAttributes = async () => {
      try {
        setIsLoading(true);
        
        // Se temos variações reais, usá-las
        if (memoizedVariationTypes && memoizedVariationTypes.length > 0) {
          const attributes: ProductAttribute[] = memoizedVariationTypes.map((vt: any, index: number) => ({
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
          setIsLoading(false);
          return;
        }
        
        // Fallback para dados mock se não houver variações
        const mockAttributes: ProductAttribute[] = [
          {
            id: 1,
            attributeId: 1,
            attributeName: "Impressão",
            attributeSlug: "impressao",
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
            attributeName: "Tipo de Material",
            attributeSlug: "tipo-material",
            attributeType: "select",
            values: [
              { id: 3, value: "Brilho", priceModifier: 30, timeModifier: 0, compatibleWith: [1] }, // Solvente
              { id: 4, value: "Fosco", priceModifier: 20, timeModifier: 0, compatibleWith: [1] }, // Solvente
              { id: 5, value: "Transparente", priceModifier: 35, timeModifier: 0, compatibleWith: [1] }, // Solvente
              { id: 6, value: "Perfurado", priceModifier: 25, timeModifier: 0, compatibleWith: [1] }, // Solvente
              { id: 7, value: "Blackout", priceModifier: 40, timeModifier: 0, compatibleWith: [1] }, // Solvente
              { id: 8, value: "Automotivo", priceModifier: 45, timeModifier: 0, compatibleWith: [1] }, // Solvente
              { id: 9, value: "ACM", priceModifier: 60, timeModifier: 0, compatibleWith: [2] }, // UV
              { id: 10, value: "MDF", priceModifier: 50, timeModifier: 0, compatibleWith: [2] }, // UV
              { id: 11, value: "PS", priceModifier: 15, timeModifier: 0, compatibleWith: [2] }, // UV
            ],
            isRequired: true,
            displayOrder: 2,
            priceModifier: 0,
          },
          {
            id: 3,
            attributeId: 3,
            attributeName: "Acabamento",
            attributeSlug: "acabamento",
            attributeType: "select",
            values: [
              { id: 12, value: "Bastão Vertical", priceModifier: 10, timeModifier: 0 },
              { id: 13, value: "Bastão Horizontal", priceModifier: 10, timeModifier: 0 },
              { id: 14, value: "Corte Reto", priceModifier: 5, timeModifier: 0 },
              { id: 15, value: "Corte Especial", priceModifier: 25, timeModifier: 0 },
              { id: 16, value: "Canteamento", priceModifier: 15, timeModifier: 0 },
              { id: 17, value: "Meio Corte", priceModifier: 8, timeModifier: 0 },
              { id: 18, value: "Ilhós", priceModifier: 12, timeModifier: 0 },
              { id: 19, value: "Ilhós + Proteção UV", priceModifier: 18, timeModifier: 0 },
              { id: 20, value: "Ilhós + Proteção UV + Reforço", priceModifier: 25, timeModifier: 0 },
              { id: 21, value: "Sem Acabamento + Verniz", priceModifier: 8, timeModifier: 0 },
              { id: 22, value: "Sem Acabamento", priceModifier: 0, timeModifier: 0 },
              { id: 23, value: "Laminação Brilho", priceModifier: 20, timeModifier: 0 },
            ],
            isRequired: false,
            displayOrder: 3,
            priceModifier: 0,
          },
          {
            id: 4,
            attributeId: 4,
            attributeName: "Tipo de Finalização",
            attributeSlug: "tipo-finalizacao",
            attributeType: "select",
            values: [
              { id: 24, value: "Verniz Total Brilho", priceModifier: 15, timeModifier: 0 },
              { id: 25, value: "Verniz UV Local", priceModifier: 20, timeModifier: 0 },
              { id: 26, value: "Sem Verniz UV", priceModifier: 0, timeModifier: 0 },
              { id: 27, value: "Plastificação", priceModifier: 18, timeModifier: 0 },
              { id: 28, value: "Corte Especial", priceModifier: 25, timeModifier: 0 },
              { id: 29, value: "Corte Eletrônico", priceModifier: 30, timeModifier: 0 },
              { id: 30, value: "Vinco", priceModifier: 10, timeModifier: 0 },
              { id: 31, value: "Dobra Central", priceModifier: 12, timeModifier: 0 },
              { id: 32, value: "Dobra Sanfona", priceModifier: 14, timeModifier: 0 },
              { id: 33, value: "Dobra Janela", priceModifier: 16, timeModifier: 0 },
              { id: 34, value: "Dobra Carteira", priceModifier: 16, timeModifier: 0 },
              { id: 35, value: "Serrilha", priceModifier: 8, timeModifier: 0 },
              { id: 36, value: "Furo", priceModifier: 5, timeModifier: 0 },
              { id: 37, value: "Ilhós", priceModifier: 12, timeModifier: 0 },
              { id: 38, value: "Laminação Brilho", priceModifier: 20, timeModifier: 0 },
              { id: 39, value: "Sem Revestimento", priceModifier: 0, timeModifier: 0 },
              { id: 40, value: "Laminação Fosca", priceModifier: 22, timeModifier: 0 },
              { id: 41, value: "Laminação Holográfica", priceModifier: 35, timeModifier: 0 },
              { id: 42, value: "Refile", priceModifier: 6, timeModifier: 0 },
              { id: 43, value: "Hot Stamping", priceModifier: 40, timeModifier: 0 },
              { id: 44, value: "2 Cantos Arredondados", priceModifier: 8, timeModifier: 0 },
              { id: 45, value: "4 Cantos Arredondados", priceModifier: 12, timeModifier: 0 },
              { id: 46, value: "Faca Especial", priceModifier: 28, timeModifier: 0 },
              { id: 47, value: "Espiral", priceModifier: 15, timeModifier: 0 },
              { id: 48, value: "Cola", priceModifier: 10, timeModifier: 0 },
              { id: 49, value: "Blocagem", priceModifier: 20, timeModifier: 0 },
              { id: 50, value: "Wire-O", priceModifier: 18, timeModifier: 0 },
              { id: 51, value: "Encadernação", priceModifier: 25, timeModifier: 0 },
            ],
            isRequired: false,
            displayOrder: 4,
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
  }, [productId, memoizedVariationTypes]);

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

    totalPrice = basePrice + totalAdditionals;

    // Chamar callback com preço atualizado
    if (onPriceUpdate) {
      onPriceUpdate(totalPrice, {
        basePrice,
        additionals: totalAdditionals,
        selectedValues,
        dimensions,
        quantity,
      });
    }

    return totalPrice;
  }, [selectedValues, basePrice, calculatorConfig, calculationType, dimensions, quantity, attributes, onPriceUpdate]);

  const handleAttributeSelect = (attributeId: number, valueId: number) => {
    setSelectedValues((prev) => ({
      ...prev,
      [attributeId]: valueId,
    }));
  };

  const requiredFieldsFilled = attributes
    .filter((attr) => attr.isRequired)
    .every((attr) => selectedValues[attr.id] !== undefined);

  const filledCount = Object.keys(selectedValues).length;
  const requiredCount = attributes.filter((attr) => attr.isRequired).length;

  // Funcao para filtrar opcoes baseado na selecao de Impressao
  const getFilteredValues = (attribute: ProductAttribute) => {
    const selectedPrintingId = selectedValues[1]; // ID do atributo Impressao
    
    // Se for o atributo Tipo de Material
    if (attribute.id === 2 && selectedPrintingId) {
      // Filtrar baseado na compatibilidade
      return attribute.values.filter(
        (v) => !v.compatibleWith || v.compatibleWith.includes(selectedPrintingId)
      );
    }
    
    return attribute.values;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Carregando configurações...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Produto</CardTitle>
          <CardDescription>Customize seu produto selecionando as opções abaixo</CardDescription>
          <div className="mt-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3">
            <div className="text-sm font-medium text-orange-900">
              {filledCount} de {requiredCount} campos preenchidos
            </div>
            <div className="mt-2 w-full bg-orange-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(filledCount / requiredCount) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {attributes.map((attribute, index) => (
            <Card key={attribute.id} className="border-2 border-orange-200">
              <CardHeader
                className="cursor-pointer hover:bg-orange-50 transition-colors"
                onClick={() =>
                  setExpandedAttribute(
                    expandedAttribute === attribute.id ? null : attribute.id
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {attribute.attributeName}
                        {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </CardTitle>
                      <CardDescription>
                        {selectedValues[attribute.id]
                          ? attribute.values.find((v) => v.id === selectedValues[attribute.id])?.value
                          : "Não selecionado"}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
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
                        <SelectContent className="max-h-96">
                          {getFilteredValues(attribute).map((value) => (
                            <SelectItem key={value.id} value={value.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{value.value}</span>
                                {value.priceModifier > 0 && (
                                  <span className="text-orange-500 ml-2 font-semibold">
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
                </CardContent>
              )}
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-900">Preço Total Estimado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Preço Base:</span>
            <span className="text-lg font-semibold">R$ {basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Adicionais:</span>
            <span className="text-lg font-semibold text-orange-600">
              R$ {(calculatedPrice - basePrice).toFixed(2)}
            </span>
          </div>
          <div className="border-t-2 border-orange-300 pt-3 flex justify-between items-center">
            <span className="text-lg font-bold text-orange-900">Total:</span>
            <span className="text-2xl font-bold text-orange-600">
              R$ {calculatedPrice.toFixed(2)}
            </span>
          </div>
          {!requiredFieldsFilled && (
            <Alert className="mt-4 bg-orange-100 border-orange-300">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Preencha todos os campos obrigatórios
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
