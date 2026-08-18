import { useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Store, ChevronLeft, ChevronRight, Eye, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fmt = (v: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pagamento_aprovado: { label: "Pag. Aprovado", color: "bg-green-100 text-green-700" },
  pagamento_retirada: { label: "Pag. Retirada", color: "bg-blue-100 text-blue-700" },
  analisando: { label: "Analisando", color: "bg-orange-100 text-orange-700" },
  com_problemas: { label: "Com Problemas", color: "bg-red-100 text-red-700" },
  em_producao: { label: "Em Produção", color: "bg-orange-100 text-orange-700" },
  pronto_entrega: { label: "Pronto p/ Entrega", color: "bg-teal-100 text-teal-700" },
  pronto_retirada: { label: "Pronto p/ Retirada", color: "bg-cyan-100 text-cyan-700" },
  entregue: { label: "Entregue", color: "bg-emerald-100 text-emerald-700" },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-700" },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-orange-100 text-orange-700" },
  pago: { label: "Pago", color: "bg-green-100 text-green-700" },
  falhou: { label: "Falhou", color: "bg-red-100 text-red-700" },
};

export default function PagamentosRetirada() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 20;

  const now = Date.now();
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const { data, isLoading } = trpc.gerenciadorFinanceiro.getPickupPayments.useQuery({
    page,
    limit,
    startDate: startOfMonth.getTime(),
    endDate: now,
    status: statusFilter || undefined,
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const totalValue = orders.reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0);
  const paidValue = orders.filter(o => o.paymentStatus === "pago").reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0);
  const pendingValue = orders.filter(o => o.paymentStatus === "pendente").reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/gerenciador-financeiro">
            <span className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-pink-700 transition-colors hover:bg-pink-50 hover:text-pink-800">
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" /> Voltar
            </span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pagamentos na Retirada</h1>
            <p className="text-sm text-gray-500">Pedidos com retirada na loja</p>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-pink-200 bg-pink-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-pink-600 uppercase tracking-wide">Total Retirada (Mês)</p>
              <p className="text-2xl font-bold text-pink-700 mt-1">{fmt(totalValue)}</p>
              <p className="text-xs text-pink-500 mt-1">{total} pedidos</p>
            </CardContent>
          </Card>
          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Já Pago</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{fmt(paidValue)}</p>
              <p className="text-xs text-green-500 mt-1">{orders.filter(o => o.paymentStatus === "pago").length} pedidos</p>
            </CardContent>
          </Card>
          <Card className="border border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Aguardando Pagamento</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">{fmt(pendingValue)}</p>
              <p className="text-xs text-orange-500 mt-1">{orders.filter(o => o.paymentStatus === "pendente").length} pedidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-gray-500 self-center">Filtrar por status:</span>
              {["", "pagamento_retirada", "pronto_retirada", "entregue", "cancelado"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === s
                      ? "bg-pink-600 text-white border-pink-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-700"
                  }`}
                  aria-pressed={statusFilter === s}
                >
                  {s === "" ? "Todos" : STATUS_LABELS[s]?.label ?? s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-pink-600" aria-hidden="true" />
              Pedidos para Retirada
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full mx-auto" aria-label="Carregando pagamentos na retirada" />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
                <p className="text-sm">Nenhum pedido de retirada encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Pedido</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status Pedido</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status Pag.</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const statusCfg = STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-700" };
                      const paymentCfg = PAYMENT_STATUS[order.paymentStatus] ?? { label: order.paymentStatus, color: "bg-gray-100 text-gray-700" };
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
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${paymentCfg.color}`}>{paymentCfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-pink-600">
                            {fmt(order.totalPrice || "0")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={`/admin/pedidos/${order.id}`}>
                              <span className="inline-flex h-7 items-center rounded-md px-2 text-pink-700 transition-colors hover:bg-pink-50 hover:text-pink-800" aria-label={`Ver pedido ${order.id}`}>
                                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              </span>
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
                  <Button type="button" variant="outline" size="sm" className="border-pink-200 text-pink-700 hover:bg-pink-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Página anterior">
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="border-pink-200 text-pink-700 hover:bg-pink-50" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Próxima página">
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
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
