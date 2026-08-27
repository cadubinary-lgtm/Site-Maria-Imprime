import SellerLayout from "@/components/seller/SellerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BadgeDollarSign, ClipboardList, FileText, WalletCards } from "lucide-react";
import { Link } from "wouter";

const currency = (value: unknown) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SellerDashboard() {
  const { data: profile } = trpc.sellers.seller.me.useQuery();
  const { data: summary } = trpc.sellers.seller.summary.useQuery();
  const { data: orders } = trpc.sellers.seller.orders.useQuery({});
  const { data: quotations } = trpc.sellers.seller.quotations.useQuery({});
  const cards = [
    { label: "Comissões a pagar", value: currency(summary?.a_pagar), icon: WalletCards, tone: "text-amber-600 bg-amber-50" },
    { label: "Comissões recebidas", value: currency(summary?.paga), icon: BadgeDollarSign, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Pedidos da carteira", value: String(orders?.length ?? 0), icon: ClipboardList, tone: "text-blue-600 bg-blue-50" },
    { label: "Orçamentos emitidos", value: String(quotations?.length ?? 0), icon: FileText, tone: "text-pink-600 bg-pink-50" },
  ];
  return <SellerLayout title={`Olá, ${profile?.name?.split(" ")[0] ?? "vendedor"}`} description="Acompanhe sua carteira comercial e suas comissões.">
    <section className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm text-slate-300">Percentual vigente para novas vendas</p><p className="mt-1 text-3xl font-bold">{Number(profile?.commissionRate ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</p></div>
      <Button asChild className="bg-pink-600 text-white hover:bg-pink-700"><Link href="/vendedor/vendas/nova">Registrar venda <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone }) => <Card key={label} className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className={`rounded-xl p-3 ${tone}`}><Icon className="h-5 w-5" /></span><div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div></CardContent></Card>)}
    </section>
    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Pedidos recentes</CardTitle><Button asChild variant="link" size="sm"><Link href="/vendedor/pedidos">Ver todos</Link></Button></CardHeader><CardContent className="space-y-3">{orders?.slice(0, 5).map((order: any) => <div key={order.id} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm last:border-0"><div><p className="font-medium">{order.orderNumber}</p><p className="text-slate-500">{order.clientName ?? "Cliente"}</p></div><span className="font-medium">{currency(order.total)}</span></div>) ?? <p className="text-sm text-slate-500">Nenhum pedido registrado.</p>}</CardContent></Card>
      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Orçamentos recentes</CardTitle><Button asChild variant="link" size="sm"><Link href="/vendedor/orcamentos">Ver todos</Link></Button></CardHeader><CardContent className="space-y-3">{quotations?.slice(0, 5).map((quote: any) => <div key={quote.id} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm last:border-0"><div><p className="font-medium">{quote.quotationNumber}</p><p className="text-slate-500">{quote.clientName ?? "Cliente"}</p></div><span className="font-medium">{currency(quote.total)}</span></div>) ?? <p className="text-sm text-slate-500">Nenhum orçamento registrado.</p>}</CardContent></Card>
    </section>
  </SellerLayout>;
}
