import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Package, MapPin, Clock, CheckCircle2 } from "lucide-react";

const STATUS_STEPS = [
  { key: "aguardando", label: "Pedido Recebido", icon: "📋" },
  { key: "em_producao", label: "Em Produção", icon: "🖨️" },
  { key: "enviado", label: "Enviado", icon: "🚚" },
  { key: "entregue", label: "Entregue", icon: "✅" },
];

export default function OrderDetailPage() {
  const [, params] = useRoute("/pedido/:id");
  const [, setLocation] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : 0;

  const { data, isLoading, error } = trpc.checkout.getOrderById.useQuery(
    { id: orderId },
    { enabled: !!orderId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Package className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">Pedido não encontrado</h2>
        <Button onClick={() => setLocation("/meus-pedidos")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Meus Pedidos
        </Button>
      </div>
    );
  }

  const { order, items } = data;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const date = new Date(order.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => setLocation("/meus-pedidos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.orderNumber}</h1>
            <p className="text-gray-500 text-sm mt-1">Realizado em {date}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progresso do pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Status do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Linha de progresso */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200">
                    <div
                      className="h-full bg-orange-500 transition-all duration-500"
                      style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                    />
                  </div>

                  <div className="relative flex justify-between">
                    {STATUS_STEPS.map((step, i) => {
                      const isCompleted = i <= currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                              isCompleted
                                ? "bg-orange-500 border-orange-500 text-white"
                                : "bg-white border-gray-200 text-gray-300"
                            } ${isCurrent ? "ring-4 ring-orange-100" : ""}`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                          </div>
                          <span
                            className={`text-xs text-center font-medium max-w-16 ${
                              isCompleted ? "text-orange-600" : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itens do pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="w-4 h-4 text-orange-500" />
                  Itens do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-14 h-14 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{item.productName ?? "Produto"}</p>
                      <p className="text-xs text-gray-500">Quantidade: {item.quantity}</p>
                      {item.selectedAttributes && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {(() => {
                            try {
                              const attrs = JSON.parse(item.selectedAttributes);
                              return Object.entries(attrs)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" • ");
                            } catch {
                              return item.selectedAttributes;
                            }
                          })()}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">Obs: {item.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Unitário</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        R$ {parseFloat(item.priceAtOrder).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Total: R$ {(parseFloat(item.priceAtOrder) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Endereço de entrega */}
            {order.deliveryStreet && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-gray-800">{order.deliveryFullName}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.deliveryStreet}, {order.deliveryNumber}
                    {order.deliveryComplement ? `, ${order.deliveryComplement}` : ""}
                  </p>
                  <p className="text-sm text-gray-600">{order.deliveryNeighborhood}</p>
                  <p className="text-sm text-gray-600">
                    {order.deliveryCity} - {order.deliveryState}
                  </p>
                  <p className="text-sm text-gray-600">CEP: {order.deliveryZipCode}</p>
                  {order.deliveryPhone && (
                    <p className="text-sm text-gray-600 mt-1">📞 {order.deliveryPhone}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo lateral */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>R$ {parseFloat(order.totalPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span className="text-gray-400">A combinar</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-orange-600 text-lg">
                    R$ {parseFloat(order.totalPrice).toFixed(2)}
                  </span>
                </div>
                <div className={`text-xs px-3 py-2 rounded-lg font-medium text-center ${
                  order.paymentStatus === "pago"
                    ? "bg-green-100 text-green-800"
                    : order.paymentStatus === "falhou"
                    ? "bg-red-100 text-red-800"
                    : "bg-orange-100 text-orange-800"
                }`}>
                  {order.paymentStatus === "pago" ? "✅ Pago"
                    : order.paymentStatus === "falhou" ? "❌ Pagamento Falhou"
                    : "⏳ Pagamento Pendente"}
                </div>
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full"
              variant="outline"
              onClick={() => setLocation("/meus-pedidos")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Todos os Pedidos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
