import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, BarChart3 } from "lucide-react";

export default function FinancialDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Queries
  const { data: monthlySales, isLoading: loadingMonthlySales } = trpc.financial.getMonthlySalesReport.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const { data: topProducts, isLoading: loadingTopProducts } = trpc.financial.getTopSellingProducts.useQuery({
    limit: 10,
    days: 30,
  });

  const { data: averageTicket, isLoading: loadingTicket } = trpc.financial.calculateAverageTicket.useQuery({
    days: 30,
  });

  // Calcular período para lucro bruto
  const startDate = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    return date;
  }, [selectedYear, selectedMonth]);

  const endDate = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, 0);
    return date;
  }, [selectedYear, selectedMonth]);

  const { data: grossProfit, isLoading: loadingProfit } = trpc.financial.getGrossProfitByPeriod.useQuery({
    startDate,
    endDate,
  });

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">

        {/* Seletor de período */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handlePreviousMonth}>
                Mês Anterior
              </Button>
              <span className="text-lg font-semibold min-w-[200px] text-center capitalize">
                {monthName}
              </span>
              <Button variant="outline" onClick={handleNextMonth}>
                Próximo Mês
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total de Vendas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMonthlySales ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    R$ {parseFloat(String(monthlySales?.totalSales || "0")).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Faturamento do mês
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quantidade de Pedidos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMonthlySales ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{monthlySales?.ordersCount || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    <ShoppingCart className="w-4 h-4 inline mr-1" />
                    Pedidos do mês
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Ticket Médio */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTicket ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    R$ {parseFloat(String(averageTicket?.averageTicket || "0")).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    <BarChart3 className="w-4 h-4 inline mr-1" />
                    Últimos 30 dias
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lucro Bruto */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Lucro Bruto</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProfit ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {parseFloat(String(grossProfit?.profit || "0")).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Receita - Custos
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes de Receita e Custos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProfit ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-3xl font-bold text-blue-600">
                  R$ {parseFloat(String(grossProfit?.revenue || "0")).toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custos Totais</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProfit ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-3xl font-bold text-red-600">
                  R$ {parseFloat(String(grossProfit?.costs || "0")).toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Margem de Lucro</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProfit ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  {grossProfit?.revenue && grossProfit.revenue > 0
                    ? ((grossProfit.profit / grossProfit.revenue) * 100).toFixed(1)
                    : 0}
                  %
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Produtos Mais Vendidos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos (30 dias)</CardTitle>
            <CardDescription>Top 10 produtos por quantidade</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTopProducts ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : topProducts && topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-semibold">Produto</th>
                      <th className="text-left py-2 px-4 font-semibold">Quantidade</th>
                      <th className="text-left py-2 px-4 font-semibold">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">Produto #{product.productId}</td>
                        <td className="py-2 px-4 font-semibold">{product.totalQuantity}</td>
                        <td className="py-2 px-4 font-semibold">
                          R$ {parseFloat(product.totalRevenue).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum produto vendido neste período</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
