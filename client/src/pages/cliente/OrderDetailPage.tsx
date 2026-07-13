import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2, ArrowLeft, Package, MapPin, Clock,
  CheckCircle2, Circle, RefreshCw, ShoppingCart,
  FileText, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Status steps dinâmicos por tipo de entrega e pagamento
function getStatusSteps(order: any) {
  const isPickup = order.shippingMethod === 'retirada' || order.shippingMethod === 'pickup' || !order.deliveryStreet;
  const isInProduction = ['em_producao', 'pronto_entrega', 'pronto_retirada', 'saiu_entrega', 'em_transporte', 'entregue'].includes(order.status);

  // Passo 1: definir o status de pagamento correto (apenas o que foi usado)
  const paymentStep = order.paymentMethod === 'pagar_na_retirada'
    ? { key: 'pagamento_retirada', label: 'Pagamento\nna Retirada', emoji: '🏪' }
    : { key: 'pagamento_aprovado', label: 'Pagamento\nAprovado', emoji: '💳' };

  // Passo 2: montar fluxo base
  const base = [
    paymentStep,
    // "Com Problemas" só aparece se ainda não entrou em produção
    ...(!isInProduction ? [{ key: 'com_problemas', label: 'Com\nProblemas', emoji: '⚠️' }] : []),
    { key: 'em_producao', label: 'Em\nProdução', emoji: '🏭' },
  ];

  // Passo 3: adicionar etapas finais conforme tipo de entrega
  if (isPickup) {
    return [
      ...base,
      { key: 'pronto_retirada', label: 'Pronto p/\nRetirada', emoji: '🎁' },
      { key: 'entregue', label: 'Retirado', emoji: '✅' },
    ];
  } else {
    return [
      ...base,
      { key: 'em_transporte', label: 'Em\nTransporte', emoji: '🚛' },
      { key: 'entregue', label: 'Entregue', emoji: '✅' },
    ];
  }
}

