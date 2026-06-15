import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, ChevronRight, Package, Filter, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

// ─── Mapa de status operacionais ────────────────────────────────────────────
export const ORDER_STATUS: Record<string, { label: string; color: string; icon: string }> = {
  pagamento_aprovado:  { label: "Pagamento Aprovado",      color: "bg-green-100 text-green-800",   icon: "💳" },
  pagamento_retirada:  { label: "Pagamento na Retirada",   color: "bg-blue-100 text-blue-800",     icon: "🏪" },
  analisando:          { label: "Analisando",              color: "bg-orange-100 text-orange-800", icon: "🔍" },
  com_problemas:       { label: "Com Problemas",           color: "bg-red-100 text-red-800",       icon: "⚠️" },
  em_producao:         { label: "Em Produção",             color: "bg-purple-100 text-purple-800", icon: "⚙️" },
  pronto_entrega:      { label: "Pronto para Entrega",     color: "bg-teal-100 text-teal-800",     icon: "🚚" },
  pronto_retirada:     { label: "Pronto para Retirada",    color: "bg-cyan-100 text-cyan-800",     icon: "🎁" },
  entregue:            { label: "Entregue",                color: "bg-emerald-100 text-emerald-800",icon: "✔️" },
  cancelado:           { label: "Cancelado",               color: "bg-red-100 text-red-800",       icon: "❌" },
};

export default function NewOrders() {
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const deleteOrderMutation = trpc.admin.deleteOrder.useMutation({
    onSuccess: () => {
      toast.success("Pedido excluído com sucesso");
      setConfirmDeleteId(null);
      utils.checkout.getAllOrders.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao excluir pedido");
      setConfirmDeleteId(null);
    },
  });

  const { data: allOrders, isLoading } = trpc.checkout.getAllOrders.useQuery();

  // Filtrar apenas pedidos com status "analisando" (novos pedidos)
  const newOrders = useMemo(() => {
    if (!allOrders) return [];
    return (allOrders as any[])
      .filter((o) => o.status === "analisando")
      .filter((o) => {
        if (search) {
          const q = search.toLowerCase();
          return (
            o.orderNumber?.toLowerCase().includes(q) ||
            o.deliveryFullName?.toLowerCase().includes(q) ||
            o.deliveryPhone?.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [allOrders, search]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const fmtDate = (d: any) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "-";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-5">
        <div>
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-orange-600" />
                Novos Pedidos
              </h1>
              <p className="text-gray-500 mt-1">Pedidos aguardando análise</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por número, cliente ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-6 text-sm text-gray-600">
            {newOrders.length} novo{newOrders.length !== 1 ? "s" : ""} pedido{newOrders.length !== 1 ? "s" : ""} encontrado{newOrders.length !== 1 ? "s" : ""}
          </div>

          {/* Orders List */}
          {newOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum novo pedido no momento</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {newOrders.map((order: any) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Pedido #{order.orderNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.deliveryFullName} • {order.deliveryPhone}
                            </p>
                          </div>
                          <Badge className={ORDER_STATUS[order.status]?.color}>
                            {ORDER_STATUS[order.status]?.icon} {ORDER_STATUS[order.status]?.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Total</p>
                            <p className="font-semibold">{fmt(order.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Data</p>
                            <p className="font-semibold">{fmtDate(order.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Itens</p>
                            <p className="font-semibold">{order.items?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/admin/pedidos/${order.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            Ver Detalhes
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(order.orderId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Delete Confirmation */}
                    {confirmDeleteId === order.orderId && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                        <p className="text-sm text-red-800">
                          Tem certeza que deseja excluir este pedido?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() =>
                              deleteOrderMutation.mutate({ orderId: order.orderId })
                            }
                            disabled={deleteOrderMutation.isPending}
                          >
                            {deleteOrderMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Excluir"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Link para todos os pedidos */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href="/admin/pedidos">
              <Button variant="outline" className="gap-2">
                Ver Todos os Pedidos
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
