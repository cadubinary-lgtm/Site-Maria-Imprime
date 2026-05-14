import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { CalculatorInput } from './CalculatorInput';
import {
  getCategoryVariables,
  getProductCategories,
  calculateProductPrice,
  calculateProductLeadTime,
  calculateArea,
  formatPrice,
  validateProductSelections,
  getCompletionPercentage,
  CATEGORY_LABELS,
  FIXED_CATEGORIES,
  ProductVariationData,
  ProductSelection,
  AttributeCategory,
} from '@/lib/product-variation-engine';

interface ProductVariationAccordionProps {
  variationData: ProductVariationData;
  onPriceUpdate?: (price: number) => void;
  onLeadTimeUpdate?: (days: number) => void;
  onSelectionChange?: (selections: ProductSelection) => void;
  baseArea?: number;
}

/**
 * Componente de seletor de variáveis com layout de accordion
 * - Categorias fixas em retângulos com cantos arredondados
 * - Seta/Chevron para indicar expansão
 * - Variáveis aparecem ao clicar na categoria
 */
export const ProductVariationAccordion: React.FC<ProductVariationAccordionProps> = ({
  variationData,
  onPriceUpdate,
  onLeadTimeUpdate,
  onSelectionChange,
  baseArea = 0,
}) => {
  const [selections, setSelections] = useState<ProductSelection>({});
  const [expandedCategory, setExpandedCategory] = useState<AttributeCategory | null>(null);
  const [widthCm, setWidthCm] = useState(0);
  const [heightCm, setHeightCm] = useState(0);

  // Obter categorias com variáveis para este produto
  const productCategories = useMemo(() => {
    return getProductCategories(variationData);
  }, [variationData]);

  // Calcular área
  const calculatedArea = useMemo(() => {
    if (baseArea > 0) return baseArea;
    return calculateArea(widthCm / 100, heightCm / 100);
  }, [widthCm, heightCm, baseArea]);

  // Calcular preço final
  const finalPrice = useMemo(() => {
    return calculateProductPrice(variationData, selections, calculatedArea);
  }, [variationData, selections, calculatedArea]);

  // Calcular prazo
  const leadTime = useMemo(() => {
    return calculateProductLeadTime(variationData, selections);
  }, [variationData, selections]);

  // Validar seleções
  const validation = useMemo(() => {
    return validateProductSelections(variationData, selections);
  }, [variationData, selections]);

  // Calcular percentual de conclusão
  const completionPercentage = useMemo(() => {
    return getCompletionPercentage(variationData, selections);
  }, [variationData, selections]);

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

  const handleVariableChange = (variableId: number, valueId: string) => {
    setSelections((prev) => ({
      ...prev,
      [variableId]: parseInt(valueId, 10),
    }));
  };

  const toggleCategory = (category: AttributeCategory) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="space-y-6">
      {/* Calculadora de Dimensões */}
      {productCategories.includes('format') && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
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
                    <span className="font-semibold">Área calculada:</span> {calculatedArea.toFixed(4)} m²
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categorias em Accordion */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Configurações do Produto</h3>
          <div className="w-full bg-gray-200 rounded-full h-2 ml-4">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 ml-2 whitespace-nowrap">{completionPercentage}%</span>
        </div>

        {productCategories.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este produto não possui variáveis vinculadas. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {FIXED_CATEGORIES.map((category) => {
              const hasVariables = productCategories.includes(category);
              if (!hasVariables) return null;

              const categoryVariables = getCategoryVariables(variationData, category);
              const isExpanded = expandedCategory === category;
              const hasSelection = categoryVariables.some((v) => selections[v.id]);

              return (
                <div key={category}>
                  {/* Botão da Categoria */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                      isExpanded
                        ? 'bg-blue-50 border-blue-500'
                        : hasSelection
                          ? 'bg-green-50 border-green-500'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="font-medium text-gray-900">{CATEGORY_LABELS[category]}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-600 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Conteúdo Expandido */}
                  {isExpanded && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                      {categoryVariables.map((variable) => (
                        <div key={variable.id}>
                          <label className="text-sm font-medium text-gray-700">
                            {variable.name}
                            {variable.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <Select
                            value={selections[variable.id]?.toString() || ''}
                            onValueChange={(value) => handleVariableChange(variable.id, value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder={`Selecione ${variable.name.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {variable.values.map((value) => (
                                <SelectItem key={value.id} value={value.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span>{value.name}</span>
                                    {value.priceModifier !== 0 && (
                                      <span className="text-gray-500 text-sm">
                                        {value.priceModifier > 0 ? '+' : ''}{formatPrice(value.priceModifier)}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Validação */}
        {!validation.valid && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Campos obrigatórios faltando: {validation.missingVariables.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {validation.valid && productCategories.length > 0 && (
          <Alert className="bg-green-50 border-green-200 mt-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Configuração completa! Pronto para solicitar orçamento.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Resumo de Preço */}
      <Card className="border-2 border-red-600">
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Preço Base:</span>
            <span className="font-semibold">{formatPrice(variationData.basePrice)}</span>
          </div>

          {Object.entries(selections).length > 0 && (
            <>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Modificadores:</span>
                  <span className="font-semibold">
                    {formatPrice(
                      Object.entries(selections).reduce((acc, [varId, valueId]) => {
                        const variable = variationData.variables.find((v) => v.id === parseInt(varId, 10));
                        if (!variable) return acc;
                        const value = variable.values.find((v) => v.id === valueId);
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
        <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors">
          Solicitar Orçamento
        </button>
      )}
    </div>
  );
};
