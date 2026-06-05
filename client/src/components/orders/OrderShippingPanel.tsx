import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, DollarSign, Clock } from "lucide-react";

interface OrderShippingPanelProps {
  shippingMethod?: string;
  shippingPrice?: number | string;
  deliveryZipCode?: string;
  deliveryStreet?: string;
  deliveryNumber?: string;
  deliveryComplement?: string;
  deliveryNeighborhood?: string;
  deliveryCity?: string;
  deliveryState?: string;
}

const SHIPPING_METHODS: Record<string, { label: string; icon: string; color: string }> = {
  pickup: { label: "Retirada na Loja", icon: "🏪", color: "bg-green-100 text-green-800" },
  moto_express: { label: "Moto Express", icon: "🛵", color: "bg-orange-100 text-orange-800" },
  carrier_1: { label: "Transportadora 1", icon: "🚛", color: "bg-blue-100 text-blue-800" },
  carrier_2: { label: "Transportadora 2", icon: "🚛", color: "bg-blue-100 text-blue-800" },
  carrier_3: { label: "Transportadora 3", icon: "🚛", color: "bg-blue-100 text-blue-800" },
};

export function OrderShippingPanel({
  shippingMethod,
  shippingPrice,
  deliveryZipCode,
  deliveryStreet,
  deliveryNumber,
  deliveryComplement,
  deliveryNeighborhood,
  deliveryCity,
  deliveryState,
}: OrderShippingPanelProps) {
  const methodInfo = SHIPPING_METHODS[shippingMethod || ""] || {
    label: shippingMethod || "Não informado",
    icon: "📦",
    color: "bg-gray-100 text-gray-800",
  };

  const formattedPrice = shippingPrice
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        typeof shippingPrice === "string" ? parseFloat(shippingPrice) : shippingPrice
      )
    : "Grátis";

  const isPickup = shippingMethod === "pickup";

  return (
    <Card className="border-teal-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="w-5 h-5 text-teal-600" />
          Logística e Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Método de Entrega */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Método de Entrega</p>
          <Badge className={methodInfo.color}>
            <span className="mr-2">{methodInfo.icon}</span>
            {methodInfo.label}
          </Badge>
        </div>

        {/* Valor do Frete */}
        <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
          <DollarSign className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-teal-600 font-medium">Valor do Frete</p>
            <p className="font-bold text-teal-900">{formattedPrice}</p>
          </div>
        </div>

        {/* Endereço de Entrega (se não for retirada) */}
        {!isPickup && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço de Entrega
            </p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              {deliveryZipCode && (
                <div>
                  <p className="text-xs text-gray-500">CEP</p>
                  <p className="font-mono font-semibold text-gray-900">{deliveryZipCode}</p>
                </div>
              )}
              {deliveryStreet && (
                <div>
                  <p className="text-xs text-gray-500">Endereço</p>
                  <p className="text-gray-900">
                    {deliveryStreet}, {deliveryNumber}
                    {deliveryComplement && ` - ${deliveryComplement}`}
                  </p>
                </div>
              )}
              {deliveryNeighborhood && (
                <div>
                  <p className="text-xs text-gray-500">Bairro</p>
                  <p className="text-gray-900">{deliveryNeighborhood}</p>
                </div>
              )}
              {deliveryCity && (
                <div>
                  <p className="text-xs text-gray-500">Cidade/UF</p>
                  <p className="text-gray-900">
                    {deliveryCity}, {deliveryState}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retirada na Loja */}
        {isPickup && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Local de Retirada
            </p>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-sm text-green-800 font-medium">🏪 Nossa Loja</p>
              <p className="text-xs text-green-600 mt-1">
                O cliente retirará o pedido diretamente em nossa loja após a produção estar pronta.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
