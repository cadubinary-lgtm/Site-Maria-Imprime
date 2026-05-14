import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AttributeOption {
  id: number;
  name: string;
  priceModifier: number;
}

export interface ProductAttribute {
  id: number;
  name: string;
  category: string;
  options: AttributeOption[];
  required?: boolean;
}

export interface ProductConfigurationCardsProps {
  productName: string;
  basePrice: number;
  attributes: ProductAttribute[];
  onSelectionChange?: (selections: Record<number, number>) => void;
}

export function ProductConfigurationCards({
  productName,
  basePrice,
  attributes,
  onSelectionChange,
}: ProductConfigurationCardsProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [selections, setSelections] = useState<Record<number, number>>({});

  // Calcular preço total
  const totalPrice = useMemo(() => {
    let total = basePrice;
    Object.entries(selections).forEach(([attrId, optionId]) => {
      const attr = attributes.find((a) => a.id === Number(attrId));
      if (attr) {
        const option = attr.options.find((o) => o.id === optionId);
        if (option) {
          total += option.priceModifier;
        }
      }
    });
    return total;
  }, [selections, basePrice, attributes]);

  // Calcular progresso de configuração
  const completionPercentage = useMemo(() => {
    const requiredAttrs = attributes.filter((a) => a.required !== false).length;
    const selectedRequired = Object.entries(selections).filter(
      ([attrId]) => {
        const attr = attributes.find((a) => a.id === Number(attrId));
        return attr?.required !== false;
      }
    ).length;
    return requiredAttrs > 0 ? Math.round((selectedRequired / requiredAttrs) * 100) : 0;
  }, [selections, attributes]);

  const handleSelectOption = (attrId: number, optionId: number) => {
    const newSelections = { ...selections, [attrId]: optionId };
    setSelections(newSelections);
    onSelectionChange?.(newSelections);
  };

  const getSelectedOptionName = (attrId: number) => {
    const optionId = selections[attrId];
    if (!optionId) return "Não selecionado";
    const attr = attributes.find((a) => a.id === attrId);
    const option = attr?.options.find((o) => o.id === optionId);
    return option?.name || "Não selecionado";
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{productName}</h1>
      </div>

      {/* Seção de Configurações */}
      <Card className="mb-6 border-0 shadow-sm bg-gray-50">
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Configurações do Produto
            </h2>
            <p className="text-sm text-gray-600">
              Customize seu produto selecionando as opções abaixo
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Barra de Progresso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Configuração do Produto
          </span>
          <span className="text-sm font-semibold text-orange-600">
            {completionPercentage}% completo
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Cards de Atributos */}
      <div className="space-y-3 mb-8">
        {attributes.map((attr, index) => {
          const isExpanded = expandedCard === attr.id;
          const isSelected = selections[attr.id] !== undefined;

          return (
            <Card
              key={attr.id}
              className={`border-2 transition-all cursor-pointer ${
                isExpanded
                  ? "border-orange-500 bg-orange-50"
                  : isSelected
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() =>
                setExpandedCard(isExpanded ? null : attr.id)
              }
            >
              <CardContent className="p-4">
                {/* Header do Card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Número */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base">
                        {attr.name}
                      </h3>
                      <p
                        className={`text-sm mt-1 ${
                          isSelected
                            ? "text-green-700 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {getSelectedOptionName(attr.id)}
                      </p>
                    </div>
                  </div>

                  {/* Seta */}
                  <div className="flex-shrink-0 ml-2">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Conteúdo Expandido */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Select
                      value={selections[attr.id]?.toString() || ""}
                      onValueChange={(value) =>
                        handleSelectOption(attr.id, Number(value))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        {attr.options.map((option) => (
                          <SelectItem key={option.id} value={option.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{option.name}</span>
                              {option.priceModifier > 0 && (
                                <span className="text-xs text-gray-500">
                                  +R$ {(option.priceModifier / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo de Preço */}
      <Card className="border-0 shadow-lg bg-orange-50 sticky bottom-4">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Preço Base:</span>
              <span className="text-gray-900 font-medium">
                R$ {(basePrice / 100).toFixed(2)}
              </span>
            </div>

            {Object.entries(selections).some(([attrId, optionId]) => {
              const attr = attributes.find((a) => a.id === Number(attrId));
              const option = attr?.options.find((o) => o.id === optionId);
              return option && option.priceModifier > 0;
            }) && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Adicionais:</span>
                <span className="text-orange-600 font-medium">
                  +R${" "}
                  {(
                    Object.entries(selections).reduce((sum, [attrId, optionId]) => {
                      const attr = attributes.find((a) => a.id === Number(attrId));
                      const option = attr?.options.find((o) => o.id === optionId);
                      return sum + (option?.priceModifier || 0);
                    }, 0) / 100
                  ).toFixed(2)}
                </span>
              </div>
            )}

            <div className="border-t border-orange-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">
                  Preço Total Estimado:
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  R$ {(totalPrice / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg">
              Adicionar ao Carrinho
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
