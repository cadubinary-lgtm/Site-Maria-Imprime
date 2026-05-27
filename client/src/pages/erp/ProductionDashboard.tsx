import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["pagamento_aprovado", "pedido_recebido", "arte_em_analise", "aguardando_aprovacao", "em_producao", "impressao", "acabamento", "pronto", "saiu_para_entrega", "entregue", "cancelado"];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pagamento_aprovado:   { label: "Pagamento Aprovado",   color: "bg-green-50 border-green-200" },
  pedido_recebido:      { label: "Pedido em Andamento",  color: "bg-blue-50 border-blue-200" },
  arte_em_analise:      { label: "Arte em Análise",      color: "bg-orange-50 border-orange-200" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", color: "bg-amber-50 border-amber-200" },
  em_producao:          { label: "Em Produção",          color: "bg-purple-50 border-purple-200" },
  impressao:            { label: "Impressão",            color: "bg-indigo-50 border-indigo-200" },
  acabamento:           { label: "Acabamento",           color: "bg-violet-50 border-violet-200" },
  pronto:               { label: "Pronto",               color: "bg-teal-50 border-teal-200" },
  saiu_para_entrega:    { label: "Saiu para Entrega",    color: "bg-cyan-50 border-cyan-200" },
  entregue:             { label: "Entregue",             color: "bg-emerald-50 border-emerald-200" },
  cancelado:            { label: "Cancelado",            color: "bg-red-50 border-red-200" },
};

export default function ProductionDashboard() {
  const { data: orders, isLoading, refetch } = trpc.admin.getAllOrders.useQuery();
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        newStatus: newStatus as "pedido_recebido" | "pagamento_aprovado" | "arte_em_analise" | "aguardando_aprovacao" | "em_producao" | "impressao" | "acabamento" | "pronto" | "saiu_para_entrega" | "entregue" | "cancelado",
      });
      
      const statusLabel = STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus;
      toast.success(`Pedido atualizado para: ${statusLabel}`);
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = STATUSES.indexOf(currentStatus);
    return currentIndex < STATUSES.length - 1 ? STATUSES[currentIndex + 1] : null;
  };

  const getOrdersByStatus = (status: string) => {
    return orders?.filter((order) => order.status === status) || [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">PR</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Painel de Produção</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto">
            {STATUSES.map((status) => {
              const statusOrders = getOrdersByStatus(status);
              const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];

              return (
                <div key={status} className="min-w-[300px]">
                  <div className={`rounded-lg border-2 p-4 ${config.color}`}>
                    <h3 className="font-bold text-lg mb-2 capitalize">{config.label}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {statusOrders.length} pedido{statusOrders.length !== 1 ? "s" : ""}
                    </p>

                    <div className="space-y-3">
                      {statusOrders.length > 0 ? (
                        statusOrders.map((order) => {
                          const nextStatus = getNextStatus(status);

                          return (
                            <Card key={order.id} className="cursor-move hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">{order.orderNumber}</CardTitle>
                                <CardDescription className="text-xs">
                                  Cliente #{order.clientId}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pb-3">
                                <div className="mb-3 space-y-1">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-semibold">Valor:</span> R$ {parseFloat(order.totalPrice.toString()).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    <span className="font-semibold">Data:</span> {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                                  </p>
                                </div>

                                {nextStatus && (
                                  <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleStatusChange(order.id, nextStatus)}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    {updateStatusMutation.isPending ? (
                                      <>
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Atualizando...
                                      </>
                                    ) : (
                                      `Avançar para ${STATUS_CONFIG[nextStatus as keyof typeof STATUS_CONFIG].label}`
                                    )}
                                  </Button>
                                )}

                                {status === "entregue" && (
                                  <Badge className="w-full justify-center mt-2 bg-green-600">
                                    ✓ Concluído
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">Nenhum pedido</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
