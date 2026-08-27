import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import { Loader2, CheckCircle2, Clock, Package, Printer, Scissors, Box, Truck, Home, ExternalLink, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HOME_PRIMARY_ACTION_CLASS, HOME_SECONDARY_ACTION_CLASS } from "@/lib/homeActionStyles";

function getTimelineSteps(order: any) {
  const isPickup = order.shippingMethod === 'retirada' || order.shippingMethod === 'pickup' || !order.deliveryStreet;
  const isInProduction = ['em_producao', 'pronto_entrega', 'pronto_retirada', 'saiu_entrega', 'em_transporte', 'entregue'].includes(order.status);

  // Passo 1: apenas o método de pagamento usado
  const paymentStep = order.status === 'aguardando_pagamento' || order.paymentStatus !== 'pago'
    ? { key: 'aguardando_pagamento', label: 'Aguardando Pagamento', icon: Clock }
    : order.paymentMethod === 'pagar_na_retirada'
    ? { key: 'pagamento_retirada', label: 'Pagamento na Retirada', icon: CheckCircle2 }
    : { key: 'pagamento_aprovado', label: 'Pagamento Aprovado', icon: Clock };

  // Passo 2: base com ou sem "Com Problemas"
  const base = [
    paymentStep,
    { key: 'analisando', label: 'Analisando', icon: Package },
    ...(!isInProduction ? [{ key: 'com_problemas', label: 'Com Problemas', icon: Package }] : []),
    { key: 'em_producao', label: 'Em Produção', icon: Printer },
  ];

  // Passo 3: etapas finais por tipo de entrega
  if (isPickup) {
    return [
      ...base,
      { key: 'pronto_retirada', label: 'Pronto para Retirada', icon: Box },
      { key: 'entregue', label: 'Retirado', icon: Home },
    ];
  } else {
    return [
      ...base,
      { key: 'pronto_entrega', label: 'Pronto para Entrega', icon: Box },
      { key: 'saiu_entrega', label: 'Saiu para Entrega', icon: Truck },
      { key: 'em_transporte', label: 'Em Transporte', icon: Truck },
      { key: 'entregue', label: 'Entregue', icon: Home },
    ];
  }
}

