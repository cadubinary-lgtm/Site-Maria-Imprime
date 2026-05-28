import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Package, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Status operacionais (9 etapas) ─────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pagamento_aprovado:  { label: "Pagamento Aprovado",     color: "bg-green-100 text-green-800",   icon: "💳" },
  pagamento_retirada:  { label: "Pagamento na Retirada",  color: "bg-blue-100 text-blue-800",     icon: "🏪" },
  analisando:          { label: "Analisando",             color: "bg-orange-100 text-orange-800", icon: "🔍" },
  com_problemas:       { label: "Com Problemas",          color: "bg-red-100 text-red-800",       icon: "⚠️" },
  em_producao:         { label: "Em Produção",            color: "bg-purple-100 text-purple-800", icon: "⚙️" },
  pronto_entrega:      { label: "Pronto para Entrega",    color: "bg-teal-100 text-teal-800",     icon: "🚚" },
  pronto_retirada:     { label: "Pronto para Retirada",   color: "bg-cyan-100 text-cyan-800",     icon: "🎁" },
  entregue:            { label: "Entregue",               color: "bg-emerald-100 text-emerald-800",icon: "✔️" },
  cancelado:           { label: "Cancelado",              color: "bg-red-100 text-red-800",       icon: "❌" },
};

// Ordem linear de progresso (excluindo cancelado)
const PROGRESS_STEPS = [
  "pagamento_aprovado",
  "pagamento_retirada",
  "analisando",
  "com_problemas",
  "em_producao",
  "pronto_entrega",
  "pronto_retirada",
  "entregue",
];

export default function OrderTracking() {
  const { data: orders, isLoading, refetch } = trpc.orders.getMyOrders.useQuery();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const deleteOrderMutation = trpc.orders.deleteOrder.useMutation({
    onSuccess: () => {
      toast.success("Pedido excluído com sucesso");
      setConfirmDeleteId(null);
      utils.orders.getMyOrders.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao excluir pedido");
      setConfirmDeleteId(null);
    },
  });

  // Polling a cada 10s para atualizar status em tempo real
  useEffect(() => {
    const interval = setInterval(() => refetch(), 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const deletableStatuses = ["analisando", "pagamento_retirada", "cancelado"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
            <p className="text-sm text-gray-500">Acompanhe o andamento dos seus pedidos</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = order.status as string;
              const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.analisando;
              const currentIdx = PROGRESS_STEPS.indexOf(status);
              const isCanceled = status === "cancelado";

              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div>
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        <CardDescription>
                          Criado em {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </CardDescription>
                      </div>
                      <Badge className={`${sc.color} text-sm px-3 py-1`}>
                        {sc.icon} {sc.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Resumo */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Valor Total</p>
                        <p className="font-semibold text-gray-900">{fmt(parseFloat(order.totalPrice.toString()))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Pagamento</p>
                        <p className="font-semibold text-gray-900 capitalize">{order.paymentStatus}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Última Atualização</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(order.updatedAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    {/* Timeline de Progresso */}
                    {!isCanceled ? (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-semibold text-gray-700 mb-4">Progresso do Pedido</p>
                        <div className="relative">
                          {/* Barra de progresso */}
                          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
                          <div
                            className="absolute top-5 left-0 h-0.5 bg-indigo-500 transition-all duration-500"
                            style={{
                              width: currentIdx >= 0
                                ? `${(currentIdx / (PROGRESS_STEPS.length - 1)) * 100}%`
                                : "0%",
                            }}
                          />

                          {/* Etapas */}
                          <div className="relative flex justify-between">
                            {PROGRESS_STEPS.map((step, idx) => {
                              const isCompleted = currentIdx >= idx;
                              const isCurrent = currentIdx === idx;
                              const stepCfg = STATUS_CONFIG[step];
                              return (
                                <div key={step} className="flex flex-col items-center" style={{ width: `${100 / PROGRESS_STEPS.length}%` }}>
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all
                                      ${isCompleted
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "bg-white border-gray-300 text-gray-400"}
                                      ${isCurrent ? "ring-2 ring-indigo-300 ring-offset-2" : ""}
                                    `}
                                  >
                                    {isCompleted ? "✓" : stepCfg.icon}
                                  </div>
                                  <p className="text-xs text-center text-gray-500 mt-2 leading-tight hidden md:block">
                                    {stepCfg.label}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Status atual em mobile */}
                        <p className="mt-4 text-sm text-center text-indigo-700 font-medium md:hidden">
                          Etapa atual: {sc.label}
                        </p>
                      </div>
                    ) : (
                      <div className="pt-4 border-t">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                          <p className="text-red-700 font-medium">❌ Este pedido foi cancelado</p>
                          <p className="text-red-500 text-sm mt-1">Entre em contato para mais informações</p>
                        </div>
                      </div>
                    )}

                    {/* Ações do pedido */}
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      {/* Botão excluir - apenas para status iniciais */}
                      {deletableStatuses.includes(status) && (
                        confirmDeleteId === order.id ? (
                          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <span className="text-sm text-red-700 font-medium">Confirmar exclusão?</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteOrderMutation.mutate({ orderId: order.id })}
                              disabled={deleteOrderMutation.isPending}
                            >
                              {deleteOrderMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sim, excluir"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deleteOrderMutation.isPending}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setConfirmDeleteId(order.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Excluir Pedido
                          </Button>
                        )
                      )}
                      <Link href={`/pedido/${order.id}`}>
                        <Button variant="outline" size="sm">
                          Ver Detalhes Completos →
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">Você ainda não tem pedidos</p>
            <p className="text-gray-400 text-sm mb-6">Explore nosso catálogo e faça seu primeiro pedido</p>
            <Link href="/catalogo">
              <Button>Ver Catálogo</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
