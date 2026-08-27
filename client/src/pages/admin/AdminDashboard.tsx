import { useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getDefaultAdminRoute } from "@/lib/adminRouteUtils";
import {
  ShoppingCart, DollarSign, Printer, Package, AlertTriangle,
  ChevronRight, FileText, Users, BarChart3,
  Clock, CheckCircle, AlertCircle, Info, Loader2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  aguardando_pagamento: { label: "Aguardando Pagamento", color: "text-amber-800", bg: "bg-amber-100", dot: "#d97706" },
  pagamento_aprovado: { label: "Pagamento Aprovado", color: "text-green-700",   bg: "bg-green-100",   dot: "#22c55e" },
  pagamento_retirada: { label: "Pagamento Retirada",  color: "text-blue-700",    bg: "bg-blue-100",    dot: "#3b82f6" },
  analisando:         { label: "Analisando",          color: "text-amber-700",   bg: "bg-amber-100",   dot: "#d97706" },
  com_problemas:      { label: "Com Problemas",       color: "text-red-700",     bg: "bg-red-100",     dot: "#ef4444" },
  em_producao:        { label: "Em Produção",         color: "text-amber-700",   bg: "bg-amber-100",   dot: "#d97706" },
  pronto_entrega:     { label: "Pronto p/ Entrega",   color: "text-teal-700",    bg: "bg-teal-100",    dot: "#14b8a6" },
  pronto_retirada:    { label: "Pronto p/ Retirada",  color: "text-cyan-700",    bg: "bg-cyan-100",    dot: "#06b6d4" },
  entregue:           { label: "Entregue",            color: "text-emerald-700", bg: "bg-emerald-100", dot: "#10b981" },
  cancelado:          { label: "Cancelado",           color: "text-gray-700",    bg: "bg-gray-100",    dot: "#6b7280" },
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";

function buildChartData(orders: any[]) {
  const days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    const value = orders
      .filter((o) => o.paymentStatus === "pago" && o.createdAt && new Date(o.createdAt).toISOString().slice(0, 10) === key)
      .reduce((acc, o) => acc + parseFloat(o.totalPrice?.toString() ?? "0"), 0);
    days.push({ label, value });
  }
  return days;
}

function buildPieData(orders: any[]) {
  const counts: Record<string, number> = {};
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
  return Object.entries(counts)
    .map(([status, count]) => ({ status, label: STATUS_CONFIG[status]?.label ?? status, count, color: STATUS_CONFIG[status]?.dot ?? "#6b7280" }))
    .sort((a, b) => b.count - a.count);
}

function KpiCard({ icon, iconBg, title, value, sub, subColor, href }: {
  icon: React.ReactNode; iconBg: string; title: string; value: string | number;
  sub?: string; subColor?: string; href?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className={`text-xs mt-1 ${subColor ?? "text-gray-500"}`}>{sub}</p>}
        {href && <Link href={href} className="mt-1 inline-block text-xs text-pink-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">Ver detalhes →</Link>}
      </div>
    </div>
  );
}

