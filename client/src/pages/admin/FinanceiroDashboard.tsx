import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/AdminLayout";
import {
  DollarSign, TrendingUp, Clock, ShoppingBag, Users,
  ArrowUpRight, ArrowDownRight, BarChart2, Bell, RefreshCw,
  Wallet, CreditCard, Package
} from "lucide-react";

type Periodo = "hoje" | "semana" | "mes" | "ano";

const PERIODO_LABELS: Record<Periodo, string> = {
  hoje: "Hoje",
  semana: "Esta Semana",
  mes: "Este Mês",
  ano: "Este Ano",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function FinanceiroDashboard() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");

  const { data, isLoading, refetch } = trpc.financeiro.getDashboard.useQuery({ periodo });
  const { data: notifs } = trpc.financeiro.getNotificacoes.useQuery({ apenasNaoLidas: false });

  const metrics = [
    {
      title: "Recebido Hoje",
      value: formatCurrency(data?.totalRecebidoHoje ?? 0),
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Recebido no Mês",
      value: formatCurrency(data?.totalRecebidoMes ?? 0),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Pendente",
      value: formatCurrency(data?.totalPendente ?? 0),
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Aguardando Retirada",
      value: String(data?.aguardandoRetirada ?? 0),
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
      suffix: "pedidos",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(data?.ticketMedio ?? 0),
      icon: Wallet,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      title: "Pedidos Pagos",
      value: String(data?.pedidosPagos ?? 0),
      icon: CreditCard,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      suffix: "pedidos",
    },
    {
      title: "Pedidos Pendentes",
      value: String(data?.pedidosPendentes ?? 0),
      icon: ShoppingBag,
      color: "text-red-600",
      bg: "bg-red-50",
      suffix: "pedidos",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral das finanças da Gráfica Ponto Digital</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} className="border-pink-200 text-pink-700 hover:bg-pink-50">
            <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
            Atualizar
          </Button>
          {notifs && notifs.total > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="h-3 w-3" aria-hidden="true" />
              {notifs.total} alertas
            </Badge>
          )}
        </div>
      </div>

      {/* Filtro de Período */}
      <div className="flex gap-2">
        {(Object.keys(PERIODO_LABELS) as Periodo[]).map((p) => (
          <Button
            key={p}
            variant={periodo === p ? "default" : "outline"}
            size="sm"
            type="button"
            onClick={() => setPeriodo(p)}
            className={periodo === p ? "bg-pink-600 hover:bg-pink-700 text-white" : "border-pink-200 text-pink-700 hover:bg-pink-50"}
            aria-pressed={periodo === p}
          >
            {PERIODO_LABELS[p]}
          </Button>
        ))}
      </div>

      {/* Alertas */}
      {notifs && notifs.alertas.length > 0 && (
        <div className="space-y-2">
          {notifs.alertas.map((alerta, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                alerta.urgencia === "alta"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
              }`}
            >
              <Bell className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium">{alerta.mensagem}</span>
            </div>
          ))}
        </div>
      )}

      {/* Métricas */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <Card key={m.title} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{m.title}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{m.value}</p>
                    {m.suffix && <p className="text-xs text-gray-400">{m.suffix}</p>}
                  </div>
                  <div className={`p-2 rounded-lg ${m.bg}`}>
                    <m.icon className={`h-5 w-5 ${m.color}`} aria-hidden="true" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Evolução Mensal */}
      {data?.evolucaoMensal && data.evolucaoMensal.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-pink-600" aria-hidden="true" />
              Evolução Financeira Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {data.evolucaoMensal.map((m, i) => {
                const maxVal = Math.max(...data.evolucaoMensal.map(x => x.receita), 1);
                const height = Math.max((m.receita / maxVal) * 100, 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium">
                      {formatCurrency(m.receita).replace("R$\u00a0", "R$")}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-pink-400 transition-all"
                      style={{ height: `${height}%` }}
                      role="img"
                      aria-label={`${m.mes}: ${formatCurrency(m.receita)}`}
                    />
                    <span className="text-xs text-gray-400">{m.mes}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { href: "/admin/gerenciador-financeiro/receber", label: "Contas a Receber", icon: Clock, color: "text-orange-600", bg: "bg-orange-50", desc: "Pedidos aguardando pagamento" },
          { href: "/admin/gerenciador-financeiro/recebidas", label: "Contas Recebidas", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", desc: "Pagamentos confirmados" },
          { href: "/admin/gerenciador-financeiro/retirada", label: "Pagamentos na Retirada", icon: Package, color: "text-orange-600", bg: "bg-orange-50", desc: "Pedidos para retirar na loja" },
          { href: "/admin/gerenciador-financeiro/fluxo", label: "Fluxo de Caixa", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50", desc: "Entradas e saídas" },
          { href: "/admin/gerenciador-financeiro/relatorios", label: "Relatórios", icon: BarChart2, color: "text-teal-600", bg: "bg-teal-50", desc: "Relatórios financeiros" },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${link.bg}`}>
                  <link.icon className={`h-5 w-5 ${link.color}`} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                  <p className="text-xs text-gray-500">{link.desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
    </AdminLayout>
  );
}
