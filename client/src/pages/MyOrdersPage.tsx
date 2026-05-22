import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, Eye, RefreshCw, Package } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  aguardando: { label: "Pedido Recebido", color: "bg-yellow-100 text-yellow-800" },
  em_producao: { label: "Em Produção", color: "bg-blue-100 text-blue-800" },
  enviado: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
  entregue: { label: "Entregue", color: "bg-green-100 text-green-800" },
};

const PAYMENT_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pagamento Pendente", color: "bg-orange-100 text-orange-800" },
  pago: { label: "Pago", color: "bg-green-100 text-green-800" },
  falhou: { label: "Pagamento Falhou", color: "bg-red-100 text-red-800" },
};

export default function MyOrdersPage() {
  const [, setLocation] = useLocation();
  const { data: orders, isLoading } = trpc.checkout.getMyOrders.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
            <p className="text-gray-500 mt-1">Acompanhe o status dos seus pedidos</p>
          </div>
          <Button
            onClick={() => setLocation("/catalogo")}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Fazer Novo Pedido
          </Button>
        </div>

        {/* Lista de pedidos */}
        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Package className="w-16 h-16 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-600">Nenhum pedido ainda</h2>
              <p className="text-gray-400 text-center">
                Você ainda não realizou nenhum pedido. Explore nosso catálogo!
              </p>
              <Button
                onClick={() => setLocation("/catalogo")}
                className="bg-orange-500 hover:bg-orange-600 mt-2"
              >
                Ver Produtos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const status = STATUS_MAP[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-700" };
              const payment = PAYMENT_MAP[order.paymentStatus] ?? { label: order.paymentStatus, color: "bg-gray-100 text-gray-700" };
              const date = new Date(order.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Info principal */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-gray-900 text-sm">#{order.orderNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payment.color}`}>
                            {payment.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📅 {date}</span>
                          <span>📦 {order.itemCount} {Number(order.itemCount) === 1 ? "item" : "itens"}</span>
                          {order.deliveryCity && (
                            <span>📍 {order.deliveryCity} - {order.deliveryState}</span>
                          )}
                        </div>
                      </div>

                      {/* Valor e ações */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-bold text-orange-600 text-lg">
                            R$ {parseFloat(order.totalPrice).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation(`/pedido/${order.id}`)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setLocation("/carrinho")}
                            className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Recomprar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