function AlertItem({ type, title, desc, time }: { type: "error"|"warn"|"info"|"ok"; title: string; desc: string; time: string }) {
  const cfg = {
    error: { icon: <AlertCircle className="w-4 h-4 text-red-500" />,    bg: "bg-red-50" },
    warn:  { icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />, bg: "bg-yellow-50" },
    info:  { icon: <Info className="w-4 h-4 text-blue-500" />,           bg: "bg-blue-50" },
    ok:    { icon: <CheckCircle className="w-4 h-4 text-green-500" />,   bg: "bg-green-50" },
  }[type];
  return (
    <div className={`flex items-start gap-2.5 p-2.5 rounded-lg ${cfg.bg}`}>
      <div className="mt-0.5 flex-shrink-0" aria-hidden="true">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900">{title}</p>
        <p className="text-[11px] text-gray-500">{desc}</p>
      </div>
      <span className="text-[10px] text-gray-400 flex-shrink-0">{time}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { adminUser } = useAdminAuth();

  // Buscar permissões para redirecionar operadores sem acesso ao dashboard
  const { data: myPermissions, isLoading: permLoading } = trpc.adminAuth.myPermissions.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Redirecionar operadores sem permissão de ver o dashboard
  useEffect(() => {
    if (!adminUser || permLoading || myPermissions === undefined) return;
    // null = acesso total (superadmin) → pode ver o dashboard
    if (myPermissions === null) return;
    // Tem permissões restritas → redirecionar para a primeira rota disponível
    const route = getDefaultAdminRoute(adminUser.role, myPermissions);
    if (route !== "/admin") {
      navigate(route);
    }
  }, [adminUser, myPermissions, permLoading, navigate]);

  const { data: orders, isLoading } = trpc.admin.getAllOrders.useQuery();
  const { data: products } = trpc.products.getAll.useQuery();
  const allOrders = (orders ?? []) as any[];

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = allOrders.filter((o) => o.createdAt && new Date(o.createdAt).toISOString().slice(0, 10) === today);
  const todayRevenue = todayOrders.filter((order) => order.paymentStatus === "pago").reduce((acc, o) => acc + parseFloat(o.totalPrice?.toString() ?? "0"), 0);
  const inProduction = allOrders.filter((o) => o.status === "em_producao").length;
  const readyToShip = allOrders.filter((o) => o.status === "pronto_entrega" || o.status === "pronto_retirada").length;
  const withProblems = allOrders.filter((o) => o.status === "com_problemas").length;

  const chartData = useMemo(() => buildChartData(allOrders), [allOrders]);
  const pieData = useMemo(() => buildPieData(allOrders), [allOrders]);
  const recentOrders = useMemo(() =>
    [...allOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8),
    [allOrders]
  );

  const kanbanCols = [
    { key: "analisando",        label: "Arte",     color: "bg-orange-100 text-orange-700" },
    { key: "pagamento_aprovado",label: "Aprovado", color: "bg-green-100 text-green-700" },
    { key: "em_producao",       label: "Produção", color: "bg-orange-100 text-orange-700" },
    { key: "pronto_entrega",    label: "Entrega",  color: "bg-teal-100 text-teal-700" },
    { key: "entregue",          label: "Entregue", color: "bg-emerald-100 text-emerald-700" },
    { key: "com_problemas",     label: "Problema", color: "bg-red-100 text-red-700" },
  ];

  const alerts = useMemo(() => {
    const a: { type: "error"|"warn"|"info"|"ok"; title: string; desc: string; time: string }[] = [];
    if (withProblems > 0) a.push({ type: "error", title: `${withProblems} pedido(s) com problemas`, desc: "Clique para ver os pedidos", time: "agora" });
    if (inProduction > 5) a.push({ type: "warn", title: `${inProduction} pedidos em produção`, desc: "Verifique a capacidade", time: "agora" });
    if (readyToShip > 0) a.push({ type: "ok", title: `${readyToShip} pedidos prontos para envio`, desc: "Clique para gerar etiquetas", time: "agora" });
    if (todayOrders.length > 0) a.push({ type: "info", title: `${todayOrders.length} novo(s) pedido(s) hoje`, desc: "Verifique os pedidos de hoje", time: "hoje" });
    if (a.length === 0) a.push({ type: "ok", title: "Tudo em ordem!", desc: "Nenhum alerta no momento", time: "agora" });
    return a;
  }, [withProblems, inProduction, readyToShip, todayOrders.length]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando indicadores administrativos" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
            <p className="text-sm text-gray-500">Bem-vindo de volta, visão geral do sistema</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4" aria-hidden="true" />
            {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3" aria-label="Indicadores principais" aria-live="polite">
          <KpiCard icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}   iconBg="bg-blue-100"   title="Pedidos Hoje"      value={todayOrders.length}  sub={`${allOrders.length} total`}                                               href="/admin/pedidos" />
          <KpiCard icon={<DollarSign className="w-5 h-5 text-green-600" />}   iconBg="bg-green-100"  title="Faturamento Hoje"  value={fmt(todayRevenue)}   sub={`Total recebido: ${fmt(allOrders.filter((order) => order.paymentStatus === "pago").reduce((a,o)=>a+parseFloat(o.totalPrice?.toString()??"0"),0))}`} subColor="text-green-600" href="/admin/financeiro" />
          <KpiCard icon={<Printer className="w-5 h-5 text-pink-600" aria-hidden="true" />}     iconBg="bg-pink-100" title="Em Produção"       value={inProduction}        sub="Ver produção →"                                                             href="/admin/pedidos/kanban" />
          <KpiCard icon={<Package className="w-5 h-5 text-teal-600" />}       iconBg="bg-teal-100"   title="Prontos p/ Envio"  value={readyToShip}         sub="Ver expedição →"                                                            href="/admin/pedidos" />
          <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />}  iconBg="bg-red-100"    title="Com Problemas"     value={withProblems}        sub={withProblems > 0 ? "Atenção necessária" : "Tudo ok"} subColor={withProblems > 0 ? "text-red-600" : "text-green-600"} href="/admin/pedidos" />
        </div>

        {/* Gráficos + Lateral */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Coluna principal */}
          <div className="xl:col-span-2 space-y-5">
            {/* Gráfico de faturamento */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Faturamento (últimos 7 dias)</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Últimos 7 dias</span>
              </div>
              <div role="img" aria-label="Gráfico de faturamento dos últimos sete dias">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E6005C" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#E6005C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => [fmt(v), "Faturamento"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Area type="monotone" dataKey="value" stroke="#E6005C" strokeWidth={2.5} fill="url(#colorRevenue)" dot={{ fill: "#E6005C", r: 4 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Pedidos por Status (donut) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Pedidos por Status</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Total</span>
              </div>
              {pieData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div role="img" aria-label="Gráfico de distribuição de pedidos por status">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="count" paddingAngle={2}>
                          {pieData.map((entry) => <Cell key={entry.status} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: any, _: any, props: any) => [v, props.payload.label]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {pieData.map((entry) => (
                      <div key={entry.status} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                          <span className="text-gray-700">{entry.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{entry.count}</span>
                          <span className="text-gray-400">({allOrders.length > 0 ? Math.round((entry.count / allOrders.length) * 100) : 0}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Nenhum pedido ainda</div>
              )}
            </div>

            {/* Últimos Pedidos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Últimos Pedidos</h2>
                <Link href="/admin/pedidos" className="text-xs text-pink-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">Ver todos →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Pedido","Cliente","Valor","Status","Data",""].map((h) => (
                        <th scope="col" key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-3">{h || <span className="sr-only">Ações</span>}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const sc = STATUS_CONFIG[order.status];
                      return (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-gray-900">{order.orderNumber}</td>
                          <td className="py-2.5 pr-3 text-gray-700 text-xs">{order.deliveryFullName || `Cliente #${order.clientId}`}</td>
                          <td className="py-2.5 pr-3 font-semibold text-gray-900 text-xs">{fmt(parseFloat(order.totalPrice?.toString() ?? "0"))}</td>
                          <td className="py-2.5 pr-3">
                            {sc ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                            ) : (
                              <span className="text-gray-400 text-xs">{order.status}</span>
                            )}
                          </td>
                          <td className="py-2.5 text-xs text-gray-500">{fmtDate(order.createdAt)}</td>
                          <td className="py-2.5 pl-2">
                            <Link href={`/admin/pedidos/${order.id}`} className="text-gray-400 hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300" aria-label={`Ver detalhes do pedido ${order.orderNumber}`}><ChevronRight className="w-4 h-4" aria-hidden="true" /></Link>
                          </td>
                        </tr>
                      );
                    })}
                    {recentOrders.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">Nenhum pedido encontrado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-5">
            {/* Alertas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Alertas Importantes</h2>
                <Link href="/admin/pedidos" className="text-xs text-pink-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">Ver todos</Link>
              </div>
              <div className="space-y-2">
                {alerts.map((a, i) => <AlertItem key={i} {...a} />)}
              </div>
            </div>

            {/* Kanban Resumido */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Produção - Kanban</h2>
                <Link href="/admin/pedidos/kanban" className="text-xs text-pink-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">Ver quadro completo</Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {kanbanCols.map((col) => {
                  const count = allOrders.filter((o) => o.status === col.key).length;
                  return (
                    <div key={col.key} className={`rounded-lg p-2.5 text-center ${col.color}`}>
                      <p className="text-xs font-semibold leading-tight">{col.label}</p>
                      <p className="text-xl font-bold mt-1">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Produtos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Produtos</h2>
                <Link href="/admin/produtos" className="text-xs text-pink-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">Gerenciar</Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{products?.length ?? 0}</p>
                  <p className="text-xs text-gray-500">produtos cadastrados</p>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Ações Rápidas</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Pedidos",    icon: <ShoppingCart className="w-5 h-5" aria-hidden="true" />, href: "/admin/pedidos",        color: "text-pink-600 bg-pink-50" },
                  { label: "Produtos",   icon: <Package className="w-5 h-5" />,      href: "/admin/produtos",       color: "text-blue-500 bg-blue-50" },
                  { label: "Clientes",   icon: <Users className="w-5 h-5" aria-hidden="true" />,        href: "/admin/clientes",       color: "text-pink-600 bg-pink-50" },
                  { label: "Kanban",     icon: <BarChart3 className="w-5 h-5" />,    href: "/admin/pedidos/kanban", color: "text-teal-500 bg-teal-50" },
                  { label: "Financeiro", icon: <DollarSign className="w-5 h-5" />,   href: "/admin/financeiro",     color: "text-green-500 bg-green-50" },
                  { label: "Relatórios", icon: <FileText className="w-5 h-5" />,     href: "/admin/erp",            color: "text-gray-500 bg-gray-50" },
                ].map((action) => (
                  <Link key={action.label} href={action.href} className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 p-2.5 transition-all hover:border-pink-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.color}`}>{action.icon}</div>
                    <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
          <span>© {new Date().getFullYear()} Maria Imprime. Todos os direitos reservados.</span>
          <div className="flex items-center gap-2">
            <span>Versão 2.0.0</span>
            <span>Painel administrativo</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
