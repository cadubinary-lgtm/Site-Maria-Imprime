import AdminLayout from "@/components/AdminLayout";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
  FileCheck,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Settings,
  ArrowRight,
  Clock,
  Zap,
  Package,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(ts: any) {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABELS: Record<string, string> = {
  pagamento_aprovado: "Pagamento Aprovado",
  pagamento_retirada: "Pagar na Retirada",
  analisando: "Analisado",
  com_problemas: "Com Problemas",
  em_producao: "Em Produção",
  pronto_entrega: "Pronto p/ Entrega",
  pronto_retirada: "Pronto p/ Retirada",
  saiu_entrega: "Saiu p/ Entrega",
  em_transporte: "Em Transporte",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pagamento_aprovado: "bg-green-100 text-green-800",
  pagamento_retirada: "bg-blue-100 text-blue-800",
  analisando: "bg-yellow-100 text-yellow-800",
  com_problemas: "bg-red-100 text-red-800",
  em_producao: "bg-orange-100 text-orange-800",
  pronto_entrega: "bg-teal-100 text-teal-800",
  pronto_retirada: "bg-teal-100 text-teal-800",
  saiu_entrega: "bg-indigo-100 text-indigo-800",
  em_transporte: "bg-indigo-100 text-indigo-800",
  entregue: "bg-gray-100 text-gray-800",
  cancelado: "bg-red-100 text-red-800",
};

export default function ERPDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  // ERP KPIs
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKPIs } = trpc.erp.getDashboardKPIs.useQuery(undefined, {
    refetchInterval: 60000, // auto-refresh a cada 1 minuto
  });

  // Financial
  const { data: monthlySales } = trpc.financial.getMonthlySalesReport.useQuery({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const { data: topProducts } = trpc.financial.getTopSellingProducts.useQuery({
    limit: 5,
    days: 30,
  });

  const { data: automationCounts } = trpc.automation.countByStatus.useQuery();
  const { data: automationTypes } = trpc.automation.countByType.useQuery();
  const { data: validationCounts } = trpc.web2print.countByStatus.useQuery();

  const handleRefresh = () => {
    refetchKPIs();
    setRefreshKey(k => k + 1);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Dashboard ERP</h1>
              <p className="text-gray-600 mt-2">Visão geral completa do seu negócio gráfico</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>

          {/* KPIs Operacionais do Dia */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Operação de Hoje
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Pedidos do Dia */}
              <Card className="border-l-4 border-l-blue-500 col-span-2 md:col-span-1">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    Pedidos Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {kpisLoading ? "—" : (kpis?.today.count ?? 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(kpis?.today.revenue ?? 0)}
                  </p>
                </CardContent>
              </Card>

              {/* Em Produção */}
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    Em Produção
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-3xl font-bold text-orange-600">
                    {kpisLoading ? "—" : (kpis?.inProduction ?? 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">pedidos ativos</p>
                </CardContent>
              </Card>

              {/* Aguardando */}
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Aguardando
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-3xl font-bold text-yellow-600">
                    {kpisLoading ? "—" : (kpis?.pending ?? 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">para iniciar</p>
                </CardContent>
              </Card>

              {/* Prontos */}
              <Card className="border-l-4 border-l-teal-500">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Prontos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-3xl font-bold text-teal-600">
                    {kpisLoading ? "—" : (kpis?.ready ?? 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">p/ entrega/retirada</p>
                </CardContent>
              </Card>

              {/* Atrasados */}
              <Card className={`border-l-4 ${(kpis?.overdue ?? 0) > 0 ? "border-l-red-500" : "border-l-gray-300"}`}>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Atrasados
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className={`text-3xl font-bold ${(kpis?.overdue ?? 0) > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {kpisLoading ? "—" : (kpis?.overdue ?? 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">fora do prazo</p>
                </CardContent>
              </Card>

              {/* Com Problemas */}
              <Card className={`border-l-4 ${(kpis?.problems ?? 0) > 0 ? "border-l-red-500" : "border-l-gray-300"}`}>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Problemas
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className={`text-3xl font-bold ${(kpis?.problems ?? 0) > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {kpisLoading ? "—" : (kpis?.problems ?? 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">requerem atenção</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pedidos em Produção + Atrasados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Em Produção */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  Em Produção Agora
                </CardTitle>
                <Link href="/admin/pedidos">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Carregando...</div>
                ) : (kpis?.inProductionOrders ?? []).length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Nenhum pedido em produção</div>
                ) : (
                  <div className="space-y-2">
                    {(kpis?.inProductionOrders ?? []).map((order: any) => (
                      <Link key={order.id} href={`/admin/pedidos/${order.id}`}>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100">
                          <div>
                            <p className="font-medium text-sm">#{order.orderNumber}</p>
                            <p className="text-xs text-gray-500">{order.guestName || "Cliente"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-600">
                              {formatCurrency(parseFloat(order.totalPrice || "0"))}
                            </p>
                            {order.deliveryDeadline && (
                              <p className="text-xs text-gray-400">
                                Prazo: {formatDate(order.deliveryDeadline)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pedidos Atrasados */}
            <Card className={(kpis?.overdue ?? 0) > 0 ? "border-red-200" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${(kpis?.overdue ?? 0) > 0 ? "text-red-500" : "text-gray-400"}`} />
                  Pedidos Atrasados
                  {(kpis?.overdue ?? 0) > 0 && (
                    <Badge className="bg-red-100 text-red-700 text-xs">{kpis?.overdue}</Badge>
                  )}
                </CardTitle>
                <Link href="/admin/pedidos">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Carregando...</div>
                ) : (kpis?.overdueOrders ?? []).length === 0 ? (
                  <div className="text-center py-4 text-green-600 text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Nenhum pedido atrasado!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(kpis?.overdueOrders ?? []).map((order: any) => (
                      <Link key={order.id} href={`/admin/pedidos/${order.id}`}>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-red-50 cursor-pointer border border-red-100 bg-red-50/50">
                          <div>
                            <p className="font-medium text-sm">#{order.orderNumber}</p>
                            <p className="text-xs text-gray-500">{order.guestName || "Cliente"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-red-600">
                              {formatCurrency(parseFloat(order.totalPrice || "0"))}
                            </p>
                            <p className="text-xs text-red-400">
                              Prazo: {formatDate(order.deliveryDeadline)}
                            </p>
                            <Badge className={`text-xs mt-1 ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                              {STATUS_LABELS[order.status] ?? order.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* KPIs Financeiros do Mês */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Financeiro do Mês
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Pedidos do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{monthlySales?.ordersCount || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Pedidos processados</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Faturamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(parseFloat(String(monthlySales?.totalSales || "0")))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Receita do mês</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Pendências
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {(validationCounts?.em_analise || 0) + (automationCounts?.pendente || 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Itens aguardando ação</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Módulos do ERP */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" />
              Módulos do ERP
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/admin/clientes">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      CRM - Clientes
                    </CardTitle>
                    <CardDescription>Gestão de clientes e histórico</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Gerencie dados de clientes, tipos, volume de vendas e relacionamento.
                    </p>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Acessar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/financeiro">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Financeiro
                    </CardTitle>
                    <CardDescription>Controle de vendas e custos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Acompanhe faturamento, custos, lucros e margens por período.
                    </p>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Acessar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/validacao-arquivos">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-orange-600" />
                      Web2Print
                    </CardTitle>
                    <CardDescription>Validação de arquivos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Valide DPI, cores, sangria e margens de segurança dos arquivos.
                    </p>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Acessar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/automacao">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-orange-600" />
                      Automação
                    </CardTitle>
                    <CardDescription>WhatsApp, Email, SMS</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Envie notificações automáticas por múltiplos canais.
                    </p>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Acessar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/produtos">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-red-600" />
                      Produtos
                    </CardTitle>
                    <CardDescription>Catálogo e preços</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Gerencie produtos, variações, preços e disponibilidade.
                    </p>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Acessar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-600" />
                      Configurações
                    </CardTitle>
                    <CardDescription>Painel administrativo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Acesse todas as configurações e ferramentas administrativas.
                    </p>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Acessar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Produtos Mais Vendidos + Automações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Top 5 Produtos (30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts && topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {topProducts.map((product: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">Produto #{product.productId}</p>
                          <p className="text-sm text-gray-600">{product.totalQuantity} unidades vendidas</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(parseFloat(product.totalRevenue))}
                          </p>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum produto vendido neste período</p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status de Automações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2">
                      <span className="text-sm">Enviadas</span>
                      <Badge className="bg-green-100 text-green-800">{automationCounts?.enviado || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2">
                      <span className="text-sm">Falhadas</span>
                      <Badge className="bg-red-100 text-red-800">{automationCounts?.falhou || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2">
                      <span className="text-sm">Pendentes</span>
                      <Badge className="bg-yellow-100 text-yellow-800">{automationCounts?.pendente || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Canais de Automação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2">
                      <span className="text-sm">WhatsApp</span>
                      <Badge className="bg-green-100 text-green-800">{automationTypes?.whatsapp || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2">
                      <span className="text-sm">Email</span>
                      <Badge className="bg-blue-100 text-blue-800">{automationTypes?.email || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2">
                      <span className="text-sm">SMS</span>
                      <Badge className="bg-orange-100 text-orange-800">{automationTypes?.sms || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
