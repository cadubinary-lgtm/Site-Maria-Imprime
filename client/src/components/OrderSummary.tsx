/**
 * ========================================
 * OrderSummary Component
 * ========================================
 * Resumo lateral fixo com produto, atributos selecionados,
 * calculadora e preço em tempo real
 */

import React, { useMemo } from "react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface SelectedAttribute {
  name: string;
  value: string;
  priceModifier?: number;
}

interface OrderSummaryProps {
  productName: string;
  productImage?: string;
  basePrice: number;
  selectedAttributes: SelectedAttribute[];
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  isLoading?: boolean;
  calculatorValue?: number;
  onCalculatorChange?: (value: number) => void;
  deadline?: string;
  notes?: string;
  onNotesChange?: (notes: string) => void;
  width?: number;
  onWidthChange?: (width: number) => void;
  height?: number;
  onHeightChange?: (height: number) => void;
  deadline_type?: 'economico' | 'expresso';
  onDeadlineTypeChange?: (type: 'economico' | 'expresso') => void;
  file_treatment?: 'padrao' | 'profissional';
  onFileTreatmentChange?: (type: 'padrao' | 'profissional') => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  productName,
  productImage,
  basePrice,
  selectedAttributes,
  quantity,
  onQuantityChange,
  onAddToCart,
  isLoading = false,
  calculatorValue,
  onCalculatorChange,
  deadline,
  notes,
  onNotesChange,
  width = 0,
  onWidthChange,
  height = 0,
  onHeightChange,
  deadline_type = 'economico',
  onDeadlineTypeChange,
  file_treatment = 'padrao',
  onFileTreatmentChange,
}) => {
  // Calcular modificadores de prazo e tratamento
  const fileTreatmentModifier = file_treatment === 'profissional' ? 21 : 0;
  const deadlineModifier = deadline_type === 'expresso' ? 15 : 0;

  // Calcular preço total com modificadores
  const totalModifier = useMemo(() => {
    return selectedAttributes.reduce((sum, attr) => {
      return sum + (attr.priceModifier || 0);
    }, 0) + fileTreatmentModifier + deadlineModifier;
  }, [selectedAttributes, fileTreatmentModifier, deadlineModifier]);

  const unitPrice = basePrice + totalModifier;
  const totalPrice = unitPrice * quantity;

  // Calcular preço com área (se aplicável)
  const priceWithArea = useMemo(() => {
    if (!calculatorValue || calculatorValue === 0) {
      return totalPrice;
    }
    // Exemplo: preço por m² = unitPrice / 10000 (conversão de cm² para m²)
    return (unitPrice * calculatorValue) / 10000 * quantity;
  }, [unitPrice, quantity, calculatorValue]);

  const finalPrice = calculatorValue ? priceWithArea : totalPrice;

  return (
    <Card className="sticky top-4 bg-card shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Imagem do Produto */}
        {productImage && (
          <div className="w-full h-32 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={productImage}
              alt={productName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Nome do Produto */}
        <div>
          <p className="text-xs text-muted-foreground">Produto</p>
          <p className="font-semibold text-sm line-clamp-2">{productName}</p>
        </div>

        {/* Atributos Selecionados */}
        {selectedAttributes.length > 0 && (
          <div className="space-y-2 pb-3 border-b">
            <p className="text-xs font-medium text-muted-foreground">
              Atributos Selecionados
            </p>
            {selectedAttributes.map((attr, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{attr.name}:</span>
                <span className="font-medium">{attr.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Dimensões */}
        {onWidthChange && onHeightChange && (
          <div className="space-y-3 pb-3 border-b">
            <p className="text-xs font-medium text-muted-foreground">Dimensões</p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Largura (m)</label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => onWidthChange(Number(e.target.value))}
                  placeholder="0.00"
                  step="0.01"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Altura (m)</label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => onHeightChange(Number(e.target.value))}
                  placeholder="0.00"
                  step="0.01"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Prazo de Produção */}
        {onDeadlineTypeChange && (
          <div className="space-y-2 pb-3 border-b">
            <p className="text-xs font-medium text-muted-foreground">Prazo de Produção</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deadline"
                  value="economico"
                  checked={deadline_type === 'economico'}
                  onChange={() => onDeadlineTypeChange('economico')}
                  className="w-4 h-4"
                />
                <span className="text-xs">Econômico (4 dias úteis)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deadline"
                  value="expresso"
                  checked={deadline_type === 'expresso'}
                  onChange={() => onDeadlineTypeChange('expresso')}
                  className="w-4 h-4"
                />
                <span className="text-xs">Expresso (3 dias úteis) +R$ 15,00</span>
              </label>
            </div>
          </div>
        )}

        {/* Tratamento de Arquivo */}
        {onFileTreatmentChange && (
          <div className="space-y-2 pb-3 border-b">
            <div className="flex items-center gap-1">
              <p className="text-xs font-medium text-muted-foreground">Tratamento de Arquivo</p>
              <span className="text-xs bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-help" title="Profissional: Ajuste de cores, dimensões e preparação completa">?</span>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="treatment"
                  value="padrao"
                  checked={file_treatment === 'padrao'}
                  onChange={() => onFileTreatmentChange('padrao')}
                  className="w-4 h-4"
                />
                <span className="text-xs">Padrão (R$ 0,00 - Grátis)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="treatment"
                  value="profissional"
                  checked={file_treatment === 'profissional'}
                  onChange={() => onFileTreatmentChange('profissional')}
                  className="w-4 h-4"
                />
                <span className="text-xs">Profissional (R$ 21,00)</span>
              </label>
            </div>
          </div>
        )}

        {/* Preços */}
        <div className="space-y-2 pb-3 border-b">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Preço Base</span>
            <span className="font-medium">R$ {basePrice.toFixed(2)}</span>
          </div>

          {totalModifier > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Modificadores</span>
              <span className="text-green-600 font-medium">
                +R$ {totalModifier.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm font-semibold">
            <span>Preço Unitário</span>
            <span>R$ {unitPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Calculadora (se aplicável) */}
        {calculatorValue !== undefined && onCalculatorChange && (
          <div className="space-y-2 pb-3 border-b">
            <p className="text-xs font-medium text-muted-foreground">
              Área (cm²)
            </p>
            <Input
              type="number"
              value={calculatorValue}
              onChange={(e) => onCalculatorChange(Number(e.target.value))}
              placeholder="Digite a área em cm²"
              className="text-sm"
            />
            {calculatorValue > 0 && (
              <p className="text-xs text-muted-foreground">
                ≈ {(calculatorValue / 10000).toFixed(2)} m²
              </p>
            )}
          </div>
        )}

        {/* Prazo */}
        {deadline && (
          <div className="space-y-2 pb-3 border-b">
            <p className="text-xs font-medium text-muted-foreground">Prazo de Entrega</p>
            <p className="text-sm font-semibold text-green-600">{deadline}</p>
          </div>
        )}

        {/* Observações */}
        {onNotesChange && (
          <div className="space-y-2 pb-3 border-b">
            <p className="text-xs font-medium text-muted-foreground">Observações</p>
            <textarea
              value={notes || ""}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Adicione observações sobre seu pedido..."
              className="w-full h-20 p-2 text-xs border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* Quantidade */}
        <div className="space-y-2 pb-3 border-b">
          <p className="text-xs font-medium text-muted-foreground">Quantidade</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(1, Number(e.target.value)))}
              className="text-center h-8 flex-1"
              min="1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuantityChange(quantity + 1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Total */}
        <div className="space-y-2 pb-4 border-b">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">R$ {(unitPrice * quantity).toFixed(2)}</span>
          </div>
          {calculatorValue && calculatorValue > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Com Área</span>
              <span className="font-medium">R$ {priceWithArea.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">R$ {finalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Botão Adicionar ao Carrinho */}
        <Button
          onClick={onAddToCart}
          disabled={isLoading}
          className="w-full h-10 gap-2"
          size="lg"
        >
          <ShoppingCart className="w-4 h-4" />
          {isLoading ? "Adicionando..." : "Adicionar ao Carrinho"}
        </Button>

        {/* Aviso de Termos */}
        <p className="text-xs text-center text-muted-foreground">
          Você será redirecionado para confirmar o pedido
        </p>
      </CardContent>
    </Card>
  );
};
