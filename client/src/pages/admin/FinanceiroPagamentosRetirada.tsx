import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Package, RefreshCw, CheckCircle, Clock, Truck, User, Users } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

function formatCurrency(v: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
function formatDate(ts: any) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("pt-BR");
}

type StatusRetirada = "aguardando_producao" | "pronto_retirada" | "pago" | "retirado_cliente" | "retirado_terceiros";

const STATUS_CONFIG: Record<StatusRetirada, { label: string; color: string; icon: any }> = {
  aguardando_producao: { label: "Em Produção", color: "bg-blue-100 text-blue-700", icon: Clock },
  pronto_retirada: { label: "Pronto p/ Retirada", color: "bg-yellow-100 text-yellow-700", icon: Package },
  pago: { label: "A Receber", color: "bg-green-100 text-green-700", icon: CheckCircle },
  retirado_cliente: { label: "Retirado (Cliente)", color: "bg-emerald-100 text-emerald-700", icon: User },
  retirado_terceiros: { label: "Retirado (Terceiros)", color: "bg-teal-100 text-teal-700", icon: Users },
};

const NEXT_STATUS: Record<string, StatusRetirada[]> = {
  aguardando_producao: ["pronto_retirada"],
  pronto_retirada: ["pago", "retirado_cliente", "retirado_terceiros"],
  pago: ["retirado_cliente", "retirado_terceiros"],
  retirado_cliente: [],
  retirado_terceiros: [],
};

