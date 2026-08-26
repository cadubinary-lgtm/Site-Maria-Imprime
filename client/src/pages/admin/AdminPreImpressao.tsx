import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useSearch } from "wouter";
import { Search, ChevronRight, Layers, Loader2, Trash2, CheckCircle2, CircleAlert, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ProductionQuickDetailsDialog } from "@/components/admin/ProductionQuickDetailsDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const PRE_PRODUCTION_STATUS: Record<string, { label: string; color: string }> = {
  liberado_analise: { label: "Liberado para Análise", color: "bg-amber-100 text-amber-800 border-amber-200" },
  arte_final_aprovada: { label: "Arte Final Aprovada", color: "bg-green-100 text-green-800 border-green-200" },
  em_producao: { label: "Arte Final Aprovada", color: "bg-green-100 text-green-800 border-green-200" },
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pagamento_aprovado: "Pagamento Aprovado",
  pagamento_retirada: "Pagamento Retirada",
  analisando: "Analisando",
  com_problemas: "Com Problemas",
  em_producao: "Em Produção",
  pronto_entrega: "Pronto p/ Entrega",
  pronto_retirada: "Pronto p/ Retirada",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  pagamento_aprovado: "bg-pink-50 text-pink-700 border-pink-200",
  pagamento_retirada: "bg-pink-50 text-pink-700 border-pink-200",
  analisando: "bg-amber-50 text-amber-800 border-amber-200",
  com_problemas: "bg-red-50 text-red-700 border-red-200",
  em_producao: "bg-amber-50 text-amber-800 border-amber-200",
  pronto_entrega: "bg-teal-50 text-teal-700 border-teal-200",
  pronto_retirada: "bg-teal-50 text-teal-700 border-teal-200",
  entregue: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelado: "bg-red-50 text-red-700 border-red-200",
};

