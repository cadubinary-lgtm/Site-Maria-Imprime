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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="w-5 h-5 text-pink-600" aria-hidden="true" />
          Logística e entrega
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50" role="list" aria-label="Informações de logística e entrega">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="flex items-start gap-2 border-b border-gray-100 bg-white px-4 py-3 sm:border-b-0 sm:border-r" role="listitem">
              <Truck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-pink-500" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Método de entrega</p>
                <Badge className={`mt-1 ${methodInfo.color}`} aria-label={`Método de entrega: ${methodInfo.label}`}>
                  <span className="mr-1.5" aria-hidden="true">{methodInfo.icon}</span>
                  {methodInfo.label}
                </Badge>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-white px-4 py-3" role="listitem">
              <DollarSign className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-pink-500" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Frete</p>
                <p className={`mt-0.5 text-sm font-semibold ${shippingAmount > 0 ? "text-gray-800" : "text-green-700"}`}>{formattedPrice}</p>
                {shippingEstimatedDays && shippingEstimatedDays > 0 && <p className="mt-0.5 text-xs text-gray-500">Previsão: até {shippingEstimatedDays} dia{shippingEstimatedDays !== 1 ? "s úteis" : " útil"}</p>}
              </div>
            </div>
          </div>

          {!isPickup && hasAddress && (
            <div className="border-t border-gray-100 bg-white px-4 py-3" role="listitem">
              <div className="mb-3 flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-pink-500" aria-hidden="true" /><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Endereço de entrega</p></div>
              <div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2" role="list" aria-label="Endereço de entrega">
                {deliveryFullName && <div role="listitem"><p className="text-xs text-gray-500">Destinatário</p><p className="mt-0.5 font-medium text-gray-900">{deliveryFullName}</p></div>}
                {deliveryZipCode && <div role="listitem"><p className="text-xs text-gray-500">CEP</p><p className="mt-0.5 font-mono font-semibold text-gray-900">{deliveryZipCode}</p></div>}
                {deliveryStreet && <div className="sm:col-span-2" role="listitem"><p className="text-xs text-gray-500">Endereço</p><p className="mt-0.5 text-gray-900">{deliveryStreet}{deliveryNumber ? `, ${deliveryNumber}` : ""}{deliveryComplement ? ` — ${deliveryComplement}` : ""}</p></div>}
                {deliveryNeighborhood && <div role="listitem"><p className="text-xs text-gray-500">Bairro</p><p className="mt-0.5 text-gray-900">{deliveryNeighborhood}</p></div>}
                {cityState && <div role="listitem"><p className="text-xs text-gray-500">Cidade/UF</p><p className="mt-0.5 text-gray-900">{cityState}</p></div>}
              </div>
            </div>
          )}

          {!isPickup && !hasAddress && <div className="border-t border-gray-100 bg-white px-4 py-3 text-sm text-gray-600" role="listitem">O endereço de entrega ainda não foi informado no pedido.</div>}

          {isPickup && <div className="flex items-start gap-2 border-t border-gray-100 bg-white px-4 py-3" role="listitem"><MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" aria-hidden="true" /><div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Local de retirada</p><p className="mt-0.5 text-sm font-semibold text-emerald-800">Retirada na loja</p><p className="mt-0.5 text-xs text-emerald-700">O pedido será disponibilizado para retirada após a confirmação de produção.</p></div></div>}
        </div>
      </CardContent>
    </Card>
  );
}