export default function FinanceiroPagamentosRetirada() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [actionDialog, setActionDialog] = useState<{ open: boolean; order: any; nextStatus: StatusRetirada | null }>({
    open: false, order: null, nextStatus: null,
  });

  const { data, isLoading, refetch } = trpc.financeiro.getPagamentosRetirada.useQuery({
    page, limit: 30, status: filterStatus || undefined,
  });

  const atualizarStatus = trpc.financeiro.atualizarStatusRetirada.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      setActionDialog({ open: false, order: null, nextStatus: null });
      refetch();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const allOrders = data?.data ?? [];

  // Agrupar por status para visão kanban
  const byStatus: Record<string, any[]> = {};
  for (const o of allOrders) {
    const s = o.status || "aguardando_producao";
    if (!byStatus[s]) byStatus[s] = [];
    byStatus[s].push(o);
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagamentos na Retirada</h1>
          <p className="text-sm text-gray-500 mt-1">Pedidos com retirada na loja e pagamento presencial</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()} className="border-pink-200 text-pink-700 hover:bg-pink-50">
          <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />Atualizar
        </Button>
      </div>

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterStatus === "" ? "default" : "outline"}
          size="sm"
          type="button"
          onClick={() => { setFilterStatus(""); setPage(1); }}
          className={filterStatus === "" ? "bg-pink-600 hover:bg-pink-700 text-white" : "border-pink-200 text-pink-700 hover:bg-pink-50"}
          aria-pressed={filterStatus === ""}
        >
          Todos ({data?.total ?? 0})
        </Button>
        {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
          <Button key={k} type="button" variant={filterStatus === k ? "default" : "outline"} size="sm"
            onClick={() => { setFilterStatus(k); setPage(1); }}
            className={filterStatus === k ? "bg-pink-600 hover:bg-pink-700 text-white" : "border-pink-200 text-pink-700 hover:bg-pink-50"}
            aria-pressed={filterStatus === k}>
            {cfg.label} ({byStatus[k]?.length ?? 0})
          </Button>
        ))}
      </div>

      {/* Kanban ou lista */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : !allOrders.length ? (
        <div className="p-8 text-center text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-30" aria-hidden="true" />
          <p>Nenhum pedido de retirada encontrado</p>
        </div>
      ) : filterStatus ? (
        // Vista em lista quando filtrado
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Pedido</th>
                    <th className="text-left p-3 font-medium text-gray-600">Cliente</th>
                    <th className="text-right p-3 font-medium text-gray-600">Valor</th>
                    <th className="text-left p-3 font-medium text-gray-600">Data</th>
                    <th className="text-left p-3 font-medium text-gray-600">Status</th>
                    <th className="text-center p-3 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allOrders.map((item: any, i: number) => {
                    const cfg = STATUS_CONFIG[item.status as StatusRetirada] || STATUS_CONFIG.aguardando_producao;
                    const nextStatuses = NEXT_STATUS[item.status] || [];
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-xs font-semibold text-pink-600">#{item.orderNumber}</td>
                        <td className="p-3 font-medium">{item.cliente || "—"}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(item.valor)}</td>
                        <td className="p-3 text-gray-500">{formatDate(item.createdAt)}</td>
                        <td className="p-3">
                          <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 justify-center">
                            {nextStatuses.map(ns => (
                              <Button key={ns} type="button" size="sm" variant="outline" className="h-7 px-2 text-xs border-pink-200 text-pink-700 hover:bg-pink-50"
                                onClick={() => setActionDialog({ open: true, order: item, nextStatus: ns })}
                                aria-label={`Alterar pedido ${item.orderNumber} para ${STATUS_CONFIG[ns].label}`}>
                                {STATUS_CONFIG[ns].label}
                              </Button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Vista Kanban quando sem filtro
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(Object.keys(STATUS_CONFIG) as StatusRetirada[]).map((status) => {
            const cfg = STATUS_CONFIG[status];
            const items = byStatus[status] || [];
            return (
              <div key={status} className="space-y-2">
                <div className={`flex items-center gap-2 p-2 rounded-lg ${cfg.color}`}>
                  <cfg.icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold">{cfg.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {items.map((item: any, i: number) => {
                    const nextStatuses = NEXT_STATUS[item.status] || [];
                    return (
                      <Card key={i} className="border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <span className="font-mono text-xs font-bold text-pink-600">#{item.orderNumber}</span>
                            <span className="text-xs font-bold text-gray-900">{formatCurrency(item.valor)}</span>
                          </div>
                          <p className="text-xs font-medium text-gray-700 truncate">{item.cliente || "—"}</p>
                          <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
                          {nextStatuses.length > 0 && (
                            <div className="flex flex-col gap-1 pt-1">
                              {nextStatuses.map(ns => (
                                <Button key={ns} type="button" size="sm" variant="outline" className="h-6 text-xs w-full border-pink-200 text-pink-700 hover:bg-pink-50"
                                  onClick={() => setActionDialog({ open: true, order: item, nextStatus: ns })}
                                  aria-label={`Alterar pedido ${item.orderNumber} para ${STATUS_CONFIG[ns].label}`}>
                                  → {STATUS_CONFIG[ns].label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-400 border-2 border-dashed rounded-lg">
                      Nenhum pedido
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog: Confirmar ação */}
      <Dialog open={actionDialog.open} onOpenChange={(o) => !o && setActionDialog({ open: false, order: null, nextStatus: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Atualização de Status</DialogTitle>
          </DialogHeader>
          {actionDialog.order && actionDialog.nextStatus && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pedido</span>
                  <span className="font-mono font-semibold">#{actionDialog.order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-medium">{actionDialog.order.cliente}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-bold text-green-600">{formatCurrency(actionDialog.order.valor)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                <span className="text-sm text-gray-600">Novo status:</span>
                <Badge className={`${STATUS_CONFIG[actionDialog.nextStatus].color} border-0`}>
                  {STATUS_CONFIG[actionDialog.nextStatus].label}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActionDialog({ open: false, order: null, nextStatus: null })}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={atualizarStatus.isPending}
              aria-busy={atualizarStatus.isPending}
              onClick={() => {
                if (actionDialog.order && actionDialog.nextStatus) {
                  atualizarStatus.mutate({
                    orderId: actionDialog.order.pedidoId,
                    status: actionDialog.nextStatus,
                  });
                }
              }}
            >
              {atualizarStatus.isPending ? "Atualizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
