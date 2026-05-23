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
} from "lucide-react";

export default function ERPDashboard() {
  // Queries
  const { data: monthlySales } = trpc.financial.getMonthlySalesReport.useQuery({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const { data: averageTicket } = trpc.financial.calculateAverageTicket.useQuery({
    days: 30,
  });

  const { data: topProducts } = trpc.financial.getTopSellingProducts.useQuery({
    limit: 5,
    days: 30,
  });

  const { data: automationCounts } = trpc.automation.countByStatus.useQuery();
  const { data: automationTypes } = trpc.automation.countByType.useQuery();
  const { data: validationCounts } = trpc.web2print.countByStatus.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard ERP</h1>
          <p className="text-gray-600 mt-2">Visão geral completa do seu negócio gráfico</p>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                R$ {parseFloat(String(monthlySales?.totalSales || "0")).toFixed(0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Receita do mês</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Ticket Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                R$ {parseFloat(String(averageTicket?.averageTicket || "0")).toFixed(0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
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

        {/* Módulos do ERP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* CRM */}
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

          {/* Financeiro */}
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

          {/* Web2Print */}
          <Link href="/admin/validacao-arquivos">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600" />
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

          {/* Automação */}
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

          {/* Pedidos */}
          <Link href="/admin/erp/pedidos">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  Pedidos
                </CardTitle>
                <CardDescription>Gestão operacional de pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Acompanhe, filtre e gerencie pedidos, alterações de status e produção.
                </p>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  Acessar <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Produtos */}
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

          {/* Configurações */}
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

        {/* Produtos Mais Vendidos */}
        <Card className="mb-8">
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
                        R$ {parseFloat(product.totalRevenue).toFixed(2)}
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

        {/* Status de Automações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status de Automações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
              <CardTitle>Canais de Automação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                  <Badge className="bg-purple-100 text-purple-800">{automationTypes?.sms || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm">Notificações</span>
                  <Badge className="bg-orange-100 text-orange-800">{automationTypes?.notificacao || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