export default function OrderConfirmation() {
  const [, params] = useRoute("/confirmacao/:orderNumber");
  const orderNumber = params?.orderNumber ?? "";

  const { data: orderData, isLoading } = trpc.checkout.getOrderByNumber.useQuery(
    { orderNumber },
    { enabled: !!orderNumber, refetchInterval: 10000 }
  );

  const order = (orderData as any)?.order ?? orderData as any;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando confirmação do pedido" />
      </div>
    );
  }

  if (!order || !order.status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-center">
        <div className="w-full max-w-md rounded-2xl border border-pink-100 bg-white p-7 shadow-sm sm:p-9">
          <Package className="mx-auto h-8 w-8 text-pink-600" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Pedido não encontrado</h1>
          <p role="alert" className="mt-2 text-sm leading-6 text-gray-600">Confira o link recebido ou navegue pelo catálogo para iniciar um novo pedido.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/catalogo"><Button variant="outline" className={`${HOME_SECONDARY_ACTION_CLASS} w-full sm:w-auto`}>Explorar catálogo</Button></Link>
            <Link href="/"><Button className={`${HOME_PRIMARY_ACTION_CLASS} w-full sm:w-auto`}>Voltar ao início</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const TIMELINE_STEPS = getTimelineSteps(order);
  const currentStepIndex = (() => {
    if (order.status === 'cancelado') return -1;
    const idx = TIMELINE_STEPS.findIndex((s: any) => s.key === order.status);
    return idx >= 0 ? idx : 0;
  })();
  const isCancelled = order.status === "cancelado";
  const trackUrl = order.guestToken
    ? `${window.location.origin}/pedido/acompanhar/${order.guestToken}`
    : null;

  const STATUS_LABELS: Record<string, string> = {
    pagamento_aprovado:  "Pagamento Aprovado",
    pagamento_retirada:  "Pagamento na Retirada",
    analisando:          "Analisando",
    com_problemas:       "Com Problemas",
    em_producao:         "Em Produção",
    pronto_entrega:      "Pronto para Entrega",
    pronto_retirada:     "Pronto para Retirada",
    saiu_entrega:        "Saiu para Entrega",
    em_transporte:       "Em Transporte",
    entregue:            "Entregue",
    cancelado:           "Cancelado",
  };

  const handleCopyLink = async () => {
    if (!trackUrl) return;

    try {
      await navigator.clipboard.writeText(trackUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link. Tente selecionar e copiar manualmente.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">

        {/* Cabeçalho de sucesso */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Pedido realizado com sucesso!</h1>
          <p className="text-gray-600 mt-2 text-base">
            Seu pedido foi confirmado e já está em processamento.
          </p>
          <p className="text-gray-500 mt-1 text-sm">
            Enviamos todos os detalhes para o seu e-mail.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Número do pedido: <span className="font-semibold text-gray-900">{order.orderNumber}</span>
          </p>
        </div>

        {/* Destaque do link de acompanhamento para convidados */}
        {trackUrl && (
          <Card className="mb-6 border-2 border-pink-200 bg-pink-50 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-gray-700 text-base">
                  Você pode acompanhar seu pedido a qualquer momento pelo link abaixo:
                </p>
                <a
                  href={trackUrl}
                  className="inline-flex items-center gap-2 text-pink-700 font-bold text-lg hover:text-pink-900 underline underline-offset-4 transition-colors"
                >
                  Acompanhar meu pedido
                  <ExternalLink className="w-4 h-4" />
                </a>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <code className="text-xs bg-white border border-pink-200 rounded px-3 py-1.5 text-pink-700 break-all max-w-xs truncate">
                    {trackUrl}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-800 border border-pink-300 rounded px-2 py-1.5 bg-white hover:bg-pink-50 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                    aria-label="Copiar link de acompanhamento"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                </div>
                <p className="text-xs text-pink-600">
                  Guarde este link — ele também foi enviado para o seu e-mail.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acompanhamento do Pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-pink-600" />
              Status do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Status Atual */}
            <div className="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-100" aria-live="polite">
              <p className="text-sm text-pink-600 font-medium">Status atual</p>
              <p className="text-lg font-bold text-pink-700">
                {isCancelled ? "Cancelado" : STATUS_LABELS[order.status] || order.status}
              </p>
            </div>

            {/* Timeline Visual */}
            {!isCancelled && (
              <div className="flex items-center justify-between overflow-x-auto pb-4" aria-label="Etapas do pedido">
                {TIMELINE_STEPS.map((step: any, i: number) => {
                  const Icon = step.icon;
                  const isActive = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;

                  return (
                    <div key={step.key} className="flex flex-col items-center min-w-[70px] relative">
                      {/* Linha conectora */}
                      {i > 0 && (
                        <div
                          className={`absolute top-5 -left-1/2 w-full h-0.5 ${
                            i <= currentStepIndex ? "bg-pink-400" : "bg-gray-200"
                          }`}
                          style={{ zIndex: 0 }}
                        />
                      )}
                      {/* Ícone */}
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent
                            ? "bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-200"
                            : isActive
                            ? "bg-pink-100 border-pink-400 text-pink-600"
                            : "bg-gray-100 border-gray-200 text-gray-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {/* Label */}
                      <span
                        className={`text-[10px] mt-2 text-center leading-tight ${
                          isCurrent ? "font-bold text-pink-600" : isActive ? "text-pink-500" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {isCancelled && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-center">
                <p className="text-red-700 font-semibold">Este pedido foi cancelado.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-lg text-pink-600">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  parseFloat(order.totalPrice.toString())
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pagamento:</span>
              <span className="font-medium capitalize">{order.paymentMethod || "Pendente"}</span>
            </div>
            {order.deliveryFullName && (
              <div className="flex justify-between">
                <span className="text-gray-600">Entrega para:</span>
                <span className="font-medium">{order.deliveryFullName}</span>
              </div>
            )}
            {order.deliveryCity && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cidade:</span>
                <span className="font-medium">{order.deliveryCity}, {order.deliveryState}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/catalogo">
            <Button variant="outline" className={`${HOME_SECONDARY_ACTION_CLASS} w-full sm:w-auto`}>
              Continuar Comprando
            </Button>
          </Link>
          {trackUrl ? (
            <a href={trackUrl}>
              <Button className={`${HOME_PRIMARY_ACTION_CLASS} w-full sm:w-auto`}>
                Acompanhar meu pedido
              </Button>
            </a>
          ) : (
            <Link href="/meus-pedidos">
              <Button className={`${HOME_PRIMARY_ACTION_CLASS} w-full sm:w-auto`}>
                Meus Pedidos
              </Button>
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
