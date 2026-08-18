import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, DollarSign } from "lucide-react";

interface OrderShippingPanelProps {
  shippingMethod?: string;
  shippingLabel?: string;
  shippingPrice?: number | string;
  shippingEstimatedDays?: number | null;
  deliveryZipCode?: string;
  deliveryStreet?: string;
  deliveryNumber?: string;
  deliveryComplement?: string;
  deliveryNeighborhood?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryFullName?: string;
}

const SHIPPING_METHODS: Record<string, { label: string; icon: string; color: string }> = {
  pickup: { label: "Retirada na loja", icon: "🏪", color: "bg-green-100 text-green-800" },
  moto_express: { label: "Moto express", icon: "🛵", color: "bg-orange-100 text-orange-800" },
  carrier_1: { label: "Transportadora 1", icon: "🚛", color: "bg-blue-100 text-blue-800" },
  carrier_2: { label: "Transportadora 2", icon: "🚛", color: "bg-blue-100 text-blue-800" },
  carrier_3: { label: "Transportadora 3", icon: "🚛", color: "bg-blue-100 text-blue-800" },
};

export function OrderShippingPanel({
  shippingMethod,
  shippingLabel,
  shippingPrice,
  shippingEstimatedDays,
  deliveryZipCode,
  deliveryStreet,
  deliveryNumber,
  deliveryComplement,
  deliveryNeighborhood,
  deliveryCity,
  deliveryState,
  deliveryFullName,
}: OrderShippingPanelProps) {
  const configuredMethod = SHIPPING_METHODS[shippingMethod || ""];
  const methodInfo = {
    label: shippingLabel?.trim() || configuredMethod?.label || shippingMethod || "Não informado",
    icon: configuredMethod?.icon || "📦",
    color: configuredMethod?.color || "bg-gray-100 text-gray-800",
  };
  const shippingAmount = Number(shippingPrice ?? 0);
  const formattedPrice = Number.isFinite(shippingAmount) && shippingAmount > 0
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(shippingAmount)
    : "Grátis";
  const isPickup = [shippingMethod, shippingLabel]
    .filter(Boolean)
    .some((method) => /pickup|retirada/i.test(String(method)));
  const hasAddress = Boolean(deliveryStreet || deliveryZipCode || deliveryCity);
  const cityState = [deliveryCity, deliveryState].filter(Boolean).join(", ");

  return (
    <Card className="border-pink-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="w-5 h-5 text-pink-600" aria-hidden="true" />
          Logística e entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Método de entrega</p>
          <Badge className={methodInfo.color} aria-label={`Método de entrega: ${methodInfo.label}`}>
            <span className="mr-2" aria-hidden="true">{methodInfo.icon}</span>
            {methodInfo.label}
          </Badge>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-pink-200 bg-pink-50 p-3">
          <DollarSign className="w-5 h-5 flex-shrink-0 text-pink-600" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-pink-700">Valor do frete</p>
            <p className="font-bold text-gray-900">{formattedPrice}</p>
            {shippingEstimatedDays && shippingEstimatedDays > 0 && (
              <p className="mt-0.5 text-xs text-gray-600">Previsão: até {shippingEstimatedDays} dia{shippingEstimatedDays !== 1 ? "s úteis" : " útil"}</p>
            )}
          </div>
        </div>

        {!isPickup && hasAddress && (
          <div className="space-y-2 border-t pt-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MapPin className="w-4 h-4 text-pink-600" aria-hidden="true" />
              Endereço de entrega
            </p>
            <div className="space-y-2 rounded-lg bg-gray-50 p-3 text-sm" role="list" aria-label="Endereço de entrega">
              {deliveryFullName && (
                <div role="listitem">
                  <p className="text-xs text-gray-500">Destinatário</p>
                  <p className="font-medium text-gray-900">{deliveryFullName}</p>
                </div>
              )}
              {deliveryZipCode && (
                <div role="listitem">
                  <p className="text-xs text-gray-500">CEP</p>
                  <p className="font-mono font-semibold text-gray-900">{deliveryZipCode}</p>
                </div>
              )}
              {deliveryStreet && (
                <div role="listitem">
                  <p className="text-xs text-gray-500">Endereço</p>
                  <p className="text-gray-900">{deliveryStreet}{deliveryNumber ? `, ${deliveryNumber}` : ""}{deliveryComplement ? ` — ${deliveryComplement}` : ""}</p>
                </div>
              )}
              {deliveryNeighborhood && (
                <div role="listitem">
                  <p className="text-xs text-gray-500">Bairro</p>
                  <p className="text-gray-900">{deliveryNeighborhood}</p>
                </div>
              )}
              {cityState && (
                <div role="listitem">
                  <p className="text-xs text-gray-500">Cidade/UF</p>
                  <p className="text-gray-900">{cityState}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isPickup && !hasAddress && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">O endereço de entrega ainda não foi informado no pedido.</p>
        )}

        {isPickup && (
          <div className="space-y-2 border-t pt-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MapPin className="w-4 h-4 text-green-600" aria-hidden="true" />
              Local de retirada
            </p>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-800">Retirada na loja</p>
              <p className="mt-1 text-xs text-green-700">O pedido será disponibilizado para retirada após a confirmação de produção.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
