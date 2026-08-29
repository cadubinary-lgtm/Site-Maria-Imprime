import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CalendarDays, Search, SlidersHorizontal } from "lucide-react";
import SellerLayout from "@/components/seller/SellerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

const currency = (value: unknown) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const commissionLabels: Record<string, string> = { prevista: "Prevista", a_pagar: "A pagar", paga: "Paga", cancelada: "Cancelada" };
const orderStatusLabels: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento", pagamento_aprovado: "Pagamento aprovado", pagamento_retirada: "Pagamento na retirada",
  analisando: "Analisando", com_problemas: "Com problemas", em_producao: "Em produção", pronto_entrega: "Pronto para entrega",
  pronto_retirada: "Pronto para retirada", saiu_entrega: "Saiu para entrega", em_transporte: "Em transporte", entregue: "Entregue", cancelado: "Cancelado",
};

function getMonthRange(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { startDate: start.getTime(), endDate: end.getTime() };
}

export default function SellerOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [period, setPeriod] = useState<"all" | "this_month" | "last_month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const dateRange = useMemo(() => {
    if (period === "this_month") return getMonthRange(0);
    if (period === "last_month") return getMonthRange(-1);
    if (period === "custom") return {
      startDate: customStartDate ? new Date(`${customStartDate}T00:00:00`).getTime() : undefined,
      endDate: customEndDate ? new Date(`${customEndDate}T23:59:59.999`).getTime() : undefined,
    };
    return { startDate: undefined, endDate: undefined };
  }, [period, customStartDate, customEndDate]);
  const { data, isLoading } = trpc.sellers.seller.orders.useQuery({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const { data: summary } = trpc.sellers.seller.summary.useQuery();
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setPeriod("all"); setCustomStartDate(""); setCustomEndDate(""); };
  const hasActiveFilters = Boolean(search) || statusFilter !== "all" || period !== "all";

  return (
    <SellerLayout title="Meus Pedidos / Minhas Vendas" description="Acompanhe somente as vendas realizadas por você e suas comissões.">
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Comissões a receber</p><p className="mt-1 text-2xl font-bold text-amber-600">{currency(summary?.a_pagar)}</p><p className="mt-1 text-xs text-slate-500">Pedidos com pagamento confirmado.</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Comissões recebidas</p><p className="mt-1 text-2xl font-bold text-emerald-600">{currency(summary?.paga)}</p><p className="mt-1 text-xs text-slate-500">Valores baixados pelo Superadmin.</p></CardContent></Card>
      </div>

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm" aria-label="Filtros de pedidos">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-44 items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-pink-600" aria-hidden="true" /><p className="text-sm font-semibold text-slate-800">Filtrar pedidos</p></div>
          <div className="relative min-w-60 flex-1"><label htmlFor="seller-orders-search" className="sr-only">Buscar pedido ou cliente</label><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input id="seller-orders-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por número do pedido ou cliente..." className="h-9 pl-9" /></div>
          <label htmlFor="seller-orders-status" className="sr-only">Filtrar por status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger id="seller-orders-status" className="h-9 w-56"><SelectValue placeholder="Todos os status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem>{Object.entries(orderStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          {[{ value: "all", label: "Todo período" }, { value: "this_month", label: "Este mês" }, { value: "last_month", label: "Mês passado" }].map((item) => <Button key={item.value} type="button" variant={period === item.value ? "default" : "outline"} size="sm" className={period === item.value ? "bg-pink-600 hover:bg-pink-700" : ""} onClick={() => setPeriod(item.value as typeof period)}>{item.label}</Button>)}
          <Button type="button" variant={period === "custom" ? "default" : "outline"} size="sm" className={period === "custom" ? "bg-pink-600 hover:bg-pink-700" : ""} onClick={() => setPeriod("custom")}><CalendarDays className="mr-1 h-3.5 w-3.5" />Personalizado</Button>
          <Button type="button" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50" disabled={!hasActiveFilters} onClick={clearFilters}>Limpar filtros</Button>
        </div>
        {period === "custom" && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"><label htmlFor="seller-orders-date-start" className="text-xs font-medium text-slate-600">De</label><Input id="seller-orders-date-start" type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} className="h-9 w-40 text-xs" /><label htmlFor="seller-orders-date-end" className="text-xs font-medium text-slate-600">Até</label><Input id="seller-orders-date-end" type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} className="h-9 w-40 text-xs" /></div>}
        <p className="mt-3 text-xs text-slate-500" aria-live="polite">{isLoading ? "Atualizando pedidos..." : `Mostrando ${data?.length ?? 0} pedido${(data?.length ?? 0) === 1 ? "" : "s"} da sua carteira.`}</p>
      </section>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-4">Pedido</th><th className="p-4">Cliente</th><th className="p-4">Data</th><th className="p-4">Status</th><th className="p-4 text-right">Total</th><th className="p-4 text-right">Comissão</th><th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">Carregando vendas...</td></tr> : data?.length ? data.map((order: any) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="align-middle p-4 font-medium">{order.orderNumber}</td>
                    <td className="align-middle p-4"><p>{order.clientName ?? "Cliente"}</p>{order.customerEmail && <p className="mt-0.5 text-xs text-slate-500">{order.customerEmail}</p>}</td>
                    <td className="align-middle p-4 text-slate-600">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="align-middle p-4"><Badge variant={order.paymentStatus === "pago" ? "default" : "secondary"}>{orderStatusLabels[order.status] ?? String(order.status).replaceAll("_", " ")}</Badge></td>
                    <td className="align-middle p-4 text-right font-semibold">{currency(order.total)}</td>
                    <td className="align-middle p-4 text-right"><p className="font-semibold">{order.commissionAmount == null ? "—" : currency(order.commissionAmount)}</p>{order.commissionStatus && <p className="mt-0.5 text-xs text-slate-500">{commissionLabels[order.commissionStatus] ?? order.commissionStatus}</p>}</td>
                    <td className="align-middle p-4 text-right"><Button asChild size="sm" variant="outline"><Link href={`/vendedor/pedidos/${order.id}`}>Ver detalhes</Link></Button></td>
                  </tr>
                )) : <tr><td colSpan={7} className="p-8 text-center text-slate-500">Você ainda não possui vendas na carteira.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </SellerLayout>
  );
}
