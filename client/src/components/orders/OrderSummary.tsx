/**
 * ========================================
 * OrderSummary Component
 * ========================================
 * Resumo lateral fixo com produto, atributos selecionados,
 * calculadora e preço em tempo real
 */

import React from "react";
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
  /** Preço já calculado pelo ProductConfigurator (total para m², unitário para unidade) */
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
  deliveryOption?: any;
  deliveryTax?: number;
  /** Indica explicitamente se é produto cobrado por m² */
  isAreaProduct?: boolean;
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
  deliveryOption,
  deliveryTax = 0,
  isAreaProduct: isAreaProductProp,
}) => {
  /**
   * Regras de cálculo:
   * - Produto m² (isAreaProduct=true): basePrice já é o total calculado pelo ProductConfigurator
   *   (inclui área × pricePerM2 × modificadores). NÃO multiplicar por quantity.
   * - Produto por unidade (isAreaProduct=false): basePrice é o preço unitário.
   *   Multiplicar por quantity para obter o total.
   */
  const isAreaProduct = isAreaProductProp === true || (calculatorValue !== undefined && calculatorValue > 0);
  const finalPrice = isAreaProduct ? basePrice : basePrice * quantity;

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

        {/* Preços */}
        <div className="space-y-2 pb-3 border-b">
          {isAreaProduct ? (
            <>
              {calculatorValue && calculatorValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Área</span>
                  <span className="font-semibold">{(calculatorValue / 10000).toFixed(2)} m²</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor calculado</span>
                <span className="font-semibold">R$ {basePrice.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Preço Unitário</span>
              <span className="font-semibold">R$ {basePrice.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Prazo */}
        {(deadline || deliveryOption) && (
          <div className="space-y-2 pb-3 border-b">
            <p className="text-xs font-medium text-muted-foreground">Prazo de Entrega</p>
            <p className="text-sm font-semibold text-green-600">
              {deliveryOption ? deliveryOption.name : deadline}
            </p>
            {deliveryOption && deliveryOption.daysToDeliver && (
              <p className="text-xs text-muted-foreground">
                {deliveryOption.daysToDeliver} dias úteis
              </p>
            )}
          </div>
        )}

        {/* Taxa de Prazo Expresso */}
        {deliveryTax > 0 && (
          <div className="space-y-2 pb-3 border-b">
            <p className="text-xs font-medium text-muted-foreground">Taxa Expressa</p>
            <p className="text-sm font-semibold text-orange-600">+R$ {deliveryTax.toFixed(2)}</p>
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
          {!isAreaProduct && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({quantity}x)</span>
              <span className="font-medium">R$ {(basePrice * quantity).toFixed(2)}</span>
            </div>
          )}
          {deliveryTax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa Expressa</span>
              <span className="font-medium text-orange-600">+R$ {deliveryTax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">R$ {(finalPrice + deliveryTax).toFixed(2)}</span>
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
