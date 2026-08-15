import AdminLayout from "@/components/AdminLayout";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProductionDashboardSummary, isProductionPriority } from "@/lib/production-dashboard";
import { filterAndSortProductionOrders, type ProductionDashboardSort } from "@/lib/production-dashboard-filters";
import { paginateProductionDashboardItems } from "@/lib/production-dashboard-pagination";
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, ClipboardCheck, Loader2, PackageCheck, Printer, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { Link } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  analisando: "Analisando",
  com_problemas: "Com problema",
  em_producao: "Em produção",
  pronto_entrega: "Pronto para entrega",
  pronto_retirada: "Pronto para retirada",
  pagamento_aprovado: "Pagamento aprovado",
  pagamento_retirada: "Pagamento na retirada",
};

const LANE_ICONS = [ClipboardCheck, Printer, PackageCheck, AlertTriangle];
const PRIORITY_PAGE_SIZE = 8;

export default function ProductionDashboard() {
  const { data: orders = [], isLoading, isFetching, refetch } = trpc.admin.getAllOrders.useQuery();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<ProductionDashboardSort>("newest");
  const [priorityPage, setPriorityPage] = useState(1);
  const filteredOrders = useMemo(
    () => filterAndSortProductionOrders(orders, { query, status: statusFilter, sort }),
    [orders, query, statusFilter, sort]
  );
  const lanes = getProductionDashboardSummary(filteredOrders);
  const priorityOrders = filteredOrders.filter((order) => isProductionPriority(order.status));
  const paginatedPriorityOrders = paginateProductionDashboardItems(priorityOrders, priorityPage, PRIORITY_PAGE_SIZE);
  const hasActiveFilters = query.length > 0 || statusFilter !== "all" || sort !== "newest";

  useEffect(() => {
    setPriorityPage(1);
  }, [query, statusFilter, sort]);

  useEffect(() => {
    if (priorityPage !== paginatedPriorityOrders.currentPage) {
      setPriorityPage(paginatedPriorityOrders.currentPage);
    }
  }, [paginatedPriorityOrders.currentPage, priorityPage]);

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setSort("newest");
  };

  return (
    <AdminLayout>
      <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8 admin-visual-system">
        <div className="mx-auto max-w-7xl space-y-5">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-pink-600">Linha de Produção</p>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Acompanhamento operacional</h1>
              <p className="mt-1 text-sm text-gray-500">Visualize as filas prioritárias e avance pelo procedimento correto em cada área.</p>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="self-start">
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </header>

          {isLoading ? (
            <div className="flex min-h-52 items-center justify-center rounded-xl border bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-pink-600" />
            </div>
          ) : (
            <>
              <section className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <label className="relative block flex-1">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600"><Search className="h-3.5 w-3.5" />Buscar pedido</span>
                    <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Número do pedido" className="pl-9" />
                    <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-gray-400" />
                  </label>
                  <label className="block min-w-48">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600"><SlidersHorizontal className="h-3.5 w-3.5" />Status</span>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100">
                      <option value="all">Todas as filas</option>
                      {Object.entries(STATUS_LABELS).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
                    </select>
                  </label>
                  <label className="block min-w-48">
                    <span className="mb-1.5 text-xs font-medium text-gray-600">Ordenar por</span>
                    <select value={sort} onChange={(event) => setSort(event.target.value as ProductionDashboardSort)} className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100">
                      <option value="newest">Mais recentes</option>
                      <option value="oldest">Mais antigos</option>
                      <option value="highest_value">Maior valor</option>
                    </select>
                  </label>
                  {hasActiveFilters && <Button variant="ghost" onClick={clearFilters} className="text-gray-500 hover:text-pink-600"><X className="mr-1.5 h-4 w-4" />Limpar</Button>}
                </div>
                <p className="mt-3 text-xs text-gray-500">{filteredOrders.length} pedido{filteredOrders.length !== 1 ? "s" : ""} encontrado{filteredOrders.length !== 1 ? "s" : ""}.</p>
              </section>

              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {lanes.map((lane, index) => {
                  const Icon = LANE_ICONS[index];
                  return (
                    <Link key={lane.id} href={lane.href} className="group">
                      <Card className="h-full border-gray-200 transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="rounded-lg bg-pink-50 p-2 text-pink-600"><Icon className="h-4 w-4" /></div>
                            <span className="text-2xl font-semibold leading-none text-gray-900">{lane.count}</span>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-gray-800">{lane.label}</p>
                          <p className="mt-1 text-xs leading-4 text-gray-500">{lane.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </section>

              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Fila prioritária</h2>
                    <p className="text-xs text-gray-500">Pedidos que exigem análise ou atuação da produção.</p>
                  </div>
                  <Badge variant="secondary" className="w-fit bg-pink-50 text-pink-700">{priorityOrders.length} em acompanhamento</Badge>
                </div>

                {priorityOrders.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">Não há pedidos prioritários para os filtros selecionados.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {paginatedPriorityOrders.items.map((order) => (
                      <div key={order.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                          <p className="mt-0.5 text-xs text-gray-500">Criado em {new Date(order.createdAt).toLocaleDateString("pt-BR")} · R$ {Number(order.totalPrice).toFixed(2).replace(".", ",")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">{STATUS_LABELS[order.status] || order.status}</Badge>
                          <Link href={`/admin/pedidos/${order.id}`}>
                            <Button size="sm" variant="outline">Abrir pedido <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {priorityOrders.length > PRIORITY_PAGE_SIZE && (
                  <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>Página {paginatedPriorityOrders.currentPage} de {paginatedPriorityOrders.totalPages} · {paginatedPriorityOrders.totalItems} pedidos</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setPriorityPage((page) => page - 1)} disabled={paginatedPriorityOrders.currentPage === 1}>
                        <ChevronLeft className="mr-1 h-3.5 w-3.5" />Anterior
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPriorityPage((page) => page + 1)} disabled={paginatedPriorityOrders.currentPage === paginatedPriorityOrders.totalPages}>
                        Próxima<ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