const fmtDate = (date: any) => date ? new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";
const fmtTime = (date: any) => date ? new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "-";

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
  const utils = trpc.useUtils();

  useEffect(() => {
    const status = new URLSearchParams(searchStr).get("status") || "todos";
    setFilterStatus(status);
  }, [searchStr]);

  const { data: allOrders = [], isLoading } = trpc.checkout.getAllOrders.useQuery();
  const { data: historyResult, isLoading: isLoadingHistory } = trpc.preImpressaoHistory.getHistory.useQuery({ page: historyPage, limit: 20 });

  const deleteHistoryMutation = trpc.preImpressaoHistory.deleteHistoryRecord.useMutation({
    onSuccess: async () => {
      toast.success("Registro removido permanentemente do histórico.", {
        position: "top-right",
        duration: 3500,
        id: "prepress-history-delete",
      });
      setHistoryOrderToDelete(null);
      await utils.preImpressaoHistory.getHistory.invalidate();
    },
    onError: (error) => toast.error(error.message || "Não foi possível excluir o registro histórico."),
  });

  const activeOrders = useMemo(
    () => (allOrders as any[]).filter((order) => !["pronto_entrega", "pronto_retirada", "entregue", "cancelado"].includes(order.status)),
    [allOrders]
  );

  const filtered = useMemo(() => {
    return activeOrders
      .filter((order) => {
        const effectivePreProductionStatus = order.status === "em_producao"
          ? "em_producao"
          : (order.preProductionStatus || "liberado_analise");
        const isApprovedOrProducing = ["arte_final_aprovada", "em_producao"].includes(effectivePreProductionStatus);
        const matchesStatus = filterStatus === "todos"
          ? true
          : filterStatus === "arte_final_aprovada"
            ? isApprovedOrProducing
            : effectivePreProductionStatus === filterStatus;
        const matchesSearch = !search
          || order.orderNumber?.toLowerCase().includes(search.toLowerCase())
          || order.deliveryFullName?.toLowerCase().includes(search.toLowerCase())
          || order.deliveryPhone?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeOrders, filterStatus, search]);

  const preProductionOrdersByStatus = useMemo(() => ({
    liberado_analise: activeOrders.filter((order) => order.status !== "em_producao" && (order.preProductionStatus || "liberado_analise") === "liberado_analise"),
    arte_final_aprovada: activeOrders.filter((order) => order.status === "em_producao" || ["arte_final_aprovada", "em_producao"].includes(order.preProductionStatus || "")),
  }) as Record<string, any[]>, [activeOrders]);

  const prePressSummary = useMemo(() => ({
    active: activeOrders.length,
    inAnalysis: activeOrders.filter((order) => order.status !== "em_producao" && (order.preProductionStatus || "liberado_analise") === "liberado_analise").length,
    approved: activeOrders.filter((order) => order.status === "em_producao" || ["arte_final_aprovada", "em_producao"].includes(order.preProductionStatus || "")).length,
  }), [activeOrders]);

  const hasActiveFilters = Boolean(search) || filterStatus !== "todos";
  const clearFilters = () => {
    setSearch("");
    setFilterStatus("todos");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" aria-label="Carregando pedidos da pré-impressão" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6" aria-labelledby="prepress-title">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pink-600">Linha de produção</p>
              <h1 id="prepress-title" className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
                <span className="rounded-xl bg-pink-600 p-2 text-white shadow-sm shadow-pink-200">
                  <Layers className="h-5 w-5" aria-hidden="true" />
                </span>
                Pré-Impressão
              </h1>
              <p className="mt-2 text-sm text-slate-600">Acompanhe as artes em análise, aprovadas e os pedidos já encaminhados para produção.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-medium text-pink-700">
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span aria-live="polite">{filtered.length} pedido{filtered.length !== 1 ? "s" : ""} na visualização</span>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Indicadores da pré-impressão">
            <PrePressMetric label="Pedidos ativos" value={prePressSummary.active} description="Ainda na linha de pré-impressão" icon={Layers} tone="pink" />
            <PrePressMetric label="Liberado p/ Análise" value={prePressSummary.inAnalysis} description="Prontos para revisão da arte" icon={CircleAlert} tone="slate" />
            <PrePressMetric label="Arte aprovada" value={prePressSummary.approved} description="Aguardando sequência operacional" icon={CheckCircle2} tone="green" />
          </section>

          <Card className="border-pink-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end" aria-label="Filtros da pré-impressão">
                <div className="relative min-w-[200px] flex-1">
                  <label htmlFor="prepress-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar pedido</label>
                  <Search className="absolute left-3 top-[calc(50%+11px)] h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <Input
                    id="prepress-search"
                    placeholder="Buscar por número, cliente ou telefone..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-10 border-slate-200 pl-9 text-sm focus-visible:ring-pink-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Etapa da arte</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {["todos", "liberado_analise", "arte_final_aprovada"].map((status) => (
                      <div key={status} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFilterStatus(status)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${filterStatus === status
                            ? "border-pink-600 bg-pink-600 text-white shadow-sm shadow-pink-200"
                            : "border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700"}`}
                          aria-pressed={filterStatus === status}
                          aria-label={`Filtrar por ${status === "todos" ? "todos os pedidos" : PRE_PRODUCTION_STATUS[status]?.label ?? status}`}
                        >
                          {status === "todos" ? "Todos" : PRE_PRODUCTION_STATUS[status]?.label ?? status}
                        </button>
                        {status !== "todos" && (
                          <button
                            type="button"
                            onClick={() => setQuickDetailsStatus(status)}
                            className="min-w-6 rounded-full border border-pink-200 bg-pink-50 px-1.5 py-1 text-xs font-semibold text-pink-700 hover:bg-pink-100"
                            title={`Ver detalhes de ${PRE_PRODUCTION_STATUS[status]?.label}`}
                            aria-label={`Ver detalhes de ${preProductionOrdersByStatus[status]?.length ?? 0} itens em ${PRE_PRODUCTION_STATUS[status]?.label}`}
                          >
                            {preProductionOrdersByStatus[status]?.length ?? 0}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-pink-700 hover:bg-pink-50 hover:text-pink-800">
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {filtered.length === 0 ? (
            <Card className="border-dashed border-slate-200 bg-white">
              <CardContent className="py-12 text-center">
                <Layers className="mx-auto mb-4 h-12 w-12 text-pink-200" aria-hidden="true" />
                <p className="font-medium text-slate-700">Nenhum pedido encontrado</p>
                <p className="mt-1 text-sm text-slate-500">Ajuste a busca ou os filtros para visualizar outros pedidos.</p>
                {hasActiveFilters && <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="mt-4 border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800">Limpar filtros</Button>}
              </CardContent>
            </Card>
          ) : (
            <section className="space-y-3" aria-label="Pedidos ativos de pré-impressão">
              {filtered.map((order: any) => {
                const currentPreStatus = order.status === "em_producao" ? "em_producao" : (order.preProductionStatus || "liberado_analise");
                const statusConfig = PRE_PRODUCTION_STATUS[currentPreStatus];
                return (
                  <Card key={order.orderId ?? order.id} className="border-slate-200 bg-white transition-shadow hover:shadow-md">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">#{order.orderNumber}</p>
                            <Badge variant="outline" className={`text-xs ${ORDER_STATUS_COLOR[order.status] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
                              {ORDER_STATUS_LABEL[order.status] ?? order.status}
                            </Badge>
                          </div>
                          <p className="mt-1.5 text-sm font-medium text-slate-700">{order.deliveryFullName || "Cliente não informado"}</p>
                          <p className="mt-1 text-xs text-slate-500">{order.deliveryPhone || "Telefone não informado"} <span aria-hidden="true">•</span> criado em {fmtDate(order.createdAt)} às {fmtTime(order.createdAt)}</p>
                        </div>

                        <div className="flex w-full items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 lg:w-auto lg:min-w-[230px]">
                          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">Pré-impressão</span>
                          <Badge className={`border ${statusConfig?.color}`}>{statusConfig?.label ?? currentPreStatus}</Badge>
                        </div>

                        <Button variant="outline" size="sm" className="h-9 gap-1 border-pink-200 bg-white text-pink-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-800" asChild>
                          <Link href={`/admin/pedidos/${order.orderId ?? order.id}`} aria-label={`Ver detalhes do pedido ${order.orderNumber}`}>
                            Detalhes
                            <ChevronRight className="h-3 w-3" aria-hidden="true" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Histórico da Pré-Impressão</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Pedidos removidos da lista ativa após ficarem Prontos para Entrega. São exibidos 20 registros por página.</p>
                </div>
                <Badge variant="outline" className="w-fit border-pink-200 bg-pink-50 text-pink-700">Consulta histórica</Badge>
              </div>
              {isLoadingHistory ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-pink-600" aria-label="Carregando histórico de pré-impressão" /></div>
              ) : !historyResult?.data.length ? (
                <p className="py-8 text-center text-sm text-slate-400">Nenhum pedido finalizado no histórico.</p>
              ) : (
                <>
                  <div className="mt-4 space-y-2">
                    {historyResult.data.map((order: any) => (
                      <div key={`history-${order.orderId ?? order.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50">
                        <span className="min-w-0 truncate font-medium text-slate-800">#{order.orderNumber} · {order.deliveryFullName || "Cliente não informado"}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline" className={ORDER_STATUS_COLOR[order.status] ?? "border-slate-200 bg-slate-50 text-slate-700"}>{ORDER_STATUS_LABEL[order.status] ?? order.status}</Badge>
                          {canDeleteHistory && (
                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" title={`Excluir permanentemente o pedido ${order.orderNumber}`} aria-label={`Excluir permanentemente o pedido ${order.orderNumber}`} onClick={() => setHistoryOrderToDelete(order)}>
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {historyResult.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-xs text-slate-500" aria-live="polite">Página {historyResult.page} de {historyResult.totalPages} · {historyResult.total} registro(s)</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 border-pink-200 text-xs text-pink-700 hover:bg-pink-50 hover:text-pink-800" disabled={historyPage === 1} onClick={() => setHistoryPage((page) => page - 1)}>Anterior</Button>
                        <Button variant="outline" size="sm" className="h-8 border-pink-200 text-xs text-pink-700 hover:bg-pink-50 hover:text-pink-800" disabled={historyPage === historyResult.totalPages} onClick={() => setHistoryPage((page) => page + 1)}>Próxima</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={Boolean(historyOrderToDelete)} onOpenChange={(open) => !open && setHistoryOrderToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir este registro histórico permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>O pedido #{historyOrderToDelete?.orderNumber} e seus registros vinculados serão removidos de forma permanente. Esta ação não poderá ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteHistoryMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={deleteHistoryMutation.isPending} aria-busy={deleteHistoryMutation.isPending} onClick={(event) => {
                event.preventDefault();
                const orderId = historyOrderToDelete?.orderId ?? historyOrderToDelete?.id;
                if (orderId) deleteHistoryMutation.mutate({ orderId });
              }}>
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
      </main>
    </AdminLayout>
  );
}

function PrePressMetric({ label, value, description, icon: Icon, tone }: {
  label: string;
  value: number;
  description: string;
  icon: typeof Layers;
  tone: "pink" | "amber" | "slate" | "green";
}) {
  const styles = {
    pink: "bg-pink-50 text-pink-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-50 text-green-700",
  }[tone];

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${styles}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
