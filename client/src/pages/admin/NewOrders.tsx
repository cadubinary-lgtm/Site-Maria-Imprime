import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Search, ChevronRight, Package, X, Loader2, Trash2, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

// Novos pedidos = pedidos que acabaram de chegar e precisam de atenção
// Inclui: pagamento_aprovado, pagamento_retirada
// Ao clicar em "Abrir", o status muda para "analisando" e o pedido sai desta lista
const NEW_ORDER_STATUSES = ["pagamento_aprovado", "pagamento_retirada"];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pagamento_aprovado: { label: "Pagamento Aprovado", color: "bg-green-100 text-green-800 border-green-200",   icon: "💳" },
  pagamento_retirada: { label: "Pagar na Retirada",  color: "bg-blue-100 text-blue-800 border-blue-200",     icon: "🏪" },
  analisando:         { label: "Analisado",          color: "bg-orange-100 text-orange-800 border-orange-200", icon: "🔍" },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  cartao_credito: "Cartão de Crédito",
  pagar_na_retirada: "Pagar na Retirada",
};

const SHIPPING_LABELS: Record<string, string> = {
  pickup: "Retirada na Loja",
  retirada: "Retirada na Loja",
  moto_express: "Moto Express",
};

function formatCurrency(v: any) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
}

function formatDate(d: any) {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function NewOrders() {
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();

  const updateStatusMutation = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: (_data, variables) => {
      utils.checkout.getAllOrders.invalidate();
      navigate(`/admin/pedidos/${variables.orderId}`);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar status do pedido");
      setOpeningId(null);
    },
  });

  const handleOpen = (orderId: number) => {
    setOpeningId(orderId);
    updateStatusMutation.mutate({ orderId, newStatus: "analisando" });
  };

  // Busca todos os pedidos (adminProcedure retorna todos com orderBy desc)
  const { data: allOrders, isLoading, refetch } = trpc.checkout.getAllOrders.useQuery(undefined, {
    refetchInterval: 30_000, // atualiza a cada 30s automaticamente
  });

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

  // Filtrar apenas pedidos "novos" (status inicial)
  const newOrders = useMemo(() => {
    if (!allOrders) return [];
    const q = search.toLowerCase().trim();
    return (allOrders as any[])
      .filter((o) => NEW_ORDER_STATUSES.includes(o.status))
      .filter((o) => {
        if (!q) return true;
        return (
          (o.orderNumber ?? "").toLowerCase().includes(q) ||
          (o.deliveryFullName ?? "").toLowerCase().includes(q) ||
          (o.guestName ?? "").toLowerCase().includes(q) ||
          (o.deliveryPhone ?? "").toLowerCase().includes(q) ||
          (o.guestEmail ?? "").toLowerCase().includes(q)
        );
      });
  }, [allOrders, search]);

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-7 h-7 text-orange-500" />
              Novos Pedidos
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Pedidos recém-chegados aguardando atenção
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Search */}
        <div className="mb-5 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por número, cliente, telefone ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {search && (
            <Button variant="outline" size="sm" onClick={() => setSearch("")} className="gap-2">
              <X className="w-4 h-4" /> Limpar
            </Button>
          )}
        </div>

        {/* Counter */}
        <div className="mb-5 flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-orange-500" />
          {isLoading ? "Carregando..." : (
            <span>
              <strong className="text-gray-900">{newOrders.length}</strong> novo{newOrders.length !== 1 ? "s" : ""} pedido{newOrders.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : newOrders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum novo pedido no momento</p>
              <p className="text-gray-400 text-sm mt-1">Os pedidos novos aparecerão aqui assim que forem feitos</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {newOrders.map((order: any) => {
              const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.analisando;
              const isPickup = order.shippingMethod === "pickup" || order.shippingMethod === "retirada" || order.paymentMethod === "pagar_na_retirada";
              const clientName = order.deliveryFullName || order.guestName || "Cliente";
              const clientPhone = order.deliveryPhone || "-";
              const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod ?? ""] || order.paymentMethod || "-";
              const shippingLabel = SHIPPING_LABELS[order.shippingMethod ?? ""] || order.shippingMethod || "Entrega";

              return (
                <Card key={order.id} className="hover:shadow-md transition-all border-l-4 border-l-orange-400">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-base">#{order.orderNumber}</span>
                          <Badge className={`text-xs border ${statusCfg.color}`}>
                            {statusCfg.icon} {statusCfg.label}
                          </Badge>
                          {isPickup && (
                            <Badge className="text-xs bg-cyan-100 text-cyan-800 border-cyan-200 border">
                              🏪 Retirada na Loja
                            </Badge>
                          )}
                        </div>

                        {/* Client info */}
                        <p className="text-sm text-gray-700 font-medium">{clientName}</p>
                        <p className="text-xs text-gray-500 mb-3">{clientPhone} {order.guestEmail ? `• ${order.guestEmail}` : ""}</p>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400 uppercase tracking-wide">Total</p>
                            <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.totalPrice)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wide">Pagamento</p>
                            <p className="font-semibold text-gray-700">{paymentLabel}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wide">Entrega</p>
                            <p className="font-semibold text-gray-700">{shippingLabel}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wide">Data</p>
                            <p className="font-semibold text-gray-700">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white gap-1 w-full"
                          onClick={() => handleOpen(order.id)}
                          disabled={openingId === order.id}
                        >
                          {openingId === order.id ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Abrindo...</>
                          ) : (
                            <>Abrir <ChevronRight className="w-4 h-4" /></>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(order.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Delete Confirmation */}
                    {confirmDeleteId === order.id && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                        <p className="text-sm text-red-800 font-medium">Confirmar exclusão do pedido #{order.orderNumber}?</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => deleteOrderMutation.mutate({ orderId: order.id })}
                            disabled={deleteOrderMutation.isPending}
                          >
                            {deleteOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer link */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/admin/pedidos">
            <Button variant="outline" className="gap-2">
              Ver Todos os Pedidos
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
