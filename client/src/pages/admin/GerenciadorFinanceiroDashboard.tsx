import { useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Clock, CheckCircle, Store, AlertCircle, ArrowRight,
  BarChart3, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const COLORS = ["#f97316", "#3b82f6", "#22c55e", "#ef4444", "#a855f7"];

export default function GerenciadorFinanceiroDashboard() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");

  const now = Date.now();
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const startDate = period === "today" ? startOfDay.getTime() : period === "week" ? startOfWeek.getTime() : startOfMonth.getTime();

  const { data: metrics, isLoading, refetch } = trpc.gerenciadorFinanceiro.getDashboardMetrics.useQuery({
    startDate,
    endDate: now,
  });

  const { data: cashFlow } = trpc.gerenciadorFinanceiro.getCashFlow.useQuery({
    startDate,
    endDate: now,
    groupBy: period === "today" ? "day" : period === "week" ? "day" : "day",
  });

  const kpis = [
    {
      title: "Receita Total",
      value: fmt(metrics?.totalRevenue ?? 0),
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      sub: `${metrics?.totalOrders ?? 0} pedidos`,
      href: "/admin/gerenciador-financeiro/recebidas",
    },
    {
      title: "A Receber",
      value: fmt(metrics?.pendingRevenue ?? 0),
      icon: <Clock className="w-5 h-5" />,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      sub: `${metrics?.pendingOrders ?? 0} pedidos pendentes`,
      href: "/admin/gerenciador-financeiro/receber",
    },
    {
      title: "Recebido (Aprovado)",
      value: fmt(metrics?.approvedRevenue ?? 0),
      icon: <CheckCircle className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      sub: `${metrics?.approvedOrders ?? 0} pedidos aprovados`,
      href: "/admin/gerenciador-financeiro/recebidas",
    },
    {
      title: "Pagamentos na Retirada",
      value: fmt(metrics?.pickupRevenue ?? 0),
      icon: <Store className="w-5 h-5" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      sub: `${metrics?.pickupOrders ?? 0} pedidos retirada`,
      href: "/admin/gerenciador-financeiro/retirada",
    },
  ];

  const pieData = [
    { name: "Recebido", value: metrics?.approvedRevenue ?? 0 },
    { name: "A Receber", value: metrics?.pendingRevenue ?? 0 },
    { name: "Retirada", value: metrics?.pickupRevenue ?? 0 },
    { name: "Cancelado", value: metrics?.cancelledOrders ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
            <p className="text-sm text-gray-500 mt-0.5">Visão geral das finanças da gráfica</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    period === p ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p === "today" ? "Hoje" : p === "week" ? "7 dias" : "Mês"}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPIs */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <Link key={kpi.title} href={kpi.href}>
                <Card className={`border ${kpi.border} hover:shadow-md transition-shadow cursor-pointer`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.title}</p>
                        <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${kpi.bg}`}>
                        <span className={kpi.color}>{kpi.icon}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Ticket Médio e Hoje */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(metrics?.averageTicket ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-1">por pedido aprovado</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Receita Hoje</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(metrics?.todayRevenue ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-1">{metrics?.todayOrders ?? 0} pedidos hoje</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cancelados</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{metrics?.cancelledOrders ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">pedidos cancelados no período</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fluxo de Caixa */}
          <Card className="lg:col-span-2 border border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Fluxo de Receita</CardTitle>
                <Link href="/admin/gerenciador-financeiro/fluxo">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                    Ver detalhes <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {cashFlow && cashFlow.cashFlowData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cashFlow.cashFlowData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Area type="monotone" dataKey="income" stroke="#f97316" fill="url(#colorIncome)" name="Receita" />
                  </AreaChart>
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

          {/* Distribuição */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Distribuição</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  <p className="text-sm">Sem dados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Contas a Receber", href: "/admin/gerenciador-financeiro/receber", icon: <Clock className="w-4 h-4" />, color: "text-orange-600" },
            { label: "Contas Recebidas", href: "/admin/gerenciador-financeiro/recebidas", icon: <CheckCircle className="w-4 h-4" />, color: "text-green-600" },
            { label: "Pagamentos Retirada", href: "/admin/gerenciador-financeiro/retirada", icon: <Store className="w-4 h-4" />, color: "text-purple-600" },
            { label: "Fluxo de Caixa", href: "/admin/gerenciador-financeiro/fluxo", icon: <TrendingUp className="w-4 h-4" />, color: "text-blue-600" },
            { label: "Relatórios", href: "/admin/gerenciador-financeiro/relatorios", icon: <BarChart3 className="w-4 h-4" />, color: "text-gray-600" },
            { label: "Gestão Fiscal", href: "/admin/fiscal", icon: <DollarSign className="w-4 h-4" />, color: "text-indigo-600" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer">
                <span className={link.color}>{link.icon}</span>
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
