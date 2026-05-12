import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDeliveryDate } from "@/lib/price-calculator";
import { AlertCircle, CheckCircle2, Package, Calendar, DollarSign } from "lucide-react";

export interface CartItem {
  id: string;
  productName: string;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  attributes: {
    material?: string;
    acabamento?: string;
    revestimento?: string;
    medidas?: string;
    [key: string]: string | undefined;
  };
  deadline: number;
  deliveryDate: Date;
  uploadedFiles: Array<{
    name: string;
    status: "pending" | "approved" | "rejected";
  }>;
  observations?: string;
}

interface CartSummaryProps {
  items: CartItem[];
  onRemoveItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
}

export default function CartSummary({
  items,
  onRemoveItem,
  onEditItem,
}: CartSummaryProps) {
  const totalPrice = items.reduce((sum, item) => sum + item.finalPrice, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const latestDelivery = items.length > 0
    ? new Date(Math.max(...items.map((item) => item.deliveryDate.getTime())))
    : new Date();

  return (
    <div className="space-y-4">
      {/* Resumo Geral */}
      <Card className="border-2 border-orange-500">
        <CardHeader>
          <CardTitle>Resumo do Carrinho</CardTitle>
          <CardDescription>{items.length} produto(s) adicionado(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Total de Unidades</p>
              <p className="text-2xl font-bold">{totalQuantity.toLocaleString("pt-BR")}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Entrega Prevista</p>
              <p className="text-sm font-semibold">{formatDeliveryDate(latestDelivery)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-orange-600">{formatPrice(totalPrice)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens do Carrinho */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.productName}</CardTitle>
                    <CardDescription>
                      {item.quantity.toLocaleString("pt-BR")} unidades
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      {formatPrice(item.finalPrice)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(item.finalPrice / item.quantity)} por unidade
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Atributos Técnicos */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3">Especificações Técnicas</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(item.attributes)
                      .filter(([, value]) => value !== undefined)
                      .map(([key, value]) => (
                        <div key={key}>
                          <p className="text-gray-600 capitalize">{key}</p>
                          <p className="font-medium">{value}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Prazo e Entrega */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Prazo</p>
                      <p className="font-semibold">{item.deadline} dias úteis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Entrega</p>
                      <p className="font-semibold text-sm">
                        {formatDeliveryDate(item.deliveryDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arquivos */}
                {item.uploadedFiles.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Arquivos de Arte</h4>
                    <div className="space-y-2">
                      {item.uploadedFiles.map((file, fileIndex) => (
                        <div key={fileIndex} className="flex items-center gap-2 text-sm">
                          {file.status === "approved" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : file.status === "rejected" ? (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          )}
                          <span>{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {file.status === "approved" ? "Aprovado" : file.status === "rejected" ? "Rejeitado" : "Pendente"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações */}
                {item.observations && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900 font-semibold mb-1">Observações da Produção</p>
                    <p className="text-sm text-blue-800">{item.observations}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2 pt-2 border-t">
                  {onEditItem && (
                    <button
                      onClick={() => onEditItem(item.id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                  )}
                  {onRemoveItem && (
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-sm text-red-600 hover:underline ml-auto"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Seu carrinho está vazio</p>
          </CardContent>
        </Card>
      )}

      {/* Resumo Final */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(totalPrice * 0.85)}</span>
            </div>
            <div className="flex justify-between">
              <span>Impostos (18%)</span>
              <span>{formatPrice(totalPrice * 0.15)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-600">{formatPrice(totalPrice)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
