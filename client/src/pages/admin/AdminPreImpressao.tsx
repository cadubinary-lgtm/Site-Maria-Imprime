import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useSearch } from "wouter";
import { Search, ChevronRight, Layers, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductionQuickDetailsDialog } from "@/components/admin/ProductionQuickDetailsDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const PRE_PRODUCTION_STATUS: Record<string, { label: string; color: string }> = {
  liberado_analise:    { label: "Liberado para Análise",  color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  arte_final_aprovada: { label: "Arte Final Aprovada",    color: "bg-green-100 text-green-800 border-green-200" },
  em_producao:         { label: "Arte Final Aprovada",    color: "bg-green-100 text-green-800 border-green-200" },
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pagamento_aprovado: "Pagamento Aprovado",
  pagamento_retirada: "Pagamento Retirada",
  analisando:         "Analisando",
  com_problemas:      "Com Problemas",
  em_producao:        "Em Produção",
  pronto_entrega:     "Pronto p/ Entrega",
  pronto_retirada:    "Pronto p/ Retirada",
  entregue:           "Entregue",
  cancelado:          "Cancelado",
};

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

const fmtTime = (d: any) =>
  d ? new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "-";

export default function AdminPreImpressao() {
  const searchStr = useSearch();
  const urlStatus = new URLSearchParams(searchStr).get("status") || "todos";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(urlStatus);
  const [quickDetailsStatus, setQuickDetailsStatus] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyOrderToDelete, setHistoryOrderToDelete] = useState<any | null>(null);
  const { adminUser } = useAdminAuth();
  const canDeleteHistory = adminUser?.role === "superadmin";

  useEffect(() => {
    const s = new URLSearchParams(searchStr).get("status") || "todos";
    setFilterStatus(s);
  }, [searchStr]);
  const utils = trpc.useUtils();

  const { data: allOrders = [], isLoading } = trpc.checkout.getAllOrders.useQuery();
  const { data: historyResult, isLoading: isLoadingHistory } = trpc.preImpressaoHistory.getHistory.useQuery({ page: historyPage, limit: 20 });

  const updatePreProductionMutation = trpc.admin.updatePreProductionStatus.useMutation({
    onSuccess: () => {
      toast.success("Status de pré-impressão atualizado!");
      utils.checkout.getAllOrders.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar status"),
  });

  const deleteHistoryMutation = trpc.preImpressaoHistory.deleteHistoryRecord.useMutation({
    onSuccess: async () => {
      toast.success("Registro removido permanentemente do histórico.");
      setHistoryOrderToDelete(null);
      await utils.preImpressaoHistory.getHistory.invalidate();
    },
    onError: (error) => toast.error(error.message || "Não foi possível excluir o registro histórico."),
  });

  const filtered = useMemo(() => {
    return (allOrders as any[])
      .filter((o) => {
        const isFinishedForDelivery = ["pronto_entrega", "pronto_retirada", "entregue"].includes(o.status);
        const isApprovedOrProducing = ["arte_final_aprovada", "em_producao"].includes(o.preProductionStatus || "") || o.status === "em_producao";
        const matchStatus = filterStatus === "todos"
          ? !isFinishedForDelivery
          : filterStatus === "arte_final_aprovada"
            ? isApprovedOrProducing && !isFinishedForDelivery
            : (o.preProductionStatus || "liberado_analise") === filterStatus && !isFinishedForDelivery;
        const matchSearch =
          !search ||
          o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
          o.deliveryFullName?.toLowerCase().includes(search.toLowerCase()) ||
          o.deliveryPhone?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, filterStatus, search]);

  const preProductionOrdersByStatus = useMemo(() => {
    const activeOrders = (allOrders as any[]).filter((o) => !["pronto_entrega", "pronto_retirada", "entregue"].includes(o.status));
    return {
      liberado_analise: activeOrders.filter((o) => (o.preProductionStatus || "liberado_analise") === "liberado_analise"),
      arte_final_aprovada: activeOrders.filter((o) => ["arte_final_aprovada", "em_producao"].includes(o.preProductionStatus || "") || o.status === "em_producao"),
    } as Record<string, any[]>;
  }, [allOrders]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-orange-500" />
              Pré-Impressão
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Gerencie o status de pré-impressão dos pedidos
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Layers className="w-4 h-4" />
            {filtered.length} pedido{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por número, cliente ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["todos", "liberado_analise", "arte_final_aprovada"].map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      filterStatus === s
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s === "todos" ? "Todos" : PRE_PRODUCTION_STATUS[s]?.label ?? s}
                  </button>
                  {s !== "todos" && (
                    <button
                      type="button"
                      onClick={() => setQuickDetailsStatus(s)}
                      className="min-w-5 rounded-full border border-pink-200 bg-pink-50 px-1.5 py-0.5 text-xs font-semibold text-pink-700 hover:bg-pink-100"
                      title={`Ver detalhes de ${PRE_PRODUCTION_STATUS[s]?.label}`}
                      aria-label={`Ver detalhes de ${preProductionOrdersByStatus[s]?.length ?? 0} itens em ${PRE_PRODUCTION_STATUS[s]?.label}`}
                    >
                      {preProductionOrdersByStatus[s]?.length ?? 0}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum pedido encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((order: any) => {
              const currentPreStatus = order.preProductionStatus || "liberado_analise";
              const statusCfg = PRE_PRODUCTION_STATUS[currentPreStatus];
              // Pedidos com pagamento aprovado ou na retirada ainda não foram liberados pelo comercial
              const isAwaitingRelease = order.status === "pagamento_aprovado" || order.status === "pagamento_retirada";
              return (
                <Card key={order.orderId ?? order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Info do pedido */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm">
                            #{order.orderNumber}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {ORDER_STATUS_LABEL[order.status] ?? order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {order.deliveryFullName} • {order.deliveryPhone} • {fmtTime(order.createdAt)} • {fmtDate(order.createdAt)}
                        </p>
                      </div>

                      {/* Status de Pré-Impressão */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">Pré-Impressão:</span>
                        {isAwaitingRelease ? (
                          <Badge className="text-xs border bg-pink-600 text-white border-pink-600 hover:bg-pink-600">
                            Aguardando liberação
                          </Badge>
                        ) : (
                          <Badge className={`text-xs border ${statusCfg?.color}`}>
                            {statusCfg?.label ?? currentPreStatus}
                          </Badge>
                        )}
                      </div>

                      {/* Status de pré-impressão é gerenciado por item na tela de detalhes */}

                      {/* Link para detalhes */}
                      <Link href={`/admin/pedidos/${order.orderId ?? order.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                          Detalhes
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardContent className="pt-5 pb-5">
            <h2 className="text-sm font-semibold text-gray-800">Histórico da Pré-Impressão</h2>
            <p className="mt-1 text-xs text-gray-500">Pedidos removidos da lista ativa após ficarem Prontos para Entrega. São exibidos 20 registros por página.</p>
            {isLoadingHistory ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-orange-500" /></div> : !historyResult?.data.length ? <p className="py-5 text-center text-sm text-gray-400">Nenhum pedido finalizado no histórico.</p> : <><div className="mt-4 space-y-2">{historyResult.data.map((order: any) => <div key={`history-${order.orderId ?? order.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm"><span className="min-w-0 truncate font-medium">#{order.orderNumber} · {order.deliveryFullName || "Cliente não informado"}</span><div className="flex shrink-0 items-center gap-2"><Badge variant="outline">{ORDER_STATUS_LABEL[order.status] ?? order.status}</Badge>{canDeleteHistory && <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" title={`Excluir permanentemente o pedido ${order.orderNumber}`} aria-label={`Excluir permanentemente o pedido ${order.orderNumber}`} onClick={() => setHistoryOrderToDelete(order)}><Trash2 className="h-3.5 w-3.5" /></Button>}</div></div>)}</div>{historyResult.totalPages > 1 && <div className="mt-4 flex items-center justify-between border-t pt-3"><span className="text-xs text-gray-500">Página {historyResult.page} de {historyResult.totalPages} · {historyResult.total} registro(s)</span><div className="flex gap-2"><Button variant="outline" size="sm" className="h-8 text-xs" disabled={historyPage === 1} onClick={() => setHistoryPage((page) => page - 1)}>Anterior</Button><Button variant="outline" size="sm" className="h-8 text-xs" disabled={historyPage === historyResult.totalPages} onClick={() => setHistoryPage((page) => page + 1)}>Próxima</Button></div></div>}</>}
          </CardContent>
        </Card>
        <AlertDialog open={Boolean(historyOrderToDelete)} onOpenChange={(open) => !open && setHistoryOrderToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir este registro histórico permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>O pedido #{historyOrderToDelete?.orderNumber} e seus registros vinculados serão removidos de forma permanente. Esta ação não poderá ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteHistoryMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={deleteHistoryMutation.isPending} onClick={(event) => { event.preventDefault(); if (historyOrderToDelete?.orderId ?? historyOrderToDelete?.id) deleteHistoryMutation.mutate({ orderId: historyOrderToDelete.orderId ?? historyOrderToDelete.id }); }}>
                {deleteHistoryMutation.isPending ? "Excluindo..." : "Excluir permanentemente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <ProductionQuickDetailsDialog
          open={Boolean(quickDetailsStatus)}
          onOpenChange={(open) => !open && setQuickDetailsStatus(null)}
          title={quickDetailsStatus ? `Detalhes rápidos — ${PRE_PRODUCTION_STATUS[quickDetailsStatus]?.label}` : "Detalhes rápidos"}
          statusLabel={quickDetailsStatus ? PRE_PRODUCTION_STATUS[quickDetailsStatus]?.label ?? quickDetailsStatus : ""}
          orders={quickDetailsStatus ? preProductionOrdersByStatus[quickDetailsStatus] ?? [] : []}
        />
      </div>
    </AdminLayout>
  );
}
