import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart2, TrendingUp, DollarSign, ShoppingBag, RefreshCw, Printer } from "lucide-react";

function formatCurrency(v: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

type TipoRelatorio = "diario" | "semanal" | "mensal" | "anual";

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", pix: "Pix", cartao_credito: "Cartão Crédito",
  cartao_debito: "Cartão Débito", boleto: "Boleto", transferencia: "Transferência",
  pagar_na_retirada: "Pagar na Retirada", outro: "Outro",
};

const PAYMENT_COLORS: Record<string, string> = {
  pix: "bg-green-500", cartao_credito: "bg-blue-500", cartao_debito: "bg-indigo-500",
  dinheiro: "bg-yellow-500", boleto: "bg-orange-500", transferencia: "bg-purple-500",
  pagar_na_retirada: "bg-teal-500", outro: "bg-gray-500",
};

export default function FinanceiroRelatorios() {
  const [tipo, setTipo] = useState<TipoRelatorio>("mensal");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const { data, isLoading, refetch } = trpc.financeiro.getRelatorio.useQuery({
    tipo,
    startDate: useCustom && customStart ? new Date(customStart).getTime() : undefined,
    endDate: useCustom && customEnd ? new Date(customEnd).getTime() : undefined,
  });

  const handlePrint = () => window.print();

  const maxDailyValue = data?.evolucaoDiaria
    ? Math.max(...data.evolucaoDiaria.map(d => d.valor), 1)
    : 1;

  const maxPaymentValue = data?.formasPagamento
    ? Math.max(...data.formasPagamento.map(p => p.valor), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <p className="text-sm text-gray-500 mt-1">Análise detalhada do desempenho financeiro</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />Imprimir
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["diario","semanal","mensal","anual"] as TipoRelatorio[]).map(t => (
              <Button key={t} variant={tipo === t && !useCustom ? "default" : "outline"} size="sm"
                onClick={() => { setTipo(t); setUseCustom(false); }}
                className={tipo === t && !useCustom ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}>
                {t === "diario" ? "Hoje" : t === "semanal" ? "Esta Semana" : t === "mensal" ? "Este Mês" : "Este Ano"}
              </Button>
            ))}
            <Button variant={useCustom ? "default" : "outline"} size="sm"
              onClick={() => setUseCustom(true)}
              className={useCustom ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}>
              Período Personalizado
            </Button>
          </div>
          {useCustom && (
            <div className="flex gap-3 items-center">
              <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-40" />
              <span className="text-gray-500 text-sm">até</span>
              <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-40" />
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => refetch()}>
                Aplicar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({length:4}).map((_,i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse"/>)}
        </div>
      ) : data ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Receita Bruta", value: formatCurrency(data.receitaBruta), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
              { label: "Receita Líquida", value: formatCurrency(data.receitaLiquida), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Ticket Médio", value: formatCurrency(data.ticketMedio), icon: BarChart2, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Pedidos Pagos", value: String(data.pedidosPagos), icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-50", suffix: "pedidos" },
            ].map(m => (
              <Card key={m.label} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{m.label}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{m.value}</p>
                      {m.suffix && <p className="text-xs text-gray-400">{m.suffix}</p>}
                    </div>
                    <div className={`p-2 rounded-lg ${m.bg}`}>
                      <m.icon className={`h-5 w-5 ${m.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Evolução Diária */}
            {data.evolucaoDiaria.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-orange-500" />
                    Evolução de Receita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 h-40">
                    {data.evolucaoDiaria.slice(-14).map((d, i) => {
                      const height = Math.max((d.valor / maxDailyValue) * 100, 3);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t bg-orange-400 transition-all"
                            style={{ height: `${height}%` }}
                            title={`${d.date}: ${formatCurrency(d.valor)}`} />
                          <span className="text-xs text-gray-400 rotate-45 origin-left" style={{ fontSize: "9px" }}>
                            {new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formas de Pagamento */}
            {data.formasPagamento.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-orange-500" />
                    Formas de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.formasPagamento
                    .sort((a, b) => b.valor - a.valor)
                    .map((p, i) => {
                      const pct = Math.round((p.valor / data.receitaBruta) * 100);
                      const color = PAYMENT_COLORS[p.forma] || "bg-gray-500";
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">
                              {PAYMENT_LABELS[p.forma] || p.forma}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{p.count} pedidos</Badge>
                              <span className="font-semibold text-gray-900">{formatCurrency(p.valor)}</span>
                              <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${color} transition-all`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo do Período */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">Período</p>
                  <p className="font-medium">
                    {new Date(data.periodo.inicio).toLocaleDateString("pt-BR")} —{" "}
                    {new Date(data.periodo.fim).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">Total de Pedidos</p>
                  <p className="font-bold text-gray-900">{data.totalPedidos}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">Taxa de Conversão</p>
                  <p className="font-bold text-gray-900">
                    {data.totalPedidos > 0
                      ? Math.round((data.pedidosPagos / data.totalPedidos) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
