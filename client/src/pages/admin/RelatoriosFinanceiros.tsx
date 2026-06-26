import { useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, BarChart3, Download, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

const COLORS = ["#E6005C", "#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#14b8a6", "#f59e0b"];

export default function RelatoriosFinanceiros() {
  const [reportType, setReportType] = useState<"revenue" | "orders" | "payment_methods">("revenue");
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");

  const now = Date.now();
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const startOfQuarter = new Date(); startOfQuarter.setDate(startOfQuarter.getDate() - 90);
  const startOfYear = new Date(); startOfYear.setMonth(0); startOfYear.setDate(1); startOfYear.setHours(0, 0, 0, 0);

  const startDate = period === "month" ? startOfMonth.getTime() : period === "quarter" ? startOfQuarter.getTime() : startOfYear.getTime();

  const { data, isLoading } = trpc.gerenciadorFinanceiro.getFinancialReports.useQuery({
    startDate,
    endDate: now,
    reportType,
  });

  const orders = data?.orders ?? [];
  const reportData = data?.data ?? [];

  // Agrupar pedidos por dia para gráfico de receita
  const revenueByDay = orders.reduce((acc: Record<string, number>, o) => {
    const day = new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    acc[day] = (acc[day] ?? 0) + parseFloat(o.totalPrice || "0");
    return acc;
  }, {});

  const revenueChartData = Object.entries(revenueByDay)
    .map(([date, value]) => ({ date, value }))
    .slice(-30);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/gerenciador-financeiro">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
              <p className="text-sm text-gray-500">Análise detalhada das finanças</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["month", "quarter", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p === "month" ? "Mês" : p === "quarter" ? "Trimestre" : "Ano"}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {([
              { key: "revenue", label: "Receita" },
              { key: "payment_methods", label: "Formas de Pagamento" },
            ] as const).map((r) => (
              <button
                key={r.key}
                onClick={() => setReportType(r.key)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  reportType === r.key ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(data?.totalRevenue ?? 0)}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data?.totalOrders ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(data?.averageTicket ?? 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico Principal */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              {reportType === "revenue" ? "Receita por Dia" : "Formas de Pagamento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
              </div>
            ) : reportType === "payment_methods" && reportData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={reportData} cx="50%" cy="50%" outerRadius={90} dataKey="total" nameKey="method">
                      {reportData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {reportData.map((item: any, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-gray-700 capitalize">{item.method}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{fmt(item.total)}</p>
                        <p className="text-xs text-gray-400">{item.count} pedidos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Bar dataKey="value" name="Receita" fill="#E6005C" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum dado no período</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Pedidos */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Pedidos no Período</CardTitle>
              <span className="text-xs text-gray-500">{orders.length} registros</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum pedido no período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Pedido</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Forma Pag.</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 50).map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">#{order.id}</td>
                        <td className="px-4 py-3 text-gray-700">{order.guestName || order.deliveryFullName || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(order.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{order.paymentMethod || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-orange-600">
                          {fmt(parseFloat(order.totalPrice || "0"))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length > 50 && (
                  <p className="text-xs text-gray-400 text-center py-3">
                    Mostrando 50 de {orders.length} registros
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