const STATUS_LABELS: Record<string, string> = {
  pagamento_aprovado:  "Pagamento Aprovado",
  pagamento_retirada:  "Pagamento na Retirada",
  analisando:          "Analisado",
  com_problemas:       "Com Problemas",
  em_producao:         "Em Produção",
  pronto_entrega:      "Pronto para Entrega",
  pronto_retirada:     "Pronto para Retirada",
  entregue:            "Entregue",
  cancelado:           "Cancelado",
};

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function formatDate(dateStr: string | Date, includeTime = false) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export default function OrderDetailPage() {
  const [, params] = useRoute("/pedido/:id");
  const [, setLocation] = useLocation();
  const orderNumber = params?.id ?? "";

  const { data, isLoading, error } = trpc.checkout.getOrderByNumber.useQuery(
    { orderNumber },
    { enabled: !!orderNumber }
  );

  const reorderMutation = trpc.customerAuth.reorder.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.addedCount} ${result.addedCount === 1 ? "item adicionado" : "itens adicionados"} ao carrinho!`, {
        action: { label: "Ver carrinho", onClick: () => setLocation("/carrinho") },
      });
    },
    onError: () => toast.error("Erro ao recomprar pedido"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">Pedido não encontrado</h2>
        <p className="text-gray-500">Este pedido não existe ou não pertence à sua conta</p>
        <Button onClick={() => setLocation("/meus-pedidos")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Meus Pedidos
        </Button>
      </div>
    );
  }

  // getOrderByNumber returns the order directly; items come from a separate query
  const order = (data as any)?.order ?? data as any;
  const items = (data as any)?.items ?? [];
  const isCancelled = order.status === "cancelado";
  const STATUS_STEPS = getStatusSteps(order);
  const currentStepIndex = STATUS_STEPS.findIndex((s: any) => s.key === order.status);
  const progressPercent = currentStepIndex >= 0
    ? (currentStepIndex / (STATUS_STEPS.length - 1)) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/meus-pedidos")} className="text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Meus Pedidos
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">Realizado em {formatDate(order.createdAt, true)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reorderMutation.mutate({ orderId: order.id })}
            disabled={reorderMutation.isPending}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${reorderMutation.isPending ? "animate-spin" : ""}`} />
            Recomprar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Status Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Acompanhamento do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCancelled ? (
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-700">Pedido Cancelado</p>
                      <p className="text-sm text-red-600">Este pedido foi cancelado. Entre em contato para mais informações.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Current status highlight */}
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200 mb-5">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-orange-600 font-medium">Status atual</p>
                        <p className="font-bold text-orange-800">{STATUS_LABELS[order.status] ?? order.status}</p>
                      </div>
                    </div>

                      {/* Progress bar */}
                    <div className="relative mb-8">
                      {/* Background line */}
                      <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full" />
                      {/* Progress line (only up to current step) */}
                      <div
                        className="absolute top-5 left-5 h-1 bg-orange-500 rounded-full transition-all duration-700"
                        style={{ width: currentStepIndex >= 0 ? `calc(${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}% - 0px)` : "0%", maxWidth: "calc(100% - 2.5rem)" }}
                      />
                      {/* Steps */}
                      <div className="relative flex justify-between">
                        {STATUS_STEPS.map((step, i) => {
                          const isPast = i < currentStepIndex;
                          const isCurrent = i === currentStepIndex;
                          const isFuture = i > currentStepIndex;
                          return (
                            <div key={step.key} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 transition-all z-10 relative ${
                                  isCurrent
                                    ? "bg-orange-500 border-orange-500 text-white shadow-md ring-4 ring-orange-100 scale-110"
                                    : isPast
                                    ? "bg-orange-400 border-orange-400 text-white"
                                    : "bg-gray-100 border-gray-200 text-gray-300"
                                }`}
                              >
                                {isPast ? <CheckCircle2 className="w-4 h-4" /> : isCurrent ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-base opacity-40">{step.emoji}</span>}
                              </div>
                              <span
                                className={`text-xs text-center font-medium leading-tight whitespace-pre-line ${
                                  isCurrent ? "text-orange-600 font-bold" : isPast ? "text-orange-400" : "text-gray-300"
                                }`}
                                style={{ fontSize: "0.65rem" }}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Order items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="w-4 h-4 text-orange-500" />
                  Itens do Pedido ({(items ?? []).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(items ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhum item encontrado</p>
                ) : (
                  (items ?? []).map((item: any) => (
                    <div key={item.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName ?? "Produto"}
                          className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{item.productName ?? "Produto"}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Quantidade: {item.quantity}</p>
                        {item.selectedAttributes && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {(() => {
                              try {
                                const attrs = JSON.parse(item.selectedAttributes);
                                return Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(" • ");
                              } catch { return item.selectedAttributes; }
                            })()}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">Obs: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">Unitário</p>
                        <p className="font-semibold text-gray-900 text-sm">{formatCurrency(item.priceAtOrder)}</p>
                        <p className="text-xs text-orange-600 font-medium">
                          {formatCurrency(parseFloat(item.priceAtOrder) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Card de Retirada na Loja */}
            {(order.shippingMethod === 'retirada' || order.shippingMethod === 'pickup' || !order.deliveryStreet) && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-orange-800">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Retirada na Loja
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Endereço */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-0.5">Endereço</p>
                      <p className="text-sm text-gray-600">Av. Ver. Antônio Ferreira dos Santos, 651</p>
                      <p className="text-sm text-gray-600">Braga, Cabo Frio - RJ, 28908-200</p>
                    </div>
                  </div>
                  {/* Telefone */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">📞</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-0.5">Telefone</p>
                      <a href="tel:+5522999459596" className="text-sm text-orange-600 hover:underline">(22) 99945-9596</a>
                    </div>
                  </div>
                  {/* Horários */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 mb-2">Horário de Funcionamento</p>
                      <div className="space-y-1">
                        {[
                          { day: 'Segunda', hours: '09:00–12:00 | 13:30–18:00' },
                          { day: 'Terça', hours: '09:00–12:00 | 13:30–18:00' },
                          { day: 'Quarta', hours: '09:00–12:00 | 13:30–18:00' },
                          { day: 'Quinta', hours: '09:00–12:00 | 13:30–18:00' },
                          { day: 'Sexta', hours: '09:00–12:00 | 13:30–18:00' },
                          { day: 'Sábado', hours: 'Fechado', closed: true },
                          { day: 'Domingo', hours: 'Fechado', closed: true },
                        ].map(({ day, hours, closed }) => (
                          <div key={day} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 font-medium w-20">{day}</span>
                            <span className={closed ? 'text-red-500 font-medium' : 'text-gray-700'}>{hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Aviso */}
                  <div className="bg-orange-100 rounded-lg p-3">
                    <p className="text-xs text-orange-800">
                      <strong>Importante:</strong> Aguarde o aviso de que seu pedido está pronto antes de vir buscar. Você será notificado por e-mail ou WhatsApp.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery address */}
            {order.deliveryStreet && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.deliveryFullName && (
                    <p className="font-semibold text-gray-800 mb-1">{order.deliveryFullName}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {order.deliveryStreet}, {order.deliveryNumber}
                    {order.deliveryComplement ? `, ${order.deliveryComplement}` : ""}
                  </p>
                  {order.deliveryNeighborhood && (
                    <p className="text-sm text-gray-600">{order.deliveryNeighborhood}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {order.deliveryCity} - {order.deliveryState}
                  </p>
                  {order.deliveryZipCode && (
                    <p className="text-sm text-gray-600">CEP: {order.deliveryZipCode}</p>
                  )}
                  {order.deliveryPhone && (
                    <p className="text-sm text-gray-600 mt-1">📞 {order.deliveryPhone}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 italic">"{order.notes}"</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Entrega Selecionada */}
            {order.shippingLabel && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Entrega Selecionada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-gray-900">{order.shippingLabel}</p>
                  {order.shippingPrice && (
                    <p className="text-sm text-gray-600 mt-1">{formatCurrency(order.shippingPrice)}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Financial summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({(items ?? []).length} {(items ?? []).length === 1 ? "item" : "itens"})</span>
                  <span>{formatCurrency((order.totalPrice ?? 0) - (order.shippingPrice ?? 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span>{order.shippingPrice ? formatCurrency(order.shippingPrice) : "Grátis"}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-orange-600 text-lg">{formatCurrency(order.totalPrice)}</span>
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

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={() => reorderMutation.mutate({ orderId: order.id })}
                disabled={reorderMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${reorderMutation.isPending ? "animate-spin" : ""}`} />
                Recomprar este pedido
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/carrinho")}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ver Carrinho
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-600"
                onClick={() => setLocation("/meus-pedidos")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Todos os Pedidos
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
