import { useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Clock, Search, ChevronLeft, ChevronRight, Eye, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fmt = (v: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pagamento_aprovado: { label: "Pagamento Aprovado", color: "bg-green-100 text-green-700" },
  pagamento_retirada: { label: "Pag. Retirada", color: "bg-blue-100 text-blue-700" },
  analisando: { label: "Analisando", color: "bg-orange-100 text-orange-700" },
  com_problemas: { label: "Com Problemas", color: "bg-red-100 text-red-700" },
  em_producao: { label: "Em Produção", color: "bg-orange-100 text-orange-700" },
  pronto_entrega: { label: "Pronto p/ Entrega", color: "bg-teal-100 text-teal-700" },
  pronto_retirada: { label: "Pronto p/ Retirada", color: "bg-cyan-100 text-cyan-700" },
  entregue: { label: "Entregue", color: "bg-emerald-100 text-emerald-700" },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-700" },
};

export default function ContasReceber() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  const { data, isLoading } = trpc.gerenciadorFinanceiro.getAccountsReceivable.useQuery({
    page,
    limit,
    search: search || undefined,
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const totalValue = orders.reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/gerenciador-financeiro">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
            <p className="text-sm text-gray-500">Pedidos com pagamento pendente</p>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Total a Receber</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">{fmt(totalValue)}</p>
              <p className="text-xs text-orange-500 mt-1">{total} pedidos pendentes</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pedidos Exibidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
              <p className="text-xs text-gray-400 mt-1">de {total} no total</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {orders.length > 0 ? fmt(totalValue / orders.length) : "R$ 0,00"}
              </p>
              <p className="text-xs text-gray-400 mt-1">por pedido</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente ou pedido..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Pedidos Pendentes de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum pedido pendente encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Pedido</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Forma Pag.</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const statusCfg = STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-700" };
                      return (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">#{order.id}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{order.guestName || order.deliveryFullName || "—"}</p>
                            <p className="text-xs text-gray-400">{order.guestEmail || ""}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{fmtDate(order.createdAt)}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600 capitalize">{order.paymentMethod || "—"}</td>
                          <td className="px-4 py-3 text-right font-semibold text-orange-600">
                            {fmt(order.totalPrice || "0")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={`/admin/pedidos/${order.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Página {page} de {totalPages} ({total} registros)
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
