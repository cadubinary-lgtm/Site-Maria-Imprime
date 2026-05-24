import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProductAttribute {
  id: number;
  attributeId: number;
  productId: number;
  isRequired: boolean;
  allowMultiple: boolean;
  attribute?: {
    id: number;
    name: string;
    slug: string;
    type: string;
  };
  values: Array<{
    id: number;
    value: string;
    priceModifier: number;
  }>;
}

interface ProductConfigurationCardsProps {
  product: any;
  productAttributes: ProductAttribute[];
  selectedAttributes: Record<number, { valueIds: number[]; customValue?: string }>;
  onAttributeSelect: (attrId: number, valueIds: number[]) => void;
  basePrice: number;
}

export function ProductConfigurationCards({
  product,
  productAttributes,
  selectedAttributes,
  onAttributeSelect,
  basePrice,
}: ProductConfigurationCardsProps) {
  const [expandedAttribute, setExpandedAttribute] = useState<number | null>(null);

  // Calcular preço total
  const totalPrice = useMemo(() => {
    let price = basePrice;
    Object.entries(selectedAttributes).forEach(([attrId, selection]) => {
      const attr = productAttributes.find((pa) => pa.attributeId === Number(attrId));
      if (attr) {
        selection.valueIds.forEach((valueId) => {
          const value = attr.values.find((v) => v.id === valueId);
          if (value) {
            price += parseFloat(value.priceModifier.toString());
          }
        });
      }
    });
    return price;
  }, [selectedAttributes, productAttributes, basePrice]);

  // Calcular progresso de configuração
  const completionPercentage = useMemo(() => {
    const requiredAttributes = productAttributes.filter((pa) => pa.isRequired);
    if (requiredAttributes.length === 0) return 100;
    
    const completedAttributes = requiredAttributes.filter((pa) => {
      const selection = selectedAttributes[pa.attributeId];
      return selection && selection.valueIds.length > 0;
    });
    
    return Math.round((completedAttributes.length / requiredAttributes.length) * 100);
  }, [selectedAttributes, productAttributes]);

  const handleAttributeChange = (attrId: number, valueId: number, isMultiple: boolean) => {
    const current = selectedAttributes[attrId]?.valueIds || [];
    
    if (isMultiple) {
      // Checkbox: adicionar/remover
      const newValueIds = current.includes(valueId)
        ? current.filter((id) => id !== valueId)
        : [...current, valueId];
      onAttributeSelect(attrId, newValueIds);
    } else {
      // Radio: substituir
      onAttributeSelect(attrId, [valueId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Produto</CardTitle>
          <CardDescription>Customize seu produto selecionando as opções abaixo</CardDescription>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Configuração</span>
              <span className="font-semibold text-orange-600">{completionPercentage}% completo</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Cards de Atributos */}
      <div className="space-y-3">
        {productAttributes.map((attr, index) => {
          const isExpanded = expandedAttribute === attr.attributeId;
          const isSelected = selectedAttributes[attr.attributeId]?.valueIds?.length > 0;
          const selectedValue = attr.values.find(
            (v) => v.id === selectedAttributes[attr.attributeId]?.valueIds?.[0]
          );

          return (
            <Card
              key={attr.id}
              className={`cursor-pointer transition-all ${
                isExpanded
                  ? "border-blue-500 bg-blue-50"
                  : isSelected
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
              }`}
              onClick={() => setExpandedAttribute(isExpanded ? null : attr.attributeId)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Número Sequencial */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>

                    {/* Nome e Status */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{attr.attribute?.name}</h3>
                      <p className="text-sm text-gray-600">
                        {isSelected ? (
                          <span className="text-green-600 font-medium">
                            ✓ {selectedValue?.value || "Selecionado"}
                          </span>
                        ) : (
                          <span className="text-gray-500">Não selecionado</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Seta */}
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Conteúdo Expandido */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {attr.values.map((value) => (
                      <label key={value.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type={attr.allowMultiple ? "checkbox" : "radio"}
                          name={`attr-${attr.attributeId}`}
                          checked={selectedAttributes[attr.attributeId]?.valueIds?.includes(value.id) || false}
                          onChange={() =>
                            handleAttributeChange(attr.attributeId, value.id, attr.allowMultiple)
                          }
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{value.value}</span>
                          {value.priceModifier > 0 && (
                            <span className="text-sm text-orange-600 ml-2">
                              +R$ {value.priceModifier.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo de Preço */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Preço Base</span>
              <span className="text-gray-900">R$ {basePrice.toFixed(2)}</span>
            </div>
            {totalPrice > basePrice && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Adicionais</span>
                <span className="text-orange-600">+R$ {(totalPrice - basePrice).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between">
              <span className="font-bold text-gray-900">Preço Total Estimado</span>
              <span className="text-2xl font-bold text-orange-600">R$ {totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
