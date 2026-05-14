import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { CalculatorInput } from './CalculatorInput';
import {
  calculatePrice,
  calculateLeadTime,
  calculateArea,
  formatPrice,
  validateSelections,
  ProductVariationConfig,
  VariationSelection,
  AttributeType,
} from '@/lib/variation-engine';

interface VariationCalculatorProps {
  config: ProductVariationConfig;
  onPriceUpdate?: (price: number) => void;
  onLeadTimeUpdate?: (days: number) => void;
  onSelectionChange?: (selections: VariationSelection) => void;
  baseArea?: number; // Área base em m²
}

/**
 * Componente de calculadora de preço com variações dinâmicas
 * Integra CalculatorInput com engine de variações
 */
export const VariationCalculator: React.FC<VariationCalculatorProps> = ({
  config,
  onPriceUpdate,
  onLeadTimeUpdate,
  onSelectionChange,
  baseArea = 0,
}) => {
  const [selections, setSelections] = useState<VariationSelection>({});
  const [widthCm, setWidthCm] = useState(0);
  const [heightCm, setHeightCm] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Calcular área baseado em largura e altura
  const calculatedArea = useMemo(() => {
    if (baseArea > 0) return baseArea;
    return calculateArea(widthCm / 100, heightCm / 100);
  }, [widthCm, heightCm, baseArea]);

  // Calcular preço final
  const finalPrice = useMemo(() => {
    return calculatePrice(config, selections, calculatedArea);
  }, [config, selections, calculatedArea]);

  // Calcular prazo de produção
  const leadTime = useMemo(() => {
    return calculateLeadTime(config, selections);
  }, [config, selections]);

  // Validar seleções
  const validation = useMemo(() => {
    return validateSelections(config, selections);
  }, [config, selections]);

  // Calcular percentual de conclusão
  useEffect(() => {
    const requiredAttributes = config.attributes.filter((a) => a.required);
    if (requiredAttributes.length === 0) {
      setCompletionPercentage(100);
      return;
    }

    const completedCount = requiredAttributes.filter((a) => selections[a.id]).length;
    setCompletionPercentage(Math.round((completedCount / requiredAttributes.length) * 100));
  }, [selections, config.attributes]);

  // Notificar mudanças
  useEffect(() => {
    onPriceUpdate?.(finalPrice);
  }, [finalPrice, onPriceUpdate]);

  useEffect(() => {
    onLeadTimeUpdate?.(leadTime);
  }, [leadTime, onLeadTimeUpdate]);

  useEffect(() => {
    onSelectionChange?.(selections);
  }, [selections, onSelectionChange]);

  const handleAttributeChange = (attributeId: number, valueId: string) => {
    setSelections((prev) => ({
      ...prev,
      [attributeId]: parseInt(valueId, 10),
    }));
  };

  const getAttributeLabel = (type: AttributeType): string => {
    const labels: Record<AttributeType, string> = {
      print_type: 'Tipo de Impressão',
      material: 'Material',
      weight: 'Gramatura',
      finishing: 'Acabamento',
      format: 'Formato',
      color: 'Cor de Impressão',
      quantity: 'Quantidade',
      lead_time: 'Prazo de Produção',
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      {/* Calculadora de Dimensões */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensões</CardTitle>
          <CardDescription>Configure as medidas do seu produto</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <CalculatorInput
            label="Largura"
            value={widthCm}
            onChange={setWidthCm}
            unit="cm"
            placeholder="0.00"
          />
          <CalculatorInput
            label="Altura"
            value={heightCm}
            onChange={setHeightCm}
            unit="cm"
            placeholder="0.00"
          />
          {calculatedArea > 0 && (
            <div className="col-span-2 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Área calculada:</span> {(calculatedArea).toFixed(4)} m²
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Selecione as opções do seu produto</CardDescription>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">{completionPercentage}% configurado</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.attributes.map((attr) => (
            <div key={attr.id} className="space-y-2">
              <label className="text-sm font-medium">
                {getAttributeLabel(attr.type)}
                {attr.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <Select
                value={selections[attr.id]?.toString() || ''}
                onValueChange={(value) => handleAttributeChange(attr.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione ${getAttributeLabel(attr.type).toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {attr.values.map((value) => (
                    <SelectItem key={value.id} value={value.id.toString()}>
                      <span>{value.name}</span>
                      {value.priceModifier !== 0 && (
                        <span className="text-gray-500 ml-2">
                          {value.priceModifier > 0 ? '+' : ''}{formatPrice(value.priceModifier)}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {/* Validação */}
          {!validation.valid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Campos obrigatórios faltando: {validation.missingAttributes.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {validation.valid && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Configuração completa! Pronto para solicitar orçamento.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resumo de Preço */}
      <Card className="border-2 border-red-600">
        <CardHeader>
          <CardTitle className="text-red-600">Resumo do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Preço Base:</span>
            <span className="font-semibold">{formatPrice(config.basePrice)}</span>
          </div>

          {Object.entries(selections).length > 0 && (
            <>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Modificadores:</span>
                  <span className="font-semibold">
                    {formatPrice(
                      Object.entries(selections).reduce((acc, [attrId, valueId]) => {
                        const attr = config.attributes.find((a) => a.id === parseInt(attrId, 10));
                        if (!attr) return acc;
                        const value = attr.values.find((v) => v.id === valueId);
                        return acc + (value?.priceModifier || 0);
                      }, 0)
                    )}
                  </span>
                </div>
              </div>

              {calculatedArea > 0 && (
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Área: {calculatedArea.toFixed(4)} m²</span>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between items-center text-lg">
                <span className="font-bold">Preço Total:</span>
                <span className="font-bold text-red-600 text-2xl">{formatPrice(finalPrice)}</span>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Prazo de Entrega:</span>
                <span className="font-semibold">{leadTime} dias úteis</span>
              </div>
            </>
          )}

          {Object.entries(selections).length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Selecione as configurações para ver o preço total
            </p>
          )}
        </CardContent>
      </Card>

      {/* Botão de Ação */}
      {validation.valid && (
        <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg">
          Solicitar Orçamento
        </Button>
      )}
    </div>
  );
};
