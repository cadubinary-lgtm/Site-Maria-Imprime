import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import { Loader2, CheckCircle2, Clock, Package, Printer, Scissors, Box, Truck, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TIMELINE_STEPS = [
  { key: "pagamento_aprovado", label: "Pagamento Aprovado",   icon: Clock },
  { key: "pedido_recebido",    label: "Pedido em Andamento",  icon: CheckCircle2 },
  { key: "em_producao",        label: "Em Produção",          icon: Package },
  { key: "impressao",          label: "Impressão",            icon: Printer },
  { key: "acabamento",         label: "Acabamento",           icon: Scissors },
  { key: "pronto",             label: "Pronto",               icon: Box },
  { key: "enviado",            label: "Enviado",              icon: Truck },
  { key: "entregue",           label: "Entregue",             icon: Home },
];

function getStepIndex(status: string): number {
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === status);
  if (status === "arte_em_analise" || status === "aguardando_aprovacao") return 2;
  if (status === "saiu_para_entrega") return 6;
  if (status === "cancelado") return -1;
  return idx >= 0 ? idx : 0;
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
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order || !order.status) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-600">Pedido não encontrado</p>
        <Link href="/">
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === "cancelado";

  const STATUS_LABELS: Record<string, string> = {
    pagamento_aprovado: "Pagamento Aprovado",
    pedido_recebido: "Pedido em Andamento",
    arte_em_analise: "Arte em Análise",
    aguardando_aprovacao: "Aguardando Aprovação",
    em_producao: "Em Produção",
    impressao: "Impressão",
    acabamento: "Acabamento",
    pronto: "Pronto",
    saiu_para_entrega: "Saiu para Entrega",
    enviado: "Enviado",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Cabeçalho de sucesso */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido Confirmado!</h1>
          <p className="text-gray-500 mt-1">
            Número do pedido: <span className="font-semibold text-gray-900">{order.orderNumber}</span>
          </p>
        </div>

        {/* Acompanhamento do Pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-orange-500" />
              Acompanhamento do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Status Atual */}
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-600 font-medium">Status atual</p>
              <p className="text-lg font-bold text-orange-700">
                {isCancelled ? "Cancelado" : STATUS_LABELS[order.status] || order.status}
              </p>
            </div>

            {/* Timeline Visual */}
            {!isCancelled && (
              <div className="flex items-center justify-between overflow-x-auto pb-4">
                {TIMELINE_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;

                  return (
                    <div key={step.key} className="flex flex-col items-center min-w-[70px] relative">
                      {/* Linha conectora */}
                      {i > 0 && (
                        <div
                          className={`absolute top-5 -left-1/2 w-full h-0.5 ${
                            i <= currentStepIndex ? "bg-orange-400" : "bg-gray-200"
                          }`}
                          style={{ zIndex: 0 }}
                        />
                      )}
                      {/* Ícone */}
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent
                            ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200"
                            : isActive
                            ? "bg-orange-100 border-orange-400 text-orange-600"
                            : "bg-gray-100 border-gray-200 text-gray-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {/* Label */}
                      <span
                        className={`text-[10px] mt-2 text-center leading-tight ${
                          isCurrent ? "font-bold text-orange-600" : isActive ? "text-orange-500" : "text-gray-400"
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
            <CardTitle className="text-lg">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-lg">
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
            <Button variant="outline" className="w-full sm:w-auto">
              Continuar Comprando
            </Button>
          </Link>
          <Link href="/meus-pedidos">
            <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600">
              Meus Pedidos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
