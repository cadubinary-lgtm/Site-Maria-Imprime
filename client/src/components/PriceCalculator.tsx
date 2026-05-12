import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDeliveryDate, getVolumeDiscount } from "@/lib/price-calculator";
import type { PriceCalculationResult, DeadlineCalculationResult } from "@/lib/price-calculator";
import { TrendingDown, Calendar, AlertCircle } from "lucide-react";

interface PriceCalculatorProps {
  priceResult: PriceCalculationResult;
  deadlineResult: DeadlineCalculationResult;
  quantity: number;
  showBreakdown?: boolean;
}

export default function PriceCalculator({
  priceResult,
  deadlineResult,
  quantity,
  showBreakdown = true,
}: PriceCalculatorProps) {
  const volumeDiscount = getVolumeDiscount(quantity);

  return (
    <div className="space-y-4">
      {/* Resumo Principal */}
      <Card className="border-2 border-orange-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl">Resumo do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preço */}
          <div className="flex justify-between items-center pb-4 border-b">
            <div>
              <p className="text-gray-600 text-sm">Preço Total</p>
              <p className="text-3xl font-bold text-orange-600">{formatPrice(priceResult.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm">Por Unidade</p>
              <p className="text-xl font-semibold">{formatPrice(priceResult.pricePerUnit)}</p>
            </div>
          </div>

          {/* Prazo e Entrega */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Prazo de Entrega</p>
                <p className="font-semibold">{deadlineResult.totalDeadline} dias úteis</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600">Previsão</p>
              <p className="font-semibold text-sm">{formatDeliveryDate(deadlineResult.deliveryDate)}</p>
            </div>
          </div>

          {/* Desconto por Volume */}
          {volumeDiscount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-900">Desconto por Volume</p>
                <p className="text-xs text-green-700">{volumeDiscount}% de desconto aplicado</p>
              </div>
            </div>
          )}

          {/* Quantidade */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Quantidade</p>
            <p className="text-lg font-semibold">{quantity.toLocaleString("pt-BR")} unidades</p>
          </div>
        </CardContent>
      </Card>

      {/* Detalhamento (Opcional) */}
      {showBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhamento de Preços</CardTitle>
            <CardDescription>Veja como o preço foi calculado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priceResult.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.percentage !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {item.percentage}%
                      </Badge>
                    )}
                    <span className="font-semibold text-right min-w-[100px]">
                      {formatPrice(item.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avisos */}
      {priceResult.attributeModifiers > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Modificadores Aplicados</p>
            <p className="text-xs text-blue-700">
              {formatPrice(priceResult.attributeModifiers)} adicionado(s) pelos atributos selecionados
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
