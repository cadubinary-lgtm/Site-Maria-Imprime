import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Loader2, ArrowLeft, CheckCircle, Clock, Truck, Package } from "lucide-react";

const STATUS_CONFIG = {
  aguardando: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  em_producao: { label: "Em Produção", color: "bg-blue-100 text-blue-800", icon: Package },
  enviado: { label: "Enviado", color: "bg-purple-100 text-purple-800", icon: Truck },
  entregue: { label: "Entregue", color: "bg-green-100 text-green-800", icon: CheckCircle },
};

export default function OrderTracking() {
  const { data: orders, isLoading } = trpc.orders.getMyOrders.useQuery();

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
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">GP</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig?.icon || Clock;

              return (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Pedido {order.orderNumber}</CardTitle>
                        <CardDescription>
                          Criado em {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </CardDescription>
                      </div>
                      <Badge className={statusConfig?.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig?.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Valor Total</p>
                        <p className="text-lg font-semibold">
                          R$ {parseFloat(order.totalPrice.toString()).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status do Pagamento</p>
                        <p className="text-lg font-semibold capitalize">{order.paymentStatus}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Última Atualização</p>
                        <p className="text-lg font-semibold">
                          {new Date(order.updatedAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Arquivo de Arte</p>
                        <p className="text-lg font-semibold">
                          {order.artFileUrl ? "✓ Enviado" : "✗ Não enviado"}
                        </p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm font-semibold text-gray-700 mb-4">Progresso do Pedido</p>
                      <div className="flex justify-between items-center">
                        {["aguardando", "em_producao", "enviado", "entregue"].map((status, index) => {
                          const isCompleted = ["aguardando", "em_producao", "enviado", "entregue"].indexOf(order.status as string) >= index;
                          const isCurrent = order.status === status;

                          return (
                            <div key={status} className="flex flex-col items-center flex-1">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                                  isCompleted ? "bg-green-500" : "bg-gray-300"
                                } ${isCurrent ? "ring-2 ring-blue-600" : ""}`}
                              >
                                <CheckCircle className="w-6 h-6 text-white" />
                              </div>
                              <p className="text-xs text-center text-gray-600 capitalize">
                                {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">Você ainda não tem pedidos.</p>
            <Link href="/catalogo">
              <Button>Fazer Primeiro Pedido</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
