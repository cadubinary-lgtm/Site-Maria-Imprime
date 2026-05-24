import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AttributeOption {
  id: string;
  label: string;
  description?: string;
  priceModifier?: number;
  leadTimeModifier?: number;
  icon?: string;
}

interface ConfiguradorStep {
  id: string;
  title: string;
  description?: string;
  type: 'radio' | 'checkbox' | 'quantity';
  attributes: AttributeOption[];
  required: boolean;
  visible: boolean;
}

interface ConfiguradorVisualProps {
  steps: ConfiguradorStep[];
  onSelectionChange: (stepId: string, selectedValues: string | string[]) => void;
  selectedValues: Record<string, string | string[]>;
  onPriceUpdate?: (totalPrice: number) => void;
  basePrice: number;
}

export const ConfiguradorVisual: React.FC<ConfiguradorVisualProps> = ({
  steps,
  onSelectionChange,
  selectedValues,
  onPriceUpdate,
  basePrice,
}) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(steps[0]?.id || null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Calcular preço total baseado em seleções
  const totalPrice = useMemo(() => {
    let price = basePrice;
    
    Object.entries(selectedValues).forEach(([stepId, values]) => {
      const step = steps.find(s => s.id === stepId);
      if (!step) return;

      const selectedArray = Array.isArray(values) ? values : [values];
      selectedArray.forEach(value => {
        const attr = step.attributes.find(a => a.id === value);
        if (attr?.priceModifier) {
          price += attr.priceModifier;
        }
      });
    });

    return price;
  }, [selectedValues, steps, basePrice]);

  // Atualizar preço no componente pai usando useEffect
  useEffect(() => {
    onPriceUpdate?.(totalPrice);
  }, [totalPrice, onPriceUpdate]);

  const handleStepSelect = (stepId: string, value: string | string[]) => {
    onSelectionChange(stepId, value);
    
    // Marcar step como completo
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
  };

  const visibleSteps = steps.filter(step => step.visible);
  const completionPercentage = Math.round((completedSteps.size / visibleSteps.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm text-gray-700">Configuração do Produto</h3>
          <span className="text-xs font-medium text-orange-600">{completionPercentage}% completo</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {visibleSteps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            stepNumber={index + 1}
            isExpanded={expandedStep === step.id}
            isCompleted={completedSteps.has(step.id)}
            selectedValue={selectedValues[step.id]}
            onToggle={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
            onSelect={(value) => handleStepSelect(step.id, value)}
          />
        ))}
      </div>

      {/* Resumo de Preço */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Preço Total Estimado</p>
            <p className="text-2xl font-bold text-orange-600">R$ {totalPrice.toFixed(2)}</p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Preço Base: R$ {basePrice.toFixed(2)}</p>
            <p>Adicionais: R$ {(totalPrice - basePrice).toFixed(2)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface StepCardProps {
  step: ConfiguradorStep;
  stepNumber: number;
  isExpanded: boolean;
  isCompleted: boolean;
  selectedValue: string | string[] | undefined;
  onToggle: () => void;
  onSelect: (value: string | string[]) => void;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  stepNumber,
  isExpanded,
  isCompleted,
  selectedValue,
  onToggle,
  onSelect,
}) => {
  const [localValues, setLocalValues] = useState<string[]>(
    Array.isArray(selectedValue) ? selectedValue : selectedValue ? [selectedValue] : []
  );

  const handleRadioChange = (value: string) => {
    onSelect(value);
  };

  const handleCheckboxChange = (value: string, checked: boolean) => {
    const newValues = checked
      ? [...localValues, value]
      : localValues.filter(v => v !== value);
    setLocalValues(newValues);
    onSelect(newValues);
  };

  const getSelectedLabel = () => {
    if (step.type === 'radio' && selectedValue) {
      const attr = step.attributes.find(a => a.id === selectedValue);
      return attr?.label || 'Selecione uma opção';
    }
    if (step.type === 'checkbox' && Array.isArray(selectedValue)) {
      return `${selectedValue.length} selecionado(s)`;
    }
    if (step.type === 'quantity') {
      return selectedValue ? `${selectedValue} unidades` : 'Selecione a quantidade';
    }
    return 'Não selecionado';
  };

  return (
    <Card className={`border-2 transition-all ${
      isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-orange-300'
    }`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-3 text-left flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
            isCompleted ? 'bg-green-500 text-white' : 'bg-orange-100 text-orange-600'
          }`}>
            {isCompleted ? '✓' : stepNumber}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{step.title}</h4>
            {step.description && (
              <p className="text-xs text-gray-500 mt-1">{step.description}</p>
            )}
            <p className="text-sm text-gray-600 mt-2">{getSelectedLabel()}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {step.type === 'radio' && (
            <RadioGroup value={selectedValue as string || ''} onValueChange={handleRadioChange}>
              <div className="space-y-3">
                {step.attributes.map(attr => (
                  <div key={attr.id} className="flex items-start space-x-3">
                    <RadioGroupItem value={attr.id} id={attr.id} className="mt-1" />
                    <Label htmlFor={attr.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{attr.label}</p>
                          {attr.description && (
                            <p className="text-xs text-gray-500 mt-1">{attr.description}</p>
                          )}
                        </div>
                        {attr.priceModifier && attr.priceModifier > 0 && (
                          <span className="text-sm font-semibold text-orange-600">
                            +R$ {attr.priceModifier.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {step.type === 'checkbox' && (
            <div className="space-y-3">
              {step.attributes.map(attr => (
                <div key={attr.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={attr.id}
                    checked={localValues.includes(attr.id)}
                    onCheckedChange={(checked) => handleCheckboxChange(attr.id, checked as boolean)}
                  />
                  <Label htmlFor={attr.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{attr.label}</p>
                        {attr.description && (
                          <p className="text-xs text-gray-500 mt-1">{attr.description}</p>
                        )}
                      </div>
                      {attr.priceModifier && attr.priceModifier > 0 && (
                        <span className="text-sm font-semibold text-orange-600">
                          +R$ {attr.priceModifier.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}

          {step.type === 'quantity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 1000].map(qty => (
                  <Button
                    key={qty}
                    variant={selectedValue === String(qty) ? 'default' : 'outline'}
                    className="text-sm"
                    onClick={() => onSelect(String(qty))}
                  >
                    {qty}
                  </Button>
                ))}
              </div>
              <div>
                <Label htmlFor="custom-qty" className="text-sm">Quantidade customizada</Label>
                <Input
                  id="custom-qty"
                  type="number"
                  min="1"
                  placeholder="Digite a quantidade"
                  value={selectedValue || ''}
                  onChange={(e) => onSelect(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
