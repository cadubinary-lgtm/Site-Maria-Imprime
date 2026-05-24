import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import { Loader2, CheckCircle2, Clock, Package, Printer, Scissors, Box, Truck, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TIMELINE_STEPS = [
  { key: "pagamento_aprovado", label: "Pagamento Aprovado",  icon: Clock },
  { key: "pedido_recebido",    label: "Pedido em Andamento", icon: CheckCircle2 },
  { key: "em_producao",        label: "Em Produção",         icon: Package },
  { key: "impressao",          label: "Impressão",           icon: Printer },
  { key: "acabamento",         label: "Acabamento",          icon: Scissors },
  { key: "pronto",             label: "Pronto",              icon: Box },
  { key: "enviado",            label: "Enviado",             icon: Truck },
  { key: "entregue",           label: "Entregue",            icon: Home },
];

function getStepIndex(status: string): number {
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === status);
  if (status === "arte_em_analise" || status === "aguardando_aprovacao") return 2;
  if (status === "saiu_para_entrega") return 6;
  if (status === "cancelado") return -1;
  return idx >= 0 ? idx : 0;
}

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

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

export default function GuestOrderTracking() {
  const [, params] = useRoute("/pedido/acompanhar/:token");
  const token = params?.token ?? "";

  const { data, isLoading } = trpc.checkout.getOrderByToken.useQuery(
    { token },
    { enabled: !!token, refetchInterval: 15000 }
  );

  const order = (data as any)?.order ?? null;
  const items = (data as any)?.items ?? [];
  const history = (data as any)?.history ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-600">Link de acompanhamento inválido ou expirado.</p>
        <Link href="/">
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === "cancelado";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acompanhamento do Pedido</h1>
          <p className="text-gray-500 mt-1">
            Pedido <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
          </p>
        </div>

        {/* Status atual */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-orange-500" />
              Status do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-600 font-medium">Status atual</p>
              <p className="text-lg font-bold text-orange-700">
                {isCancelled ? "Cancelado" : STATUS_LABELS[order.status] || order.status}
              </p>
            </div>

            {/* Timeline */}
            {!isCancelled && (
              <div className="flex items-center justify-between overflow-x-auto pb-4">
                {TIMELINE_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center min-w-[70px] relative">
                      {i > 0 && (
                        <div
                          className={`absolute top-5 -left-1/2 w-full h-0.5 ${
                            i <= currentStepIndex ? "bg-orange-400" : "bg-gray-200"
                          }`}
                        />
                      )}
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent
                            ? "bg-orange-500 border-orange-500 text-white scale-110 ring-4 ring-orange-100"
                            : isActive
                            ? "bg-orange-100 border-orange-400 text-orange-600"
                            : "bg-gray-100 border-gray-200 text-gray-400"
                        }`}
                      >
                        {isActive && !isCurrent ? (
                          <CheckCircle2 className="w-5 h-5 text-orange-500" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <p className={`text-xs mt-2 text-center leading-tight max-w-[70px] ${
                        isCurrent ? "font-semibold text-orange-600" : isActive ? "text-orange-500" : "text-gray-400"
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Histórico */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Histórico de atualizações</p>
                <div className="space-y-2">
                  {history.map((h: any) => (
                    <div key={h.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-800">{STATUS_LABELS[h.status] || h.status}</span>
                        {h.notes && <span className="text-gray-500"> — {h.notes}</span>}
                        <p className="text-xs text-gray-400">
                          {new Date(h.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Itens do pedido */}
        {items.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="w-12 h-12 object-cover rounded-lg" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                      <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(parseFloat(item.priceAtCart) * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
            <div className="flex justify-between font-semibold text-base pt-2 border-t">
              <span>Total</span>
              <span className="text-orange-600">{formatCurrency(order.totalPrice)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/catalogo">
            <Button variant="outline" className="w-full sm:w-auto">
              Continuar Comprando
            </Button>
          </Link>
          <Link href="/cliente/login">
            <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600">
              Criar Conta / Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
