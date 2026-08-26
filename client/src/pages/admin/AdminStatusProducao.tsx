import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
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
import { Search, ChevronDown, ChevronRight, Printer, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductionQuickDetailsDialog } from "@/components/admin/ProductionQuickDetailsDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const PRODUCTION_STATUS: Record<string, { label: string; color: string }> = {
  pendente:               { label: "Pendente",               color: "bg-gray-100 text-gray-800 border-gray-200" },
  impresso:               { label: "Impresso",               color: "bg-blue-100 text-blue-800 border-blue-200" },
  acabamento_finalizado:  { label: "Acabamento Finalizado",  color: "bg-green-100 text-green-800 border-green-200" },
  encerrado:              { label: "Encerrado",              color: "bg-slate-100 text-slate-700 border-slate-200" },
};

const normalizeProductionStatus = (status?: string | null) =>
  status === "pending" ? "pendente" : status || "pendente";

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

export default function AdminStatusProducao() {
  const searchStr = useSearch();
  const urlStatus = new URLSearchParams(searchStr).get("status") || "todos";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(urlStatus);
  const [quickDetailsStatus, setQuickDetailsStatus] = useState<string | null>(null);
  const [historyEntryToDelete, setHistoryEntryToDelete] = useState<any | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const { adminUser } = useAdminAuth();
  const canDeleteHistory = adminUser?.role === "admin" || adminUser?.role === "superadmin";

  useEffect(() => {
    const s = new URLSearchParams(searchStr).get("status") || "todos";
    setFilterStatus(s);
  }, [searchStr]);
  const utils = trpc.useUtils();

  const { data: allOrders = [], isLoading } = trpc.checkout.getAllOrders.useQuery();
  const { data: productionHistory = [], isLoading: isLoadingHistory } = trpc.admin.getProductionStatusHistory.useQuery();

  const updateProductionMutation = trpc.admin.updateProductionStatus.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success(variables.productionStatus === "acabamento_finalizado" ? "Produção finalizada: pedido encaminhado para retirada ou entrega." : "Status de produção atualizado!");
      await Promise.all([
        utils.checkout.getAllOrders.invalidate(),
        utils.admin.getProductionStatusHistory.invalidate(),
      ]);
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar status"),
  });
  const deleteProductionHistoryMutation = trpc.admin.deleteProductionStatusHistory.useMutation({
    onSuccess: async () => {
      toast.success("Registro removido do Histórico de Status de Produção.");
      setHistoryEntryToDelete(null);
      await utils.admin.getProductionStatusHistory.invalidate();
    },
    onError: (error) => toast.error(error.message || "Não foi possível excluir o registro histórico."),
  });

  const filtered = useMemo(() => {
    return (allOrders as any[])
      .filter((o) => {
        if (o.status !== "em_producao") return false;
        const matchStatus = filterStatus === "todos" || normalizeProductionStatus(o.productionStatus) === filterStatus;
        const matchSearch =
          !search ||
          o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
          o.deliveryFullName?.toLowerCase().includes(search.toLowerCase()) ||
          o.deliveryPhone?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, filterStatus, search]);

  const history = useMemo(() => (allOrders as any[])
    .filter((o) => ["pronto_retirada", "pronto_entrega", "entregue"].includes(o.status) && o.productionStatus === "acabamento_finalizado")
    .sort((a: any, b: any) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()), [allOrders]);

  const productionOrdersByStatus = useMemo(() => {
    const activeOrders = (allOrders as any[]).filter((o) => o.status === "em_producao");
    return {
      pendente: activeOrders.filter((o) => normalizeProductionStatus(o.productionStatus) === "pendente"),
      impresso: activeOrders.filter((o) => normalizeProductionStatus(o.productionStatus) === "impresso"),
      acabamento_finalizado: activeOrders.filter((o) => normalizeProductionStatus(o.productionStatus) === "acabamento_finalizado"),
    } as Record<string, any[]>;
  }, [allOrders]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando pedidos de produção" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Printer className="w-6 h-6 text-pink-600" aria-hidden="true" />
              Status de Produção
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Pedidos em produção entram automaticamente nesta fila para acompanhamento operacional.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span aria-live="polite">{filtered.length} pedido{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <label htmlFor="production-status-search" className="sr-only">Buscar pedidos de produção</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <Input
                id="production-status-search"
                placeholder="Buscar por número, cliente ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["todos", "pendente", "impresso", "acabamento_finalizado"].map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      filterStatus === s
                        ? "bg-pink-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    aria-pressed={filterStatus === s}
                  >
                    {s === "todos" ? "Todos" : PRODUCTION_STATUS[s]?.label ?? s}
                  </button>
                  {s !== "todos" && (
                    <button
                      type="button"
                      onClick={() => setQuickDetailsStatus(s)}
                      className="min-w-5 rounded-full border border-pink-200 bg-pink-50 px-1.5 py-0.5 text-xs font-semibold text-pink-700 hover:bg-pink-100"
                      title={`Ver detalhes de ${PRODUCTION_STATUS[s]?.label}`}
                      aria-label={`Ver detalhes de ${productionOrdersByStatus[s]?.length ?? 0} itens em ${PRODUCTION_STATUS[s]?.label}`}
                    >
                      {productionOrdersByStatus[s]?.length ?? 0}
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
              <Printer className="w-12 h-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
              <p className="text-gray-500">Nenhum pedido encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((order: any) => {
              const currentProdStatus = normalizeProductionStatus(order.productionStatus);
              const statusCfg = PRODUCTION_STATUS[currentProdStatus];
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

                      {/* Status de Produção */}
                      <div className="flex items-center gap-2">
                        <span id={`production-status-label-${order.orderId ?? order.id}`} className="text-xs text-gray-500 whitespace-nowrap">Produção:</span>
                        <Badge className={`text-xs border ${statusCfg?.color}`}>
                          {statusCfg?.label ?? currentProdStatus}
                        </Badge>
                      </div>

                      {/* Dropdown para alterar status */}
                      <div className="flex items-center gap-2">
                        <label htmlFor={`production-status-${order.orderId ?? order.id}`} className="sr-only">Atualizar produção do pedido {order.orderNumber}</label>
                        <Select
                          value={currentProdStatus}
                          onValueChange={(val) =>
                            updateProductionMutation.mutate({
                              orderId: order.orderId ?? order.id,
                              productionStatus: val as any,
                            })
                          }
                        >
                          <SelectTrigger id={`production-status-${order.orderId ?? order.id}`} className="h-8 text-xs w-[200px]" disabled={updateProductionMutation.isPending} aria-describedby={`production-status-label-${order.orderId ?? order.id}`} aria-busy={updateProductionMutation.isPending}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="impresso">Impresso</SelectItem>
                            <SelectItem value="acabamento_finalizado">Acabamento Finalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Link para detalhes */}
                      <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" asChild>
                        <Link href={`/admin/pedidos/${order.orderId ?? order.id}`} aria-label={`Ver detalhes do pedido ${order.orderNumber}`}>
                          Detalhes
                          <ChevronRight className="w-3 h-3" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Histórico de Status de Produção</h2>
                <p className="mt-1 text-sm text-gray-500">Todas as mudanças de estágio, incluindo a retirada automática da tag nos estados finais.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0 text-pink-700 hover:bg-pink-50 hover:text-pink-800" onClick={() => setIsHistoryExpanded((expanded) => !expanded)} aria-expanded={isHistoryExpanded} aria-controls="production-status-history" aria-label={isHistoryExpanded ? "Recolher Histórico de Status de Produção" : "Expandir Histórico de Status de Produção"} title={isHistoryExpanded ? "Recolher histórico" : "Expandir histórico"}>
                <ChevronDown className={`h-4 w-4 transition-transform ${isHistoryExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
              </Button>
            </div>
            {isHistoryExpanded && <div id="production-status-history">{isLoadingHistory ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-pink-600" /></div> : productionHistory.length === 0 ? <p className="py-6 text-center text-sm text-gray-400">Nenhuma alteração de produção registrada.</p> : <div className="mt-4 space-y-2" aria-live="polite">{productionHistory.map((entry: any) => { const statusCfg = PRODUCTION_STATUS[entry.newStatus] ?? PRODUCTION_STATUS.encerrado; return <div key={`production-history-${entry.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">#{entry.orderNumber ?? entry.orderId} · {entry.deliveryFullName || "Cliente não informado"}</span><Badge className={`border ${statusCfg.color}`}>{statusCfg.label}</Badge></div><p className="mt-1 text-xs text-gray-500">{fmtDate(entry.createdAt)} às {fmtTime(entry.createdAt)}{entry.changedByName ? ` · ${entry.changedByName}` : ""}</p>{entry.notes && <p className="mt-1 text-xs text-gray-600">{entry.notes}</p>}</div>{canDeleteHistory && <Button type="button" variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" title="Excluir registro do histórico" aria-label={`Excluir registro de produção do pedido ${entry.orderNumber ?? entry.orderId}`} onClick={() => setHistoryEntryToDelete(entry)}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>}</div>; })}</div>}</div>}
          </CardContent>
        </Card>
        <AlertDialog open={Boolean(historyEntryToDelete)} onOpenChange={(open) => !open && setHistoryEntryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir este registro do Histórico de Status de Produção?</AlertDialogTitle>
              <AlertDialogDescription>Esta exclusão remove somente o evento selecionado do histórico e não altera o status atual do pedido.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteProductionHistoryMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={deleteProductionHistoryMutation.isPending} onClick={(event) => { event.preventDefault(); if (historyEntryToDelete?.id) deleteProductionHistoryMutation.mutate({ id: historyEntryToDelete.id }); }}>
                {deleteProductionHistoryMutation.isPending ? "Excluindo..." : "Excluir registro"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <ProductionQuickDetailsDialog
          open={Boolean(quickDetailsStatus)}
          onOpenChange={(open) => !open && setQuickDetailsStatus(null)}
          title={quickDetailsStatus ? `Detalhes rápidos — ${PRODUCTION_STATUS[quickDetailsStatus]?.label}` : "Detalhes rápidos"}
          statusLabel={quickDetailsStatus ? PRODUCTION_STATUS[quickDetailsStatus]?.label ?? quickDetailsStatus : ""}
          orders={quickDetailsStatus ? productionOrdersByStatus[quickDetailsStatus] ?? [] : []}
        />
      </div>
    </AdminLayout>
  );
}
