import { useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, Package, Users, DollarSign, Clock, Factory,
  TrendingUp, AlertCircle, CheckCircle2, ArrowRight, Printer,
  Layers, Calculator, FileText, BarChart3,
} from "lucide-react";
import { Loader2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pedido_recebido: "Pedido Recebido",
  pagamento_aprovado: "Pagamento Aprovado",
  arte_em_analise: "Arte em Análise",
  aguardando_aprovacao: "Aguardando Aprovação",
  em_producao: "Em Produção",
  impressao: "Impressão",
  acabamento: "Acabamento",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para Entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pedido_recebido: "bg-blue-100 text-blue-800",
  pagamento_aprovado: "bg-green-100 text-green-800",
  arte_em_analise: "bg-orange-100 text-orange-800",
  aguardando_aprovacao: "bg-amber-100 text-amber-800",
  em_producao: "bg-purple-100 text-purple-800",
  impressao: "bg-indigo-100 text-indigo-800",
  acabamento: "bg-violet-100 text-violet-800",
  pronto: "bg-teal-100 text-teal-800",
  saiu_para_entrega: "bg-cyan-100 text-cyan-800",
  entregue: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-800",
};

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(d: any) {
  return d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";
}

// ─── Atalhos rápidos ──────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "Todos os Pedidos", href: "/admin/pedidos", icon: ShoppingCart, color: "bg-blue-50 text-blue-600 border-blue-200" },
  { label: "Produção", href: "/admin/producao", icon: Factory, color: "bg-purple-50 text-purple-600 border-purple-200" },
  { label: "Produtos", href: "/admin/produtos", icon: Package, color: "bg-orange-50 text-orange-600 border-orange-200" },
  { label: "Variações", href: "/admin/variacoes", icon: Layers, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  { label: "Calculadoras", href: "/admin/regras-dinamicas", icon: Calculator, color: "bg-green-50 text-green-600 border-green-200" },
  { label: "Clientes", href: "/admin/clientes-loja", icon: Users, color: "bg-pink-50 text-pink-600 border-pink-200" },
  { label: "Financeiro", href: "/admin/financeiro", icon: DollarSign, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { label: "Relatórios", href: "/admin/erp", icon: BarChart3, color: "bg-slate-50 text-slate-600 border-slate-200" },
];

// ─── Status que indicam pedidos ativos em produção ────────────────────────────
const PRODUCTION_STATUSES = ["arte_em_analise", "aguardando_aprovacao", "em_producao", "impressao", "acabamento"];
const PENDING_STATUSES = ["pedido_recebido", "pagamento_aprovado"];

export default function AdminHome() {
  const { data: orders = [], isLoading } = trpc.admin.getAllOrders.useQuery();
  const { data: products = [] } = trpc.products.getAll.useQuery();

  const stats = useMemo(() => {
    const all = orders as any[];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = all.filter((o) => new Date(o.createdAt) >= startOfMonth);
    const revenue = thisMonth.reduce((sum, o) => sum + parseFloat(o.totalPrice ?? "0"), 0);
    const inProduction = all.filter((o) => PRODUCTION_STATUSES.includes(o.status));
    const pending = all.filter((o) => PENDING_STATUSES.includes(o.status));
    const readyToShip = all.filter((o) => o.status === "pronto");
    const cancelled = all.filter((o) => o.status === "cancelado");

    return {
      totalOrders: all.length,
      monthlyOrders: thisMonth.length,
      revenue,
      inProduction: inProduction.length,
      pending: pending.length,
      readyToShip: readyToShip.length,
      cancelled: cancelled.length,
      recentOrders: all.slice(0, 8),
      totalCustomers: Array.from(new Map(all.map((o: any) => [o.customerEmail, o])).values()).length,
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
        <p className="text-slate-500 text-sm mt-1">Resumo do seu negócio gráfico</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Pedidos este mês</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.monthlyOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Faturamento mensal</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(stats.revenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Em produção</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.inProduction}</p>
              </div>
              <Factory className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total de pedidos</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.totalOrders}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(stats.pending > 0 || stats.readyToShip > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.pending > 0 && (
            <Link href="/admin/pedidos">
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">{stats.pending} pedido(s) aguardando processamento</p>
                  <p className="text-xs text-amber-600">Clique para visualizar</p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-500" />
              </div>
            </Link>
          )}
          {stats.readyToShip > 0 && (
            <Link href="/admin/producao">
              <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-teal-800">{stats.readyToShip} pedido(s) prontos para entrega</p>
                  <p className="text-xs text-teal-600">Clique para visualizar</p>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-500" />
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Atalhos rápidos */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Acesso Rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all ${link.color}`}>
                <link.icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center leading-tight">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pedidos recentes + Resumo de status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos recentes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pedidos Recentes</CardTitle>
                <Link href="/admin/pedidos">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 gap-1">
                    Ver todos <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {stats.recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum pedido ainda</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.recentOrders.map((order: any) => (
                    <Link key={order.id} href={`/admin/pedidos/${order.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800 truncate">
                              {order.orderNumber}
                            </span>
                            <Badge className={`text-xs px-1.5 py-0 ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                              {STATUS_LABELS[order.status] ?? order.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {order.deliveryFullName || order.guestName || "Cliente"} · {fmtDate(order.createdAt)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-700 flex-shrink-0">
                          {fmt(parseFloat(order.totalPrice ?? "0"))}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo por status */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status de Produção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { key: "pedido_recebido", label: "Recebidos" },
                { key: "pagamento_aprovado", label: "Pag. Aprovado" },
                { key: "arte_em_analise", label: "Arte em Análise" },
                { key: "em_producao", label: "Em Produção" },
                { key: "impressao", label: "Impressão" },
                { key: "acabamento", label: "Acabamento" },
                { key: "pronto", label: "Prontos" },
                { key: "saiu_para_entrega", label: "Em Entrega" },
              ].map(({ key, label }) => {
                const count = (orders as any[]).filter((o) => o.status === key).length;
                return (
                  <Link key={key} href="/admin/producao">
                    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <span className="text-sm text-slate-600">{label}</span>
                      <Badge className={`${STATUS_COLORS[key] ?? "bg-gray-100 text-gray-700"} text-xs`}>
                        {count}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
